// ההגדרות שמסתנכרנות בין מכשירים (נשמרות ב-KV). ההיסטוריה והתמונות נשארות ב-IndexedDB במכשיר.
export const MAX_SETTINGS_BYTES = 1024 * 1024;
export const MAX_SOURCE_CHARS = 700_000;
export const MAX_NEVER_ITEMS = 30;
export const MAX_NEVER_CHARS = 40;
const MAX_NAME_CHARS = 120;

export type BrandSettings = {
  logo: boolean; slogan: boolean;
  logoSource: string; sloganSource: string;
  logoName: string; sloganName: string;
  logoX: number; logoY: number; logoScale: number;
  sloganX: number; sloganY: number; sloganScale: number;
};
export type StudioSettings = {version: 1; neverList: string[]; brand: BrandSettings};

export const defaultBrand: BrandSettings = {
  logo: false, slogan: false,
  logoSource: "/assets/rebecca_studio_logo.png", sloganSource: "/assets/rebecca_studio_slogan.png",
  logoName: "הלוגו של רבקה", sloganName: "הסלוגן של רבקה",
  logoX: 0, logoY: 0, logoScale: 100, sloganX: 10, sloganY: 20, sloganScale: 100
};
export const defaultSettings: StudioSettings = {version: 1, neverList: [], brand: defaultBrand};

const builtInSources = new Set(["/assets/rebecca_studio_logo.png", "/assets/rebecca_studio_slogan.png", "/assets/logo.png"]);

// מקור מותר: קובץ מובנה, או data URI של תמונה. SVG נבדק גם כאן, בנוסף לניקוי שנעשה בדפדפן בהעלאה.
export function validSource(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_SOURCE_CHARS) return false;
  if (builtInSources.has(value)) return true;
  const svg = /^data:image\/svg\+xml(?:;charset=utf-8)?,/i.exec(value);
  if (svg) {
    let text: string;
    try { text = decodeURIComponent(value.slice(svg[0].length)); } catch { return false; }
    return /<svg[\s>]/i.test(text) && !/<\s*(script|foreignObject|iframe|image|animate|set)\b|\son\w+\s*=|javascript:|@import|url\s*\(|href\s*=\s*["'](?!#)/i.test(text);
  }
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
}

const number = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const name = (value: unknown): value is string => typeof value === "string" && value.length <= MAX_NAME_CHARS;

export function parseBrand(value: unknown): BrandSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.logo !== "boolean" || typeof v.slogan !== "boolean" || !validSource(v.logoSource) || !validSource(v.sloganSource) ||
    !name(v.logoName) || !name(v.sloganName) ||
    !number(v.logoX, 0, 20) || !number(v.logoY, 0, 20) || !number(v.sloganX, 0, 20) || !number(v.sloganY, 0, 20) ||
    !number(v.logoScale, 30, 160) || !number(v.sloganScale, 30, 160)) return null;
  return {
    logo: v.logo, slogan: v.slogan, logoSource: v.logoSource, sloganSource: v.sloganSource, logoName: v.logoName, sloganName: v.sloganName,
    logoX: v.logoX, logoY: v.logoY, logoScale: v.logoScale, sloganX: v.sloganX, sloganY: v.sloganY, sloganScale: v.sloganScale
  };
}

export function parseNeverList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_NEVER_ITEMS) return null;
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const text = item.trim();
    if (!text || text.length > MAX_NEVER_CHARS || /[\r\n]/.test(text)) return null;
    if (!items.includes(text)) items.push(text);
  }
  return items;
}

// מחזיר הגדרות תקינות (עם שדות נקיים בלבד) או null אם משהו בהן לא תקין.
export function parseSettings(value: unknown): StudioSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return null;
  const neverList = parseNeverList(v.neverList), brand = parseBrand(v.brand);
  if (!neverList || !brand) return null;
  return {version: 1, neverList, brand};
}
