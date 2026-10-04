import {findItem} from "./catalog.ts";
import type {Selection} from "./selection.ts";

export type PromptSettings = {neverList: readonly string[]};

// פונקציה טהורה: אותה בחירה מחזירה תמיד אותו פרומפט. אין בה קריאות רשת, והיא נבדקת ביחידה.
export function buildPrompt(selection: Selection, settings: PromptSettings = {neverList: []}): string {
  const product = findItem("productTypes", selection.product);
  const style = findItem("styles", selection.style);
  const palette = findItem("palettes", selection.palette);
  const props = findItem("props", selection.props);
  if (!product || !style || !palette || !props) throw new Error("Selection is not in the catalog");
  const prompt = `Create a single photorealistic commercial product photograph by editing the supplied photo of ${product.prompt}.
The image itself must become one coherent edge-to-edge scene. No frames, mats, borders, poster layouts, inset source photos, cards, text overlays, typography, additional logos or watermarks.
Keep the exact number, shape, silhouette, arrangement, scale, material, colors, surface details and existing labels of the actual products in the supplied photo. Do not redesign or invent products. Do not change the words on any existing label. Keep the products central and recognizable.
Replace and integrate the background and surrounding surface as ${style.prompt}. Use the '${palette.label}' palette in the ENVIRONMENT ONLY, with these exact three colors as guidance: ${palette.prompt}. Do not recolor the products. ${props.prompt}
Make perspective, natural lighting, contact shadows and reflections consistent so the products feel physically present. Leave generous breathing room on every side because the image may be cropped for social publishing. Keep the full product safely inside the central 60 percent. Output one finished photograph, no graphic layout.`;
  const never = settings.neverList.map(item => item.trim()).filter(Boolean);
  return never.length ? `${prompt}\nStrictly avoid: ${never.join(", ")}.` : prompt;
}
