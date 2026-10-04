import {favoritesFirst, props, styles} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";
import {NeverList} from "./NeverList";

export function StylePanel({studio}: {studio: Studio}) {
  const {selection} = studio.state;
  const [common, hidden] = [props.filter(p => p.id !== "rich"), props.filter(p => p.id === "rich")];
  return <div className="panel-body">
    <div><h2>סגנון הסצנה</h2><p className="panel-sub">נקודת התחלה. כל פרט אפשר לשנות בלשונית "פרטים".</p></div>
    <div className="grid grid-2 phone-5">
      {favoritesFirst(styles).map(s => <Tile key={s.id} selected={selection.style === s.id} onClick={() => studio.select("style", s.id)}
        visual={<Icon d={s.icon}/>} label={s.label} detail={s.detail}/>)}
    </div>
    <div className="group"><span className="group-title">אביזרים</span>
      <div className="grid grid-2">
        {common.map(p => <Tile key={p.id} selected={selection.props === p.id} onClick={() => studio.select("props", p.id)} visual={<Icon d={p.icon} size={22}/>} label={p.label}/>)}
      </div>
      <details className="advanced" open={selection.props === "rich"}>
        <summary>הגדרות מתקדמות</summary>
        <div className="grid grid-2">
          {hidden.map(p => <Tile key={p.id} selected={selection.props === p.id} onClick={() => studio.select("props", p.id)} visual={<Icon d={p.icon} size={22}/>} label={p.label}/>)}
        </div>
      </details>
    </div>
    <NeverList studio={studio}/>
  </div>;
}
