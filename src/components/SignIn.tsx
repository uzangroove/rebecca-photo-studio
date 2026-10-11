import {useState, type FormEvent} from "react";
import {signIn} from "../site";

// מסך כניסה: אותו מייל וסיסמה של ממשק הניהול באתר.
export function SignIn({onDone}: {onDone: () => void}) {
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err); else onDone();
  }
  return <main className="signin">
    <form className="signin-card" onSubmit={submit}>
      <img className="brand-logo" src="/assets/rebecca_studio_logo.png" alt="RÉBECCA"/>
      <img className="brand-slogan" src="/assets/rebecca_studio_slogan.png" alt="HANDMADE NATURAL SOAP & CANDLES"/>
      <h1>סטודיו התמונות</h1>
      <p className="signin-sub">כניסה עם המייל והסיסמה של ממשק הניהול באתר</p>
      <label>מייל<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label>
      <label>סיסמה<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>
      <button type="submit" className="cta cta-green" disabled={busy}>{busy ? "מתחברים…" : "כניסה"}</button>
      <p className="signin-error" role="alert">{error}</p>
    </form>
  </main>;
}
