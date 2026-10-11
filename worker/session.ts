// אימות מול חשבון האתר (Supabase): אותו מייל וסיסמה כמו בממשק הניהול של האתר.
// הדפדפן שולח את אסימון הכניסה בכותרת Authorization: Bearer ...
// השרת בודק מול Supabase שהאסימון תקף ושהמשתמש מוגדר כמנהלת (public.is_admin()).
// התוצאה נשמרת לחמש דקות בזיכרון של ה-Worker כדי לא לפנות ל-Supabase בכל בקשה.
// כתובת Supabase והמפתח הציבורי (anon) של האתר. זה לא סוד — אותו מפתח נמצא בממשק (src/site.ts) ובאתר עצמו;
// ההגנה היא בהרשאות במסד הנתונים. משתני סביבה SUPABASE_URL / SUPABASE_ANON_KEY, אם הוגדרו, גוברים.
// ברירת המחדל כאן כדי שהכניסה תעבוד גם כש-Cloudflare לא מעביר את ה-vars (למשל בגרסאות תצוגה מקדימה).
const DEFAULT_SUPABASE_URL = "https://nvtpngjecdzerbbzqmtg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dHBuZ2plY2R6ZXJiYnpxbXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2ODI4NTEsImV4cCI6MjEwNzI1ODg1MX0.cPS2zkz32GzEsp-a_JTd4rpK8V6S34dKmvY2e_tF-5E";
type SessionEnv = {SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string};
const cache = new Map<string, number>();
const TTL = 5 * 60 * 1000;

function config(env: SessionEnv): {url: string; key: string} {
  return {url: (env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, ""), key: env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY};
}

export function sessionConfigured(env: SessionEnv): boolean {
  const {url, key} = config(env);
  return Boolean(url && key);
}

export async function sessionAuthorized(request: Request, env: SessionEnv): Promise<boolean> {
  if (!sessionConfigured(env)) return false;
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token || token.length > 4096) return false;
  const now = Date.now(), until = cache.get(token);
  if (until && until > now) return true;
  const {url: base, key} = config(env);
  const headers = {apikey: key, Authorization: `Bearer ${token}`};
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
