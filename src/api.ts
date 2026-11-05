import type {Selection} from "../shared/selection.ts";
import type {StudioSettings} from "../shared/settings.ts";
import {authFetch, toJpeg} from "./site.ts";

// יצירת תמונה. הודעות השגיאה בעברית מגיעות מהשרת; כאן רק ברירות מחדל לפי קוד המצב.
export const CONNECTION_LOST = "החיבור נקטע לפני שהתמונה הגיעה. השאירו את המסך פתוח עד שהתמונה מוכנה ונסו שוב.";

/**
 * הצילום נשלח מוקטן: עד 2048 פיקסלים בצלע הארוכה, JPEG. צילום מהטלפון יכול להיות 5–10 מגה,
 * וברשת סלולרית ההעלאה לבדה לוקחת זמן רב ומגדילה את הסיכוי לניתוק. OpenAI מחזיר ממילא 1024–1536.
 * קובץ קטן מספיק (JPEG עד 1.5 מגה) נשלח כמו שהוא.
 */
export async function uploadReady(file: File): Promise<File> {
  if (file.type === "image/jpeg" && file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const jpeg = await toJpeg(file, 2048, 0.9);
    return jpeg.size < file.size || file.type !== "image/jpeg" ? new File([jpeg], "photo.jpg", {type: "image/jpeg"}) : file;
  } catch { return file; }
}

export async function requestImage(file: File, selection: Selection, ratio: string): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  // השרת מקבל את קטגוריית "props" בשם "density".
  const fields: Record<string, string> = {product: selection.product, style: selection.style, palette: selection.palette, density: selection.props,
    surface: selection.surface ?? "", background: selection.background ?? "", light: selection.light ?? "",
    candleState: selection.candleState, giftWrap: selection.giftWrap, glassTint: selection.glassTint ?? "", angle: selection.angle ?? "", occasion: selection.occasion ?? "", wish: selection.wish, ratio};
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  // "Failed to fetch" של הדפדפן = החיבור נקטע לפני שהגיעה תשובה (רשת סלולרית, או יציאה מהדפדפן באמצע). מסבירים בעברית.
  let response: Response;
  try { response = await authFetch("/api/generate", {method: "POST", body}); }
  catch { throw new Error(CONNECTION_LOST); }
  const payload = await response.json().catch(() => ({})) as {error?: string; image?: string; detail?: string};
  // הסבר של OpenAI (באנגלית) מצורף להודעה, כדי שיהיה ברור מה לתקן.
  const withDetail = (text: string) => payload.detail ? `${text} פירוט מ־OpenAI: ${payload.detail}` : text;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error(payload.error || "החיבור לסטודיו פג. רעננו את הדף והתחברו שוב");
    if (response.status === 502 || response.status === 503) throw new Error(withDetail(payload.error || "שירות יצירת התמונות אינו זמין כרגע. נסו שוב בעוד כמה דקות"));
    throw new Error(withDetail(payload.error || `לא הצלחנו ליצור תמונה (שגיאה ${response.status})`));
  }
  if (!payload.image) throw new Error("לא התקבלה תמונה משירות היצירה. נסו שוב");
  return "data:image/png;base64," + payload.image;
}

// null: עוד לא נשמרו הגדרות בשרת. שגיאה: השרת לא זמין, ואז לא כותבים אליו כדי לא לדרוס הגדרות שלא קראנו.
export async function fetchSettings(): Promise<StudioSettings | null> {
  const response = await authFetch("/api/settings");
  if (!response.ok) throw new Error(`settings ${response.status}`);
  return ((await response.json()) as {settings: StudioSettings | null}).settings;
}

export async function putSettings(settings: StudioSettings): Promise<void> {
  const response = await authFetch("/api/settings", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(settings)});
  if (!response.ok) throw new Error(`settings ${response.status}`);
}
