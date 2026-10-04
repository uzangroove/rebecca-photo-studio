import {layoutsFromLegacy, parseLayouts, type Layouts} from "../shared/brand-layout.ts";
import {hasItem} from "../shared/catalog.ts";
import {defaultSelection, parseSelection, type Selection} from "../shared/selection.ts";
import {defaultBrand, type BrandSettings} from "../shared/settings.ts";

// מה ששמור במכשיר מהמיתוג. עד שלב 1 נשמרו המקורות והמיקום ברשת 0-20; מגרסה זו המקורות והפריסה לכל פורמט.
type LegacyBranding = {
  logo: boolean; slogan: boolean; logoSource: string; sloganSource: string;
  logoName: string; sloganName: string; logoX: number; logoY: number;
  sloganX: number; sloganY: number;
  logoScale?: number; sloganScale?: number;
};
export type SavedBranding = {brand: BrandSettings; layouts: Layouts};
type StoredBranding = LegacyBranding | {version: 3; brand: BrandSettings; layouts: Layouts};

// גרסאות ישנות שמרו את הלוגו והסלוגן כקובץ אחד.
const migrateSource = (source: string, fallback: string) => source === "/assets/logo.png" ? fallback : source;
export function normalizeBranding(stored: StoredBranding): SavedBranding {
  if ("version" in stored) return {brand: stored.brand, layouts: parseLayouts(stored.layouts) ?? {}};
  const brand: BrandSettings = {logoSource: migrateSource(stored.logoSource, defaultBrand.logoSource), sloganSource: migrateSource(stored.sloganSource, defaultBrand.sloganSource),
    logoName: stored.logoName, sloganName: stored.sloganName};
  const layouts = [stored.logoX, stored.logoY, stored.sloganX, stored.sloganY].every(n => typeof n === "number")
    ? layoutsFromLegacy({logo: !!stored.logo, slogan: !!stored.slogan, logoX: stored.logoX, logoY: stored.logoY, logoScale: stored.logoScale ?? 100,
      sloganX: stored.sloganX, sloganY: stored.sloganY, sloganScale: stored.sloganScale ?? 100}) : {};
  return {brand, layouts};
}
export type Rating = "up" | "down" | null;
export const MAX_HISTORY = 30;
// כל תמונה נשמרת עם ההגדרות שיצרו אותה ועם הדירוג של רבקה.
export type SavedImage = {key: string; createdAt: number; blob: Blob; selection: Selection; formatId: string; rating: Rating};
// כך נראו רשומות משלב 0: רק סגנון ופלטה.
type StoredImage = Omit<SavedImage, "selection" | "formatId" | "rating"> & {selection?: unknown; formatId?: unknown; rating?: unknown; style?: string; palette?: string};
type RecordValue = StoredImage | {key: "branding"; value: StoredBranding};

// ממיר רשומה שמורה (גם ישנה) לצורה הנוכחית, ובוחר ברירת מחדל לכל שדה לא תקין.
export function normalizeImage(stored: StoredImage): SavedImage {
  const parsed = parseSelection(stored.selection);
  const selection = parsed ?? {...defaultSelection,
    style: hasItem("styles", stored.style) ? stored.style! : defaultSelection.style,
    palette: hasItem("palettes", stored.palette) ? stored.palette! : defaultSelection.palette};
  return {key: stored.key, createdAt: stored.createdAt, blob: stored.blob, selection,
    formatId: typeof stored.formatId === "string" ? stored.formatId : "instagram-square",
    rating: stored.rating === "up" || stored.rating === "down" ? stored.rating : null};
}

function openStore():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open("rebecca-photo-studio",1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("items"))request.result.createObjectStore("items",{keyPath:"key"})};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
function requestValue<T>(request:IDBRequest<T>):Promise<T> {
  return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
}
async function allRecords(db:IDBDatabase):Promise<RecordValue[]> {
  return requestValue(db.transaction("items","readonly").objectStore("items").getAll()) as Promise<RecordValue[]>;
}
const imagesOf = (records: RecordValue[]) =>
  records.filter((r): r is StoredImage => r.key.startsWith("image:")).map(normalizeImage).sort((a, b) => b.createdAt - a.createdAt);

export async function loadStudio():Promise<{branding:SavedBranding|null;images:SavedImage[]}> {
  const db=await openStore();
  try{
    const records=await allRecords(db);
    const branding=records.find(r=>r.key==="branding") as {key:"branding";value:StoredBranding}|undefined;
    return {branding:branding?normalizeBranding(branding.value):null,images:imagesOf(records).slice(0,MAX_HISTORY)};
  }finally{db.close()}
}
export async function saveBranding(value:SavedBranding):Promise<void> {
  const db=await openStore();
  try{await requestValue(db.transaction("items","readwrite").objectStore("items").put({key:"branding",value:{version:3,...value}}))}
  finally{db.close()}
}
// שומר תמונה חדשה ומשאיר את MAX_HISTORY האחרונות.
export async function saveImage(blob:Blob,selection:Selection,formatId:string):Promise<{images:SavedImage[];key:string}> {
  const db=await openStore();
  try{
    const image:SavedImage={key:`image:${Date.now()}:${crypto.randomUUID()}`,createdAt:Date.now(),blob,selection,formatId,rating:null};
    await requestValue(db.transaction("items","readwrite").objectStore("items").put(image));
    const all=imagesOf(await allRecords(db));
    const old=all.slice(MAX_HISTORY);
    if(old.length){const transaction=db.transaction("items","readwrite");for(const item of old)transaction.objectStore("items").delete(item.key);
      await new Promise<void>((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error)})}
    return {images:all.slice(0,MAX_HISTORY),key:image.key};
  }finally{db.close()}
}
export async function rateImage(key:string,rating:Rating):Promise<void> {
  const db=await openStore();
  try{
    const store=db.transaction("items","readwrite").objectStore("items");
    const stored=await requestValue(store.get(key)) as StoredImage|undefined;
    if(stored)await requestValue(store.put({...stored,rating}));
  }finally{db.close()}
}
