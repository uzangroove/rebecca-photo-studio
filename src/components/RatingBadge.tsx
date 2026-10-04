import type {Rating} from "../studio-storage";
import {Icon, icons} from "./Icon";

export function RatingBadge({rating}: {rating: Rating}) {
  if (!rating) return null;
  return <span className={`badge badge-${rating}`} role="img" aria-label={rating === "up" ? "דורגה כטובה" : "דורגה כלא טובה"}><Icon d={icons.thumb} size={14} strokeWidth={1.8} flip={rating === "down"}/></span>;
}
