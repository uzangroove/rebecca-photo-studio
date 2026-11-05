import {findItem, hasItem, palettes} from "./catalog.ts";

// פלטות אישיות (שלב 5).
// בחירה של פלטה אישית נשמרת כ"custom:#AABBCC,#DDEEFF,#112233": הצבעים עצמם, ולא מזהה.
// כך מתכון, תמונה בהיסטוריה ובקשת יצירה ממשיכים לעבוד גם אחרי שהפלטה נמחקה, והשרת בודק רק שהקודים תקינים.
// השם של הפלטה לא נכנס לפרומפט, בדיוק כמו בפלטות הקבועות: רק קודי ה-HEX.

export type Colors = readonly [string, string, string];
export type CustomPalette = {id: string; label: string; colors: Colors};

export const CUSTOM_PREFIX = "custom:";
export const MAX_CUSTOM_PALETTES = 24;
export const MAX_PALETTE_NAME = 24;
export const MAX_HIDDEN_PALETTES = palettes.length;
const HEX = /^#[0-9A-F]{6}$/;

export const normHex = (value: string): string | null => {
  const v = value.trim().toUpperCase().replace(/^([0-9A-F]{6})$/, "#$1");
  if (/^#[0-9A-F]{3}$/.test(v)) return "#" + v.slice(1).split("").map(c => c + c).join("");
  return HEX.test(v) ? v : null;
};

export function customToken(colors: Colors): string {
  return CUSTOM_PREFIX + colors.map(c => normHex(c) ?? "#000000").join(",");
}

export function parseCustomToken(value: unknown): Colors | null {
  if (typeof value !== "string" || !value.startsWith(CUSTOM_PREFIX)) return null;
  const parts = value.slice(CUSTOM_PREFIX.length).split(",");
  if (parts.length !== 3 || parts.some(p => !HEX.test(p))) return null;
  return [parts[0], parts[1], parts[2]];
}

/** ערך פלטה תקין: מזהה מהקטלוג או פלטה אישית. */
export function isPaletteValue(value: unknown): value is string {
  return hasItem("palettes", value) || parseCustomToken(value) !== null;
}

export function paletteColors(value: string): Colors | null {
  return findItem("palettes", value)?.colors ?? parseCustomToken(value);
}

/** השם שמוצג בממשק. פלטה אישית: לפי השם שרבקה נתנה, ואם נמחקה — "פלטה אישית". */
export function paletteLabel(value: string, customs: readonly CustomPalette[] = []): string {
  const item = findItem("palettes", value);
  if (item) return item.label;
  const own = customs.find(c => customToken(c.colors) === value);
  return own?.label || (parseCustomToken(value) ? "פלטה אישית" : value);
}

/** מקטע הפרומפט: שלושת קודי ה-HEX בלבד, בסדר שבו הם מוצגים. */
export function palettePrompt(value: string): string | null {
  const colors = paletteColors(value);
  return colors ? colors.join(", ") : null;
}

export function parseCustomPalettes(value: unknown): CustomPalette[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_CUSTOM_PALETTES) return null;
  const out: CustomPalette[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const v = item as Record<string, unknown>;
    if (typeof v.id !== "string" || !/^c-[a-z0-9]{4,24}$/.test(v.id) || out.some(o => o.id === v.id)) return null;
    if (typeof v.label !== "string" || v.label.length > MAX_PALETTE_NAME || /[\r\n]/.test(v.label)) return null;
    if (!Array.isArray(v.colors) || v.colors.length !== 3 || v.colors.some(c => typeof c !== "string" || !HEX.test(c))) return null;
    out.push({id: v.id, label: v.label.trim(), colors: [v.colors[0], v.colors[1], v.colors[2]]});
  }
  return out;
}

// פלטה קבועה אפשר להסתיר מהרשימה (ולהחזיר). את המועדפות של רבקה לא מסתירים.
export function parseHiddenPalettes(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_HIDDEN_PALETTES) return null;
  const out: string[] = [];
  for (const id of value) {
    const item = typeof id === "string" ? findItem("palettes", id) : undefined;
    if (!item || item.favorite) return null;
    if (!out.includes(item.id)) out.push(item.id);
  }
  return out;
}

/* ---------- צבע: המרות HSL ושליפת צבעים מתמונה ---------- */

export type Hsl = {h: number; s: number; l: number}; // h 0–360, s ו-l 0–100

export function hexToHsl(hex: string): Hsl {
  const v = normHex(hex) ?? "#000000";
  const r = parseInt(v.slice(1, 3), 16) / 255, g = parseInt(v.slice(3, 5), 16) / 255, b = parseInt(v.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return {h: 0, s: 0, l: Math.round(l * 100)};
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return {h: Math.round(h * 60) % 360, s: Math.round(s * 100), l: Math.round(l * 100)};
}

export function hslToHex({h, s, l}: Hsl): string {
  const S = Math.min(100, Math.max(0, s)) / 100, L = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + ((h % 360) + 360) % 360 / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

const luminance = (hex: string) => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

/**
 * שלושת הצבעים הבולטים בתמונה (פיקסלים RGBA), מהכהה לבהיר.
 * ספירה לפי "דליים" של צבע, ואז בחירה של שלושה דליים שרחוקים מספיק זה מזה, כדי לא לקבל שלושה גוונים של אותו צבע.
 */
export function extractPalette(pixels: Uint8ClampedArray | readonly number[]): Colors {
  const buckets = new Map<number, {n: number; r: number; g: number; b: number}>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
    const cell = buckets.get(key) ?? {n: 0, r: 0, g: 0, b: 0};
    cell.n++; cell.r += r; cell.g += g; cell.b += b;
    buckets.set(key, cell);
  }
  const sorted = [...buckets.values()].sort((x, y) => y.n - x.n)
    .map(c => [c.r / c.n, c.g / c.n, c.b / c.n] as const);
  const picked: (readonly [number, number, number])[] = [];
  for (const minDist of [80, 50, 25, 0]) {
    for (const c of sorted) {
      if (picked.length === 3) break;
      if (picked.every(p => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > minDist)) picked.push(c);
    }
    if (picked.length === 3) break;
  }
  while (picked.length < 3) picked.push(picked[picked.length - 1] ?? [128, 128, 128]);
  const hex = picked.map(c => "#" + c.map(x => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase());
  hex.sort((a, b) => luminance(a) - luminance(b));
  return [hex[0], hex[1], hex[2]];
}

/** גוונים מוכנים שמתאימים לצילום מוצר (30), לבורר הצבעים. */
export const presetColors: readonly string[] = [
  "#1F2A24", "#4A3B32", "#6B4A36", "#8E5B4A", "#B07D62", "#C9A76A", "#D8A47F", "#E1CDB4", "#F3E1D4", "#FBF8F2",
  "#163B30", "#2F4A3A", "#6B8E76", "#A2B57B", "#C6D8CB", "#13315C", "#5C6B73", "#8DA9C4", "#C2DFE3", "#EDF2F4",
  "#5E548E", "#9F86C0", "#E0B1CB", "#823329", "#B85D43", "#E29578", "#FEC5BB", "#8C8C8C", "#D9D9D9", "#FFFFFF"
];

export const newPaletteId = (): string => "c-" + Math.random().toString(36).slice(2, 10).padEnd(6, "0");
