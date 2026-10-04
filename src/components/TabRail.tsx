import type {TabId} from "../state";
import {Icon} from "./Icon";

export const tabs: readonly {id: TabId; label: string; icon: string}[] = [
  {id: "style", label: "סגנון", icon: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"},
  {id: "details", label: "פרטים", icon: "M4 6h9 M17 6h3 M15 4v4 M4 12h3 M11 12h9 M9 10v4 M4 18h11 M19 18h1 M17 16v4"},
  {id: "palette", label: "צבעים", icon: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z M7.5 12h.01 M9.5 7.5h.01 M14.5 7.5h.01"},
  {id: "product", label: "מוצר", icon: "M7 9h10v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z M7 13h10 M12 9V7 M12 7c.8-.8 1-1.8 0-3-1 1.2-.8 2.2 0 3z"},
  {id: "brand", label: "מיתוג", icon: "M3 12V4h8l10 10-8 8z M7.5 8.5h.01"},
  {id: "format", label: "פורמט", icon: "M6 2v16h16 M2 6h16v16"}
];

export function TabRail({tab, onTab}: {tab: TabId; onTab: (tab: TabId) => void}) {
  return <nav className="tab-rail" aria-label="נושאים">
    {tabs.map(t => <button key={t.id} type="button" className={`rail-btn${t.id === tab ? " is-active" : ""}`} aria-pressed={t.id === tab} onClick={() => onTab(t.id)}>
      <Icon d={t.icon} size={26}/><span>{t.label}</span>
    </button>)}
  </nav>;
}
