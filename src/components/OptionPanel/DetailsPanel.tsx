import {backgrounds, isBlocked, lights, surfaces, type CatalogItem} from "../../../shared/catalog";
import {effectiveScene, MAX_WISH_CHARS, type SceneKey} from "../../../shared/selection";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";
import {Tile} from "../Tile";

export function DetailsPanel({studio}: {studio: Studio}) {
  const {selection, neverList} = studio.state;
  const explicit = selection.surface !== null || selection.background !== null || selection.light !== null;
  // אריח שנבחר = הערך בפועל: בחירה מפורשת, ואם אין אז ברירת המחדל של הסגנון.
  const grid = (key: SceneKey, items: readonly CatalogItem[], cols: string, visual: (i: CatalogItem) => React.ReactNode) =>
    <div className={`grid ${cols}`}>
      {items.map(i => {
        const blocked = isBlocked(i, neverList);
        return <Tile key={i.id} layout="col" disabled={blocked} title={blocked ? `${i.label} ברשימת "אף פעם לא"` : undefined}
          selected={!blocked && effectiveScene(selection, key) === i.id} onClick={() => studio.select(key, i.id)}
          visual={visual(i)} label={blocked ? `${i.label} · חסום` : i.label}/>;
      })}
    </div>;
  const icon = (i: CatalogItem) => <Icon d={i.icon}/>;
  return <div className="panel-body">
    <div className="heading-row"><h2>פרטי הסצנה</h2>
      {explicit && <button type="button" className="link-btn" onClick={studio.resetScene}><Icon d={icons.reset} size={16}/>חזרה לברירות הסגנון</button>}
    </div>
    <div className="group"><span className="group-title">משטח</span>
      {grid("surface", surfaces, "grid-3 surfaces phone-5", i => <span className="swatch" style={{background: surfaces.find(s => s.id === i.id)!.swatch}}><Icon d={i.icon} size={20}/></span>)}
    </div>
    <div className="group"><span className="group-title">תאורה</span>{grid("light", lights, "grid-4", icon)}</div>
    <div className="group"><span className="group-title">רקע</span>{grid("background", backgrounds, "grid-4", icon)}</div>
    <label className="field">בקשה מיוחדת <small className="counter">{selection.wish.length}/{MAX_WISH_CHARS}</small>
      <textarea rows={2} maxLength={MAX_WISH_CHARS} value={selection.wish} placeholder="למשל: שירגיש כמו בוקר שבת שקט" onChange={e => studio.dispatch({type: "wish", text: e.target.value})}/>
    </label>
  </div>;
}
