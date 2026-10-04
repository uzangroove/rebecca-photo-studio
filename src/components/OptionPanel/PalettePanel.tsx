import {favoritesFirst, palettes, type PaletteItem} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

const Bar = ({colors}: {colors: readonly string[]}) => <span className="bar">{colors.map(c => <i key={c} style={{background: c}}/>)}</span>;

export function PalettePanel({studio}: {studio: Studio}) {
  const {selection} = studio.state, pick = (id: string) => studio.select("palette", id);
  const ordered = favoritesFirst(palettes), favorites = ordered.filter(p => p.favorite), others = ordered.filter(p => !p.favorite);
  const dots = (p: PaletteItem) => <span className="dots">{p.colors.map(c => <i key={c} style={{background: c}}/>)}</span>;
  return <div className="panel-body">
    <div><h2>פלטת צבעים</h2><p className="panel-sub">הצבעים חלים על הסביבה בלבד, לא על המוצר.</p></div>
    <span className="group-title gold">המועדפות של רבקה</span>
    <div className="grid grid-2">
      {favorites.map(p => <button key={p.id} type="button" className={`tile tile-big${selection.palette === p.id ? " is-selected" : ""}`} aria-pressed={selection.palette === p.id} onClick={() => pick(p.id)}>
        <span className="big-top"><Icon d={p.icon} fill={p.iconFill} size={30} strokeWidth={1.5}/><strong>{p.label}</strong></span><Bar colors={p.colors}/>
      </button>)}
    </div>
    <span className="group-title muted">כל הפלטות</span>
    <div className="grid grid-3 phone-5">
      {others.map(p => <Tile key={p.id} selected={selection.palette === p.id} onClick={() => pick(p.id)}
        visual={<Icon d={p.icon} fill={p.iconFill} size={22}/>} label={p.label} extra={dots(p)}/>)}
    </div>
  </div>;
}
