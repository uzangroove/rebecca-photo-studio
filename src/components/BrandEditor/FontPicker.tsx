import {useEffect, useMemo, useRef, useState} from "react";
import {fonts, fontLabel, isBundledFont, systemFontName, systemFontRef, type FontRef} from "../../../shared/brand-layout";
import {cachedLocalFonts, canvasFamily, listLocalFonts, loadBrandFont, localFontsSupported} from "../../brand/fonts";

// בחירת גופן: הגופנים המובנים, ובלחיצה אחת גם כל הגופנים שמותקנים במחשב (Chrome או Edge במחשב).
// בדפדפן שלא תומך (טלפון, טאבלט, Safari) אפשר להקליד שם גופן ידנית. גופן מהמחשב נראה רק במכשיר שמותקן בו.
const SAMPLE = "Rèbecca אבג";
const MAX_SHOWN = 80;

export function FontPicker({value, onChange}: {value: FontRef; onChange: (font: FontRef) => void}) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [manual, setManual] = useState("");
  const [local, setLocal] = useState<string[] | null>(cachedLocalFonts()), [status, setStatus] = useState<"idle" | "loading" | "denied" | "unsupported">("idle");
  const root = useRef<HTMLDivElement>(null);
  const canQuery = localFontsSupported();

  useEffect(() => {
    if (!open) return;
    fonts.forEach(f => void loadBrandFont(f.id).catch(() => {}));
    // הרשימה נפתחת מתחת לשדה, ובלשונית נמוכה היא יכולה לצאת מהמסך.
    root.current?.querySelector(".font-pop")?.scrollIntoView({block: "nearest"});
  }, [open, local]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function loadLocal() {
    setStatus("loading");
    try { setLocal(await listLocalFonts()); setStatus("idle"); }
    catch (e) { setStatus((e as Error).message === "unsupported" ? "unsupported" : "denied"); }
  }
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (local ?? []).filter(n => !q || n.toLowerCase().includes(q)), [local, q]);
  const pick = (ref: FontRef) => { onChange(ref); setOpen(false); };
  const manualRef = manual.trim() ? systemFontRef(manual) : null;

  return <div className="field font-picker" ref={root}>גופן
    <button type="button" className="font-current" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(v => !v)}>
      <span style={{fontFamily: canvasFamily(value)}}>{fontLabel(value)}</span>
      {systemFontName(value) !== null && <small>מהמחשב</small>}
      <span aria-hidden="true">▾</span>
    </button>
    {open && <div className="font-pop" role="listbox" aria-label="בחירת גופן">
      <div className="font-group">גופנים מובנים (עובדים בכל מכשיר)</div>
      {fonts.map(f => <button key={f.id} type="button" role="option" aria-selected={value === f.id} className="font-opt" onClick={() => pick(f.id)}>
        <span className="font-sample" style={{fontFamily: canvasFamily(f.id)}}>{SAMPLE}</span><small>{f.label}</small>
      </button>)}
      <div className="font-group">גופנים מהמחשב</div>
      {local === null
        ? canQuery
          ? <><button type="button" className="chip-toggle" disabled={status === "loading"} onClick={loadLocal}>{status === "loading" ? "טוענים…" : "הצגת הגופנים שבמחשב"}</button>
            {status === "denied" && <p className="font-note">לא ניתנה רשות. אפשר לאשר בסמל המנעול ליד כתובת האתר, ולנסות שוב.</p>}</>
          : <p className="font-note">הדפדפן הזה לא יכול להציג את הגופנים שבמחשב. ב-Chrome או ב-Edge במחשב זה עובד. אפשר גם להקליד שם גופן למטה.</p>
        : <>
          <input type="search" className="font-search" dir="ltr" placeholder="חיפוש גופן" value={query} onChange={e => setQuery(e.target.value)} aria-label="חיפוש גופן"/>
          {matches.slice(0, MAX_SHOWN).map(name => <button key={name} type="button" role="option" aria-selected={value === `sys:${name}`} className="font-opt"
            onClick={() => { const ref = systemFontRef(name); if (ref) pick(ref); }}>
            <span className="font-sample" style={{fontFamily: `"${name}", sans-serif`}}>{SAMPLE}</span><small dir="ltr">{name}</small>
          </button>)}
          {matches.length > MAX_SHOWN && <p className="font-note">מוצגים {MAX_SHOWN} מתוך {matches.length}. הקלידו כדי לצמצם.</p>}
          {matches.length === 0 && <p className="font-note">לא נמצא גופן בשם הזה.</p>}
        </>}
      <div className="font-group">או הקלידו שם גופן</div>
      <div className="font-manual">
        <input type="text" dir="ltr" placeholder="למשל Arial" value={manual} maxLength={60} onChange={e => setManual(e.target.value)} aria-label="שם גופן"
          onKeyDown={e => { if (e.key === "Enter" && manualRef) pick(manualRef); }}/>
        <button type="button" className="chip-toggle" disabled={!manualRef} onClick={() => manualRef && pick(manualRef)}>שימוש</button>
      </div>
      {!isBundledFont(value) && <p className="font-note">הגופן שנבחר מותקן במחשב. במכשיר שבו הוא לא מותקן יוצג Heebo במקומו.</p>}
    </div>}
  </div>;
}
