// גיאומטריה טהורה של עורך המיתוג. כל הפריסה נשמרת באחוזים, וכאן ממירים אותה לפיקסלים של הפורמט,
// מיישרים, מפזרים ומצמידים. אין כאן שום תלות בדפדפן, כדי שכל זה יהיה נבדק ביחידה.
export type Size = {w: number; h: number};
export type Box = {x: number; y: number; w: number; h: number};

export const SAFE_MARGIN_PCT = 5;
// אזור המוצר: 60% המרכזיים בכל ציר.
export const PRODUCT_AREA_PCT = {x: 20, y: 20, w: 60, h: 60} as const;

export const pctToPx = (pct: number, total: number) => pct / 100 * total;
export const pxToPct = (px: number, total: number) => px / total * 100;
// דיוק האחסון: אלפית האחוז. מקש חץ של פיקסל אחד חייב לזוז פיקסל אחד, ולכן לא מעגלים לעשירית כבר באחסון.
export const roundStored = (v: number) => Math.round(v * 1000) / 1000;
// דיוק התצוגה והשדות המספריים: עשירית האחוז.
export const roundShown = (v: number) => Math.round(v * 10) / 10;
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function productAreaBox(canvas: Size): Box {
  const a = PRODUCT_AREA_PCT;
  return {x: pctToPx(a.x, canvas.w), y: pctToPx(a.y, canvas.h), w: pctToPx(a.w, canvas.w), h: pctToPx(a.h, canvas.h)};
}

// מרכז באחוזים וגודל בפיקסלים => תיבה בפיקסלים. ולהפך.
export function boxFromCenter(cxPct: number, cyPct: number, wPx: number, hPx: number, canvas: Size): Box {
  return {x: pctToPx(cxPct, canvas.w) - wPx / 2, y: pctToPx(cyPct, canvas.h) - hPx / 2, w: wPx, h: hPx};
}
export function centerFromBox(box: Box, canvas: Size): {cx: number; cy: number} {
  return {cx: roundStored(pxToPct(box.x + box.w / 2, canvas.w)), cy: roundStored(pxToPct(box.y + box.h / 2, canvas.h))};
}

// שכבת תמונה: רוחב באחוזי רוחב הקנבס, והגובה נגזר מיחס התמונה (גובה/רוחב) כפול stretch (1 = פרופורציות מקוריות).
export type ImageGeometry = {cx: number; cy: number; w: number; stretch: number};
export function imageBox(g: ImageGeometry, aspect: number, canvas: Size): Box {
  const w = pctToPx(g.w, canvas.w);
  return boxFromCenter(g.cx, g.cy, w, w * aspect * g.stretch, canvas);
}
export function imageGeometryFromBox(box: Box, aspect: number, canvas: Size): ImageGeometry {
  return {...centerFromBox(box, canvas), w: roundStored(pxToPct(box.w, canvas.w)), stretch: roundStored(box.h / (box.w * aspect))};
}

// הזזה בפיקסלים של הפורמט (מקשי חצים וכפתורי מגע).
export function nudgeCenter(cx: number, cy: number, dxPx: number, dyPx: number, canvas: Size): {cx: number; cy: number} {
  return {cx: roundStored(clamp(cx + pxToPct(dxPx, canvas.w), 0, 100)), cy: roundStored(clamp(cy + pxToPct(dyPx, canvas.h), 0, 100))};
}

export type AlignAction = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";
// מיישר תיבה ביחס לתיבת ייחוס (כל התמונה, שכבה אחרת או אזור המוצר).
export function alignBox(box: Box, ref: Box, action: AlignAction): Box {
  switch (action) {
    case "left": return {...box, x: ref.x};
    case "hcenter": return {...box, x: ref.x + (ref.w - box.w) / 2};
    case "right": return {...box, x: ref.x + ref.w - box.w};
    case "top": return {...box, y: ref.y};
    case "vcenter": return {...box, y: ref.y + (ref.h - box.h) / 2};
    case "bottom": return {...box, y: ref.y + ref.h - box.h};
  }
}

// פיזור שווה: הקצוות נשארים במקומם והרווחים ביניהם נעשים שווים. פחות משלוש תיבות אין מה לפזר.
export function distribute(boxes: Box[], axis: "x" | "y"): Box[] {
  if (boxes.length < 3) return boxes;
  const size = axis === "x" ? "w" : "h";
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[a][axis] - boxes[b][axis]);
  const first = boxes[order[0]], last = boxes[order[order.length - 1]];
  const span = last[axis] + last[size] - first[axis];
  const gap = (span - order.reduce((sum, i) => sum + boxes[i][size], 0)) / (order.length - 1);
  const result = boxes.map(b => ({...b}));
  let cursor = first[axis];
  for (const i of order) {
    result[i][axis] = cursor;
    cursor += boxes[i][size] + gap;
  }
  return result;
}

export type GuideKind = "center" | "edge" | "margin" | "layer" | "product";
export type Guide = {pos: number; kind: GuideKind};
export type SnapTargets = {x: Guide[]; y: Guide[]};

// קווי ההצמדה: מרכז, קצוות ושוליים של התמונה, אזור המוצר, והקצוות והמרכז של כל שכבה אחרת.
export function snapTargets(canvas: Size, others: Box[]): SnapTargets {
  const mx = pctToPx(SAFE_MARGIN_PCT, canvas.w), my = pctToPx(SAFE_MARGIN_PCT, canvas.h), p = productAreaBox(canvas);
  const x: Guide[] = [
    {pos: canvas.w / 2, kind: "center"}, {pos: 0, kind: "edge"}, {pos: canvas.w, kind: "edge"},
    {pos: mx, kind: "margin"}, {pos: canvas.w - mx, kind: "margin"}, {pos: p.x, kind: "product"}, {pos: p.x + p.w, kind: "product"}
  ];
  const y: Guide[] = [
    {pos: canvas.h / 2, kind: "center"}, {pos: 0, kind: "edge"}, {pos: canvas.h, kind: "edge"},
    {pos: my, kind: "margin"}, {pos: canvas.h - my, kind: "margin"}, {pos: p.y, kind: "product"}, {pos: p.y + p.h, kind: "product"}
  ];
  for (const o of others) {
    x.push({pos: o.x, kind: "layer"}, {pos: o.x + o.w / 2, kind: "layer"}, {pos: o.x + o.w, kind: "layer"});
    y.push({pos: o.y, kind: "layer"}, {pos: o.y + o.h / 2, kind: "layer"}, {pos: o.y + o.h, kind: "layer"});
  }
  return {x, y};
}

function snapAxis(lines: number[], targets: Guide[], threshold: number): {delta: number; guides: Guide[]} {
  let best: {delta: number} | null = null;
  for (const line of lines) for (const t of targets) {
    const delta = t.pos - line;
    if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = {delta};
  }
  if (!best) return {delta: 0, guides: []};
  const delta = best.delta, guides: Guide[] = [];
  for (const line of lines) for (const t of targets)
    if (Math.abs(t.pos - (line + delta)) < 1e-6 && !guides.some(g => g.pos === t.pos)) guides.push(t);
  return {delta, guides};
}

// מצמיד תיבה שנגררת: הקצה השמאלי, המרכז או הימני שלה (ובאנכי: עליון, מרכז, תחתון) לקו הקרוב ביותר בטווח.
export function snapBox(box: Box, targets: SnapTargets, threshold: number): {box: Box; guides: SnapTargets} {
  const sx = snapAxis([box.x, box.x + box.w / 2, box.x + box.w], targets.x, threshold);
  const sy = snapAxis([box.y, box.y + box.h / 2, box.y + box.h], targets.y, threshold);
  return {box: {...box, x: box.x + sx.delta, y: box.y + sy.delta}, guides: {x: sx.guides, y: sy.guides}};
}

// חיתוך ידני: התמונה ממלאת את המסגרת (cover), ו-focal קובע איזה חלק ממנה נראה (0.5 = מרכז).
export type Focal = {x: number; y: number};
export const centerFocal: Focal = {x: 0.5, y: 0.5};
export function coverBox(image: Size, canvas: Size, focal: Focal): Box {
  const scale = Math.max(canvas.w / image.w, canvas.h / image.h);
  const w = image.w * scale, h = image.h * scale;
  return {x: (canvas.w - w) * focal.x + 0, y: (canvas.h - h) * focal.y + 0, w, h}; // "+ 0" מונע מינוס אפס
}
export function focalFromBox(box: Box, canvas: Size): Focal {
  const ox = box.w - canvas.w, oy = box.h - canvas.h;
  return {x: ox > 0.0001 ? clamp(-box.x / ox, 0, 1) : 0.5, y: oy > 0.0001 ? clamp(-box.y / oy, 0, 1) : 0.5};
}
