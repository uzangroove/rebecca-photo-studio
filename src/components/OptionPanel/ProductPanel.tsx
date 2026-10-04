import {angles, candleStates, giftWraps, glassTints, occasions, productTypes, findItem} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

// לשונית "מוצר": סוג המוצר, ואז רק מה שרלוונטי אליו (מצב נר, גוון זכוכית, עטיפה), זווית צילום ואירוע.
export function ProductPanel({studio}: {studio: Studio}) {
  const {selection} = studio.state, pick = studio.select;
  const product = findItem("productTypes", selection.product);
  const isCandle = product?.family === "candle", isGlass = product?.id === "glass-candle", isGift = product?.family === "gift";
  const pill = (selected: boolean, label: string, onClick: () => void) =>
    <button key={label} type="button" className={`pill-opt${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>{label}</button>;
  return <div className="panel-body">
    <h2>המוצר</h2>
    <div className="grid grid-2 grid-dense phone-4">
      {productTypes.map(p => <Tile key={p.id} selected={selection.product === p.id} onClick={() => pick("product", p.id)} visual={<Icon d={p.icon} size={22}/>} label={p.label}/>)}
    </div>
    {isCandle && <div className="group"><span className="group-title">מצב הנר</span>
      <div className="grid grid-3">
        {candleStates.map(s => <Tile key={s.id} layout="col" selected={selection.candleState === s.id} onClick={() => pick("candleState", s.id)} visual={<Icon d={s.icon}/>} label={s.label}/>)}
      </div>
    </div>}
    {isGlass && <div className="group"><span className="group-title">הזכוכית</span>
      <div className="pill-row">
        {glassTints.map(t => pill(selection.glassTint === t.id, t.label, () => pick("glassTint", selection.glassTint === t.id ? null : t.id)))}
      </div>
    </div>}
    {isGift && <div className="group"><span className="group-title">המארז</span>
      <div className="grid grid-2">
        {giftWraps.map(w => <Tile key={w.id} selected={selection.giftWrap === w.id} onClick={() => pick("giftWrap", w.id)} visual={<Icon d={w.icon} size={22}/>} label={w.label}/>)}
      </div>
    </div>}
    <div className="group"><span className="group-title">זווית צילום</span>
      <div className="grid grid-4">
        {angles.map(a => <Tile key={a.id} layout="col" selected={selection.angle === a.id} onClick={() => pick("angle", selection.angle === a.id ? null : a.id)} visual={<Icon d={a.icon}/>} label={a.label}/>)}
      </div>
    </div>
    <div className="group"><span className="group-title">אירוע</span>
      <div className="pill-row">
        {pill(selection.occasion === null, "ללא", () => pick("occasion", null))}
        {occasions.map(o => pill(selection.occasion === o.id, o.label, () => pick("occasion", o.id)))}
      </div>
    </div>
  </div>;
}
