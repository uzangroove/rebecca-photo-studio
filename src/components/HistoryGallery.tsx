import {useEffect, useRef, useState} from "react";
import {findItem} from "../../shared/catalog";
import {formatById} from "../../shared/social-formats";
import type {Studio} from "../useStudio";
import {sendToSite} from "../site";
import {Icon, icons} from "./Icon";
import {RatingBadge} from "./RatingBadge";

// כל ההיסטוריה: מהמכשיר ומהארכיון בענן (כל המכשירים). לחיצה על תמונה מחזירה אותה למסך עם ההגדרות שיצרו אותה.
// "בחירה לשליחה לאתר": מסמנים בדיוק את התמונות הרצויות ושולחים אותן ל"תמונות חדשות" באתר.
export function HistoryGallery({studio, onClose}: {studio: Studio; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selecting, setSelecting] = useState(false), [picked, setPicked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState("");
  useEffect(() => {ref.current?.showModal();}, []);
  const history = studio.state.history;
  function toggle(key: string) { setPicked(p => { const n = new Set(p); if (n.has(key)) n.delete(key); else n.add(key); return n; }); }
  async function sendPicked() {
    const items = history.filter(i => picked.has(i.key));
    const done: string[] = [];
    try {
      for (let k = 0; k < items.length; k++) {
        setProgress(`שולחים ${k + 1} מתוך ${items.length}…`);
        const i = items[k];
        const blob = i.blob ?? (i.fullUrl ? await fetch(i.fullUrl).then(r => { if (!r.ok) throw new Error("לא הצלחנו לטעון תמונה מהענן"); return r.blob(); }) : null);
        if (!blob) throw new Error("תמונה אחת לא זמינה כרגע");
        await sendToSite(blob, "clean", {style: i.selection.style, palette: i.selection.palette, product: i.selection.product, formatId: i.formatId});
        done.push(i.key);
      }
      studio.dispatch({type: "say", text: `נשלחו ${done.length} תמונות לאתר ✓ הן ממתינות ב״תמונות חדשות״ בממשק הניהול`});
    } catch (e) {
      studio.dispatch({type: "say", text: `${e instanceof Error ? e.message : "השליחה נכשלה"}${done.length ? ` (${done.length} נשלחו לפני התקלה)` : ""}`, error: true});
    } finally {
      if (done.length) await studio.markSent(done);
      setProgress(""); setPicked(new Set()); setSelecting(false);
    }
  }
  return <dialog ref={ref} className="gallery" aria-label="ההיסטוריה" onClose={onClose} onClick={e => {if (e.target === ref.current) ref.current?.close();}}>
    <div className="gallery-head">
      <h2>ההיסטוריה שלי <small>{history.length} תמונות{history.some(i => i.inCloud) ? ", שמורות בענן ונראות בכל המכשירים" : ", נשמרות בדפדפן הזה"}</small></h2>
      <div className="gallery-tools">
        <button type="button" className={`pill small${selecting ? " is-on" : ""}`} aria-pressed={selecting} onClick={() => { setSelecting(s => !s); setPicked(new Set()); }}>
          <Icon d={icons.send} size={18}/>{selecting ? "ביטול בחירה" : "בחירה לשליחה לאתר"}
        </button>
        <button type="button" className="icon-btn" aria-label="סגירה" onClick={() => ref.current?.close()}><Icon d={icons.close} size={20}/></button>
      </div>
    </div>
    {selecting && <p className="gallery-hint">סמני את התמונות שתרצי לשלוח. הן לא יתפרסמו באתר עד שתבחרי מה לעשות איתן בממשק הניהול.</p>}
    <div className="gallery-grid">
      {history.map(image => {
        const on = picked.has(image.key);
        return <button key={image.key} type="button" className={`card${selecting ? " selectable" : ""}${on ? " is-picked" : ""}`} aria-pressed={selecting ? on : undefined}
          onClick={() => { if (selecting) toggle(image.key); else { studio.openRecent(image); ref.current?.close(); } }}>
          <span className="card-img"><img src={image.url} alt="" loading="lazy" decoding="async"/><RatingBadge rating={image.rating}/>
            {image.sent && <span className="sent-badge">נשלחה לאתר</span>}
            {selecting && <span className="pick-check" aria-hidden="true">{on ? "✓" : ""}</span>}
          </span>
          <strong>{findItem("styles", image.selection.style)?.label} · {findItem("palettes", image.selection.palette)?.label}</strong>
          <small>{formatById(image.formatId).group} {formatById(image.formatId).name} · {new Date(image.createdAt).toLocaleDateString("he-IL")}</small>
        </button>;
      })}
    </div>
    {selecting && <div className="gallery-send">
      <span>{progress || (picked.size ? `${picked.size} נבחרו` : "לא נבחרו תמונות")}</span>
      <button type="button" className="cta cta-green" disabled={!picked.size || Boolean(progress)} onClick={sendPicked}>
        <Icon d={icons.send} size={20}/>שליחת המסומנות לאתר{picked.size ? ` (${picked.size})` : ""}
      </button>
    </div>}
  </dialog>;
}
