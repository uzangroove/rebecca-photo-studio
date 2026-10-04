import type {Selection} from "../shared/selection.ts";
import type {StudioSettings} from "../shared/settings.ts";

// יצירת תמונה. הודעות השגיאה בעברית מגיעות מהשרת; כאן רק ברירות מחדל לפי קוד המצב.
export async function requestImage(file: File, selection: Selection, ratio: string): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  // השרת מקבל את קטגוריית "props" בשם "density".
  for (const [key, value] of Object.entries({product: selection.product, style: selection.style, palette: selection.palette, density: selection.props, ratio})) body.append(key, value);
  const response = await fetch("/api/generate", {method: "POST", body});
  const payload = await response.json().catch(() => ({})) as {error?: string; image?: string};
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error(payload.error || "הגישה לאתר פגה או נחסמה. רעננו את הדף ופתחו אותו שוב מתוך החשבון שלכם");
    if (response.status === 502 || response.status === 503) throw new Error(payload.error || "שירות יצירת התמונות אינו זמין כרגע. נסו שוב בעוד כמה דקות");
    throw new Error(payload.error || `לא הצלחנו ליצור תמונה (שגיאה ${response.status})`);
  }
  if (!payload.image) throw new Error("לא התקבלה תמונה משירות היצירה. נסו שוב");
  return "data:image/png;base64," + payload.image;
}

// null: עוד לא נשמרו הגדרות בשרת. שגיאה: השרת לא זמין, ואז לא כותבים אליו כדי לא לדרוס הגדרות שלא קראנו.
export async function fetchSettings(): Promise<StudioSettings | null> {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error(`settings ${response.status}`);
  return ((await response.json()) as {settings: StudioSettings | null}).settings;
}

export async function putSettings(settings: StudioSettings): Promise<void> {
  const response = await fetch("/api/settings", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(settings)});
  if (!response.ok) throw new Error(`settings ${response.status}`);
}
