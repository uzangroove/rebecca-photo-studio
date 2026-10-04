import {useEffect, useRef} from "react";
import {findItem} from "../../shared/catalog";
import {formatById} from "../social-formats";
import type {Studio} from "../useStudio";
import {Icon, icons} from "./Icon";
import {RatingBadge} from "./RatingBadge";

// כל ההיסטוריה (עד 30 תמונות). לחיצה על תמונה מחזירה אותה למסך עם ההגדרות שיצרו אותה.
export function HistoryGallery({studio, onClose}: {studio: Studio; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {ref.current?.showModal();}, []);
  return <dialog ref={ref} className="gallery" aria-label="ההיסטוריה" onClose={onClose} onClick={e => {if (e.target === ref.current) ref.current?.close();}}>
    <div className="gallery-head">
      <h2>ההיסטוריה שלי <small>{studio.state.history.length} תמונות, נשמרות בדפדפן הזה</small></h2>
      <button type="button" className="icon-btn" aria-label="סגירה" onClick={() => ref.current?.close()}><Icon d={icons.close} size={20}/></button>
    </div>
    <div className="gallery-grid">
      {studio.state.history.map(image => <button key={image.key} type="button" className="card" onClick={() => {studio.openRecent(image); ref.current?.close();}}>
        <span className="card-img"><img src={image.url} alt=""/><RatingBadge rating={image.rating}/></span>
        <strong>{findItem("styles", image.selection.style)?.label} · {findItem("palettes", image.selection.palette)?.label}</strong>
        <small>{formatById(image.formatId).group} {formatById(image.formatId).name} · {new Date(image.createdAt).toLocaleDateString("he-IL")}</small>
      </button>)}
    </div>
  </dialog>;
}
