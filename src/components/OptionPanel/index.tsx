import type {Studio} from "../../useStudio";
import {BrandPanel} from "./BrandPanel";
import {FormatPanel} from "./FormatPanel";
import {PalettePanel} from "./PalettePanel";
import {ProductPanel} from "./ProductPanel";
import {StylePanel} from "./StylePanel";

const panels = {style: StylePanel, palette: PalettePanel, product: ProductPanel, brand: BrandPanel, format: FormatPanel};

export function OptionPanel({studio}: {studio: Studio}) {
  const Panel = panels[studio.state.tab];
  return <aside className="option-panel" aria-label="אפשרויות"><Panel studio={studio}/></aside>;
}
