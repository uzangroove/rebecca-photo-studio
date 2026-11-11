import {isBlocked, shown, surfaceGroups, surfaces} from "../../../shared/catalog";
import {effectiveScene} from "../../../shared/selection";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";
import {Tile} from "../Tile";

// לשונית "משטח": כל המשטחים בארבע קבוצות. אריח שנבחר = הערך בפועל (בחירה מפורשת, ואם אין אז ברירת המחדל של הסגנון).
export function SurfacePanel({studio}: {studio: Studio}) {
  const {selection, neverList} = studio.state;
  const current = effectiveScene(selection, "surface");
  const visible = shown("surfaces", surfaces, selection.surface);
  return <div className="panel-body">
    <div className="heading-row"><h2>משטח</h2>
      {selection.surface !== null && <button type="button" className="link-btn" onClick={() => studio.select("surface", null)}><Icon d={icons.reset} size={16}/>לפי הסגנון</button>}
    </div>
    <div className="surface-groups">
    {surfaceGroups.filter(g => visible.some(s => s.group === g.id)).map(g => <div className="group" key={g.id}><span className="group-title">{g.label}</span>
      <div className="grid grid-4 surfaces phone-5">
        {visible.filter(s => s.group === g.id).map(s => {
          const blocked = isBlocked(s, neverList);
          return <Tile key={s.id} layout="col" disabled={blocked} title={blocked ? `${s.label} ברשימת "אף פעם לא"` : undefined}
            selected={!blocked && current === s.id} onClick={() => studio.select("surface", s.id)}
            visual={<span className="swatch" style={{background: s.swatch}}><Icon d={s.icon} size={20}/></span>} label={blocked ? `${s.label} · חסום` : s.label}/>;
        })}
      </div>
    </div>)}
    </div>
  </div>;
}
