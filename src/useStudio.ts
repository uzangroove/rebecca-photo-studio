import {useEffect, useMemo, useReducer, useRef} from "react";
import type {MouseEvent} from "react";
import {hasItem} from "../shared/catalog";
import type {Selection} from "../shared/selection";
import {defaultBrand, type BrandSettings, type StudioSettings} from "../shared/settings";
import {fetchSettings, putSettings, requestImage} from "./api";
import {composeImage, readBrandFile} from "./brand";
import {formatById, ratioOf} from "./social-formats";
import {initialState, reducer} from "./state";
import {loadStudio, saveBranding, saveImage, type SavedBranding, type SavedImage} from "./studio-storage";

// גרסאות ישנות שמרו את הלוגו והסלוגן כקובץ אחד.
const migrateSource = (source: string, fallback: string) => source === "/assets/logo.png" ? fallback : source;
function brandFromSaved(saved: SavedBranding): BrandSettings {
  return {...defaultBrand, ...saved,
    logoSource: migrateSource(saved.logoSource, defaultBrand.logoSource), sloganSource: migrateSource(saved.sloganSource, defaultBrand.sloganSource),
    logoScale: saved.logoScale ?? 100, sloganScale: saved.sloganScale ?? 100};
}

export function useStudio() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const photoUrl = useRef<string | null>(null), recentUrl = useRef<string | null>(null), historyUrls = useRef<string[]>([]);
  const request = useRef(0);
  // סנכרון: כותבים לשרת רק אחרי שקראנו ממנו בהצלחה, כדי לא לדרוס הגדרות ממכשיר אחר.
  const remoteReadable = useRef(false), lastSynced = useRef("");

  function showHistory(images: SavedImage[]) {
    const urls = images.map(image => URL.createObjectURL(image.blob));
    const previous = historyUrls.current;
    historyUrls.current = urls;
    dispatch({type: "history", items: images.map((image, i) => ({...image, url: urls[i]}))});
    previous.forEach(url => URL.revokeObjectURL(url));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {branding, images} = await loadStudio();
        if (cancelled) return;
        if (branding) dispatch({type: "settings", settings: {version: 1, neverList: [], brand: brandFromSaved(branding)}});
        showHistory(images);
      } catch {
        if (!cancelled) dispatch({type: "say", text: "השמירה המקומית אינה זמינה בדפדפן הזה. אפשר להמשיך ליצור תמונות"});
      }
      try {
        const remote = await fetchSettings();
        if (cancelled) return;
        remoteReadable.current = true;
        if (remote) {
          lastSynced.current = JSON.stringify(remote);
          dispatch({type: "settings", settings: remote});
        }
        dispatch({type: "sync", sync: "synced"});
      } catch {
        if (!cancelled) dispatch({type: "sync", sync: "offline"});
      }
      if (!cancelled) dispatch({type: "ready"});
    })();
    return () => {
      cancelled = true;
      for (const url of [photoUrl.current, recentUrl.current, ...historyUrls.current]) if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const settings = useMemo<StudioSettings>(() => ({version: 1, neverList: state.neverList, brand: state.brand}), [state.neverList, state.brand]);
  useEffect(() => {
    if (!state.ready) return;
    const timer = setTimeout(async () => {
      saveBranding(settings.brand).catch(() => dispatch({type: "say", text: "המיתוג לא נשמר בדפדפן. בדקו שאחסון האתר מאופשר", error: true}));
      const json = JSON.stringify(settings);
      if (!remoteReadable.current || json === lastSynced.current) return;
      dispatch({type: "sync", sync: "saving"});
      try {
        await putSettings(settings);
        lastSynced.current = json;
        dispatch({type: "sync", sync: "synced"});
      } catch (e) {
        dispatch({type: "sync", sync: "offline"});
        if (e instanceof Error && e.message.endsWith("413")) dispatch({type: "say", text: "הלוגו או הסלוגן גדולים מדי לסנכרון בין מכשירים. הם נשמרו במכשיר הזה בלבד", error: true});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state.ready, settings]);

  // מרכיבים את התוצאה: חיתוך לפורמט, טקסט ומיתוג. אותו קובץ משמש לתצוגה ולהורדה.
  useEffect(() => {
    dispatch({type: "composeReset"});
    if (!state.result) return;
    let cancelled = false, url: string | null = null;
    const result = state.result, branding = {...state.brand, caption: state.caption}, format = formatById(state.formatId);
    const timer = setTimeout(async () => {
      try {
        const canvas = await composeImage(result, branding, format);
        const blob = await new Promise<Blob | null>((resolve, reject) => { try { canvas.toBlob(resolve, "image/png"); } catch (e) { reject(e); } });
        if (!blob) throw new Error("לא הצלחנו להכין את קובץ התמונה");
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        dispatch({type: "composed", composed: {url, blob, branded: true}});
      } catch {
        if (cancelled) return;
        try {
          const raw = await fetch(result).then(r => r.blob());
          if (cancelled) return;
          url = URL.createObjectURL(raw);
          dispatch({type: "composeFailed", composed: {url, blob: raw, branded: false}, text: "המיתוג לא הוחל. אפשר להוריד את התמונה המקורית ולנסות קובץ מיתוג אחר"});
        } catch {
          if (!cancelled) dispatch({type: "composeFailed", composed: null, text: "הכנת התמונה להורדה נכשלה. נסו ליצור אותה מחדש"});
        }
      }
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [state.result, state.brand, state.caption, state.formatId]);

  function select(key: keyof Selection, id: string) {
    request.current++;
    dispatch({type: "select", key, id});
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      dispatch({type: "say", text: "אפשר להעלות JPG, PNG או WebP עד 10 מגה־בייט", error: true});
      return;
    }
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = URL.createObjectURL(file);
    request.current++;
    dispatch({type: "photo", photo: {file, url: photoUrl.current}});
  }

  async function chooseBrandFile(file: File | undefined, part: "logo" | "slogan") {
    if (!file) return;
    try {
      const data = await readBrandFile(file);
      dispatch({type: "brand", patch: part === "logo" ? {logoSource: data, logoName: file.name, logo: true} : {sloganSource: data, sloganName: file.name, slogan: true}});
    } catch (e) {
      dispatch({type: "say", text: e instanceof Error ? e.message : "לא הצלחנו להעלות את הקובץ", error: true});
    }
  }

  function openRecent(image: SavedImage) {
    if (recentUrl.current) URL.revokeObjectURL(recentUrl.current);
    recentUrl.current = URL.createObjectURL(image.blob);
    if (photoUrl.current) { URL.revokeObjectURL(photoUrl.current); photoUrl.current = null; }
    request.current++;
    dispatch({type: "openRecent", url: recentUrl.current,
      style: hasItem("styles", image.style) ? image.style : state.selection.style,
      palette: hasItem("palettes", image.palette) ? image.palette : "forest"});
  }

  async function generate() {
    if (!state.photo) { dispatch({type: "say", text: "העלו קודם צילום מוצר מהמחשב או מהטלפון", error: true}); return; }
    const id = ++request.current, {selection} = state;
    dispatch({type: "generating"});
    try {
      const image = await requestImage(state.photo.file, selection, ratioOf(formatById(state.formatId)));
      if (id !== request.current) return;
      dispatch({type: "generated", image});
      try {
        const blob = await fetch(image).then(r => r.blob());
        showHistory(await saveImage(blob, selection.style, selection.palette));
      } catch {
        dispatch({type: "say", text: "התמונה נוצרה, אך לא נשמרה בארבע האחרונות. אפשר להוריד אותה כעת"});
      }
    } catch (e) {
      if (id === request.current) dispatch({type: "failed", text: e instanceof Error ? e.message : "לא הצלחנו ליצור תמונה"});
    }
  }

  async function download(e: MouseEvent<HTMLAnchorElement>) {
    const composed = state.composed;
    if (!composed) { e.preventDefault(); return; }
    type SaveHandle = {createWritable: () => Promise<{write: (data: Blob) => Promise<void>; close: () => Promise<void>}>};
    const picker = (window as Window & {showSaveFilePicker?: (options: {suggestedName: string; types: {description: string; accept: Record<string, string[]>}[]}) => Promise<SaveHandle>}).showSaveFilePicker;
    if (!picker) {
      if (window.self !== window.top) { e.preventDefault(); dispatch({type: "downloadFallback", text: "בחלון התצוגה הזה הדפדפן חוסם הורדות. פתחו את הסטודיו בחלון מלא כדי לשמור דרך הכפתור"}); }
      return;
    }
    e.preventDefault();
    try {
      const handle = await picker.call(window, {suggestedName: downloadName(state.selection), types: [{description: "תמונת PNG", accept: {"image/png": [".png"]}}]});
      const stream = await handle.createWritable();
      await stream.write(composed.blob);
      await stream.close();
      dispatch({type: "say", text: "התמונה נשמרה בהצלחה"});
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch({type: "downloadFallback", text: "הדפדפן מנע שמירה ישירה בחלון הזה. פתחו את התמונה בחלון נפרד לשמירה"});
    }
  }

  return {state, dispatch, select, choosePhoto, chooseBrandFile, openRecent, generate, download};
}

export const downloadName = (s: Selection) => `rebecca-${s.style}-${s.palette}.png`;

export type Studio = ReturnType<typeof useStudio>;
