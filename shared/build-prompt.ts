import {isBlocked, findItem, type CatalogItem} from "./catalog.ts";
import {sceneItem, type Selection} from "./selection.ts";

export type PromptSettings = {neverList: readonly string[]};

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

// פונקציה טהורה: אותה בחירה והגדרות מחזירות תמיד אותו פרומפט. אין בה קריאות רשת, והיא נבדקת ביחידה.
// - שמות פלטות לא נכנסים לפרומפט (אבן, עץ ומתכת עלולים להתפרש כחומרים): רק קודי HEX עם "environment colors only".
// - הנחיית המינימליזם קבועה, וההנחיה האחרונה בה נקבעת לפי האביזרים שנבחרו.
// - רשימת "אף פעם לא" נכנסת תמיד כ-Strictly avoid, ופריט שחסום בה לא נכנס כמשטח, רקע או תאורה.
// - הבקשה המיוחדת של רבקה מצורפת בסוף.
export function buildPrompt(selection: Selection, settings: PromptSettings): string {
  const product = findItem("productTypes", selection.product);
  const style = findItem("styles", selection.style);
  const palette = findItem("palettes", selection.palette);
  const props = findItem("props", selection.props);
  if (!product || !style || !palette || !props) throw new Error("Selection is not in the catalog");
  const never = settings.neverList.map(oneLine).filter(Boolean);
  const wrap = findItem("giftWraps", selection.giftWrap), candle = findItem("candleStates", selection.candleState);
  const tint = selection.glassTint ? findItem("glassTints", selection.glassTint) : undefined;
  const angle = selection.angle ? findItem("angles", selection.angle) : undefined;
  const occasion = selection.occasion ? findItem("occasions", selection.occasion) : undefined;
  const scene = (label: string, item: CatalogItem | undefined) =>
    item && !isBlocked(item, never) ? ` ${label}: ${item.prompt}.` : "";
  // הנחיות לפי סוג מוצר: מקטע הסוג, ואז מצב נר (רק לנרות), גוון זכוכית (רק לנר בזכוכית) ועטיפה (רק למארז).
  const notes = [product.guidance,
    product.family === "candle" ? candle?.prompt : null,
    product.id === "glass-candle" ? tint?.prompt : null,
    product.family === "gift" ? wrap?.prompt : null].filter((n): n is string => !!n).map(n => ` ${n}.`).join("");
  // אירוע משפיע על פרטי הסצנה בלבד. בלי אביזרים הוא מתבטא באווירה וצבע, בלי חפצים נוספים.
  const occasionNote = occasion ? ` Occasion: ${occasion.prompt}, expressed ${selection.props === "none" ? "only through subtle mood and color, with no added objects" : "only through subtle scene details"}, never on the products themselves.` : "";
  const prompt = `Create a single photorealistic commercial product photograph by editing the supplied photo of ${product.prompt}.
The image itself must become one coherent edge-to-edge scene. No frames, mats, borders, poster layouts, inset source photos, cards, text overlays, typography, additional logos or watermarks.
Keep the exact number, shape, silhouette, arrangement, scale, material, colors, surface details and existing labels of the actual products in the supplied photo. Do not redesign or invent products. Do not change the words on any existing label. Keep the products central and recognizable.
Replace and integrate the background and surrounding surface as ${style.prompt}.${scene("Surface", sceneItem(selection, "surface"))}${scene("Background", sceneItem(selection, "background"))}${scene("Lighting", sceneItem(selection, "light"))} Use these exact three HEX colors as guidance, environment colors only: ${palette.prompt}. Do not recolor the products.${notes} Composition: uncluttered composition, generous negative space, ${props.prompt}.${angle ? ` Camera: ${angle.prompt}.` : ""}${occasionNote}
Make perspective, natural lighting, contact shadows and reflections consistent so the products feel physically present. Leave generous breathing room on every side because the image may be cropped for social publishing. Keep the full product safely inside the central 60 percent. Output one finished photograph, no graphic layout.`;
  const lines = [prompt];
  if (never.length) lines.push(`Strictly avoid: ${never.join(", ")}.`);
  const wish = oneLine(selection.wish);
  if (wish) lines.push(`Additional wish from the maker (Hebrew): ${wish}`);
  return lines.join("\n");
}
