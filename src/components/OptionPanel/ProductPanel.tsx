import {techniqueSuggestions, MAX_TECHNIQUE_CHARS} from "../../../shared/selection";
import {angleAsPhotoIcon, angles, candleStates, occasions, productTypes, findItem} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

// לשונית "מוצר": סוג המוצר, ואז רק מה שרלוונטי אליו (מצב נר), זווית צילום ואירוע.
export function ProductPanel({studio}: {studio: Studio}) {
  const {selection} = studio.state, pick = studio.select;
  const product = findItem("productTypes", selection.product);
  const isCandle = product?.family === "candle";
  const pill = (selected: boolean, label: string, onClick: () => void) =>
    <button key={label} type="button" className={`pill-opt${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>{label}</button>;
  // ההצעות נאספות ממה שרבקה כבר רשמה בתמונות קודמות. הדפדפן מסנן אותן תוך כדי הקלדה.
  const suggestions = techniqueSuggestions(studio.state.history.map(h => h.selection.technique));
  return <div className="panel-body">
    <h2>המוצר</h2>
    <div className="grid grid-2 phone-4">
      {productTypes.map(p => <Tile key={p.id} selected={selection.product === p.id} onClick={() => pick("product", p.id)} visual={<Icon d={p.icon} size={22}/>} label={p.label}/>)}
    </div>
    <label className="field">טכניקה / עיצוב <small className="counter">לא חובה</small>
      <input type="text" dir="auto" list="technique-options" maxLength={MAX_TECHNIQUE_CHARS} value={selection.technique} autoComplete="off" placeholder="למשל: סחרור, marbled"
        onChange={e => studio.dispatch({type: "technique", text: e.target.value})}/>
      <datalist id="technique-options">{suggestions.map(t => <option key={t} value={t}/>)}</datalist>
    </label>
    {isCandle && <div className="group"><span className="group-title">מצב הנר</span>
      <div className="grid grid-3">
        {candleStates.map(s => <Tile key={s.id} layout="col" selected={selection.candleState === s.id} onClick={() => pick("candleState", s.id)} visual={<Icon d={s.icon}/>} label={s.label}/>)}
      </div>
    </div>}
    <div className="group"><span className="group-title">זווית צילום</span>
      <div className="grid grid-4">
        <Tile layout="col" selected={selection.angle === null} onClick={() => pick("angle", null)} visual={<Icon d={angleAsPhotoIcon}/>} label="כמו בצילום"/>
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
