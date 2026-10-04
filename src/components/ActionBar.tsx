import {formatById} from "../../shared/social-formats";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";
import {UploadButton} from "./UploadButton";

export function ActionBar({studio}: {studio: Studio}) {
  const {state, generate, download, choosePhoto} = studio;
  const format = formatById(state.formatId), url = state.composed?.url;
  const name = `rebecca-${state.selection.style}-${state.selection.palette}.png`;
  return <div className="actions">
    <button type="button" className="cta" disabled={state.busy} onClick={generate}>
      <Icon d={icons.sparkle}/>{state.busy ? "יוצרים…" : state.result ? "יצירת גרסה נוספת" : "יצירת תמונה"}
    </button>
    <UploadButton label={state.photo ? "החלפת צילום" : "העלאת צילום"} onFile={choosePhoto}/>
    <button type="button" className="pill" onClick={() => studio.dispatch({type: "screen", screen: "editor"})}><Icon d="M3 12V4h8l10 10-8 8z M7.5 8.5h.01" size={20} strokeWidth={1.7}/><span className="btn-label">עריכת מיתוג</span></button>
    <span className="spacer"/>
    <a className={`save${url ? "" : " is-disabled"}`} href={url} download={name} aria-disabled={!url} onClick={download}>
      <Icon d={icons.download} size={20}/><span className="save-text">{state.result && !url ? "מכינים להורדה…" : `שמירה · ${format.width}×${format.height}`}</span>
    </a>
    {state.downloadFallback && url && <a className="open-image" href={url} target="_blank" rel="noopener noreferrer">פתיחת התמונה בחלון נפרד לשמירה</a>}
  </div>;
}
