// תיעוד פעולות של רבקה בסטודיו: הבסיס ללמידת ההעדפות שלה (שלב 4).
// פונקציות טהורות בלבד (בלי רשת), כדי שאפשר יהיה לבדוק אותן.
import {parseSelection, type Selection} from "./selection.ts";

export const EVENT_TYPES = ["generate", "download", "send", "rate", "open"] as const;
export type EventType = typeof EVENT_TYPES[number];

export type StudioEvent = {
  type: EventType;
  imageKey: string | null;   // המפתח של התמונה שנוצרה (image:...), אם יש
  sourceId: string | null;   // מזהה תמונת המקור: אותו צילום = אותו מזהה, גם כשיוצרים שוב
  sourcePath: string | null; // נתיב תמונת המקור המוקטנת באחסון הפרטי
  selection: Selection | null;
  formatId: string | null;
  detail: Record<string, string | number | boolean | null>;
};

const MAX_DETAIL_KEYS = 8;

/** בונה אירוע תקין. ערכים לא תקינים נופלים ל-null, ושדות פירוט מוגבלים בגודל. */
export function buildEvent(input: {type: EventType; imageKey?: string | null; sourceId?: string | null; sourcePath?: string | null; selection?: unknown; formatId?: string | null; detail?: Record<string, unknown>}): StudioEvent | null {
  if (!EVENT_TYPES.includes(input.type)) return null;
  const detail: StudioEvent["detail"] = {};
  for (const [k, v] of Object.entries(input.detail ?? {}).slice(0, MAX_DETAIL_KEYS)) {
    if (typeof v === "string") detail[k.slice(0, 30)] = v.slice(0, 100);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) detail[k.slice(0, 30)] = v;
  }
  return {
    type: input.type,
    imageKey: input.imageKey ?? null, sourceId: input.sourceId ?? null, sourcePath: input.sourcePath ?? null,
    selection: input.selection == null ? null : parseSelection(input.selection),
    formatId: input.formatId ?? null, detail
  };
}

/** שורה לטבלה studio_events. */
export function toRow(e: StudioEvent) {
  return {event_type: e.type, image_key: e.imageKey, source_id: e.sourceId, source_path: e.sourcePath, selection: e.selection, format_id: e.formatId, detail: e.detail};
}

/** האם זו יצירה חוזרת מאותו צילום ובאותה בחירה בדיוק? סימן שלא אהבה את התוצאה הקודמת. */
export function isRepeat(prev: {sourceId: string | null; selection: Selection | null} | null, next: {sourceId: string | null; selection: Selection | null}): boolean {
  return Boolean(prev && prev.sourceId && prev.sourceId === next.sourceId && JSON.stringify(prev.selection) === JSON.stringify(next.selection));
}
