import {useEffect, useMemo, useReducer, useRef} from "react";
import type {MouseEvent} from "react";
import type {Recipe} from "../shared/recipes";
import {lookOf} from "../shared/recipes";
import type {Selection} from "../shared/selection";
import type {StudioSettings} from "../shared/settings";
import type {BrandLayout} from "../shared/brand-layout";
import {fetchSettings, putSettings, requestImage} from "./api";
import {applyTheme, readLocalTheme, saveLocalTheme} from "./theme";
import {renderBranded} from "./brand/export";
import {readBrandFile} from "./brand/upload";
import {findItem} from "../shared/catalog";
import {formatById, ratioOf} from "../shared/social-formats";
import {currentImage, currentLayout, initialState, reducer} from "./state";
import {centerFocal} from "../shared/brand-geometry";
import {loadStudio, rateImage, saveBranding, saveImage, type Rating, type SavedImage} from "./studio-storage";

export function useStudio() {
  const [state, dispatch] = useReducer(reducer, initialState, s => ({...s, theme: readLocalTheme()}));
  const photoUrl = useRef<string | null>(null), recentUrl = useRef<string | null>(null), historyUrls = useRef<string[]>([]);
  const request = useRef(0);
  // סנכרון: כותבים לשרת רק אחרי שקראנו ממנו בהצלחה, כדי לא לדרוס הגדרות ממכשיר אחר.
  const remoteReadable = useRef(false), lastSynced = useRef("");

  function showHistory(images: SavedImage[], currentKey?: string) {
    const urls = images.map(image => URL.createObjectURL(image.blob));
    const previous = historyUrls.current;
    historyUrls.current = urls;
    dispatch({type: "history", items: images.map((image, i) => ({...image, url: urls[i]})), currentKey});
    previous.forEach(url => URL.revokeObjectURL(url));
  }

  // צבעי הממשק: מוחלים מיד, ונשמרים גם במכשיר כדי שלא יהבהבו בטעינה הבאה.
  useEffect(() => { applyTheme(state.theme); saveLocalTheme(state.theme); }, [state.theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {

      try {
        const {branding, images} = await loadStudio();
        if (cancelled) return;
        if (branding) dispatch({type: "branding", brand: branding.brand, layouts: branding.layouts});
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

  const settings = useMemo<StudioSettings>(() => ({version: 3, neverList: state.neverList, recipes: state.recipes, brand: state.brand, layouts: state.layouts, theme: state.theme}), [state.neverList, state.recipes, state.brand, state.layouts, state.theme]);
  useEffect(() => {
    if (!state.ready) return;
    const timer = setTimeout(async () => {
      saveBranding({brand: settings.brand, layouts: settings.layouts}).catch(() => dispatch({type: "say", text: "המיתוג לא נשמר בדפדפן. בדקו שאחסון האתר מאופשר", error: true}));
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

  const layout = useMemo(() => currentLayout(state), [state.layouts, state.formatId]);
  const autoTextColor = findItem("palettes", state.selection.palette)?.colors[2] ?? "#FFFFFF";
  const focal = state.crops[state.formatId] ?? centerFocal;

  // מרכיבים את התוצאה: חיתוך לפורמט ומיתוג, באותה סצנה שמוצגת בעורך. אותו קובץ משמש לתצוגה ולהורדה.
  // בזמן שהעורך פתוח לא מרכיבים: התוצאה תוכן מחדש כשחוזרים אליה.
  useEffect(() => {
    dispatch({type: "composeReset"});
    if (!state.result || state.screen === "editor") return;
    let cancelled = false, url: string | null = null;
    const result = state.result, format = formatById(state.formatId);
    const timer = setTimeout(async () => {
      try {
        const blob = await renderBranded({w: format.width, h: format.height}, {backdrop: result, logo: state.brand.logoSource, slogan: state.brand.sloganSource}, focal, layout, autoTextColor);
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
  }, [state.result, state.screen, state.brand, layout, focal, autoTextColor, state.formatId]);

  // כל שינוי בחירה מבטל יצירה שעדיין רצה, כדי שתוצאה ישנה לא תחליף את המסך.
  function select(key: Exclude<keyof Selection, "wish">, id: string | null) {
    request.current++;
    dispatch({type: "select", key, id});
  }
  function chooseRecipe(recipe: Recipe) {
    request.current++;
    dispatch({type: "recipe", recipe});
  }
  function resetScene() {
    request.current++;
    dispatch({type: "resetScene"});
  }
  function saveRecipe(name: string) {
    dispatch({type: "saveRecipe", recipe: {id: crypto.randomUUID(), name: name.trim(), look: lookOf(state.selection)}});
  }
  async function rate(rating: Rating) {
    const image = currentImage(state);
    if (!image) return;
    const next = image.rating === rating ? null : rating;
    dispatch({type: "rated", key: image.key, rating: next});
    try { await rateImage(image.key, next); }
    catch { dispatch({type: "say", text: "הדירוג לא נשמר בדפדפן", error: true}); }
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

  function setLayout(next: BrandLayout) { dispatch({type: "layout", layout: next}); }

  async function chooseBrandFile(file: File | undefined, part: "logo" | "slogan") {
    if (!file) return;
    try {
      const data = await readBrandFile(file);
      dispatch({type: "brand", patch: part === "logo" ? {logoSource: data, logoName: file.name} : {sloganSource: data, sloganName: file.name}});
      dispatch({type: "layout", layout: {...layout, [part]: {...layout[part], visible: true}}});
    } catch (e) {
      dispatch({type: "say", text: e instanceof Error ? e.message : "לא הצלחנו להעלות את הקובץ", error: true});
    }
  }

  function openRecent(image: SavedImage) {
    if (recentUrl.current) URL.revokeObjectURL(recentUrl.current);
    recentUrl.current = URL.createObjectURL(image.blob);
    if (photoUrl.current) { URL.revokeObjectURL(photoUrl.current); photoUrl.current = null; }
    request.current++;
    dispatch({type: "openRecent", url: recentUrl.current, key: image.key, selection: image.selection, formatId: image.formatId});
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
        const saved = await saveImage(blob, selection, state.formatId);
        showHistory(saved.images, saved.key);
      } catch {
        dispatch({type: "say", text: "התמונה נוצרה, אך לא נשמרה בהיסטוריה. אפשר להוריד אותה כעת"});
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

  return {state, dispatch, layout, setLayout, autoTextColor, focal, select, chooseRecipe, resetScene, saveRecipe, rate, choosePhoto, chooseBrandFile, openRecent, generate, download};
}

export const downloadName = (s: Selection) => `rebecca-${s.style}-${s.palette}.png`;

export type Studio = ReturnType<typeof useStudio>;
