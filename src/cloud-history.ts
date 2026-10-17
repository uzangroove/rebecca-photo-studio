import {supabase, toJpeg} from "./site";
import {cloudPaths, parseCloudRow, type CloudImage} from "./history-merge";
import type {Rating, SavedImage} from "./studio-storage";

// ארכיון ההיסטוריה בענן: כל תמונה שנוצרת נשמרת גם כאן, וכך רואים אותה מכל מכשיר.
// הארכיון פרטי (רק למנהלת) ונפרד מהאתר: שום תמונה ממנו לא מופיעה באתר או ב"תמונות חדשות" עד שרבקה שולחת אותה.
const BUCKET = "studio-history";
const TABLE = "studio_images";
export const CLOUD_LIMIT = 500;

export async function listCloud(limit = CLOUD_LIMIT): Promise<CloudImage[]> {
  const {data, error} = await supabase.from(TABLE).select("local_key,created_at,storage_path,thumb_path,selection,format_id,rating,sent_to_site").order("created_at", {ascending: false}).limit(limit);
  if (error) throw new Error("לא הצלחנו לקרוא את הארכיון בענן");
  return (data ?? []).map(parseCloudRow).filter((x): x is CloudImage => x !== null);
}

/** כתובות זמניות (24 שעות) לתמונות הפרטיות. */
export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const {data} = await supabase.storage.from(BUCKET).createSignedUrls(chunk, 60 * 60 * 24);
    (data ?? []).forEach(d => { if (d.path && d.signedUrl) out.set(d.path, d.signedUrl); });
  }
  return out;
}

/** מעלה תמונה מההיסטוריה של המכשיר לענן (גודל מלא עד 2048 פיקסלים + תמונה מוקטנת לגלריה). */
export async function uploadToCloud(image: SavedImage): Promise<CloudImage> {
  const {path, thumbPath} = cloudPaths(image.createdAt, crypto.randomUUID());
  const [full, thumb] = await Promise.all([toJpeg(image.blob, 2048, 0.9), toJpeg(image.blob, 480, 0.8)]);
  const up1 = await supabase.storage.from(BUCKET).upload(path, full, {contentType: "image/jpeg", upsert: false});
  if (up1.error) throw new Error("העלאת התמונה לענן נכשלה");
  const up2 = await supabase.storage.from(BUCKET).upload(thumbPath, thumb, {contentType: "image/jpeg", upsert: false});
  const row = {local_key: image.key, created_at: new Date(image.createdAt).toISOString(), storage_path: path, thumb_path: up2.error ? null : thumbPath,
    selection: image.selection, format_id: image.formatId, rating: image.rating, bytes: full.size};
  const {error} = await supabase.from(TABLE).upsert(row, {onConflict: "local_key", ignoreDuplicates: true});
  if (error) { await supabase.storage.from(BUCKET).remove(up2.error ? [path] : [path, thumbPath]); throw new Error("שמירת התמונה בארכיון נכשלה"); }
  return {key: image.key, createdAt: image.createdAt, selection: image.selection, formatId: image.formatId, rating: image.rating, sent: false, path, thumbPath: up2.error ? null : thumbPath};
}

export async function rateCloud(key: string, rating: Rating): Promise<void> {
  const {error} = await supabase.from(TABLE).update({rating, updated_at: new Date().toISOString()}).eq("local_key", key);
  if (error) throw new Error("הדירוג לא נשמר בענן");
}

export async function markSentCloud(keys: string[]): Promise<void> {
  if (!keys.length) return;
  await supabase.from(TABLE).update({sent_to_site: true, updated_at: new Date().toISOString()}).in("local_key", keys);
}
