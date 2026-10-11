import {createClient, type Session} from "@supabase/supabase-js";

// חיבור לחשבון האתר של רבקה (Supabase). זה המפתח הציבורי (anon) — אותו מפתח שנמצא באתר עצמו.
// הוא לא סוד: כל פעולה מוגנת בהרשאות במסד הנתונים, ורק מנהלת יכולה לכתוב.
export const SITE_URL = "https://rebecca-studio.netlify.app";
const SUPABASE_URL = "https://nvtpngjecdzerbbzqmtg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dHBuZ2plY2R6ZXJiYnpxbXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2ODI4NTEsImV4cCI6MjEwNzI1ODg1MX0.cPS2zkz32GzEsp-a_JTd4rpK8V6S34dKmvY2e_tF-5E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {auth: {persistSession: true, autoRefreshToken: true, storageKey: "rebecca-studio-auth"}});

export async function currentSession(): Promise<Session | null> {
  return (await supabase.auth.getSession()).data.session;
}

/** כניסה עם אותו מייל וסיסמה של ממשק הניהול באתר. מחזיר הודעת שגיאה בעברית, או null בהצלחה. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const {error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
  if (error) return "המייל או הסיסמה שגויים";
  const {data: ok} = await supabase.rpc("is_admin");
  if (ok !== true) { await supabase.auth.signOut(); return "למשתמש הזה אין הרשאה לסטודיו"; }
  return null;
}

export async function signOut(): Promise<void> { await supabase.auth.signOut(); }

/** fetch לשרת של הסטודיו (/api/...) עם אסימון הכניסה. */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = (await currentSession())?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, {...init, headers});
}

/** ממיר תמונה ל-JPEG (עד 2048 פיקסלים בצלע הארוכה) — קטן יותר ומתאים לאתר. */
export async function toJpeg(blob: Blob, max = 2048, quality = 0.9): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * k); canvas.height = Math.round(bitmap.height * k);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob")), "image/jpeg", quality));
}

export type InboxVariant = "clean" | "branded";
export type InboxMeta = {style?: string; palette?: string; product?: string; formatId?: string};

/**
 * שולח תמונה ל"תמונות חדשות" בממשק הניהול של האתר.
 * התמונה לא מתפרסמת באתר — היא ממתינה שם עד שרבקה תחליט מה לעשות איתה.
 */
export async function sendToSite(blob: Blob, variant: InboxVariant, meta: InboxMeta): Promise<void> {
  const jpeg = await toJpeg(blob);
  const path = `inbox/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.jpg`;
  const {error: upErr} = await supabase.storage.from("media").upload(path, jpeg, {contentType: "image/jpeg", cacheControl: "31536000", upsert: false});
  if (upErr) throw new Error("העלאת התמונה לאתר נכשלה");
  const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  const {error} = await supabase.from("media_inbox").insert({url, storage_path: path, variant, source: "photo-studio", meta});
  if (error) { await supabase.storage.from("media").remove([path]); throw new Error("שמירת התמונה בתיבה של האתר נכשלה"); }
}

// סימון מקומי של תמונות מההיסטוריה שכבר נשלחו, כדי שרבקה תראה מה כבר עבר לאתר.
const SENT_KEY = "rebecca-sent-to-site";
export function sentKeys(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SENT_KEY) || "[]")); } catch { return new Set(); }
}
export function markSent(keys: string[]): void {
  try { const all = sentKeys(); keys.forEach(k => all.add(k)); localStorage.setItem(SENT_KEY, JSON.stringify([...all].slice(-200))); } catch { /* ignore */ }
}
