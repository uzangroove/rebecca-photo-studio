import {useEffect, useRef, useState, type KeyboardEvent, type PointerEvent} from "react";
import {extractPalette, hexToHsl, hslToHex, MAX_PALETTE_NAME, newPaletteId, normHex, paletteColors, presetColors, type Colors} from "../../../shared/palette-custom";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";

const SLOTS = ["כהה", "ביניים", "בהיר"] as const;

// שלושת הצבעים הבולטים בצילום המוצר. התמונה מוקטנת ל-96 פיקסלים, וזה מספיק כדי למצוא את הצבעים.
async function productColors(url: string): Promise<Colors> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  const k = 96 / Math.max(img.naturalWidth, img.naturalHeight);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * k)); canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = canvas.getContext("2d", {willReadFrequently: true})!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return extractPalette(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
}

// "פלטה חדשה": שלוש משבצות, גלגל גוונים ופס בהירות, גוונים מוכנים, קוד צבע ו"צבעים מהמוצר".
export function PaletteEditor({studio, fromProduct, onClose}: {studio: Studio; fromProduct: boolean; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null), ring = useRef<HTMLDivElement>(null);
  const start = paletteColors(studio.state.selection.palette) ?? ["#8E5B4A", "#D9B8A3", "#F7EFE8"];
  const [colors, setColors] = useState<string[]>([...start]);
  const [slot, setSlot] = useState(0);
  const [name, setName] = useState("");
  const [hexText, setHexText] = useState(start[0]);
  const [note, setNote] = useState("");
  const photo = studio.state.photo;
  useEffect(() => {ref.current?.showModal();}, []);
  useEffect(() => { if (fromProduct) fromPhoto(); }, []);
  useEffect(() => { setHexText(colors[slot]); }, [slot, colors]);

  const hsl = hexToHsl(colors[slot]);
  const setColor = (hex: string) => setColors(cs => cs.map((c, i) => i === slot ? hex : c));
  // בגלגל ובפס הבהירות שומרים על הרוויה של הצבע הנוכחי. צבע אפור לגמרי מקבל רוויה בינונית כדי שהגוון ייראה.
  const setHue = (h: number) => setColor(hslToHex({h, s: hsl.s < 8 ? 45 : hsl.s, l: hsl.l < 6 || hsl.l > 94 ? 50 : hsl.l}));
  const setLight = (l: number) => setColor(hslToHex({...hsl, l}));

  async function fromPhoto() {
    if (!photo) { setNote("קודם מעלים צילום של המוצר"); return; }
    try {
      const c = await productColors(photo.url);
      setColors([...c]); setSlot(0); setNote("אלה הצבעים הבולטים בצילום. אפשר לתקן כל אחד.");
    } catch { setNote("לא הצלחנו לקרוא את הצבעים מהצילום"); }
  }
  function ringPointer(e: PointerEvent<HTMLDivElement>) {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = ring.current!.getBoundingClientRect();
    const angle = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    setHue(Math.round((angle + 360) % 360));
  }
  function ringKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 15 : 3;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setHue((hsl.h + step) % 360); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setHue((hsl.h - step + 360) % 360); }
  }
  function save() {
    const label = name.trim().slice(0, MAX_PALETTE_NAME);
    studio.dispatch({type: "paletteSave", palette: {id: newPaletteId(), label, colors: [colors[0], colors[1], colors[2]]}});
    ref.current?.close();
  }
  const knob = {transform: `rotate(${hsl.h}deg)`};
  return <dialog ref={ref} className="gallery palette-editor" aria-label="פלטה חדשה" onClose={onClose} onClick={e => {if (e.target === ref.current) ref.current?.close();}}>
    <div className="gallery-head">
      <h2>פלטה חדשה</h2>
      <button type="button" className="icon-btn" aria-label="סגירה" onClick={() => ref.current?.close()}><Icon d={icons.close}/></button>
    </div>
    <div className="pe-body">
      <div className="pe-col">
        <span className="group-title">שלושת הצבעים — לוחצים על משבצת ובוחרים לה צבע</span>
        <div className="pe-slots">
          {SLOTS.map((label, i) => <button key={label} type="button" className={`pe-slot${slot === i ? " is-active" : ""}`} aria-pressed={slot === i} onClick={() => setSlot(i)}>
            <span className="pe-chip" style={{background: colors[i]}}/><strong>{label}</strong><span dir="ltr" className="pe-hex">{colors[i]}</span></button>)}
        </div>
        <button type="button" className="pe-product" onClick={fromPhoto} disabled={!photo}>
          {photo ? <img src={photo.url} alt=""/> : <span className="pe-noimg">אין צילום</span>}
          <span><strong>צבעים מהמוצר</strong><small>{photo ? "שלושת הצבעים הבולטים בצילום שהעליתם" : "קודם מעלים צילום של המוצר"}</small></span>
        </button>
        {note && <p className="pe-note" role="status">{note}</p>}
        <label className="field">שם לפלטה (רשות)
          <input type="text" value={name} maxLength={MAX_PALETTE_NAME} placeholder="למשל: ורד עתיק" onChange={e => setName(e.target.value)}/>
        </label>
        <div className="pe-preview" aria-label="ככה זה ייראה בסצנה">
          <div style={{background: colors[2]}}/>
          <div style={{background: colors[1]}}><span>המוצר</span></div>
          <i style={{background: colors[0]}}/>
        </div>
      </div>
      <div className="pe-col">
        <span className="group-title">בוחר צבע — למשבצת "{SLOTS[slot]}"</span>
        <div className="pe-picker">
          <div ref={ring} className="pe-ring" role="slider" tabIndex={0} aria-label="גוון" aria-valuemin={0} aria-valuemax={359} aria-valuenow={hsl.h}
            onPointerDown={ringPointer} onPointerMove={ringPointer} onKeyDown={ringKey}>
            <div className="pe-ring-hole"><span style={{background: colors[slot]}}/></div>
            <div className="pe-knob-arm" style={knob}><span style={{background: hslToHex({h: hsl.h, s: 70, l: 50})}}/></div>
          </div>
          <div className="pe-controls">
            <label className="field">בהירות
              <input type="range" min={4} max={97} value={hsl.l} onChange={e => setLight(Number(e.target.value))} className="pe-light"
                style={{background: `linear-gradient(to left, ${hslToHex({...hsl, l: 6})}, ${hslToHex({...hsl, l: 50})}, ${hslToHex({...hsl, l: 96})})`}}/>
            </label>
            <label className="field pe-hexfield">קוד צבע
              <input type="text" dir="ltr" value={hexText} maxLength={7} onChange={e => { setHexText(e.target.value); const v = normHex(e.target.value); if (v) setColor(v); }}/>
            </label>
          </div>
        </div>
        <span className="group-title">גוונים מוכנים לצילום מוצר</span>
        <div className="pe-presets">
          {presetColors.map(c => <button key={c} type="button" className={`pe-sw${colors[slot] === c ? " is-on" : ""}`} aria-label={c} aria-pressed={colors[slot] === c} style={{background: c}} onClick={() => setColor(c)}/>)}
        </div>
      </div>
    </div>
    <div className="pe-actions">
      <button type="button" className="cta" onClick={save}>שמירה לפלטות שלי</button>
      <button type="button" className="pill" onClick={() => ref.current?.close()}>ביטול</button>
    </div>
  </dialog>;
}
