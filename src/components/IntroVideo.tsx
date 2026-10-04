import {useEffect, useRef, useState} from "react";
import {Icon} from "./Icon";

const soundOn = "M4 9v6h4l5 4V5L8 9z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11";
const soundOff = "M4 9v6h4l5 4V5L8 9z M17 9l5 6 M22 9l-5 6";
const play = "M8 5v14l11-7z";

// סרטון הפתיחה של רבקה: מוצג בכל פעם שהאפליקציה נפתחת. מתחיל בלי קול (דפדפנים לא מאפשרים אחרת),
// אפשר להפעיל קול או לדלג, ובסיומו נסגר מעצמו. מי שביקש בדפדפן להפחית תנועה לא רואה אותו.
export function IntroVideo({onDone}: {onDone: () => void}) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true), [blocked, setBlocked] = useState(false);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => { if (reduced) onDone(); }, [reduced, onDone]);
  useEffect(() => {
    const el = video.current;
    // (שגיאה של מקור בודד, למשל פורמט שהדפדפן לא תומך בו, לא סוגרת את הסרטון: הדפדפן עובר למקור הבא.)
    // אם ההפעלה האוטומטית נחסמה (למשל מצב חיסכון בסוללה), מציגים כפתור הפעלה במקום להיתקע.
    el?.play().catch(() => setBlocked(true));
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onDone]);
  if (reduced) return null;
  return <div className="intro" role="dialog" aria-label="סרטון הפתיחה של רבקה">
    <video ref={video} className="intro-video" autoPlay muted={muted} playsInline preload="auto" poster="/assets/rebecca-intro-poster.jpg"
      onEnded={onDone} onError={e => { if (e.target === e.currentTarget) onDone(); }}>
      <source src="/assets/rebecca-intro.mp4" type='video/mp4; codecs="avc1.64001f, mp4a.40.2"'/>
      <source src="/assets/rebecca-intro.webm" type='video/webm; codecs="vp9, opus"'/>
    </video>
    <div className="intro-actions">
      <button type="button" className="pill" aria-pressed={!muted} onClick={() => { setMuted(m => !m); video.current?.play().catch(() => {}); }}>
        <Icon d={muted ? soundOff : soundOn} size={20}/><span>{muted ? "הפעלת קול" : "השתקה"}</span>
      </button>
      {blocked && <button type="button" className="pill" onClick={() => { setBlocked(false); video.current?.play().catch(() => setBlocked(true)); }}><Icon d={play} size={20}/><span>הפעלה</span></button>}
      <button type="button" className="pill" autoFocus onClick={onDone}><span>דילוג</span></button>
    </div>
  </div>;
}
