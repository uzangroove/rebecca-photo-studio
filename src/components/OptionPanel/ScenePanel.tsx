import {backgrounds, isBlocked, lights, shown, type CatalogItem} from "../../../shared/catalog";
import {effectiveScene, MAX_WISH_CHARS, type SceneKey} from "../../../shared/selection";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";
import {Tile} from "../Tile";

// לשונית "קיר ותאורה": הקיר או הרקע שמאחורי המוצר, התאורה, והבקשה המיוחדת.
export function ScenePanel({studio}: {studio: Studio}) {
  const {selection, neverList} = studio.state;
  const explicit = selection.background !== null || selection.light !== null;
  const grid = (key: SceneKey, items: readonly CatalogItem[], cols: string) =>
    <div className={`grid ${cols}`}>
      {items.map(i => {
        const blocked = isBlocked(i, neverList);
        return <Tile key={i.id} layout="col" disabled={blocked} title={blocked ? `${i.label} ברשימת "אף פעם לא"` : undefined}
          selected={!blocked && effectiveScene(selection, key) === i.id} onClick={() => studio.select(key, i.id)}
          visual={<Icon d={i.icon}/>} label={blocked ? `${i.label} · חסום` : i.label}/>;
      })}
    </div>;
  return <div className="panel-body">
    <div className="heading-row"><h2>קיר ותאורה</h2>
      {explicit && <button type="button" className="link-btn" onClick={() => { studio.select("background", null); studio.select("light", null); }}><Icon d={icons.reset} size={16}/>לפי הסגנון</button>}
    </div>
    <div className="group"><span className="group-title">קיר ורקע</span>{grid("background", shown("backgrounds", backgrounds, selection.background), "grid-5 walls phone-5")}</div>
    <div className="group"><span className="group-title">תאורה</span>{grid("light", lights, "grid-4 phone-4")}</div>
    <label className="field">בקשה מיוחדת <small className="counter">{selection.wish.length}/{MAX_WISH_CHARS}</small>
      <textarea rows={2} maxLength={MAX_WISH_CHARS} value={selection.wish} placeholder="למשל: שירגיש כמו בוקר שבת שקט" onChange={e => studio.dispatch({type: "wish", text: e.target.value})}/>
    </label>
  </div>;
}
