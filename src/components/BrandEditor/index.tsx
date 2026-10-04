import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {alignBox, centerFromBox, clamp, distribute, nudgeCenter, productAreaBox, type AlignAction, type Box} from "../../../shared/brand-geometry";
import {layerIds, type BrandLayout, type LayerId} from "../../../shared/brand-layout";
import {formatById} from "../../../shared/social-formats";
import {aspectOf} from "../../brand/assets";
import {BrandScene, layerBoxes, type EditProps, type LayerPatch, type SceneAssets} from "../../brand/BrandScene";
import {loadSceneAssets} from "../../brand/export";
import type {Studio} from "../../useStudio";
import {Icon} from "../Icon";
import {AlignBar, layerLabel, type AlignRef} from "./AlignBar";
import {FormatStrip} from "./FormatStrip";
import {LayerList} from "./LayerList";
import {Properties} from "./Properties";

// עורך המיתוג: מסך מלא. השינויים חלים מיד ונשמרים (גם בין מכשירים), ו"שמירת הפריסה" פשוט חוזרת לסטודיו.
export function BrandEditor({studio}: {studio: Studio}) {
  const {state, dispatch, layout, setLayout, autoTextColor, focal} = studio;
  const format = formatById(state.formatId), canvas = useMemo(() => ({w: format.width, h: format.height}), [format.width, format.height]);
  const [selected, setSelected] = useState<LayerId | null>(() => layerIds.find(id => layout[id].visible) ?? "logo");
  const [cropMode, setCropMode] = useState(false), [showProduct, setShowProduct] = useState(true), [step, setStep] = useState<1 | 10>(1);
  const [relativeTo, setRelativeTo] = useState<AlignRef>("image"), [refLayer, setRefLayer] = useState<LayerId | null>(null);
  const [assets, setAssets] = useState<SceneAssets>({backdrop: null, logo: null, slogan: null});
  const [scale, setScale] = useState(0.3);
  const area = useRef<HTMLDivElement>(null);
  const backdrop = state.result ?? state.photo?.url ?? null;

  // כל השכבות נטענות גם כשהן מוסתרות, כדי שהצגה שלהן תהיה מיידית.
  useEffect(() => {
    let cancelled = false;
    const all: BrandLayout = {...layout, logo: {...layout.logo, visible: true}, slogan: {...layout.slogan, visible: true}};
    loadSceneAssets({backdrop, logo: state.brand.logoSource, slogan: state.brand.sloganSource}, all).then(a => { if (!cancelled) setAssets(a); }).catch(() => {});
    return () => { cancelled = true; };
  }, [backdrop, state.brand.logoSource, state.brand.sloganSource, layout.text.font, layout.text.visible, layout.text.text]);

  // הקנבס ממלא את השטח הפנוי, בלי לעבור את גודל הפורמט.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const fit = () => setScale(clamp(Math.min((el.clientWidth - 8) / canvas.w, (el.clientHeight - 8) / canvas.h), 0.05, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.w, canvas.h]);

  const boxes = layerBoxes(layout, assets, canvas);
  const visibleIds = layerIds.filter(id => boxes[id]);
  const sel = selected && boxes[selected] ? selected : null;
  const others = visibleIds.filter(id => id !== sel);
  const effectiveRefLayer = refLayer && others.includes(refLayer) ? refLayer : others[0] ?? null;

  const patch = (id: LayerId, p: LayerPatch) => setLayout({...layout, [id]: {...layout[id], ...p}} as BrandLayout);
  const moveTo = (id: LayerId, box: Box) => { const c = centerFromBox(box, canvas); patch(id, {cx: clamp(c.cx, 0, 100), cy: clamp(c.cy, 0, 100)}); };

  function align(action: AlignAction) {
    if (!sel || !boxes[sel]) return;
    const ref = relativeTo === "image" ? {x: 0, y: 0, w: canvas.w, h: canvas.h} : relativeTo === "product" ? productAreaBox(canvas) : effectiveRefLayer ? boxes[effectiveRefLayer] : null;
    if (ref) moveTo(sel, alignBox(boxes[sel]!, ref, action));
  }
  function spread(axis: "x" | "y") {
    const list = visibleIds.map(id => boxes[id]!);
    const next = distribute(list, axis);
    const updated = {...layout} as BrandLayout;
    visibleIds.forEach((id, i) => {
      const c = centerFromBox(next[i], canvas);
      updated[id] = {...updated[id], cx: clamp(c.cx, 0, 100), cy: clamp(c.cy, 0, 100)} as never;
    });
    setLayout(updated);
  }
  function nudge(dx: number, dy: number) {
    if (!sel) return;
    const n = nudgeCenter(layout[sel].cx, layout[sel].cy, dx, dy, canvas);
    patch(sel, n);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("input, select, textarea")) return;
    const d = e.shiftKey ? 10 : 1;
    const move: Record<string, [number, number]> = {ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d]};
    if (move[e.key] && sel) { e.preventDefault(); nudge(...move[e.key]); }
    else if (e.key === "Escape") setSelected(null);
  }

  const edit: EditProps = {
    scale, selected: sel, cropMode, showProductArea: showProduct, coarse: typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches,
    onSelect: setSelected, onLayer: patch, onFocal: f => dispatch({type: "crop", formatId: state.formatId, focal: f})
  };
  const aspectFor = (id: LayerId) => id === "text" ? 1 : (assets[id] ? aspectOf(assets[id]!) : 0.25);

  return <div className="editor">
    <header className="editor-header">
      <button type="button" className="pill small" onClick={() => dispatch({type: "screen", screen: "studio"})}><Icon d="M9 6l6 6-6 6" size={18} strokeWidth={1.8}/>חזרה לסטודיו</button>
      <h1>עורך המיתוג</h1>
      <span className="editor-format">פורמט: {format.group} · {format.name} <span dir="ltr">{format.width}×{format.height}</span></span>
      <button type="button" className="save-layout" onClick={() => {dispatch({type: "screen", screen: "studio"}); dispatch({type: "say", text: "הפריסה נשמרה"});}}>שמירת הפריסה</button>
    </header>
    <div className="editor-body">
      <aside className="editor-side" aria-label="שכבות ומאפיינים">
        <LayerList layout={layout} selected={sel ?? selected} logoSource={state.brand.logoSource} sloganSource={state.brand.sloganSource}
          onSelect={setSelected} onVisible={(id, visible) => {
            patch(id, id === "text" && visible && !layout.text.text.trim() ? {visible, text: "הטקסט שלי"} : {visible});
            if (visible) setSelected(id);
          }}/>
        {selected && layout[selected].visible
          ? <Properties id={selected} layout={layout} box={boxes[selected]} canvas={canvas} aspect={aspectFor(selected)} palette={state.selection.palette} autoTextColor={autoTextColor}
            step={step} onStep={() => setStep(s => s === 1 ? 10 : 1)} onPatch={p => patch(selected, p)} onNudge={nudge}/>
          : <p className="panel-sub">{selected ? `${layerLabel[selected]} מוסתר. הציגו אותו כדי לערוך.` : "בחרו שכבה ברשימה או על התמונה."}</p>}
      </aside>
      <main className="editor-main">
        <AlignBar canEdit={!!sel} canDistribute={visibleIds.length >= 3} relativeTo={relativeTo} refLayer={effectiveRefLayer} otherLayers={others}
          cropMode={cropMode} showProduct={showProduct} onAlign={align} onDistribute={spread} onRef={setRelativeTo} onRefLayer={setRefLayer}
          onCrop={() => setCropMode(v => !v)} onProduct={() => setShowProduct(v => !v)}/>
        <div className="editor-canvas" ref={area} tabIndex={0} onKeyDown={onKeyDown} aria-label="אזור העריכה. מקשי חצים מזיזים את השכבה שנבחרה">
          <div className="canvas-frame" style={{width: canvas.w * scale, height: canvas.h * scale}}>
            <BrandScene canvas={canvas} assets={assets} focal={focal} layout={layout} autoTextColor={autoTextColor} edit={edit}/>
          </div>
        </div>
        {!backdrop && <p className="panel-sub">אין עדיין תמונה. העלו צילום או צרו תמונה בסטודיו כדי לראות את המיתוג עליה.</p>}
        {cropMode && <p className="panel-sub">מצב חיתוך: גררו את התמונה בתוך המסגרת. לחצו שוב על "חיתוך ידני" כדי לערוך שכבות.</p>}
        <FormatStrip formatId={state.formatId} layouts={state.layouts} onPick={id => dispatch({type: "format", id})}
          onApplyAll={() => {if (window.confirm("להחיל את הפריסה הזו על כל 16 הפורמטים? פריסות שנשמרו להם יוחלפו.")) dispatch({type: "layoutAll"});}}
          onReset={() => dispatch({type: "layoutReset"})}/>
      </main>
    </div>
  </div>;
}
