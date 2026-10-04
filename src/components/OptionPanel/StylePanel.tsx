import {props, styles} from "../../../shared/catalog";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {Tile} from "../Tile";

export function StylePanel({studio}: {studio: Studio}) {
  const {selection} = studio.state;
  return <div className="panel-body">
    <div><h2>סגנון הסצנה</h2><p className="panel-sub">נקודת התחלה לכל הסצנה.</p></div>
    <div className="grid grid-2 phone-5">
      {styles.map(s => <Tile key={s.id} selected={selection.style === s.id} onClick={() => studio.select("style", s.id)}
        visual={<Icon d={s.icon}/>} label={s.label} detail={s.detail}/>)}
    </div>
    <div className="group"><span className="group-title">אביזרים</span>
      <div className="grid grid-3">
        {props.map(p => <Tile key={p.id} layout="col" selected={selection.props === p.id} onClick={() => studio.select("props", p.id)}
          visual={<Icon d={p.icon}/>} label={p.label}/>)}
      </div>
    </div>
  </div>;
}
