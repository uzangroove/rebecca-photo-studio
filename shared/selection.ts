import {findItem, hasItem, legacyProductIds} from "./catalog.ts";

export const MAX_WISH_CHARS = 200;

// הבחירה של רבקה למסך אחד. surface, background ו-light ריקים (null) = ברירת המחדל של הסגנון.
export type Selection = {
  product: string; style: string; palette: string; props: string;
  surface: string | null; background: string | null; light: string | null;
  // הנחיות לפי סוג מוצר (שלב 3). מצב נר ועטיפה נשמרים תמיד, אבל נכנסים לפרומפט רק לסוג המוצר המתאים.
  candleState: string; giftWrap: string; glassTint: string | null; angle: string | null; occasion: string | null;
  wish: string;
};
export type SceneKey = "surface" | "background" | "light";

// מה שמתכון קובע: הכול חוץ ממוצר ובקשה מיוחדת.
export type LookSelection = Pick<Selection, "style" | "palette" | "props" | SceneKey>;

// פתיחת הסטודיו: מתכון "מינימליסטי שחור-לבן" (ראו shared/recipes.ts).
export const defaultSelection: Selection = {
  product: "cut-soap", style: "minimal", palette: "mono", props: "none",
  surface: "paper", background: null, light: null,
  candleState: "asis", giftWrap: "asis", glassTint: null, angle: null, occasion: null, wish: ""
};

const sceneCategory = {surface: "surfaces", background: "backgrounds", light: "lights"} as const;

// אפשרות ריקה (null, undefined או מחרוזת ריקה מטופס) = ברירת מחדל. ערך שאינו בקטלוג = לא תקין.
function optional(category: "surfaces" | "backgrounds" | "lights" | "glassTints" | "angles" | "occasions", value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return hasItem(category, value) ? value : undefined;
}

export function parseLook(value: unknown): LookSelection | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!hasItem("styles", v.style) || !hasItem("palettes", v.palette) || !hasItem("props", v.props)) return null;
  const surface = optional("surfaces", v.surface), background = optional("backgrounds", v.background), light = optional("lights", v.light);
  if (surface === undefined || background === undefined || light === undefined) return null;
  return {style: v.style, palette: v.palette, props: v.props, surface, background, light};
}

// מחזיר בחירה תקינה או null. משמש את השרת (בקשת יצירה) ואת טעינת ההיסטוריה.
export function parseSelection(value: unknown): Selection | null {
  const look = parseLook(value);
  if (!look) return null;
  const v = value as Record<string, unknown>;
  const product = typeof v.product === "string" ? legacyProductIds[v.product] ?? v.product : v.product;
  if (!hasItem("productTypes", product)) return null;
  // שדות שלא נשלחו (בקשות והיסטוריה ישנות) מקבלים את ברירת המחדל.
  const candleState = v.candleState == null || v.candleState === "" ? defaultSelection.candleState : v.candleState;
  const giftWrap = v.giftWrap == null || v.giftWrap === "" ? defaultSelection.giftWrap : v.giftWrap;
  if (!hasItem("candleStates", candleState) || !hasItem("giftWraps", giftWrap)) return null;
  const glassTint = optional("glassTints", v.glassTint), angle = optional("angles", v.angle), occasion = optional("occasions", v.occasion);
  if (glassTint === undefined || angle === undefined || occasion === undefined) return null;
  const wish = v.wish === undefined || v.wish === null ? "" : v.wish;
  if (typeof wish !== "string" || wish.length > MAX_WISH_CHARS) return null;
  return {...look, product, candleState, giftWrap, glassTint, angle, occasion, wish};
}

// הערך בפועל: בחירה מפורשת, ואם אין אז ברירת המחדל של הסגנון.
export function effectiveScene(selection: Selection, key: SceneKey): string {
  return selection[key] ?? findItem("styles", selection.style)!.defaults[key];
}

export const sceneItem = (selection: Selection, key: SceneKey) => findItem(sceneCategory[key], effectiveScene(selection, key));
