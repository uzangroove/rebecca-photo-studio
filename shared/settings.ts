import {hasItem} from "./catalog.ts";
import {layoutsFromLegacy, parseLayouts, type LegacyBrand, type Layouts} from "./brand-layout.ts";
import {builtInRecipes, parseRecipes, type Recipe} from "./recipes.ts";

// ההגדרות שמסתנכרנות בין מכשירים (נשמרות ב-KV). ההיסטוריה והתמונות נשארות ב-IndexedDB במכשיר.
export const MAX_SETTINGS_BYTES = 1024 * 1024;
export const MAX_SOURCE_CHARS = 700_000;
export const MAX_NEVER_ITEMS = 30;
export const MAX_NEVER_CHARS = 40;
const MAX_NAME_CHARS = 120;

// מקורות הלוגו והסלוגן. המיקום, הגודל והמראה שלהם יושבים בפריסה לכל פורמט (layouts).
export type BrandSettings = {logoSource: string; sloganSource: string; logoName: string; sloganName: string};
// theme: מזהה פלטה שצבעי הממשק נגזרים ממנה, או null לברירת המחדל (ירוק וזהב של רבקה).
export type StudioSettings = {version: 3; neverList: string[]; recipes: Recipe[]; brand: BrandSettings; layouts: Layouts; theme: string | null};

export const defaultBrand: BrandSettings = {
  logoSource: "/assets/rebecca_studio_logo.png", sloganSource: "/assets/rebecca_studio_slogan.png",
  logoName: "הלוגו של רבקה", sloganName: "הסלוגן של רבקה"
};

// ברירת המחדל של רבקה: שיש ועומס.
export const defaultNeverList: readonly string[] = ["שיש", "עומס"];
export const defaultSettings: StudioSettings = {version: 3, neverList: [...defaultNeverList], recipes: [...builtInRecipes], brand: defaultBrand, layouts: {}, theme: null};

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
  if (!validSource(v.logoSource) || !validSource(v.sloganSource) || !name(v.logoName) || !name(v.sloganName)) return null;
  // קובץ הלוגו המשולב הישן הוחלף בשני קבצים נפרדים.
  const fix = (source: string, fallback: string) => source === "/assets/logo.png" ? fallback : source;
  return {logoSource: fix(v.logoSource, defaultBrand.logoSource), sloganSource: fix(v.sloganSource, defaultBrand.sloganSource), logoName: v.logoName, sloganName: v.sloganName};
}

// מיתוג בגרסאות 1 ו-2: בוליאנים והמיקום ברשת 0-20. אם משהו בו שבור לא מפילים את כל ההגדרות, חוזרים לברירות המחדל.
function parseLegacyBrand(value: unknown): {brand: BrandSettings; layouts: Layouts} | null {
  const brand = parseBrand(value);
  if (!brand) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.logo !== "boolean" || typeof v.slogan !== "boolean" || !number(v.logoX, 0, 20) || !number(v.logoY, 0, 20) || !number(v.sloganX, 0, 20) || !number(v.sloganY, 0, 20) ||
    !number(v.logoScale, 30, 160) || !number(v.sloganScale, 30, 160)) return {brand, layouts: {}};
  const old: LegacyBrand = {logo: v.logo, slogan: v.slogan, logoX: v.logoX, logoY: v.logoY, logoScale: v.logoScale, sloganX: v.sloganX, sloganY: v.sloganY, sloganScale: v.sloganScale};
  return {brand, layouts: layoutsFromLegacy(old)};
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

// מחזיר הגדרות תקינות (עם שדות נקיים בלבד) או null אם משהו בהן לא תקין. גרסאות ישנות משודרגות:
// - גרסה 1 (שלב 0) לא כללה מתכונים, ורשימת "אף פעם לא" בה הייתה ריקה כברירת מחדל.
// - גרסאות 1 ו-2 שמרו מיקום מיתוג אחד לכולם. הוא הופך לפריסה זהה בכל הפורמטים.
export function parseSettings(value: unknown): StudioSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 && v.version !== 2 && v.version !== 3) return null;
  const neverList = parseNeverList(v.neverList);
  if (!neverList) return null;
  if (v.version === 3) {
    const brand = parseBrand(v.brand), recipes = parseRecipes(v.recipes), layouts = parseLayouts(v.layouts);
    // הערך אופציונלי: הגדרות שנשמרו לפני שנוסף בחירת צבעי הממשק נקראות כברירת מחדל.
    const theme = v.theme === undefined || v.theme === null ? null : hasItem("palettes", v.theme) ? v.theme : undefined;
    return brand && recipes && layouts && theme !== undefined ? {version: 3, neverList, recipes, brand, layouts, theme} : null;
  }
  const legacy = parseLegacyBrand(v.brand);
  if (!legacy) return null;
  const recipes = v.version === 1 ? [...builtInRecipes] : parseRecipes(v.recipes);
  if (!recipes) return null;
  return {version: 3, neverList: v.version === 1 && !neverList.length ? [...defaultNeverList] : neverList, recipes, brand: legacy.brand, layouts: legacy.layouts, theme: null};
}
