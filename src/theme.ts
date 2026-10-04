import {hasItem, findItem} from "../shared/catalog";
import {cssVarNames, defaultTheme, themeFromColors, type ThemeTokens} from "../shared/theme";

export function tokensFor(id: string | null): ThemeTokens {
  const palette = id ? findItem("palettes", id) : undefined;
  return palette ? themeFromColors(palette.colors) : defaultTheme;
}

// מציב את הטוקנים כמשתני CSS על הדף כולו.
export function applyTheme(id: string | null) {
  const tokens = tokensFor(id), root = document.documentElement;
  for (const key of Object.keys(cssVarNames) as (keyof ThemeTokens)[]) root.style.setProperty(cssVarNames[key], tokens[key]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens.green);
}

const KEY = "rb-theme";
export function readLocalTheme(): string | null {
  try { const v = localStorage.getItem(KEY); return v && hasItem("palettes", v) ? v : null; } catch { return null; }
}
export function saveLocalTheme(id: string | null) {
  try { if (id) localStorage.setItem(KEY, id); else localStorage.removeItem(KEY); } catch { /* אחסון חסום: הצבעים עדיין נשמרים בשרת */ }
}
