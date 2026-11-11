import {useEffect, useRef} from "react";
import type {Studio} from "../useStudio";

const TOAST_MS = 4000;

// הודעות קופצות מעל הכול: חלון חוסם בזמן יצירה או שליחה (גם מונע לחיצה כפולה),
// חלון שגיאה שנסגר ב"הבנתי", ואישור קצר שנעלם לבד.
export function Notices({studio}: {studio: Studio}) {
  const {state, dispatch} = studio;
  const dialog = useRef<HTMLDialogElement>(null), toast = useRef<HTMLDivElement>(null);
  const working = state.busy || Boolean(state.progress);
  const alert = !working && state.notice?.kind === "alert" ? state.notice : null;
  const toastNotice = !working && state.notice?.kind === "toast" ? state.notice : null;
  const modal = working || Boolean(alert);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (modal && !d.open) d.showModal();
    if (!modal && d.open) d.close();
  }, [modal]);

  useEffect(() => {
    const t = toast.current; if (!t || !toastNotice) return;
    try {t.showPopover();} catch {/* דפדפן ישן: האישור יוצג בלי שכבה עליונה */}
    const timer = setTimeout(() => dispatch({type: "dismissNotice", id: toastNotice.id}), TOAST_MS);
    return () => {clearTimeout(timer); try {t.hidePopover();} catch {/* כבר מוסתר */}};
  }, [toastNotice?.id, dispatch]);

  return <>
    <dialog ref={dialog} className="notice-dialog" aria-label={working ? "פעולה מתבצעת" : "הודעה"}
      onCancel={e => {e.preventDefault(); if (alert) dispatch({type: "dismissNotice", id: alert.id});}}>
      {working
        ? <div className="notice-body" role="status"><span className="notice-spinner"/><p>{state.progress ?? state.status.text}</p><small>אל תסגרו את החלון ואל תלחצו שוב</small></div>
        : alert && <div className="notice-body is-error" role="alertdialog" aria-live="assertive"><p>{alert.text}</p>
          <button type="button" className="cta cta-green" autoFocus onClick={() => dispatch({type: "dismissNotice", id: alert.id})}>הבנתי</button></div>}
    </dialog>
    {toastNotice && <div ref={toast} popover="manual" className="notice-toast" role="status">{toastNotice.text}</div>}
  </>;
}
