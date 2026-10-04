// צבעי הממשק נגזרים משלושת צבעי הפלטה (כהה, אמצעי, בהיר). הנגזרות מובטחות קריאות:
// כל זוג טקסט ורקע עומד בניגודיות מינימלית, כך שגם פלטות פסטל או כהות מאוד נשארות שמישות.
export type ThemeTokens = {
  green: string; gold: string; goldLight: string; cream: string;
  bg: string; bg2: string; surface: string; line: string; text: string; muted: string; okBg: string; okFg: string;
};

// ברירת המחדל של רבקה (ירוק מותג וזהב), כפי שהוגדרה בטוקנים העיצוביים.
export const defaultTheme: ThemeTokens = {
  green: "#163B30", gold: "#8A6A2F", goldLight: "#E7C98E", cream: "#F6F1E7",
  bg: "#F3EDE1", bg2: "#E9E1D2", surface: "#FBF8F2", line: "#E7DFCF", text: "#1F2A24", muted: "#5E675F", okBg: "#E6EFE7", okFg: "#276A4F"
};

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
// mix(a, b, t): t אחוז מ-b ו-(1-t) מ-a
export const mix = (a: string, b: string, t: number) => { const x = toRgb(a), y = toRgb(b); return toHex([0, 1, 2].map(i => x[i] + (y[i] - x[i]) * t) as RGB); };
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
// מכהה (או מבהיר) את הצבע עד שהוא עומד בניגודיות הנדרשת מול הצבע השני.
function ensureContrast(color: string, against: string, min: number, toward: "#000000" | "#FFFFFF"): string {
  let c = color;
  for (let t = 0; contrast(c, against) < min && t < 1; t += 0.04) c = mix(color, toward, t + 0.04);
  return c;
}

export function themeFromColors(colors: readonly [string, string, string]): ThemeTokens {
  const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const [dark, mid, light] = sorted;
  const cream = mix(light, "#FFFFFF", 0.85);
  const bg = ensureContrast(mix(light, "#FFFFFF", 0.62), "#000000", 14, "#FFFFFF");
  const green = ensureContrast(dark, cream, 6, "#000000");
  const gold = ensureContrast(mid, "#FFFFFF", 4.6, "#000000");
  const text = ensureContrast(mix(green, "#000000", 0.5), bg, 9, "#000000");
  const surface = mix(bg, "#FFFFFF", 0.6);
  const okBg = mix(bg, green, 0.1);
  return {
    green, gold, cream, bg, surface, text,
    goldLight: ensureContrast(mix(gold, "#FFFFFF", 0.55), green, 4.5, "#FFFFFF"),
    bg2: mix(bg, green, 0.08),
    line: mix(bg, green, 0.14),
    muted: ensureContrast(mix(text, bg, 0.4), bg, 4.8, "#000000"),
    okBg, okFg: ensureContrast(green, okBg, 5, "#000000")
  };
}

export const cssVarNames: Record<keyof ThemeTokens, string> = {
  green: "--green", gold: "--gold", goldLight: "--gold-light", cream: "--cream", bg: "--bg", bg2: "--bg2",
  surface: "--surface", line: "--line", text: "--text", muted: "--muted", okBg: "--ok-bg", okFg: "--ok-fg"
};
