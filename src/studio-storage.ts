export type SavedBranding = {
  logo: boolean; slogan: boolean; logoSource: string; sloganSource: string;
  logoName: string; sloganName: string; logoX: number; logoY: number;
  sloganX: number; sloganY: number;
  logoScale?: number; sloganScale?: number;
};
export type SavedImage = {key: string; createdAt: number; blob: Blob; style: string; palette: string};
type RecordValue = SavedImage | {key:"branding"; value:SavedBranding};

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
export async function loadStudio():Promise<{branding:SavedBranding|null;images:SavedImage[]}> {
  const db=await openStore();
  try{
    const records=await allRecords(db);
    const branding=records.find(r=>r.key==="branding") as {key:"branding";value:SavedBranding}|undefined;
    const images=records.filter((r):r is SavedImage=>r.key.startsWith("image:")).sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
    return {branding:branding?.value??null,images};
  }finally{db.close()}
}
export async function saveBranding(value:SavedBranding):Promise<void> {
  const db=await openStore();
  try{await requestValue(db.transaction("items","readwrite").objectStore("items").put({key:"branding",value}))}
  finally{db.close()}
}
export async function saveImage(blob:Blob,style:string,palette:string):Promise<SavedImage[]> {
  const db=await openStore();
  try{
    const image:SavedImage={key:`image:${Date.now()}:${crypto.randomUUID()}`,createdAt:Date.now(),blob,style,palette};
    await requestValue(db.transaction("items","readwrite").objectStore("items").put(image));
    const all=(await allRecords(db)).filter((r):r is SavedImage=>r.key.startsWith("image:"))
      .sort((a,b)=>b.createdAt-a.createdAt);
    const old=all.slice(4);
    if(old.length){const transaction=db.transaction("items","readwrite");for(const item of old)transaction.objectStore("items").delete(item.key);
      await new Promise<void>((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error)})}
    return all.slice(0,4);
  }finally{db.close()}
}
