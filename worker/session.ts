// אימות מול חשבון האתר (Supabase): אותו מייל וסיסמה כמו בממשק הניהול של האתר.
// הדפדפן שולח את אסימון הכניסה בכותרת Authorization: Bearer ...
// השרת בודק מול Supabase שהאסימון תקף ושהמשתמש מוגדר כמנהלת (public.is_admin()).
// התוצאה נשמרת לחמש דקות בזיכרון של ה-Worker כדי לא לפנות ל-Supabase בכל בקשה.
type SessionEnv = {SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string};
const cache = new Map<string, number>();
const TTL = 5 * 60 * 1000;

export function sessionConfigured(env: SessionEnv): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export async function sessionAuthorized(request: Request, env: SessionEnv): Promise<boolean> {
  if (!sessionConfigured(env)) return false;
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token || token.length > 4096) return false;
  const now = Date.now(), until = cache.get(token);
  if (until && until > now) return true;
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const headers = {apikey: env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}`};
  try {
    const user = await fetch(`${base}/auth/v1/user`, {headers});
    if (!user.ok) return false;
    const admin = await fetch(`${base}/rest/v1/rpc/is_admin`, {method: "POST", headers: {...headers, "Content-Type": "application/json"}, body: "{}"});
    if (!admin.ok || (await admin.json()) !== true) return false;
  } catch {
    return false;
  }
  if (cache.size > 200) cache.clear();
  cache.set(token, now + TTL);
  return true;
}
