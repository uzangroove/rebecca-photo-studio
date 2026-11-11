import {supabase, toJpeg} from "./site";
import {toRow, type StudioEvent} from "../shared/events";

// תיעוד פעולות בענן. כל כשל שקט: התיעוד לעולם לא מפריע לרבקה לעבוד.
const BUCKET = "studio-history";

/** רושם אירוע ולא מחכה לו. */
export function logEvent(event: StudioEvent | null): void {
  if (!event) return;
  void Promise.resolve(supabase.from("studio_events").insert(toRow(event))).catch(() => { /* שקט */ });
}

// אותו צילום (אותו קובץ) מועלה פעם אחת בלבד, גם אם יוצרים ממנו כמה תמונות.
const uploaded = new WeakMap<File, Promise<{sourceId: string; sourcePath: string | null}>>();

/** שומר עותק מוקטן (עד 1024 פיקסלים) של צילום המקור, ומחזיר מזהה קבוע לצילום. */
export function saveSource(file: File): Promise<{sourceId: string; sourcePath: string | null}> {
  let p = uploaded.get(file);
  if (!p) {
    const sourceId = crypto.randomUUID();
    p = (async () => {
      try {
        const jpeg = await toJpeg(file, 1024, 0.8);
        const path = `sources/${new Date().toISOString().slice(0, 7)}/${sourceId}.jpg`;
        const up = await supabase.storage.from(BUCKET).upload(path, jpeg, {contentType: "image/jpeg", upsert: false});
        return {sourceId, sourcePath: up.error ? null : path};
      } catch { return {sourceId, sourcePath: null}; }
    })();
    uploaded.set(file, p);
  }
  return p;
}
