import {parseLook, type LookSelection, type Selection} from "./selection.ts";

// מתכון = מראה שמור (סגנון, פלטה, משטח, רקע, תאורה, אביזרים). בלי מוצר ובלי בקשה מיוחדת.
export type Recipe = {id: string; name: string; look: LookSelection};

export const MAX_RECIPES = 20;
export const MAX_RECIPE_NAME = 40;

const look = (style: string, palette: string, surface: string, props: string, light: string | null = null): LookSelection =>
  ({style, palette, surface, props, background: null, light});

// ארבעת המתכונים המובנים. "מינימליסטי שחור-לבן" הוא ברירת המחדל בפתיחה.
export const builtInRecipes: readonly Recipe[] = [
  {id: "boutique-bw", name: "בוטיק שחור-לבן", look: look("boutique", "mono", "paper", "none")},
  {id: "boutique-desert", name: "בוטיק מדבר", look: look("boutique", "desert", "plaster", "subtle")},
  {id: "minimal-bw", name: "מינימליסטי שחור-לבן", look: look("minimal", "mono", "paper", "none")},
  {id: "minimal-desert", name: "מינימליסטי מדבר", look: look("minimal", "desert", "linen", "none", "window")}
];

export function parseRecipe(value: unknown): Recipe | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const l = parseLook(v.look);
  if (typeof v.id !== "string" || !/^[\w-]{1,64}$/.test(v.id) || !l) return null;
  if (typeof v.name !== "string") return null;
  const name = v.name.trim();
  if (!name || name.length > MAX_RECIPE_NAME || /[\r\n]/.test(name)) return null;
  return {id: v.id, name, look: l};
}

export function parseRecipes(value: unknown): Recipe[] | null {
  if (!Array.isArray(value) || value.length > MAX_RECIPES) return null;
  const recipes: Recipe[] = [];
  for (const item of value) {
    const recipe = parseRecipe(item);
    if (!recipe || recipes.some(r => r.id === recipe.id)) return null;
    recipes.push(recipe);
  }
  return recipes;
}

export const applyRecipe = (selection: Selection, recipe: Recipe): Selection => ({...selection, ...recipe.look});

export const lookOf = (s: Selection): LookSelection =>
  ({style: s.style, palette: s.palette, props: s.props, surface: s.surface, background: s.background, light: s.light});

// המתכון "פעיל" כל עוד הבחירה הנוכחית זהה לו בדיוק.
export const recipeMatches = (selection: Selection, recipe: Recipe): boolean =>
  (Object.keys(recipe.look) as (keyof LookSelection)[]).every(k => selection[k] === recipe.look[k]);
