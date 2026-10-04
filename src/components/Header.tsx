import type {SyncState} from "../state";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";
import {RecipeBar} from "./RecipeBar";

const syncLabel: Record<SyncState, string> = {
  checking: "בודקים סנכרון…", synced: "מסונכרן בכל המכשירים", saving: "מסנכרנים…", offline: "לא מסונכרן. ההגדרות נשמרות במכשיר הזה"
};

export function Header({studio}: {studio: Studio}) {
  const {sync} = studio.state;
  return <header className="header">
    <div className="header-brand">
      <img src="/assets/rebecca_studio_logo.png" alt="RÉBECCA"/>
      <span className="header-divider"/>
      <span className="header-title">סטודיו</span>
    </div>
    <RecipeBar studio={studio}/>
    <div className="header-end">
      <span className={`sync sync-${sync}`} role="status"><Icon d={sync === "offline" ? icons.cloudOff : icons.cloud} size={18} strokeWidth={1.7}/>{syncLabel[sync]}</span>
      <button type="button" className="icon-btn" aria-label="רשימת אף פעם לא" title="רשימת אף פעם לא" onClick={() => studio.dispatch({type: "tab", tab: "style"})}><Icon d={icons.shield} size={20} strokeWidth={1.7}/></button>
      <a className="header-link" href="/" target="_blank" rel="noopener noreferrer">פתיחה בחלון מלא</a>
    </div>
  </header>;
}
