import type {SyncState} from "../state";
import {Icon, icons} from "./Icon";

const syncLabel: Record<SyncState, string> = {
  checking: "בודקים סנכרון…", synced: "מסונכרן בכל המכשירים", saving: "מסנכרנים…", offline: "לא מסונכרן. ההגדרות נשמרות במכשיר הזה"
};

export function Header({sync}: {sync: SyncState}) {
  return <header className="header">
    <div className="header-brand">
      <img src="/assets/rebecca_studio_logo.png" alt="RÉBECCA"/>
      <span className="header-divider"/>
      <span className="header-title">סטודיו</span>
    </div>
    <span className={`sync sync-${sync}`} role="status"><Icon d={sync === "offline" ? icons.cloudOff : icons.cloud} size={18} strokeWidth={1.7}/>{syncLabel[sync]}</span>
    <a className="header-link" href="/" target="_blank" rel="noopener noreferrer">פתיחה בחלון מלא</a>
  </header>;
}
