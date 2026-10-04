import {defaultSelection, type Selection} from "../shared/selection.ts";
import {defaultBrand, type BrandSettings, type StudioSettings} from "../shared/settings.ts";
import type {SavedImage} from "./studio-storage.ts";

export type TabId = "style" | "palette" | "product" | "brand" | "format";
export type ViewMode = "split" | "single" | "compare";
export type SyncState = "checking" | "synced" | "saving" | "offline";
export type HistoryItem = SavedImage & {url: string};
// התוצאה אחרי חיתוך לפורמט והוספת מיתוג. branded=false: ההרכבה נכשלה והקובץ להורדה הוא המקור.
export type Composed = {url: string; blob: Blob; branded: boolean};
export type Photo = {file: File; url: string};

export type State = {
  tab: TabId;
  view: ViewMode;
  selection: Selection;
  formatId: string;
  brand: BrandSettings;
  caption: string;
  neverList: string[];
  photo: Photo | null;
  result: string | null;
  composed: Composed | null;
  downloadFallback: boolean;
  busy: boolean;
  status: {text: string; error: boolean};
  history: HistoryItem[];
  ready: boolean;
  sync: SyncState;
};

export const initialState: State = {
  tab: "style", view: "split",
  selection: defaultSelection, formatId: "instagram-square",
  brand: defaultBrand, caption: "", neverList: [],
  photo: null, result: null, composed: null, downloadFallback: false, busy: false,
  status: {text: "העלו צילום של סבון או נר כדי להתחיל", error: false},
  history: [], ready: false, sync: "checking"
};

export type Action =
  | {type: "tab"; tab: TabId}
  | {type: "view"; view: ViewMode}
  | {type: "select"; key: keyof Selection; id: string}
  | {type: "format"; id: string}
  | {type: "brand"; patch: Partial<BrandSettings>}
  | {type: "caption"; text: string}
  | {type: "settings"; settings: StudioSettings}
  | {type: "ready"}
  | {type: "sync"; sync: SyncState}
  | {type: "history"; items: HistoryItem[]}
  | {type: "photo"; photo: Photo}
  | {type: "openRecent"; url: string; style: string; palette: string}
  | {type: "generating"}
  | {type: "generated"; image: string}
  | {type: "failed"; text: string}
  | {type: "say"; text: string; error?: boolean}
  | {type: "composeReset"}
  | {type: "composed"; composed: Composed}
  | {type: "composeFailed"; composed: Composed | null; text: string}
  | {type: "downloadFallback"; text: string};

// בחירה חדשה (סגנון, פלטה, מוצר או אביזרים) מבטלת את התוצאה הקודמת, כמו שהיה עד היום.
const cleared = {result: null, composed: null, busy: false, downloadFallback: false} as const;

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tab": return {...state, tab: action.tab};
    case "view": return {...state, view: action.view};
    case "select":
      return {...state, ...cleared, selection: {...state.selection, [action.key]: action.id},
        status: {text: "הבחירות מוכנות. צרו תמונה חדשה", error: false}};
    case "format": return {...state, formatId: action.id};
    case "brand": return {...state, brand: {...state.brand, ...action.patch}};
    case "caption": return {...state, caption: action.text};
    case "settings": return {...state, brand: action.settings.brand, neverList: action.settings.neverList};
    case "ready": return {...state, ready: true};
    case "sync": return {...state, sync: action.sync};
    case "history": return {...state, history: action.items};
    case "photo":
      return {...state, ...cleared, photo: action.photo,
        status: {text: "הצילום נטען. בחרו סגנון וצבעים וצרו תמונה", error: false}};
    case "openRecent":
      return {...state, ...cleared, photo: null, result: action.url, view: "single",
        selection: {...state.selection, style: action.style, palette: action.palette},
        status: {text: "תמונה שנשמרה במכשיר הזה. אפשר לערוך מיתוג ולהוריד אותה", error: false}};
    case "generating":
      return {...state, busy: true, status: {text: "יוצרים סצנה חדשה בתוך התמונה…", error: false}};
    case "generated":
      return {...state, busy: false, result: action.image, composed: null, downloadFallback: false,
        status: {text: "התמונה מוכנה. בדקו את המוצר והתווית לפני שימוש", error: false}};
    case "failed": return {...state, busy: false, status: {text: action.text, error: true}};
    case "say": return {...state, status: {text: action.text, error: action.error ?? false}};
    case "composeReset": return {...state, composed: null, downloadFallback: false};
    case "composed":
      return {...state, composed: action.composed, status: {text: "התמונה מוכנה להורדה. בדקו את פרטי המוצר והמיתוג", error: false}};
    case "composeFailed": return {...state, composed: action.composed, status: {text: action.text, error: true}};
    case "downloadFallback": return {...state, downloadFallback: true, status: {text: action.text, error: true}};
  }
}

export const imageToShow = (s: State): string | null => (s.composed?.branded ? s.composed.url : s.result);
