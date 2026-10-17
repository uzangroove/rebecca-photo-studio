import {defaultSelection, parseSelection, type Selection} from "../shared/selection.ts";
import type {Rating, SavedImage} from "./studio-storage.ts";

// היסטוריה משותפת לכל המכשירים: כל תמונה נשמרת גם בענן (טבלה studio_images + אחסון פרטי studio-history).
// כאן רק פונקציות טהורות (בלי רשת), כדי שאפשר יהיה לבדוק אותן.

/** תמונה כפי שהיא שמורה בענן. */
export type CloudImage = {key: string; createdAt: number; selection: Selection; formatId: string; rating: Rating; sent: boolean; path: string; thumbPath: string | null};

/** שורה מהטבלה studio_images → CloudImage. שורה לא תקינה מחזירה null. */
export function parseCloudRow(row: unknown): CloudImage | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.local_key !== "string" || !r.local_key.startsWith("image:") || typeof r.storage_path !== "string" || !r.storage_path) return null;
  const t = Date.parse(String(r.created_at));
  return {
    key: r.local_key, createdAt: Number.isFinite(t) ? t : 0,
    selection: parseSelection(r.selection) ?? defaultSelection,
    formatId: typeof r.format_id === "string" && r.format_id ? r.format_id : "instagram-square",
    rating: r.rating === "up" || r.rating === "down" ? r.rating : null,
    sent: r.sent_to_site === true, path: r.storage_path,
    thumbPath: typeof r.thumb_path === "string" && r.thumb_path ? r.thumb_path : null
  };
}

/** תמונה בהיסטוריה המאוחדת: יכולה להיות במכשיר, בענן או בשניהם. */
export type MergedImage = {key: string; createdAt: number; selection: Selection; formatId: string; rating: Rating; sent: boolean; local?: SavedImage; cloud?: CloudImage};

/**
 * מאחד את מה שבמכשיר עם מה שבענן, בלי כפילויות, מהחדשה לישנה.
 * דירוג וסימון "נשלחה" מגיעים מהענן כשהתמונה שם (כך הם זהים בכל המכשירים); "נשלחה" נשמר גם אם סומן רק במכשיר.
 */
export function mergeHistory(local: SavedImage[], cloud: CloudImage[], localSent: Set<string> = new Set()): MergedImage[] {
  const byKey = new Map<string, MergedImage>();
  for (const c of cloud) byKey.set(c.key, {key: c.key, createdAt: c.createdAt, selection: c.selection, formatId: c.formatId, rating: c.rating, sent: c.sent, cloud: c});
  for (const l of local) {
    const m = byKey.get(l.key);
    if (m) { m.local = l; m.createdAt = l.createdAt || m.createdAt; }
    else byKey.set(l.key, {key: l.key, createdAt: l.createdAt, selection: l.selection, formatId: l.formatId, rating: l.rating, sent: false, local: l});
  }
  for (const m of byKey.values()) if (localSent.has(m.key)) m.sent = true;
  return [...byKey.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** תמונות שנמצאות רק במכשיר וצריך להעלות לענן (מהישנה לחדשה, כדי שהסדר יישמר). */
export function needsUpload(local: SavedImage[], cloudKeys: Set<string>): SavedImage[] {
  return local.filter(l => !cloudKeys.has(l.key)).sort((a, b) => a.createdAt - b.createdAt);
}

/** נתיב קובץ בענן לתמונה: חודש/מזהה.jpg, והתמונה המוקטנת עם ‎-t. */
export function cloudPaths(createdAt: number, id: string): {path: string; thumbPath: string} {
  const month = new Date(createdAt).toISOString().slice(0, 7);
  return {path: `${month}/${id}.jpg`, thumbPath: `${month}/${id}-t.jpg`};
}
