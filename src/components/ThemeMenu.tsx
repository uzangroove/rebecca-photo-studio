import {useEffect, useRef, useState} from "react";
import {palettes} from "../../shared/catalog";
import {defaultTheme} from "../../shared/theme";
import type {Studio} from "../useStudio";
import {Icon} from "./Icon";
import {tokensFor} from "../theme";

const paintIcon = "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z M7.5 12h.01 M9.5 7.5h.01 M14.5 7.5h.01";

// בחירת צבעי הממשק מתוך הפלטות הקיימות.
export function ThemeMenu({studio}: {studio: Studio}) {
  const {theme} = studio.state, [open, setOpen] = useState(false), box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const pick = (id: string | null) => { studio.dispatch({type: "theme", id}); setOpen(false); };
  const dots = (colors: readonly string[]) => <span className="dots">{colors.map(c => <i key={c} style={{background: c}}/>)}</span>;
  return <div className="theme-menu" ref={box}>
    <button type="button" className="icon-btn" aria-label="צבעי הממשק" title="צבעי הממשק" aria-expanded={open} onClick={() => setOpen(v => !v)}><Icon d={paintIcon} size={20} strokeWidth={1.7}/></button>
    {open && <div className="theme-pop" role="dialog" aria-label="צבעי הממשק">
      <strong>צבעי הממשק</strong>
      <div className="theme-grid">
        <button type="button" className={`pill-opt${theme === null ? " is-selected" : ""}`} aria-pressed={theme === null} onClick={() => pick(null)}>
          {dots([defaultTheme.green, defaultTheme.gold, defaultTheme.bg])}ברירת מחדל
        </button>
        {palettes.map(p => <button key={p.id} type="button" className={`pill-opt${theme === p.id ? " is-selected" : ""}`} aria-pressed={theme === p.id} onClick={() => pick(p.id)}>
          {dots([tokensFor(p.id).green, tokensFor(p.id).gold, tokensFor(p.id).bg])}{p.label}
        </button>)}
      </div>
    </div>}
  </div>;
}
