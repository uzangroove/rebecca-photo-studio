import {useState} from "react";
import {findItem} from "../../shared/catalog";
import {formatById} from "../social-formats";
import {imageToShow, type ViewMode} from "../state";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";
import {UploadButton} from "./UploadButton";

const views: readonly {id: ViewMode; label: string}[] = [
  {id: "split", label: "זה לצד זה"}, {id: "single", label: "תמונה אחת"}, {id: "compare", label: "לפני ואחרי"}
];

export function Stage({studio}: {studio: Studio}) {
  const {state, dispatch, choosePhoto} = studio;
  const [divider, setDivider] = useState(50);
  const result = imageToShow(state), source = state.photo?.url ?? null, format = formatById(state.formatId);
  // השוואה דורשת גם מקור וגם תוצאה; בלי שניהם מציגים תמונה אחת.
  const view = state.view === "compare" && !(result && source) ? "single" : state.view;
  const chips = [
    `סגנון: ${findItem("styles", state.selection.style)?.label}`,
    `פלטה: ${findItem("palettes", state.selection.palette)?.label}`,
    `מוצר: ${findItem("productTypes", state.selection.product)?.label}`
  ];
  return <section className="stage" aria-label="התמונה">
    <div className="stage-bar">
      <div className="views" role="group" aria-label="מצב תצוגה">
        {views.map(v => <button key={v.id} type="button" className={`view-btn${v.id === state.view ? " is-active" : ""}`} aria-pressed={v.id === state.view} onClick={() => dispatch({type: "view", view: v.id})}>{v.label}</button>)}
      </div>
      <div className="chips">{chips.map(c => <span key={c}>{c}</span>)}</div>
    </div>
    <div className={`canvas${state.busy ? " is-busy" : ""}`}>
      {!result && !source ? <div className="empty">
        <strong>הצילום הבא של רבקה מתחיל כאן</strong><span>העלו צילום מוצר כדי להתחיל בעיצוב</span>
        <UploadButton label="העלאת צילום" onFile={choosePhoto} variant="primary"/>
      </div>
      : view === "split" ? <div className="split">
        {source && <figure><img src={source} alt="צילום מקורי"/><figcaption>מקור</figcaption></figure>}
        {result ? <figure><img src={result} alt="סצנה חדשה"/><figcaption className="is-result">תוצאה</figcaption></figure>
          : <div className="placeholder">התוצאה תופיע כאן</div>}
      </div>
      : view === "compare" && result && source ? <figure className="compare" style={{aspectRatio: `${format.width} / ${format.height}`}}>
        <img src={result} alt="סצנה חדשה"/>
        <img className="compare-source" src={source} alt="צילום מקורי" style={{clipPath: `inset(0 0 0 ${divider}%)`}}/>
        <span className="compare-line" style={{left: `${divider}%`}}/>
        <span className="compare-handle" style={{left: `${divider}%`}}><Icon d={icons.compare} size={22} strokeWidth={1.8}/></span>
        <span className="compare-tag">מקור</span><span className="compare-tag is-result">תוצאה</span>
        <input className="compare-range" type="range" min={0} max={100} step={1} dir="ltr" value={divider} aria-label="מחיצת לפני ואחרי" onChange={e => setDivider(Number(e.target.value))}/>
      </figure>
      : <figure className="single"><img src={result ?? source ?? ""} alt={result ? "תמונה מעוצבת" : "צילום מוצר מקורי"}/>{result && <figcaption className="is-result">תוצאה</figcaption>}</figure>}
    </div>
    <p className={state.status.error ? "status is-error" : "status"} role="status">{state.busy && <span className="spinner"/>}{state.status.text}</p>
    <p className="caution">ביצירת תמונה פרטים קטנים במוצר עלולים להשתנות. בדקו צורה, צבעים, כיתוב ותוויות לפני פרסום.</p>
  </section>;
}
