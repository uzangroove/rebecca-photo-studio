import type {BrandLayout, LayerId} from "../../../shared/brand-layout";
import {Icon} from "../Icon";
import {layerLabel} from "./AlignBar";

const eye = "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z M12 14.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z";
const eyeOff = "M3 3l18 18 M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7 M6.4 7.9C3.6 9.6 2 12 2 12s4 6 10 6c1.4 0 2.6-.3 3.8-.8";

export function LayerList({layout, selected, logoSource, sloganSource, onSelect, onVisible}:
  {layout: BrandLayout; selected: LayerId | null; logoSource: string; sloganSource: string; onSelect: (id: LayerId) => void; onVisible: (id: LayerId, visible: boolean) => void}) {
  return <div className="layer-list" role="list">
    <span className="group-title">שכבות</span>
    {(["logo", "slogan", "text"] as const).map(id => {
      const layer = layout[id], on = selected === id;
      return <div key={id} role="listitem" className={`layer-row${on ? " is-selected" : ""}${layer.visible ? "" : " is-hidden"}`}>
        <button type="button" className="layer-main" aria-pressed={on} onClick={() => onSelect(id)}>
          {id === "text" ? <span className="layer-sample">אבג</span> : layout[id].asText ? <span className="layer-sample">Aa</span> : <img src={id === "logo" ? logoSource : sloganSource} alt=""/>}
          <strong>{id === "text" ? "טקסט" : id === "logo" ? "לוגו" : "סלוגן"}</strong>
          <small>{!layer.visible ? "מוסתר" : on ? "נבחר" : ""}</small>
        </button>
        <button type="button" className="layer-eye" aria-label={layer.visible ? `הסתרת ${layerLabel[id]}` : `הצגת ${layerLabel[id]}`} aria-pressed={layer.visible} onClick={() => onVisible(id, !layer.visible)}>
          <Icon d={layer.visible ? eye : eyeOff} size={20}/>
        </button>
      </div>;
    })}
  </div>;
}
