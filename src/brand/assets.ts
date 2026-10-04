import Konva from "konva";
import type {FontRef} from "../../shared/brand-layout";
import {canvasFamily} from "./fonts";

const images = new Map<string, Promise<HTMLImageElement>>();
// תמונה מפוענחת. נשמרת לפי כתובת, כדי שהתצוגה והייצוא יציירו את אותו אובייקט.
export function loadImage(url: string): Promise<HTMLImageElement> {
  let promise = images.get(url);
  if (!promise) {
    promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("לא הצלחנו לטעון תמונה"));
      image.src = url;
    });
    images.set(url, promise);
    promise.catch(() => images.delete(url));
  }
  return promise;
}
// מנקה תמונות שכבר לא בשימוש (data URI גדולים), כדי לא להחזיק אותן בזיכרון.
export const forgetImage = (url: string) => images.delete(url);

export const aspectOf = (image: HTMLImageElement) => image.naturalHeight / image.naturalWidth;

// גרסה חד-צבעית של לוגו או סלוגן ("בהיר" או "כהה"): הצורה נשמרת והצבע מוחלף.
const tints = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();
export function tinted(image: HTMLImageElement, color: string): HTMLCanvasElement {
  let byColor = tints.get(image);
  if (!byColor) tints.set(image, byColor = new Map());
  let canvas = byColor.get(color);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    byColor.set(color, canvas);
  }
  return canvas;
}

export const LIGHT_TONE = "#FBF8F2", DARK_TONE = "#1F2A24";

// גודל טקסט בפיקסלים, בדיוק כפי ש-Konva יצייר אותו.
export function measureText(text: string, font: FontRef, bold: boolean, sizePx: number): {w: number; h: number} {
  const node = new Konva.Text({text, fontFamily: canvasFamily(font), fontStyle: bold ? "bold" : "normal", fontSize: sizePx, direction: "rtl"});
  return {w: node.width(), h: node.height()};
}

// קובע אם צבע בהיר (לבחירת צבע מנוגד למסגרת).
export function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
