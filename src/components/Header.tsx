import type {SyncState} from "../state";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";
import {RecipeBar} from "./RecipeBar";
import {ThemeMenu} from "./ThemeMenu";

const syncLabel: Record<SyncState, string> = {
  checking: "בודקים סנכרון…", synced: "מסונכרן בכל המכשירים", saving: "מסנכרנים…", offline: "לא מסונכרן. ההגדרות נשמרות במכשיר הזה"
};

// כותרת: מתכונים בצד ימין, הלוגו והסלוגן של רבקה במרכז, וסנכרון והגדרות בצד שמאל.
export function Header({studio}: {studio: Studio}) {
  const {sync} = studio.state;
  return <header className="header">
    <RecipeBar studio={studio}/>
    <div className="header-brand">
      <img className="brand-logo" src="/assets/rebecca_studio_logo.png" alt="RÉBECCA"/>
      <img className="brand-slogan" src="/assets/rebecca_studio_slogan.png" alt="HANDMADE NATURAL SOAP & CANDLES"/>
    </div>
    <div className="header-end">
      <span className={`sync sync-${sync}`} role="status"><Icon d={sync === "offline" ? icons.cloudOff : icons.cloud} size={18} strokeWidth={1.7}/>{syncLabel[sync]}</span>
      <ThemeMenu studio={studio}/>
      <button type="button" className="icon-btn" aria-label="רשימת אף פעם לא" title="רשימת אף פעם לא" onClick={() => studio.dispatch({type: "tab", tab: "style"})}><Icon d={icons.shield} size={20} strokeWidth={1.7}/></button>
      <a className="header-link" href="/" target="_blank" rel="noopener noreferrer">פתיחה בחלון מלא</a>
    </div>
  </header>;
}
