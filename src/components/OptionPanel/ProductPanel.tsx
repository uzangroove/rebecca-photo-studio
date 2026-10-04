import {productTypes} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

export function ProductPanel({studio}: {studio: Studio}) {
  const {selection} = studio.state;
  return <div className="panel-body">
    <div><h2>המוצר</h2><p className="panel-sub">מה מופיע בצילום שהעליתם.</p></div>
    <div className="grid grid-2">
      {productTypes.map(p => <Tile key={p.id} selected={selection.product === p.id} onClick={() => studio.select("product", p.id)}
        visual={<Icon d={p.icon} size={22}/>} label={p.label}/>)}
    </div>
  </div>;
}
