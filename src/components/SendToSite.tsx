import {useState} from "react";
import type {Studio} from "../useStudio";
import {sendToSite, type InboxVariant} from "../site";
import {Icon, icons} from "./Icon";

// "שליחה לאתר": התמונה עוברת ל"תמונות חדשות" בממשק הניהול ולא מתפרסמת עד שרבקה תחליט.
// כשיש גרסה עם מיתוג, שואלים איזו גרסה לשלוח: נקייה (מומלצת לכרטיס מוצר) או עם הלוגו (לפוסטים).
export function SendToSite({studio}: {studio: Studio}) {
  const {state, dispatch} = studio;
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const clean = state.result, branded = state.composed?.branded ? state.composed.blob : null;
  if (!clean) return null;
  const meta = {style: state.selection.style, palette: state.selection.palette, product: state.selection.product, formatId: state.formatId};
  async function send(variant: InboxVariant) {
    setOpen(false); setBusy(true);
    try {
      const blob = variant === "branded" && branded ? branded : await fetch(clean!).then(r => r.blob());
      await sendToSite(blob, variant, meta);
      dispatch({type: "say", text: "נשלח לאתר ✓ התמונה ממתינה ב״תמונות חדשות״ בממשק הניהול"});
    } catch (e) {
      dispatch({type: "say", text: e instanceof Error ? e.message : "השליחה לאתר נכשלה", error: true});
    } finally { setBusy(false); }
  }
  return <span className="send-site">
    <button type="button" className="pill" title="שליחה לאתר" aria-label="שליחה לאתר" disabled={busy} aria-expanded={open} onClick={() => branded ? setOpen(o => !o) : send("clean")}>
      <Icon d={icons.send} size={20}/><span className="btn-label">{busy ? "שולחים…" : "שליחה לאתר"}</span>
    </button>
    {open && <span className="send-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => send("clean")}><strong>תמונה נקייה</strong><small>מומלץ לכרטיס מוצר באתר</small></button>
      <button type="button" role="menuitem" onClick={() => send("branded")}><strong>עם הלוגו</strong><small>מתאים לפוסטים</small></button>
    </span>}
  </span>;
}
