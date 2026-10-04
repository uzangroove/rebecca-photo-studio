import {formats} from "../../social-formats";
import type {Studio} from "../../useStudio";
import {Tile} from "../Tile";

// מסגרת קטנה ביחס של הפורמט, בתוך ריבוע של 38px.
function Frame({width, height}: {width: number; height: number}) {
  const r = width / height, w = r >= 1 ? 38 : Math.round(38 * r), h = r >= 1 ? Math.round(38 / r) : 38;
  return <i className="frame" style={{width: w, height: h}}/>;
}

export function FormatPanel({studio}: {studio: Studio}) {
  const {formatId} = studio.state;
  return <div className="panel-body">
    <div><h2>פורמט פרסום</h2><p className="panel-sub">התמונה תיחתך למידות שנבחרו.</p></div>
    <div className="grid grid-2 grid-dense phone-4">
      {formats.map(f => <Tile key={f.id} selected={formatId === f.id} onClick={() => studio.dispatch({type: "format", id: f.id})}
        visual={<Frame width={f.width} height={f.height}/>} title={`${f.group} · ${f.name} · ${f.width}×${f.height}`}
        label={<><span className="fmt-group">{f.group}</span><span className="fmt-name">{f.name}</span></>}
        extra={<small className="dims" dir="ltr">{f.width}×{f.height}</small>}/>)}
    </div>
  </div>;
}
