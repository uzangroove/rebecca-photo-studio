import {useEffect, useState} from "react";
import Studio from "./Studio";
import {SignIn} from "./components/SignIn";
import {currentSession, supabase} from "./site";

// הסטודיו נפתח רק אחרי כניסה לחשבון האתר. הכניסה נשמרת במכשיר, כך שמתחברים פעם אחת.
export default function AuthGate() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");
  useEffect(() => {
    let alive = true;
    currentSession().then(s => { if (alive) setState(s ? "in" : "out"); }).catch(() => alive && setState("out"));
    const {data} = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setState("out");
      else if (session && event === "SIGNED_IN") setState("in");
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  if (state === "checking") return <main className="signin"><p className="signin-sub">טוענים…</p></main>;
  if (state === "out") return <SignIn onDone={() => setState("in")}/>;
  return <Studio/>;
}
