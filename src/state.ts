import {findItem, isBlocked} from "../shared/catalog.ts";
import {builtInRecipes, applyRecipe, MAX_RECIPES, type Recipe} from "../shared/recipes.ts";
import {defaultSelection, MAX_WISH_CHARS, type SceneKey, type Selection} from "../shared/selection.ts";
import {defaultBrand, defaultNeverList, MAX_NEVER_CHARS, MAX_NEVER_ITEMS, type BrandSettings, type StudioSettings} from "../shared/settings.ts";
import type {Rating, SavedImage} from "./studio-storage.ts";

export type TabId = "style" | "details" | "palette" | "product" | "brand" | "format";
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
  recipes: Recipe[];
  photo: Photo | null;
  result: string | null;
  composed: Composed | null;
  downloadFallback: boolean;
  busy: boolean;
  status: {text: string; error: boolean};
  history: HistoryItem[];
  currentKey: string | null;
  ready: boolean;
  sync: SyncState;
};

export const initialState: State = {
  tab: "style", view: "split",
  selection: defaultSelection, formatId: "instagram-square",
  brand: defaultBrand, caption: "", neverList: [...defaultNeverList], recipes: [...builtInRecipes],
  photo: null, result: null, composed: null, downloadFallback: false, busy: false,
  status: {text: "העלו צילום של סבון או נר כדי להתחיל", error: false},
  history: [], currentKey: null, ready: false, sync: "checking"
};

export type Action =
  | {type: "tab"; tab: TabId}
  | {type: "view"; view: ViewMode}
  | {type: "select"; key: Exclude<keyof Selection, "wish">; id: string | null}
  | {type: "wish"; text: string}
  | {type: "recipe"; recipe: Recipe}
  | {type: "resetScene"}
  | {type: "saveRecipe"; recipe: Recipe}
  | {type: "deleteRecipe"; id: string}
  | {type: "neverAdd"; text: string}
  | {type: "neverRemove"; text: string}
  | {type: "rated"; key: string; rating: Rating}
  | {type: "format"; id: string}
  | {type: "brand"; patch: Partial<BrandSettings>}
  | {type: "caption"; text: string}
  | {type: "settings"; settings: StudioSettings}
  | {type: "ready"}
  | {type: "sync"; sync: SyncState}
  | {type: "history"; items: HistoryItem[]; currentKey?: string}
  | {type: "photo"; photo: Photo}
  | {type: "openRecent"; url: string; key: string; selection: Selection; formatId: string}
  | {type: "generating"}
  | {type: "generated"; image: string}
  | {type: "failed"; text: string}
  | {type: "say"; text: string; error?: boolean}
  | {type: "composeReset"}
  | {type: "composed"; composed: Composed}
  | {type: "composeFailed"; composed: Composed | null; text: string}
  | {type: "downloadFallback"; text: string};

// בחירה חדשה (סגנון, פלטה, מוצר או אביזרים) מבטלת את התוצאה הקודמת, כמו שהיה עד היום.
const cleared = {result: null, composed: null, currentKey: null, busy: false, downloadFallback: false} as const;
const ready = {text: "הבחירות מוכנות. צרו תמונה חדשה", error: false};
const sceneKeys: readonly SceneKey[] = ["surface", "background", "light"];
const sceneCategory = {surface: "surfaces", background: "backgrounds", light: "lights"} as const;

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tab": return {...state, tab: action.tab};
    case "view": return {...state, view: action.view};
    case "select":
      return {...state, ...cleared, selection: {...state.selection, [action.key]: action.id}, status: ready};
    // בקשה מיוחדת היא טקסט חופשי: הקלדה לא מוחקת את התמונה שעל המסך, היא נכנסת ליצירה הבאה.
    case "wish": return {...state, selection: {...state.selection, wish: action.text.slice(0, MAX_WISH_CHARS)}};
    case "recipe": return {...state, ...cleared, selection: applyRecipe(state.selection, action.recipe), status: ready};
    case "resetScene": return {...state, ...cleared, selection: {...state.selection, surface: null, background: null, light: null}, status: ready};
    case "saveRecipe": return {...state, recipes: [...state.recipes, action.recipe].slice(-MAX_RECIPES)};
    case "deleteRecipe": return {...state, recipes: state.recipes.filter(r => r.id !== action.id)};
    case "neverAdd": {
      const text = action.text.replace(/\s+/g, " ").trim();
      if (!text || text.length > MAX_NEVER_CHARS || state.neverList.length >= MAX_NEVER_ITEMS || state.neverList.includes(text)) return state;
      const neverList = [...state.neverList, text];
      // בחירה מפורשת שנחסמה עכשיו חוזרת לברירת המחדל של הסגנון.
      const selection = {...state.selection};
      for (const key of sceneKeys) {
        const item = selection[key] && findItem(sceneCategory[key], selection[key]!);
        if (item && isBlocked(item, neverList)) selection[key] = null;
      }
      return {...state, neverList, selection};
    }
    case "neverRemove": return {...state, neverList: state.neverList.filter(n => n !== action.text)};
    case "rated": return {...state, history: state.history.map(h => h.key === action.key ? {...h, rating: action.rating} : h)};
    case "format": return {...state, formatId: action.id};
    case "brand": return {...state, brand: {...state.brand, ...action.patch}};
    case "caption": return {...state, caption: action.text};
    case "settings": return {...state, brand: action.settings.brand, neverList: action.settings.neverList, recipes: action.settings.recipes};
    case "ready": return {...state, ready: true};
    case "sync": return {...state, sync: action.sync};
    case "history": return {...state, history: action.items, currentKey: action.currentKey ?? state.currentKey};
    case "photo":
      return {...state, ...cleared, photo: action.photo,
        status: {text: "הצילום נטען. בחרו סגנון וצבעים וצרו תמונה", error: false}};
    case "openRecent":
      return {...state, ...cleared, photo: null, result: action.url, view: "single", currentKey: action.key,
        selection: action.selection, formatId: action.formatId,
        status: {text: "תמונה שנשמרה במכשיר הזה. אפשר לערוך מיתוג ולהוריד אותה", error: false}};
    case "generating":
      return {...state, busy: true, status: {text: "יוצרים סצנה חדשה בתוך התמונה…", error: false}};
    case "generated":
      return {...state, busy: false, result: action.image, composed: null, currentKey: null, downloadFallback: false,
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

export const currentImage = (s: State): HistoryItem | null => s.history.find(h => h.key === s.currentKey) ?? null;
export const imageToShow = (s: State): string | null => (s.composed?.branded ? s.composed.url : s.result);
