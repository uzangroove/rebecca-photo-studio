// הצעות טקסט למוצר עבור ממשק הניהול של האתר: ניתוח תמונה, 5 שמות, תיאור ותגיות.
// פונקציות טהורות בלבד (בלי רשת), כדי שאפשר יהיה לבדוק אותן בלי לקרוא ל-OpenAI.

export type SuggestTask = "analyze" | "names" | "describe";
export type SuggestInput = {task: SuggestTask; context: string; name?: string; avoid?: string[]; materials?: string; image?: string};
export type ChatMessage = {role: "system" | "user"; content: string | Array<{type: "text"; text: string} | {type: "image_url"; image_url: {url: string; detail: "low"}}>};

export const MAX_CONTEXT = 3000;
export const MAX_MATERIALS = 6000;
export const MAX_IMAGE_DATA_URL = 2_000_000;
const IMAGE_HOSTS = [/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//, /^https:\/\/([a-z0-9-]+--)?rebecca-studio\.netlify\.app\//, /^https:\/\/(www\.)?rebecca-studio\.co\.il\//];

export const BRAND = "המותג: RÈBECCA — סטודיו בוטיק לסבונים ונרות טבעיים בעבודת יד בישראל (כרמיאל). סגנון מינימליסטי, שקט, יוקרתי, פלטת מדבר ומונוכרום.";
export const RULES = "כללי כתיבה: עברית תקנית ומקצועית. מונחים נכונים: תהליך קר (Cold Process), תהליך חם, המסה ויציקה. הטקסט החופשי של רבקה נכתב לפעמים בהקלדה קולית — תקן שגיאות ומילים משובשות לפי ההקשר, ואל תעתיק מילים שאינן ברורות. אל תמציא רכיבים, ריחות או תכונות שלא מופיעים בנתונים; אם לא נבחר ריח — אל תתאר ריח. בלי טענות רפואיות או טיפוליות. לא להשתמש בשמות של מותגים קיימים.";

const clip = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").trim().slice(0, n);

/** בודק את הקלט מהלקוח. מחזיר קלט נקי, או null אם הוא לא תקין. */
export function parseSuggestInput(raw: unknown): SuggestInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const task = r.task;
  if (task !== "analyze" && task !== "names" && task !== "describe") return null;
  const context = clip(r.context, MAX_CONTEXT);
  const image = typeof r.image === "string" ? r.image.trim() : "";
  if (task === "analyze") {
    if (!image) return null;
    const isData = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) && image.length <= MAX_IMAGE_DATA_URL;
    const isUrl = image.length <= 1000 && IMAGE_HOSTS.some(rx => rx.test(image));
    if (!isData && !isUrl) return null;
  } else if (!context) return null;
  const avoid = Array.isArray(r.avoid) ? r.avoid.slice(0, 30).map(x => clip(x, 60)).filter(Boolean) : [];
  return {task, context, name: clip(r.name, 120) || undefined, avoid, materials: clip(r.materials, MAX_MATERIALS) || undefined, image: task === "analyze" ? image : undefined};
}

/** בונה את ההודעות ל-OpenAI (chat completions, JSON). */
export function buildSuggestMessages(input: SuggestInput): ChatMessage[] {
  const system = "אתה עוזר כתיבה ומיון מוצרים לסטודיו של רבקה. אתה מחזיר JSON תקין בלבד, בלי טקסט נוסף.";
  if (input.task === "analyze") {
    const text = "זו תמונה של מוצר מהסטודיו (סבון או נר בעבודת יד). תאר רק מה שבאמת רואים.\n" +
      "החזר JSON בצורה: {\"type\":\"סבון|נר|מארז\",\"colors\":[\"…\"],\"shape\":\"…\",\"technique\":\"…\",\"material_ids\":[\"…\"],\"notes\":\"משפט אחד\"}\n" +
      "material_ids: רק מזהים מהרשימה הבאה, ורק של דברים שנראים בעין (עלי כותרת, חימר צבעוני, פחם, זרעים, מיקה וכו'). אם לא בטוח — אל תכלול. אל תנחש ריחות או שמנים.\n" +
      "הרשימה: " + (input.materials || "—") + "\n" + (input.context ? "מה שכבר ידוע: " + input.context + "\n" : "") + "כתוב בעברית.";
    return [{role: "system", content: system}, {role: "user", content: [{type: "text", text}, {type: "image_url", image_url: {url: input.image!, detail: "low"}}]}];
  }
  if (input.task === "names") {
    const avoid = input.avoid && input.avoid.length ? "\nאל תחזור על השמות האלה: " + input.avoid.join(", ") : "";
    const text = BRAND + "\n\nהצע בדיוק 5 שמות למוצר הבא, בעברית טבעית ויפה:\n" + input.context + avoid +
      "\n\nשני שמות פיוטיים, שניים תיאוריים, ואחד קצר וקליט. לכל שם: שם מלא (2–4 מילים), שם קצר לתווית (1–2 מילים), שם באנגלית, וסיבה קצרה.\n" + RULES + "\n" +
      "החזר JSON בצורה: {\"names\":[{\"style\":\"פיוטי|תיאורי|קצר\",\"name\":\"…\",\"short\":\"…\",\"en\":\"…\",\"why\":\"…\"}]}";
    return [{role: "system", content: system}, {role: "user", content: text}];
  }
  const text = BRAND + "\n\nנסח טקסטים למוצר" + (input.name ? " בשם \"" + input.name + "\"" : "") + ".\n" + input.context +
    "\n\n" + RULES + " טון חם, נקי ומינימליסטי. מילות החיפוש וההאשטגים — רק ביטויים אמיתיים שאנשים מחפשים.\n" +
    "החזר JSON בצורה: {\"short\":\"עד 20 מילים\",\"he\":\"60–90 מילים\",\"en\":\"60–90 words\",\"meta\":\"עד 155 תווים\",\"seo\":[\"8–12 ביטויי חיפוש בעברית כמו שאנשים מחפשים בגוגל\"],\"hashtags\":[\"10–15 האשטגים בעברית ובאנגלית, עם #\"]}";
  return [{role: "system", content: system}, {role: "user", content: text}];
}

const list = (v: unknown, max: number, len: number) => Array.isArray(v) ? v.slice(0, max).map(x => clip(x, len)).filter(Boolean) : [];

/** מנקה את התשובה של המודל לצורה צפויה. מחזיר null אם אין בה תוכן שימושי. */
export function cleanSuggestion(task: SuggestTask, raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (task === "analyze") {
    const type = ["סבון", "נר", "מארז"].includes(String(r.type)) ? String(r.type) : "";
    const ids = list(r.material_ids, 12, 12).filter(id => /^[A-Z]{2,3}-[A-Z]{3}$/.test(id));
    const out = {type, colors: list(r.colors, 6, 40), shape: clip(r.shape, 200), technique: clip(r.technique, 200), material_ids: ids, notes: clip(r.notes, 300)};
    return out.type || out.colors.length || out.shape || out.notes ? out : null;
  }
  if (task === "names") {
    const names = (Array.isArray(r.names) ? r.names : Array.isArray(raw) ? raw as unknown[] : []).slice(0, 5)
      .map(n => n && typeof n === "object" ? n as Record<string, unknown> : {})
      .map(n => ({style: clip(n.style, 20), name: clip(n.name, 80), short: clip(n.short, 40), en: clip(n.en, 80), why: clip(n.why, 200)}))
      .filter(n => n.name);
    return names.length ? {names} : null;
  }
  const out = {short: clip(r.short, 240), he: clip(r.he, 1500), en: clip(r.en, 1500), meta: clip(r.meta, 160), seo: list(r.seo, 12, 80),
    hashtags: list(r.hashtags, 15, 40).map(h => h.startsWith("#") ? h : "#" + h)};
  return out.he || out.short ? out : null;
}
