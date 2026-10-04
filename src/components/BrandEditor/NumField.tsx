import {useState} from "react";
import {clamp, roundShown} from "../../../shared/brand-geometry";

// שדה מספרי בדיוק של עשירית. בזמן הקלדה מציגים את מה שהוקלד, ובסיום את הערך המעוגל.
export function NumField({label, value, onCommit, min, max, step = 0.1, suffix = "%", disabled}:
  {label: string; value: number; onCommit: (v: number) => void; min: number; max: number; step?: number; suffix?: string; disabled?: boolean}) {
  const [draft, setDraft] = useState<string | null>(null);
  return <label className="num-field">{label}
    <span className="num-box">
      <input type="number" dir="ltr" inputMode="decimal" min={min} max={max} step={step} disabled={disabled}
        value={draft ?? String(step >= 1 ? Math.round(value) : roundShown(value))}
        onChange={e => {
          setDraft(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v)) onCommit(clamp(v, min, max));
        }}
        onBlur={() => setDraft(null)}/>
      <span>{suffix}</span>
    </span>
  </label>;
}
