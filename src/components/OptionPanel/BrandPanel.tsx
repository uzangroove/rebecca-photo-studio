import {layerIds, MAX_TEXT_CHARS, type LayerId} from "../../../shared/brand-layout";
import {formatById} from "../../../shared/social-formats";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";

const rows: readonly {id: LayerId; label: string; upload?: string}[] = [
  {id: "logo", label: "לוגו", upload: "החלפת לוגו"}, {id: "slogan", label: "סלוגן", upload: "החלפת סלוגן"}, {id: "text", label: "טקסט חופשי"}
];
const open = "M4 4h6v6H4z M14 14h6v6h-6z M10 7h7v7 M7 10v7h7";

// לשונית "מיתוג": מה מוצג על התמונה. המיקום והמראה נערכים בעורך המיתוג.
export function BrandPanel({studio}: {studio: Studio}) {
  const {state, layout, setLayout} = studio, format = formatById(state.formatId);
  const toggle = (id: LayerId, visible: boolean) =>
    setLayout({...layout, [id]: {...layout[id], visible}});
  return <div className="panel-body">
    <div><h2>מיתוג</h2><p className="panel-sub">הלוגו והסלוגן מורכבים על התמונה בהורדה.</p></div>
    <div className="brand-rows">
      {rows.map(r => <div key={r.id} className="brand-row2">
        <label className="check"><input type="checkbox" checked={layout[r.id].visible} onChange={e => toggle(r.id, e.target.checked)}/><span>{r.label}</span></label>
        {r.id === "text"
          ? null
          : <img src={r.id === "logo" ? state.brand.logoSource : state.brand.sloganSource} alt="" className="brand-preview"/>}
        {r.upload && <label className="pill small">{r.upload}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => {studio.chooseBrandFile(e.target.files?.[0], r.id as "logo" | "slogan"); e.currentTarget.value = "";}}/>
        </label>}
      </div>)}
      {layout.text.visible && <label className="field text-field">הטקסט שיופיע על התמונה
        <input type="text" value={layout.text.text} maxLength={MAX_TEXT_CHARS} dir="rtl" autoFocus placeholder="כתבו כאן את הטקסט"
          onChange={e => setLayout({...layout, text: {...layout.text, text: e.target.value}})}/>
      </label>}
    </div>
    <p className="info-card">הפריסה נשמרת לכל פורמט בנפרד. כרגע: {format.group} · {format.name}.{layerIds.some(id => layout[id].visible) ? "" : " עוד לא נבחרה שכבה להצגה."}</p>
    <button type="button" className="cta cta-green" onClick={() => studio.dispatch({type: "screen", screen: "editor"})}><Icon d={open} size={22} strokeWidth={1.7}/>פתיחת עורך המיתוג</button>
  </div>;
}
