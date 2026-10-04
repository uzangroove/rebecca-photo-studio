import type {AlignAction} from "../../../shared/brand-geometry";
import type {LayerId} from "../../../shared/brand-layout";
import {Icon} from "../Icon";

export type AlignRef = "image" | "layer" | "product";
export const layerLabel: Record<LayerId, string> = {logo: "הלוגו", slogan: "הסלוגן", text: "הטקסט"};

const actions: readonly {id: AlignAction; label: string; icon: string}[] = [
  {id: "right", label: "יישור לימין", icon: "M20 4v16 M17 7H7v4h10z M17 13h-6v4h6z"},
  {id: "hcenter", label: "מרכוז אופקי", icon: "M12 3v18 M7 7h10v4H7z M9 13h6v4H9z"},
  {id: "left", label: "יישור לשמאל", icon: "M4 4v16 M7 7h10v4H7z M7 13h6v4H7z"},
  {id: "top", label: "יישור למעלה", icon: "M4 4h16 M7 7v10h4V7z M13 7v6h4V7z"},
  {id: "vcenter", label: "מרכוז אנכי", icon: "M3 12h18 M7 7h4v10H7z M13 9h4v6h-4z"},
  {id: "bottom", label: "יישור למטה", icon: "M4 20h16 M7 17V7h4v10z M13 17v-6h4v6z"}
];

type Props = {
  canEdit: boolean; canDistribute: boolean; relativeTo: AlignRef; refLayer: LayerId | null; otherLayers: LayerId[];
  cropMode: boolean; showProduct: boolean;
  onAlign: (a: AlignAction) => void; onDistribute: (axis: "x" | "y") => void; onRef: (r: AlignRef) => void; onRefLayer: (id: LayerId) => void;
  onCrop: () => void; onProduct: () => void;
};

// סרגל יישור: שש פעולות, פיזור, ו"ביחס ל": כל התמונה, שכבה אחרת או אזור המוצר.
export function AlignBar(p: Props) {
  const tool = (key: string, label: string, icon: string, onClick: () => void, disabled: boolean, pressed?: boolean) =>
    <button key={key} type="button" className="tool-btn" aria-label={label} title={label} disabled={disabled} aria-pressed={pressed} onClick={onClick}><Icon d={icon} size={22}/></button>;
  const refDisabled = p.relativeTo === "layer" && !p.refLayer;
  return <div className="align-bar" role="toolbar" aria-label="יישור">
    {actions.slice(0, 3).map(a => tool(a.id, a.label, a.icon, () => p.onAlign(a.id), !p.canEdit || refDisabled))}
    <span className="bar-sep"/>
    {actions.slice(3).map(a => tool(a.id, a.label, a.icon, () => p.onAlign(a.id), !p.canEdit || refDisabled))}
    <span className="bar-sep"/>
    {tool("dx", "פיזור שווה לרוחב", "M4 4v16 M20 4v16 M9 8v8h6V8z", () => p.onDistribute("x"), !p.canDistribute)}
    {tool("dy", "פיזור שווה לגובה", "M4 4h16 M4 20h16 M8 9h8v6H8z", () => p.onDistribute("y"), !p.canDistribute)}
    <span className="bar-sep"/>
    <span className="bar-label">ביחס ל</span>
    <div className="seg" role="group" aria-label="ביחס ל">
      <button type="button" aria-pressed={p.relativeTo === "image"} onClick={() => p.onRef("image")}>כל התמונה</button>
      <button type="button" aria-pressed={p.relativeTo === "layer"} disabled={!p.otherLayers.length} onClick={() => p.onRef("layer")}>שכבה אחרת</button>
      <button type="button" aria-pressed={p.relativeTo === "product"} onClick={() => p.onRef("product")}>אזור המוצר</button>
    </div>
    {p.relativeTo === "layer" && p.otherLayers.length > 0 &&
      <select aria-label="שכבת הייחוס" value={p.refLayer ?? ""} onChange={e => p.onRefLayer(e.target.value as LayerId)}>
        {p.otherLayers.map(id => <option key={id} value={id}>{layerLabel[id]}</option>)}
      </select>}
    <span className="bar-sep"/>
    <button type="button" className="chip-toggle" aria-pressed={p.cropMode} onClick={p.onCrop}>חיתוך ידני</button>
    <button type="button" className="chip-toggle" aria-pressed={p.showProduct} onClick={p.onProduct}>אזור המוצר</button>
  </div>;
}
