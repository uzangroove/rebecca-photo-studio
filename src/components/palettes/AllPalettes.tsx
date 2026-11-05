import {useEffect, useRef} from "react";
import {palettes} from "../../../shared/catalog";
import {customToken} from "../../../shared/palette-custom";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";

const Bar = ({colors}: {colors: readonly string[]}) => <span className="bar">{colors.map((c, i) => <i key={i} style={{background: c}}/>)}</span>;

// "כל הפלטות": חלון נפרד, ובו מותר לגלול (זה דפדוף בקטלוג, לא בחירה רגילה בלשונית).
// הפלטות שלי (עם מחיקה), הקבועות (העין מסתירה), והמוסתרות (לחיצה מחזירה).
export function AllPalettes({studio, onClose, onNew}: {studio: Studio; onClose: () => void; onNew: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {ref.current?.showModal();}, []);
  const {selection, customPalettes, hiddenPalettes} = studio.state;
  const hidden = new Set(hiddenPalettes);
  const builtIns = palettes.filter(p => !hidden.has(p.id)), hiddenItems = palettes.filter(p => hidden.has(p.id));
  const choose = (value: string) => { studio.select("palette", value); ref.current?.close(); };
  return <dialog ref={ref} className="gallery palettes-dlg" aria-label="כל הפלטות" onClose={onClose} onClick={e => {if (e.target === ref.current) ref.current?.close();}}>
    <div className="gallery-head">
      <h2>כל הפלטות <small>{palettes.length} קבועות · {customPalettes.length} שלך{hiddenItems.length ? ` · ${hiddenItems.length} מוסתרות` : ""}</small></h2>
      <div className="gallery-tools">
        <button type="button" className="pill dashed" onClick={() => { ref.current?.close(); onNew(); }}><Icon d={icons.plus} size={18}/>פלטה חדשה</button>
        <button type="button" className="icon-btn" aria-label="סגירה" onClick={() => ref.current?.close()}><Icon d={icons.close}/></button>
      </div>
    </div>
    <div className="palettes-scroll">
      {customPalettes.length > 0 && <>
        <span className="group-title">הפלטות שלי</span>
        <div className="pal-grid">
          {customPalettes.map(c => {
            const token = customToken(c.colors);
            return <div key={c.id} className={`pal-card${selection.palette === token ? " is-selected" : ""}`}>
              <button type="button" className="pal-pick" aria-pressed={selection.palette === token} onClick={() => choose(token)}><strong>{c.label || "בלי שם"}</strong><Bar colors={c.colors}/></button>
              <button type="button" className="pal-side" aria-label={`מחיקת ${c.label || "הפלטה"}`} onClick={() => { if (confirm(`למחוק את הפלטה "${c.label || "בלי שם"}"?`)) studio.dispatch({type: "paletteDelete", id: c.id}); }}><Icon d={icons.trash} size={18}/></button>
            </div>;
          })}
        </div>
      </>}
      <span className="group-title">הפלטות הקבועות <small className="muted-text">· העין מסתירה פלטה מהרשימה</small></span>
      <div className="pal-grid">
        {builtIns.map(p => <div key={p.id} className={`pal-card${selection.palette === p.id ? " is-selected" : ""}`}>
          <button type="button" className="pal-pick" aria-pressed={selection.palette === p.id} onClick={() => choose(p.id)}><strong>{p.label}{p.favorite ? " ★" : ""}</strong><Bar colors={p.colors}/></button>
          {!p.favorite && <button type="button" className="pal-side" aria-label={`הסתרת ${p.label}`} onClick={() => studio.dispatch({type: "paletteHide", id: p.id})}><Icon d={icons.eyeOff} size={18}/></button>}
        </div>)}
      </div>
      {hiddenItems.length > 0 && <>
        <span className="group-title muted">מוסתרות <small className="muted-text">· לחיצה מחזירה לרשימה</small></span>
        <div className="pal-grid">
          {hiddenItems.map(p => <button key={p.id} type="button" className="pal-card pal-hidden" onClick={() => studio.dispatch({type: "paletteShow", id: p.id})} aria-label={`החזרת ${p.label}`}>
            <strong>{p.label}</strong><Bar colors={p.colors}/></button>)}
          <button type="button" className="pal-card pal-restore" onClick={() => studio.dispatch({type: "paletteShow", id: null})}>החזרת כל המוסתרות</button>
        </div>
      </>}
    </div>
  </dialog>;
}
