import type {ReactNode} from "react";

// אריח בחירה: אייקון (או תצוגה אחרת), שם ופירוט. כל המטרות בגודל 44px לפחות (ראו styles.css).
export function Tile({selected, onClick, visual, label, detail, extra, title, disabled, layout = "row"}:
  {selected: boolean; onClick: () => void; visual: ReactNode; label: ReactNode; detail?: string; title?: string; disabled?: boolean; extra?: ReactNode; layout?: "row" | "col"}) {
  return <button type="button" className={`tile tile-${layout}${selected ? " is-selected" : ""}`} aria-pressed={selected} title={title} disabled={disabled} onClick={onClick}>
    <span className="tile-visual">{visual}</span>
    <span className="tile-text"><strong>{label}</strong>{detail && <small>{detail}</small>}{extra}</span>
  </button>;
}
