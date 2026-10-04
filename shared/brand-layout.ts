import {centerFromBox, clamp, pctToPx, pxToPct, roundStored, type Size} from "./brand-geometry.ts";
import {formats, type SocialFormat} from "./social-formats.ts";

// הפריסה של המיתוג בפורמט אחד: שלוש שכבות (לוגו, סלוגן, טקסט) באחוזים. ראו brand-geometry.ts להמרה לפיקסלים.
export type LayerId = "logo" | "slogan" | "text";
export const layerIds: readonly LayerId[] = ["logo", "slogan", "text"];
export type Legibility = "none" | "shadow" | "outline";
export type Tone = "original" | "light" | "dark";

export const fonts = [
  {id: "heebo", label: "Heebo", family: "Heebo"},
  {id: "assistant", label: "Assistant", family: "Assistant"},
  {id: "rubik", label: "Rubik", family: "Rubik"},
  {id: "frank-ruhl-libre", label: "Frank Ruhl Libre", family: "Frank Ruhl Libre"}
] as const;
export type FontId = typeof fonts[number]["id"];

// הפניה לגופן: מזהה של גופן מובנה ("heebo"), או "sys:" ואחריו שם גופן שמותקן במחשב ("sys:Arial").
// גופן מהמחשב נראה רק במכשיר שמותקן בו. במכשיר אחר נופלים לגופן המובנה.
export type FontRef = string;
export const SYSTEM_FONT_PREFIX = "sys:";
export const MAX_FONT_NAME = 60;
export const isBundledFont = (ref: string): ref is FontId => fonts.some(f => f.id === ref);
export const systemFontName = (ref: string): string | null => ref.startsWith(SYSTEM_FONT_PREFIX) ? ref.slice(SYSTEM_FONT_PREFIX.length) : null;
// שם גופן תקין: בלי תווי בקרה, מרכאות, נקודה-פסיק, פסיק וסוגריים. כך אי אפשר להזריק CSS דרך שם הגופן.
const FONT_NAME_RE = /^[^\u0000-\u001f"'`\\;,{}()<>]+$/;
export const isFontRef = (ref: unknown): ref is FontRef => {
  if (typeof ref !== "string") return false;
  if (isBundledFont(ref)) return true;
  const name = systemFontName(ref);
  return name !== null && name.trim() === name && name.length >= 1 && name.length <= MAX_FONT_NAME && FONT_NAME_RE.test(name);
};
export const systemFontRef = (name: string): FontRef | null => {
  const ref = SYSTEM_FONT_PREFIX + name.trim();
  return isFontRef(ref) ? ref : null;
};
export const fontLabel = (ref: FontRef): string => fonts.find(f => f.id === ref)?.label ?? systemFontName(ref) ?? ref;

type BaseLayer = {visible: boolean; cx: number; cy: number; opacity: number; legibility: Legibility};
// w: אחוז מרוחב הקנבס. cx: אחוז מהרוחב, cy: אחוז מהגובה (מרכז השכבה). lock: שמירה על פרופורציות.
// color: צבע חופשי (#RRGGBB) שצובע את הצורה כולה, ועדיף על tone. ריק = הצבע המקורי (או "כהה"/"בהיר").
// asText: במקום התמונה המובנית מציירים טקסט (label) בגופן שנבחר. הרוחב w קובע אז את רוחב הטקסט, והפרופורציות תמיד נשמרות.
export type ImageLayer = BaseLayer & {w: number; stretch: number; lock: boolean; tone: Tone; color: string | null; asText: boolean; label: string; font: FontRef; bold: boolean};
// size: גודל הגופן באחוזי רוחב הקנבס. color ריק = אוטומטי (הצבע הבהיר של הפלטה).
export type TextLayer = BaseLayer & {text: string; font: FontRef; bold: boolean; size: number; color: string | null};
export type BrandLayout = {logo: ImageLayer; slogan: ImageLayer; text: TextLayer};

export const MAX_TEXT_CHARS = 60;
// בלוגו ובסלוגן במצב טקסט מותרות עד שתי שורות.
export const MAX_LABEL_CHARS = 60;
export const defaultLabels: Record<"logo" | "slogan", string> = {logo: "RÈBECCA", slogan: "HANDMADE NATURAL\nSOAP & CANDLES"};
// גודל הייחוס שבו מודדים טקסט כדי לגזור יחס גובה/רוחב. הגודל בפועל נגזר מהרוחב שנבחר.
export const TEXT_REF_PX = 100;
// יחסי הגובה/רוחב של הלוגו והסלוגן המובנים, לחישוב ברירות המחדל.
export const LOGO_ASPECT = 161 / 799;
export const SLOGAN_ASPECT = 310 / 2006;

const base = {opacity: 100, legibility: "shadow" as Legibility};
const textMode = (part: "logo" | "slogan") => ({color: null, asText: false, label: defaultLabels[part], font: part === "logo" ? "frank-ruhl-libre" : "assistant", bold: false});

// ברירת מחדל לפורמט: לוגו למעלה במרכז, סלוגן מתחתיו וטקסט למטה. הגדלים נגזרים מהפורמט כדי לא לחרוג ממנו.
export function defaultLayout(format: Pick<SocialFormat, "width" | "height">): BrandLayout {
  const canvas: Size = {w: format.width, h: format.height};
  const logoPct = Math.min(40.3, pxToPct(0.07 * canvas.h / LOGO_ASPECT, canvas.w));
  const logoH = pctToPx(logoPct, canvas.w) * LOGO_ASPECT, logoTop = 0.04 * canvas.h;
  const sloganPct = Math.min(44.4, pxToPct(0.05 * canvas.h / SLOGAN_ASPECT, canvas.w));
  const sloganH = pctToPx(sloganPct, canvas.w) * SLOGAN_ASPECT, sloganTop = logoTop + logoH + 0.012 * canvas.h;
  const cy = (top: number, h: number) => roundStored(pxToPct(top + h / 2, canvas.h));
  return {
    logo: {...base, visible: false, cx: 50, cy: cy(logoTop, logoH), w: roundStored(logoPct), stretch: 1, lock: true, tone: "original", ...textMode("logo")},
    slogan: {...base, visible: false, cx: 50, cy: cy(sloganTop, sloganH), w: roundStored(sloganPct), stretch: 1, lock: true, tone: "original", ...textMode("slogan")},
    text: {...base, visible: false, cx: 50, cy: 93, text: "", font: "heebo", bold: true, size: roundStored(Math.min(4.8, pxToPct(0.06 * canvas.h, canvas.w))), color: null}
  };
}

export type Layouts = Record<string, BrandLayout>;
export const layoutFor = (layouts: Layouts, format: Pick<SocialFormat, "id" | "width" | "height">): BrandLayout =>
  layouts[format.id] ?? defaultLayout(format);

// ---- אימות (השרת והלקוח משתמשים באותו קוד)
const num = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const hexColor = (v: unknown): v is string => typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v);
const legibilities: readonly string[] = ["none", "shadow", "outline"], tones: readonly string[] = ["original", "light", "dark"];

function parseBase(v: Record<string, unknown>): BaseLayer | null {
  if (typeof v.visible !== "boolean" || !num(v.cx, 0, 100) || !num(v.cy, 0, 100) || !num(v.opacity, 0, 100)) return null;
  if (typeof v.legibility !== "string" || !legibilities.includes(v.legibility)) return null;
  return {visible: v.visible, cx: v.cx, cy: v.cy, opacity: v.opacity, legibility: v.legibility as Legibility};
}
// תווית של לוגו/סלוגן במצב טקסט: עד שתי שורות. אפשר להשאיר ריק (אז לא מציירים כלום).
const labelOk = (v: unknown): v is string => typeof v === "string" && v.length <= MAX_LABEL_CHARS && !/\r/.test(v) && v.split("\n").length <= 2;
// שדות שנוספו אחרי שהפריסות כבר נשמרו אצל המשתמשת: חסר אצלן = ברירת המחדל, ולא שגיאה.
export function parseImageLayer(value: unknown, part: "logo" | "slogan" = "logo"): ImageLayer | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>, b = parseBase(v), d = textMode(part);
  if (!b || !num(v.w, 1, 100) || !num(v.stretch, 0.2, 5) || typeof v.lock !== "boolean" || typeof v.tone !== "string" || !tones.includes(v.tone)) return null;
  const color = v.color === undefined ? null : v.color, asText = v.asText === undefined ? false : v.asText;
  const label = v.label === undefined ? d.label : v.label, font = v.font === undefined ? d.font : v.font, bold = v.bold === undefined ? false : v.bold;
  if ((color !== null && !hexColor(color)) || typeof asText !== "boolean" || !labelOk(label) || !isFontRef(font) || typeof bold !== "boolean") return null;
  return {...b, w: v.w, stretch: v.stretch, lock: v.lock, tone: v.tone as Tone, color, asText, label, font, bold};
}
export function parseTextLayer(value: unknown): TextLayer | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>, b = parseBase(v);
  if (!b || typeof v.text !== "string" || v.text.length > MAX_TEXT_CHARS || /[\r\n]/.test(v.text)) return null;
  if (!isFontRef(v.font) || typeof v.bold !== "boolean" || !num(v.size, 1, 30)) return null;
  if (v.color !== null && !hexColor(v.color)) return null;
  return {...b, text: v.text, font: v.font, bold: v.bold, size: v.size, color: v.color};
}
export function parseLayout(value: unknown): BrandLayout | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const logo = parseImageLayer(v.logo, "logo"), slogan = parseImageLayer(v.slogan, "slogan"), text = parseTextLayer(v.text);
  return logo && slogan && text ? {logo, slogan, text} : null;
}
const formatIds: ReadonlySet<string> = new Set(formats.map(f => f.id));
export function parseLayouts(value: unknown): Layouts | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result: Layouts = {};
  for (const [id, layout] of Object.entries(value)) {
    const parsed = formatIds.has(id) ? parseLayout(layout) : null;
    if (!parsed) return null;
    result[id] = parsed;
  }
  return result;
}

// ---- הגירה: עד שלב 1 היה מיקום אחד לכל הפורמטים, ברשת 0-20 וגודל באחוזי ברירת המחדל הישנה.
export type LegacyBrand = {logo: boolean; slogan: boolean; logoX: number; logoY: number; logoScale: number; sloganX: number; sloganY: number; sloganScale: number};
export function layoutFromLegacy(old: LegacyBrand, format: Pick<SocialFormat, "width" | "height">): BrandLayout {
  const W = format.width, H = format.height, layout = defaultLayout(format);
  const place = (part: "logo" | "slogan", aspect: number, widthShare: number) => {
    const x = old[`${part}X`], y = old[`${part}Y`], scale = old[`${part}Scale`];
    const dw = Math.min(W * widthShare, H * 0.17 / aspect) * scale / 100, dh = dw * aspect;
    const left = W * 0.025 + (20 - x) / 20 * (W - dw - W * 0.05), top = H * 0.025 + y / 20 * (H - dh - H * 0.05);
    const c = centerFromBox({x: left, y: top, w: dw, h: dh}, {w: W, h: H});
    layout[part] = {...layout[part], visible: old[part], cx: clamp(c.cx, 0, 100), cy: clamp(c.cy, 0, 100), w: clamp(roundStored(pxToPct(dw, W)), 1, 100)};
  };
  place("logo", LOGO_ASPECT, 0.30);
  place("slogan", SLOGAN_ASPECT, 0.34);
  return layout;
}
export const layoutsFromLegacy = (old: LegacyBrand): Layouts => Object.fromEntries(formats.map(f => [f.id, layoutFromLegacy(old, f)]));
