import {pxToPct, pctToPx, roundStored, type Box, type Size} from "../../../shared/brand-geometry";
import {MAX_LABEL_CHARS, MAX_TEXT_CHARS, type BrandLayout, type ImageLayer, type LayerId, type Legibility, type TextLayer} from "../../../shared/brand-layout";
import {Icon} from "../Icon";
import {ColorField} from "./ColorField";
import {FontPicker} from "./FontPicker";
import {NumField} from "./NumField";
import {layerLabel} from "./AlignBar";

type Patch = Partial<ImageLayer> & Partial<TextLayer>;
type Props = {
  id: LayerId; layout: BrandLayout; box: Box | undefined; canvas: Size; aspect: number; autoTextColor: string;
  step: 1 | 10; onStep: () => void; onPatch: (patch: Patch) => void; onNudge: (dx: number, dy: number) => void;
};

const legibility: readonly {id: Legibility; label: string}[] = [{id: "none", label: "ללא"}, {id: "shadow", label: "צל עדין"}, {id: "outline", label: "מסגרת"}];
const arrows = [
  {label: "למעלה", dx: 0, dy: -1, icon: "M6 15l6-6 6 6"}, {label: "ימינה", dx: 1, dy: 0, icon: "M9 6l6 6-6 6"},
  {label: "שמאלה", dx: -1, dy: 0, icon: "M15 6l-6 6 6 6"}, {label: "למטה", dx: 0, dy: 1, icon: "M6 9l6 6 6-6"}
] as const;

export function Properties({id, layout, box, canvas, aspect, autoTextColor, step, onStep, onPatch, onNudge}: Props) {
  const layer = layout[id], isText = id === "text";
  const image = isText ? null : layout[id as "logo" | "slogan"], text = isText ? layout.text : null;
  const asText = !!image?.asText;
  const heightPct = box ? roundStored(pxToPct(box.h, canvas.h)) : 0;
  return <div className="props">
    {text && <>
      <label className="field">הטקסט
        <input type="text" value={text.text} maxLength={MAX_TEXT_CHARS} dir="rtl" placeholder="הטקסט שיופיע על התמונה" onChange={e => onPatch({text: e.target.value})}/>
      </label>
      <div className="two-col">
        <FontPicker value={text.font} onChange={font => onPatch({font})}/>
        <div className="field">עובי
          <button type="button" className="chip-toggle" aria-pressed={text.bold} onClick={() => onPatch({bold: !text.bold})}>מודגש</button>
        </div>
      </div>
      <ColorField label="צבע הטקסט" value={text.color} fallback={autoTextColor} resetLabel="אוטומטי" onChange={color => onPatch({color})}/>
    </>}
    {image && <>
      <div className="field">הצגה
        <div className="seg two" role="group" aria-label="הצגת השכבה">
          <button type="button" aria-pressed={!image.asText} onClick={() => onPatch({asText: false})}>התמונה המקורית</button>
          <button type="button" aria-pressed={image.asText} onClick={() => onPatch({asText: true, lock: true, stretch: 1})}>טקסט בגופן שלי</button>
        </div>
      </div>
      {image.asText && <>
        <label className="field">{id === "logo" ? "טקסט הלוגו" : "טקסט הסלוגן"}
          <textarea rows={2} value={image.label} maxLength={MAX_LABEL_CHARS} dir="ltr" placeholder="עד שתי שורות"
            onChange={e => onPatch({label: e.target.value.replace(/\r/g, "").split("\n").slice(0, 2).join("\n")})}/>
        </label>
        <div className="two-col">
          <FontPicker value={image.font} onChange={font => onPatch({font})}/>
          <div className="field">עובי
            <button type="button" className="chip-toggle" aria-pressed={image.bold} onClick={() => onPatch({bold: !image.bold})}>מודגש</button>
          </div>
        </div>
      </>}
      <ColorField label={`צבע ${layerLabel[id].slice(1)}`} value={image.color ?? (image.tone === "light" ? "#FBF8F2" : image.tone === "dark" ? "#1F2A24" : null)}
        fallback="#1F2A24" resetLabel={asText ? "ברירת מחדל" : "צבע מקורי"} onChange={color => onPatch({color, tone: "original"})}/>
    </>}
    <div className="two-col">
      <NumField label="מיקום אופקי" value={layer.cx} min={0} max={100} onCommit={v => onPatch({cx: v})}/>
      <NumField label="מיקום אנכי" value={layer.cy} min={0} max={100} onCommit={v => onPatch({cy: v})}/>
      {image && <NumField label="רוחב" value={image.w} min={1} max={100} onCommit={v => onPatch({w: v})}/>}
      {image && !image.lock && !asText && <NumField label="גובה" value={heightPct} min={1} max={100}
        onCommit={v => { const wPx = pctToPx(image.w, canvas.w); if (wPx > 0) onPatch({stretch: roundStored(Math.min(5, Math.max(0.2, pctToPx(v, canvas.h) / (wPx * aspect))))}); }}/>}
      {text && <NumField label="גודל" value={text.size} min={1} max={30} onCommit={v => onPatch({size: v})}/>}
      <NumField label="שקיפות" value={layer.opacity} min={0} max={100} step={1} onCommit={v => onPatch({opacity: v})}/>
    </div>
    {image && !asText && <label className="check"><input type="checkbox" checked={image.lock} onChange={e => onPatch(e.target.checked ? {lock: true, stretch: 1} : {lock: false})}/> שמירה על פרופורציות</label>}
    <div className="field">קריאוּת על הרקע
      <div className="seg three" role="group" aria-label="קריאות על הרקע">
        {legibility.map(l => <button key={l.id} type="button" aria-pressed={layer.legibility === l.id} onClick={() => onPatch({legibility: l.id})}>{l.label}</button>)}
      </div>
    </div>
    <div className="nudge" role="group" aria-label="הזזה עדינה">
      <span className="nudge-title">הזזה עדינה</span>
      <div className="nudge-pad">
        {arrows.map(a => <button key={a.label} type="button" className={`nudge-${a.label}`} aria-label={a.label} onClick={() => onNudge(a.dx * step, a.dy * step)}><Icon d={a.icon} size={20} strokeWidth={1.8}/></button>)}
        <button type="button" className="nudge-step" onClick={onStep} aria-label={`גודל צעד: ${step} פיקסלים. לחיצה מחליפה בין 1 ל-10`}>צעד {step}px</button>
      </div>
      <small>מקשי חצים מזיזים פיקסל אחד, ועם Shift עשרה</small>
    </div>
  </div>;
}
