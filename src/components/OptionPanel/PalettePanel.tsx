import {useState} from "react";
import {favoritesFirst, findItem, palettes, type PaletteItem} from "../../../shared/catalog";
import {customToken, paletteColors, paletteLabel, type CustomPalette} from "../../../shared/palette-custom";
import type {Studio} from "../../useStudio";
import {Icon, icons} from "../Icon";
import {Tile} from "../Tile";
import {AllPalettes} from "../palettes/AllPalettes";
import {PaletteEditor} from "../palettes/PaletteEditor";

const Bar = ({colors}: {colors: readonly string[]}) => <span className="bar">{colors.map((c, i) => <i key={i} style={{background: c}}/>)}</span>;
export const Dots = ({colors}: {colors: readonly string[]}) => <span className="dots">{colors.map((c, i) => <i key={i} style={{background: c}}/>)}</span>;

// לשונית הצבעים: המועדפות של רבקה, הפלטות שלה, "פלטה חדשה", "צבעים מהמוצר", ו"כל הפלטות" בחלון נפרד.
export function PalettePanel({studio}: {studio: Studio}) {
  const {selection, customPalettes} = studio.state, pick = (value: string) => studio.select("palette", value);
  const [dialog, setDialog] = useState<null | "all" | "new" | "product">(null);
  const favorites = favoritesFirst(palettes).filter(p => p.favorite);
  const visible = new Set<string>([...favorites.map(p => p.id), ...customPalettes.map(c => customToken(c.colors))]);
  // פלטה שנבחרה מ"כל הפלטות" (או ממתכון) ואינה ברשימה שבלשונית — מוצגת כדי שיהיה ברור מה נבחר.
  const current = visible.has(selection.palette) ? null : selection.palette;
  const currentColors = current ? paletteColors(current) : null;
  const big = (p: PaletteItem) => <button key={p.id} type="button" className={`tile tile-big${selection.palette === p.id ? " is-selected" : ""}`} aria-pressed={selection.palette === p.id} onClick={() => pick(p.id)}>
    <span className="big-top"><Icon d={p.icon} fill={p.iconFill} size={30} strokeWidth={1.5}/><strong>{p.label}</strong></span><Bar colors={p.colors}/>
  </button>;
  const own = (c: CustomPalette) => {
    const token = customToken(c.colors);
    return <Tile key={c.id} selected={selection.palette === token} onClick={() => pick(token)} visual={<Dots colors={c.colors}/>} label={c.label || "בלי שם"}/>;
  };
  return <div className="panel-body">
    <div><h2>פלטת צבעים</h2><p className="panel-sub">הצבעים חלים על הסביבה בלבד, לא על המוצר.</p></div>
    <span className="group-title gold">המועדפות של רבקה</span>
    <div className="grid grid-2">{favorites.map(big)}</div>
    <span className="group-title">הפלטות שלי</span>
    {customPalettes.length > 0 && <div className="grid grid-3 own-palettes">{customPalettes.map(own)}</div>}
    <div className="grid grid-2 palette-actions">
      <button type="button" className="tile dashed-tile" onClick={() => setDialog("new")}><Icon d={icons.plus} size={20}/><strong>פלטה חדשה</strong></button>
      <button type="button" className="tile dashed-tile" onClick={() => setDialog("product")} disabled={!studio.state.photo} title={studio.state.photo ? undefined : "קודם מעלים צילום של המוצר"}>
        <Icon d={icons.camera} size={20}/><strong>צבעים מהמוצר</strong></button>
    </div>
    {current && currentColors && <>
      <span className="group-title muted">הנבחרת עכשיו</span>
      <div className="grid grid-3"><Tile selected onClick={() => {}} visual={findItem("palettes", current) ? <Icon d={findItem("palettes", current)!.icon} fill={findItem("palettes", current)!.iconFill} size={22}/> : <Dots colors={currentColors}/>}
        label={paletteLabel(current, customPalettes)} extra={<Dots colors={currentColors}/>}/></div>
    </>}
    <button type="button" className="all-palettes-btn" onClick={() => setDialog("all")}><Icon d={icons.grid} size={20}/>כל הפלטות ({palettes.length - favorites.length + customPalettes.length})</button>
    {dialog === "all" && <AllPalettes studio={studio} onClose={() => setDialog(null)} onNew={() => setDialog("new")}/>}
    {(dialog === "new" || dialog === "product") && <PaletteEditor studio={studio} fromProduct={dialog === "product"} onClose={() => setDialog(null)}/>}
  </div>;
}
