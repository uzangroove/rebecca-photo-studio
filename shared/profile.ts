// "פרופיל רבקה": מה היא בוחרת בפועל, לפי סוג מוצר. פונקציות טהורות (בלי רשת ובלי AI).
// זה השלב הראשון של הלמידה: ספירה משוקללת פשוטה. מודל מורכב יותר רק כשיהיו מספיק נתונים.
import type {Selection} from "./selection.ts";

export const PROFILE_DIMS = ["style", "palette", "props", "surface", "background", "light"] as const;
export type ProfileDim = typeof PROFILE_DIMS[number];
export const DEFAULT_LABEL = "(ברירת מחדל)";

export type ProfileInput = {selection: Selection; rating: "up" | "down" | null; sent?: boolean};
export type Choice = {value: string; count: number; share: number};
export type ProductProfile = {product: string; images: number; dims: Record<ProfileDim, Choice[]>; disliked: string[]};
export type Profile = {total: number; rated: number; products: ProductProfile[]};

// 👍 נחשב כפול, 👎 כמעט לא נחשב. בלי דירוג = 1.
const WEIGHT = {up: 2, down: 0.25, none: 1} as const;
// פלטה מותאמת (custom:#...) נספרת כקבוצה אחת.
const valueOf = (s: Selection, dim: ProfileDim) => {
  const v = s[dim];
  if (v === null || v === undefined || v === "") return DEFAULT_LABEL;
  return dim === "palette" && v.startsWith("custom:") ? "custom" : v;
};

export function computeProfile(images: ProfileInput[], top = 3): Profile {
  const byProduct = new Map<string, ProfileInput[]>();
  for (const img of images) byProduct.set(img.selection.product, [...(byProduct.get(img.selection.product) ?? []), img]);
  const products = [...byProduct.entries()].map(([product, list]): ProductProfile => {
    const dims = {} as Record<ProfileDim, Choice[]>;
    for (const dim of PROFILE_DIMS) {
      const sums = new Map<string, number>();
      let total = 0;
      for (const img of list) {
        const w = img.rating === "up" ? WEIGHT.up : img.rating === "down" ? WEIGHT.down : WEIGHT.none;
        const v = valueOf(img.selection, dim);
        sums.set(v, (sums.get(v) ?? 0) + w); total += w;
      }
      dims[dim] = [...sums.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, top)
        .map(([value, count]) => ({value, count: Math.round(count * 100) / 100, share: total ? Math.round(count / total * 100) / 100 : 0}));
    }
    const disliked = [...new Set(list.filter(i => i.rating === "down").flatMap(i => PROFILE_DIMS.map(d => `${d}:${valueOf(i.selection, d)}`)))];
    return {product, images: list.length, dims, disliked};
  }).sort((a, b) => b.images - a.images);
  return {total: images.length, rated: images.filter(i => i.rating).length, products};
}

/** האם יש מספיק נתונים כדי להציע אוטומטית לסוג מוצר? פחות מ-15 תמונות = עדיין לא. */
export const MIN_FOR_SUGGESTION = 15;
export const canSuggest = (p: ProductProfile) => p.images >= MIN_FOR_SUGGESTION;
