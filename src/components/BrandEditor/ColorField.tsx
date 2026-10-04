import {useEffect, useState} from "react";

// בחירת צבע מלאה: פלטת הצבעים של המערכת (גלגל/ספקטרום), וגם קוד HEX שאפשר להקליד או להדביק.
// value ריק = "אוטומטי": מציגים את צבע הברירה (fallback), ולחיצה על האיפוס מחזירה אליו.
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
export function normalizeHex(input: string): string | null {
  const m = HEX.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map(c => c + c).join("") : m[1];
  return `#${h.toLowerCase()}`;
}

export function ColorField({label, value, fallback, resetLabel, onChange}:
  {label: string; value: string | null; fallback: string; resetLabel: string; onChange: (color: string | null) => void}) {
  const shown = (value ?? fallback).toLowerCase();
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [shown]);
  return <div className="field color-field" role="group" aria-label={label}>{label}
    <div className="color-row">
      <label className="color-pick" title="פתיחת פלטת הצבעים המלאה">
        <input type="color" value={shown} onChange={e => onChange(e.target.value.toLowerCase())} aria-label={`${label}: פלטת צבעים`}/>
        <span className="color-chip" style={{background: shown}}/>
      </label>
      <input type="text" dir="ltr" className="hex-input" value={draft ?? shown.toUpperCase()} maxLength={7} spellCheck={false} aria-label={`${label}: קוד צבע`}
        onChange={e => { setDraft(e.target.value); const c = normalizeHex(e.target.value); if (c) onChange(c); }}
        onBlur={() => setDraft(null)}/>
      <button type="button" className="chip-toggle" disabled={value === null} onClick={() => onChange(null)}>{resetLabel}</button>
    </div>
  </div>;
}
