import {hasItem} from "./catalog.ts";

// הבחירה של רבקה למסך אחד. כל שדה הוא מזהה מתוך הקטלוג.
export type Selection = {product: string; style: string; palette: string; props: string};

export const defaultSelection: Selection = {product: "soap", style: "boutique", palette: "forest", props: "subtle"};

// מחזיר בחירה תקינה או null. משמש גם את השרת (בקשת יצירה) וגם אימות הגדרות שמורות.
export function parseSelection(value: unknown): Selection | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!hasItem("productTypes", v.product) || !hasItem("styles", v.style) || !hasItem("palettes", v.palette) || !hasItem("props", v.props)) return null;
  return {product: v.product, style: v.style, palette: v.palette, props: v.props};
}
