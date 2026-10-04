import {useState} from "react";
import type {Studio} from "../useStudio";
import {HistoryGallery} from "./HistoryGallery";
import {Icon, icons} from "./Icon";
import {RatingBadge} from "./RatingBadge";

export function HistoryStrip({studio}: {studio: Studio}) {
  const {history} = studio.state, [open, setOpen] = useState(false);
  if (!history.length) return null;
  return <div className="history">
    <span className="history-label">אחרונות</span>
    {history.slice(0, 8).map(image => <button key={image.key} type="button" className="thumb" onClick={() => studio.openRecent(image)}
      aria-label={`פתיחת תמונה מ־${new Date(image.createdAt).toLocaleString("he-IL")}`}>
      <img src={image.url} alt=""/><RatingBadge rating={image.rating}/>
    </button>)}
    <button type="button" className="pill small" onClick={() => setOpen(true)}><Icon d={icons.grid} size={18}/>הכל ({history.length})</button>
    {open && <HistoryGallery studio={studio} onClose={() => setOpen(false)}/>}
  </div>;
}
