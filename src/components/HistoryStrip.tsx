import type {SavedImage} from "../studio-storage";
import type {HistoryItem} from "../state";

export function HistoryStrip({items, onOpen}: {items: HistoryItem[]; onOpen: (image: SavedImage) => void}) {
  if (!items.length) return null;
  return <div className="history">
    <span className="history-label">אחרונות <small>נשמרות בדפדפן הזה</small></span>
    {items.map(image => <button key={image.key} type="button" className="thumb" onClick={() => onOpen(image)}
      aria-label={`פתיחת תמונה מ־${new Date(image.createdAt).toLocaleString("he-IL")}`}>
      <img src={image.url} alt=""/>
    </button>)}
  </div>;
}
