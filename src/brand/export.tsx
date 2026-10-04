import {flushSync} from "react-dom";
import {createRoot} from "react-dom/client";
import type Konva from "konva";
import type {Focal, Size} from "../../shared/brand-geometry";
import type {BrandLayout} from "../../shared/brand-layout";
import {loadImage} from "./assets";
import {loadBrandFont} from "./fonts";
import {BrandScene, type SceneAssets} from "./BrandScene";

export type SceneSources = {backdrop: string | null; logo: string; slogan: string};

// טוען את כל מה שהסצנה צריכה לפני הציור: תמונות, והגופנים של כל טקסט שמצויר (גם לוגו וסלוגן במצב טקסט).
export async function loadSceneAssets(sources: SceneSources, layout: BrandLayout): Promise<SceneAssets> {
  const wantsText = layout.text.visible && layout.text.text.trim() !== "";
  const wantsImage = (part: "logo" | "slogan") => layout[part].visible && !layout[part].asText;
  const labelFonts = (["logo", "slogan"] as const).filter(p => layout[p].visible && layout[p].asText).map(p => layout[p].font);
  const [backdrop, logo, slogan] = await Promise.all([
    sources.backdrop ? loadImage(sources.backdrop) : null,
    wantsImage("logo") ? loadImage(sources.logo) : null,
    wantsImage("slogan") ? loadImage(sources.slogan) : null,
    wantsText ? loadBrandFont(layout.text.font) : null,
    ...labelFonts.map(loadBrandFont)
  ]);
  return {backdrop, logo, slogan};
}

// הייצוא: אותה סצנה בדיוק כמו בעורך, בגודל הפורמט ובלי ידיות, קווי עזר ואזור המוצר.
export async function renderBranded(canvas: Size, sources: SceneSources, focal: Focal, layout: BrandLayout, autoTextColor: string): Promise<Blob> {
  const assets = await loadSceneAssets(sources, layout);
  const container = document.createElement("div");
  const root = createRoot(container);
  let stage: Konva.Stage | null = null;
  try {
    flushSync(() => root.render(<BrandScene canvas={canvas} assets={assets} focal={focal} layout={layout} autoTextColor={autoTextColor} stageRef={s => { stage = s; }}/>));
    if (!stage) throw new Error("הסצנה לא נוצרה");
    const out = (stage as Konva.Stage).toCanvas({pixelRatio: 1});
    return await new Promise<Blob>((resolve, reject) => out.toBlob(blob => blob ? resolve(blob) : reject(new Error("לא הצלחנו להכין את קובץ התמונה")), "image/png"));
  } finally {
    root.unmount();
  }
}
