import {formats} from "../../../shared/social-formats";
import type {Layouts} from "../../../shared/brand-layout";

// פריסה לכל פורמט: מסגרת קטנה ביחס של הפורמט. נקודה = יש פריסה שנשמרה לפורמט הזה.
export function FormatStrip({formatId, layouts, onPick, onApplyAll, onReset}: {formatId: string; layouts: Layouts; onPick: (id: string) => void; onApplyAll: () => void; onReset: () => void}) {
  return <div className="format-strip">
    <span className="bar-label">פריסה לכל פורמט</span>
    <div className="format-frames">
      {formats.map(f => {
        const r = f.width / f.height, w = r >= 1 ? 34 : Math.round(34 * r), h = r >= 1 ? Math.round(34 / r) : 34;
        return <button key={f.id} type="button" className={`format-frame${f.id === formatId ? " is-active" : ""}`} aria-pressed={f.id === formatId}
          aria-label={`${f.group} · ${f.name}, ${f.width}×${f.height}${layouts[f.id] ? ", יש פריסה שמורה" : ""}`} title={`${f.group} · ${f.name} · ${f.width}×${f.height}`} onClick={() => onPick(f.id)}>
          <i style={{width: w, height: h}}>{layouts[f.id] && <b/>}</i>
        </button>;
      })}
    </div>
    <div className="format-actions">
      <button type="button" className="pill small" onClick={onApplyAll}>החלה על כל הפורמטים</button>
      <button type="button" className="pill small" onClick={onReset}>איפוס פריסה</button>
    </div>
  </div>;
}
