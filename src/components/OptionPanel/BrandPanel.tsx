import type {BrandSettings} from "../../../shared/settings";
import type {Studio} from "../../useStudio";

const presets = [
  [0, 0, "ימין למעלה"], [10, 0, "מרכז למעלה"], [20, 0, "שמאל למעלה"],
  [0, 10, "ימין באמצע"], [10, 10, "מרכז"], [20, 10, "שמאל באמצע"],
  [0, 20, "ימין למטה"], [10, 20, "מרכז למטה"], [20, 20, "שמאל למטה"]
] as const;
const clampPosition = (value: string) => Math.max(0, Math.min(20, Math.round(Number(value) || 0)));
const clampScale = (n: number) => Math.max(30, Math.min(160, Number.isFinite(n) ? Math.round(n) : 100));

type Part = "logo" | "slogan";
const parts: readonly {part: Part; title: string; upload: string}[] = [
  {part: "logo", title: "הלוגו", upload: "העלאת לוגו"}, {part: "slogan", title: "הסלוגן", upload: "העלאת סלוגן"}
];

function PartCard({studio, part, title, upload}: {studio: Studio} & (typeof parts)[number]) {
  const {brand} = studio.state, {dispatch} = studio;
  const x = brand[`${part}X`], y = brand[`${part}Y`], scale = brand[`${part}Scale`], on = brand[part], name = brand[`${part}Name`];
  const patch = (p: Partial<BrandSettings>) => dispatch({type: "brand", patch: p});
  const position = (nx: number, ny: number) => patch({[`${part}X`]: nx, [`${part}Y`]: ny});
  const selected = `${x},${y}`, custom = !presets.some(([px, py]) => `${px},${py}` === selected);
  return <div className="brand-card">
    <div className="brand-row">
      <label className="check"><input type="checkbox" checked={on} onChange={e => patch({[part]: e.target.checked})}/> הצגת {title}</label>
      <label className="pill small">{upload}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => {studio.chooseBrandFile(e.target.files?.[0], part); e.currentTarget.value = "";}}/>
      </label>
      <span className="file-name" title={name}>{name}</span>
    </div>
    {on && <div className="brand-controls">
      <label className="field">מיקום {title}
        <select value={selected} onChange={e => {const [nx, ny] = e.target.value.split(",").map(Number); position(nx, ny);}}>
          {presets.map(([px, py, label]) => <option key={`${px},${py}`} value={`${px},${py}`}>{label}</option>)}
          {custom && <option value={selected}>מיקום מותאם</option>}
        </select>
      </label>
      <label className="axis">אופקי <small>0 ימין · 20 שמאל</small>
        <input type="range" min="0" max="20" step="1" dir="rtl" value={x} onChange={e => position(Number(e.target.value), y)}/>
        <input type="number" min="0" max="20" step="1" dir="ltr" aria-label={`מיקום אופקי של ${title}`} value={x} onChange={e => position(clampPosition(e.target.value), y)}/>
      </label>
      <label className="axis">אנכי <small>0 למעלה · 20 למטה</small>
        <input type="range" min="0" max="20" step="1" value={y} onChange={e => position(x, Number(e.target.value))}/>
        <input type="number" min="0" max="20" step="1" dir="ltr" aria-label={`מיקום אנכי של ${title}`} value={y} onChange={e => position(x, clampPosition(e.target.value))}/>
      </label>
      <label className="axis">גודל <small>%</small>
        <input type="range" min="30" max="160" step="5" value={scale} onChange={e => patch({[`${part}Scale`]: clampScale(Number(e.target.value))})}/>
        <input type="number" min="30" max="160" step="1" dir="ltr" aria-label={`גודל ${title} באחוזים`} value={scale} onChange={e => patch({[`${part}Scale`]: clampScale(Number(e.target.value))})}/>
      </label>
    </div>}
  </div>;
}

export function BrandPanel({studio}: {studio: Studio}) {
  return <div className="panel-body">
    <div><h2>מיתוג</h2><p className="panel-sub">הלוגו והסלוגן מורכבים על התמונה בהורדה.</p></div>
    {parts.map(p => <PartCard key={p.part} studio={studio} {...p}/>)}
    <label className="field">טקסט על התמונה
      <input type="text" value={studio.state.caption} maxLength={60} placeholder="טקסט לבחירתכם" onChange={e => studio.dispatch({type: "caption", text: e.target.value})}/>
    </label>
  </div>;
}
