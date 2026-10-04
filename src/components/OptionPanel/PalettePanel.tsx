import {palettes} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

export function PalettePanel({studio}: {studio: Studio}) {
  const {selection} = studio.state;
  return <div className="panel-body">
    <div><h2>פלטת צבעים</h2><p className="panel-sub">הצבעים חלים על הסביבה בלבד, לא על המוצר.</p></div>
    <div className="grid grid-3 phone-5">
      {palettes.map(p => <Tile key={p.id} selected={selection.palette === p.id} onClick={() => studio.select("palette", p.id)}
        visual={<Icon d={p.icon} fill={p.iconFill} size={22}/>} label={p.label}
        extra={<span className="dots">{p.colors.map(c => <i key={c} style={{background: c}}/>)}</span>}/>)}
    </div>
  </div>;
}
