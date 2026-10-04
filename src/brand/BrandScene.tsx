import {useEffect, useRef, useState, type Ref} from "react";
import type Konva from "konva";
import {Group, Image as KImage, Layer, Line, Rect, Stage, Text as KText, Transformer} from "react-konva";
import {
  boxFromCenter, centerFromBox, clamp, coverBox, focalFromBox, imageBox, imageGeometryFromBox, productAreaBox, pctToPx, pxToPct, roundStored, snapBox, snapTargets,
  type Box, type Focal, type SnapTargets, type Size
} from "../../shared/brand-geometry";
import type {BrandLayout, ImageLayer, LayerId, TextLayer} from "../../shared/brand-layout";
import {aspectOf, DARK_TONE, isLightColor, LIGHT_TONE, measureText, tinted} from "./assets";
import {canvasFamily} from "./fonts";

// הסצנה היחידה שמציירת את המיתוג. העורך מציג אותה מוקטנת עם ידיות, והייצוא מציג אותה בגודל הפורמט בלי ממשק:
// כל הקואורדינטות כאן בפיקסלים של הפורמט, ולכן מה שרואים הוא מה שנשמר.
export type SceneAssets = {backdrop: HTMLImageElement | null; logo: HTMLImageElement | null; slogan: HTMLImageElement | null};
export type LayerPatch = Partial<ImageLayer> & Partial<TextLayer>;
export type EditProps = {
  scale: number; selected: LayerId | null; cropMode: boolean; showProductArea: boolean; coarse: boolean;
  onSelect: (id: LayerId | null) => void; onLayer: (id: LayerId, patch: LayerPatch) => void; onFocal: (focal: Focal) => void;
};
type Props = {canvas: Size; assets: SceneAssets; focal: Focal; layout: BrandLayout; autoTextColor: string; edit?: EditProps; stageRef?: Ref<Konva.Stage>};

const GUIDE = "#E0458B", GOLD = "#9A7737", GOLD_LIGHT = "#E7C98E", CREAM = "#FBF8F2";
const safeAspect = (image: HTMLImageElement) => { const a = aspectOf(image); return Number.isFinite(a) && a > 0 ? a : 0.25; };

export function textColor(layer: TextLayer, auto: string) { return layer.color ?? auto; }

// התיבות של השכבות הנראות, בפיקסלים של הפורמט.
export function layerBoxes(layout: BrandLayout, assets: SceneAssets, canvas: Size): Partial<Record<LayerId, Box>> {
  const boxes: Partial<Record<LayerId, Box>> = {};
  for (const id of ["logo", "slogan"] as const) {
    const image = assets[id], layer = layout[id];
    if (layer.visible && image) boxes[id] = imageBox(layer, safeAspect(image), canvas);
  }
  const t = layout.text;
  if (t.visible && t.text.trim()) {
    const size = measureText(t.text, t.font, t.bold, pctToPx(t.size, canvas.w));
    boxes.text = boxFromCenter(t.cx, t.cy, size.w, size.h, canvas);
  }
  return boxes;
}

const shadowFor = (legibility: string, sizePx: number) => legibility === "shadow"
  ? {shadowColor: "#000000", shadowBlur: Math.max(2, sizePx * 0.12), shadowOffsetY: Math.max(1, sizePx * 0.03), shadowOpacity: 0.5, shadowEnabled: true} : {shadowEnabled: false};

export function BrandScene({canvas, assets, focal, layout, autoTextColor, edit, stageRef}: Props) {
  const scale = edit?.scale ?? 1;
  const nodes = useRef<Partial<Record<LayerId, Konva.Node>>>({});
  const transformer = useRef<Konva.Transformer>(null);
  const [guides, setGuides] = useState<SnapTargets>({x: [], y: []});
  const boxes = layerBoxes(layout, assets, canvas);
  const selected = edit && edit.selected && boxes[edit.selected] ? edit.selected : null;

  useEffect(() => {
    const tr = transformer.current;
    if (!tr) return;
    const node = selected ? nodes.current[selected] : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  });

  const others = (id: LayerId) => (Object.entries(boxes) as [LayerId, Box][]).filter(([k]) => k !== id).map(([, b]) => b);
  function onDragMove(id: LayerId, e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target, b = boxes[id]!;
    let x = clamp(node.x(), 0, canvas.w), y = clamp(node.y(), 0, canvas.h);
    // Alt מבטל הצמדה, למי שרוצה מיקום חופשי.
    if (!e.evt.altKey) {
      const snapped = snapBox({x: x - b.w / 2, y: y - b.h / 2, w: b.w, h: b.h}, snapTargets(canvas, others(id)), 6 / scale);
      x = snapped.box.x + b.w / 2; y = snapped.box.y + b.h / 2;
      setGuides(snapped.guides);
    } else setGuides({x: [], y: []});
    node.position({x, y});
  }
  function onDragEnd(id: LayerId, e: Konva.KonvaEventObject<DragEvent>) {
    setGuides({x: [], y: []});
    const c = centerFromBox({x: e.target.x() - boxes[id]!.w / 2, y: e.target.y() - boxes[id]!.h / 2, w: boxes[id]!.w, h: boxes[id]!.h}, canvas);
    edit?.onLayer(id, {cx: clamp(c.cx, 0, 100), cy: clamp(c.cy, 0, 100)});
  }
  function transformImage(id: "logo" | "slogan", e: Konva.KonvaEventObject<Event>) {
    const node = e.target, b = boxes[id]!, layer = layout[id], aspect = safeAspect(assets[id]!);
    const w = b.w * node.scaleX(), h = layer.lock ? w * aspect : b.h * node.scaleY();
    node.scaleX(1); node.scaleY(1);
    const g = imageGeometryFromBox({x: node.x() - w / 2, y: node.y() - h / 2, w, h}, aspect, canvas);
    edit?.onLayer(id, {cx: clamp(g.cx, 0, 100), cy: clamp(g.cy, 0, 100), w: clamp(g.w, 1, 100), stretch: layer.lock ? 1 : clamp(g.stretch, 0.2, 5)});
  }
  function transformText(e: Konva.KonvaEventObject<Event>) {
    const node = e.target, t = layout.text, b = boxes.text!;
    const fontPx = pctToPx(t.size, canvas.w) * node.scaleX();
    node.scaleX(1); node.scaleY(1);
    const c = centerFromBox({x: node.x() - b.w / 2, y: node.y() - b.h / 2, w: b.w, h: b.h}, canvas);
    edit?.onLayer("text", {cx: clamp(c.cx, 0, 100), cy: clamp(c.cy, 0, 100), size: clamp(roundStored(pxToPct(fontPx, canvas.w)), 1, 30)});
  }

  const interactive = !!edit && !edit.cropMode;
  const common = (id: LayerId) => ({
    name: id, draggable: interactive, listening: interactive,
    ref: (n: Konva.Node | null) => { if (n) nodes.current[id] = n; else delete nodes.current[id]; },
    onClick: () => edit?.onSelect(id), onTap: () => edit?.onSelect(id),
    onDragStart: () => edit?.onSelect(id),
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(id, e), onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(id, e)
  });

  const back = assets.backdrop ? coverBox({w: assets.backdrop.naturalWidth, h: assets.backdrop.naturalHeight}, canvas, focal) : null;
  const imageNode = (id: "logo" | "slogan") => {
    const layer = layout[id], image = assets[id], b = boxes[id];
    if (!layer.visible || !image || !b) return null;
    const color = layer.tone === "light" ? LIGHT_TONE : layer.tone === "dark" ? DARK_TONE : null;
    const source = color ? tinted(image, color) : image;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const outlineColor = layer.tone === "light" ? DARK_TONE : LIGHT_TONE;
    const r = Math.max(1, b.w * 0.006);
    const shared = {width: b.w, height: b.h, offsetX: b.w / 2, offsetY: b.h / 2, opacity: layer.opacity / 100, perfectDrawEnabled: false};
    return <Group key={id} x={cx} y={cy} {...common(id)} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => transformImage(id, e)}>
      {layer.legibility === "outline" && Array.from({length: 8}, (_, k) => {
        const angle = k * Math.PI / 4;
        return <KImage key={k} image={tinted(image, outlineColor)} x={Math.cos(angle) * r} y={Math.sin(angle) * r} listening={false} {...shared}/>;
      })}
      <KImage image={source} {...shared} {...shadowFor(layer.legibility, b.w * 0.2)}/>
    </Group>;
  };
  const textNode = () => {
    const t = layout.text, b = boxes.text;
    if (!b) return null;
    const fill = textColor(t, autoTextColor), fontPx = pctToPx(t.size, canvas.w);
    return <KText key="text" x={b.x + b.w / 2} y={b.y + b.h / 2} offsetX={b.w / 2} offsetY={b.h / 2} text={t.text} fontFamily={canvasFamily(t.font)}
      fontStyle={t.bold ? "bold" : "normal"} fontSize={fontPx} direction="rtl" fill={fill} opacity={t.opacity / 100} perfectDrawEnabled={false}
      {...(t.legibility === "outline" ? {stroke: isLightColor(fill) ? DARK_TONE : LIGHT_TONE, strokeWidth: fontPx * 0.12, fillAfterStrokeEnabled: true, lineJoin: "round" as const} : {})}
      {...shadowFor(t.legibility, fontPx)}
      {...common("text")} onTransformEnd={transformText}/>;
  };

  const p = productAreaBox(canvas);
  // ידיות הטרנספורמר מוגדרות בפיקסלים של המסך (Konva מתקן אותן לפי קנה המידה של הבמה).
  const handle = (coarse: boolean) => (coarse ? 26 : 12);
  const lockedRatio = selected === "text" || (selected !== null && (layout[selected] as ImageLayer).lock);
  return <Stage ref={stageRef} width={canvas.w * scale} height={canvas.h * scale} scaleX={scale} scaleY={scale}
    onMouseDown={e => { if (edit && !edit.cropMode && e.target === e.target.getStage()) edit.onSelect(null); }}
    onTouchStart={e => { if (edit && !edit.cropMode && e.target === e.target.getStage()) edit.onSelect(null); }}>
    <Layer>
      <Rect x={0} y={0} width={canvas.w} height={canvas.h} fill="#E3DACA" listening={false}/>
      {back && assets.backdrop && <KImage image={assets.backdrop} x={back.x} y={back.y} width={back.w} height={back.h} draggable={!!edit?.cropMode} listening={!!edit?.cropMode}
        dragBoundFunc={pos => ({x: clamp(pos.x, (canvas.w - back.w) * scale, 0), y: clamp(pos.y, (canvas.h - back.h) * scale, 0)})}
        onDragEnd={e => edit?.onFocal(focalFromBox({x: e.target.x(), y: e.target.y(), w: back.w, h: back.h}, canvas))}/>}
      {imageNode("logo")}{imageNode("slogan")}{textNode()}
      {edit?.showProductArea && <>
        <Rect x={p.x} y={p.y} width={p.w} height={p.h} stroke="rgba(251,248,242,.9)" strokeWidth={2 / scale} dash={[10 / scale, 8 / scale]} cornerRadius={10 / scale} listening={false}/>
        <Rect x={p.x + p.w / 2 - 60 / scale} y={p.y + p.h - 26 / scale} width={120 / scale} height={20 / scale} cornerRadius={8 / scale} fill="rgba(22,59,48,.75)" listening={false}/>
        <KText x={p.x + p.w / 2 - 60 / scale} y={p.y + p.h - 26 / scale} width={120 / scale} height={20 / scale} align="center" verticalAlign="middle" text="אזור המוצר" fontSize={12 / scale} fontFamily="Assistant, sans-serif" fontStyle="600" fill="#F6F1E7" direction="rtl" listening={false}/>
      </>}
      {edit && guides.x.map(g => <Line key={`x${g.pos}`} points={[g.pos, 0, g.pos, canvas.h]} stroke={GUIDE} strokeWidth={1.5 / scale} listening={false}/>)}
      {edit && guides.y.map(g => <Line key={`y${g.pos}`} points={[0, g.pos, canvas.w, g.pos]} stroke={GUIDE} strokeWidth={1.5 / scale} listening={false}/>)}
      {edit && <Transformer ref={transformer} rotateEnabled={false} keepRatio={lockedRatio} flipEnabled={false}
        enabledAnchors={lockedRatio ? ["top-left", "top-right", "bottom-left", "bottom-right"] : ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"]}
        anchorSize={handle(edit.coarse)} anchorFill={CREAM} anchorStroke={GOLD} anchorStrokeWidth={1.5} anchorCornerRadius={2}
        borderStroke={GOLD_LIGHT} borderStrokeWidth={1.5} padding={4}
        boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 8 ? oldBox : newBox)}/>}
    </Layer>
  </Stage>;
}
