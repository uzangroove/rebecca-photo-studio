"use client";
import { useEffect, useRef, useState } from "react";
import {loadStudio,saveBranding,saveImage,type SavedImage} from "./studio-storage";
const styles = [
  ["boutique","בוטיק יוקרתי","תאורה מדויקת ומשטח עשיר"],["rustic","כפרי","עץ טבעי ופשתן"],
  ["urban","אורבני","בטון ואור חלון"],["minimal","מינימליסטי","מרחב נקי ומעט פריטים"],
  ["botanical","בוטני","צמחייה ואור טבעי"],["spa","ספא ורוגע","אבן ואווירה שקטה"],
  ["mediterranean","ים תיכוני","טיח, שמש וענפי זית"],["japandi","ג׳פנדי","עץ בהיר וקרמיקה"],
  ["editorial","סטודיו אמנותי","צללים וקומפוזיציה נועזת"],["gift","מתנה ואירוח","בד ושולחן חגיגי"]
] as const;
const palettes = [
  ["rebecca","רבקה",["#f1e8d5","#163b30","#b89958"]],["earth","אדמה",["#e7d8c3","#8b694c","#505f45"]],
  ["city","עירוני",["#d3d0ca","#575e62","#a77d5a"]],["clean","נקי",["#faf8f1","#c5d4c9","#627565"]],
  ["garden","גן",["#dde4ce","#70936b","#d7b58e"]],["romance","רומנטי",["#f0d9d5","#c8898d","#8b6668"]],
  ["sea","ים",["#e5e8db","#7ea6a4","#bdab89"]],["evening","ערב",["#20372f","#5d6052","#c09d65"]]
] as const;

type Branding = {logo: boolean; slogan: boolean; logoSource: string; sloganSource: string; caption: string; logoX: number; logoY: number; sloganX: number; sloganY: number};
async function readBrandFile(file: File) {
  if(!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size>5*1024*1024)throw new Error("העלו תמונת PNG, JPG או WebP עד 5 מגה־בייט");
  return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("לא הצלחנו לקרוא את הקובץ"));reader.readAsDataURL(file)});
}
async function drawBrand(ctx: CanvasRenderingContext2D, source: string, part: "logo"|"slogan", x: number, y: number) {
  const mark=new Image();mark.src=source;await mark.decode();
  const builtIn=source==="/assets/logo.png";
  const sx=builtIn?mark.naturalWidth*.027:0;
  const sy=builtIn?mark.naturalHeight*(part==="logo"?.37:.515):0;
  const sw=builtIn?mark.naturalWidth*.945:mark.naturalWidth;
  const sh=builtIn?mark.naturalHeight*(part==="logo"?.14:.125):mark.naturalHeight;
  const w=ctx.canvas.width,h=ctx.canvas.height;
  const dw=Math.min(w*(part==="logo"?.30:.34),h*.17*sw/sh),dh=dw*sh/sw;
  const left=w*.025+(20-x)/20*(w-dw-w*.05);
  const top=h*.025+y/20*(h-dh-h*.05);
  ctx.drawImage(mark,sx,sy,sw,sh,left,top,dw,dh);
}
function PositionControls({name,x,y,onPosition}:{name:string;x:number;y:number;onPosition:(x:number,y:number)=>void}) {
  const presets=[
    [0,0,"ימין למעלה"],[10,0,"מרכז למעלה"],[20,0,"שמאל למעלה"],
    [0,10,"ימין באמצע"],[10,10,"מרכז"],[20,10,"שמאל באמצע"],
    [0,20,"ימין למטה"],[10,20,"מרכז למטה"],[20,20,"שמאל למטה"]
  ] as const;
  const selected=`${x},${y}`;
  const custom=!presets.some(([px,py])=>`${px},${py}`===selected);
  function clamp(value:string){return Math.max(0,Math.min(20,Math.round(Number(value)||0)))}
  return <div className="position-row">
    <label className="position-preset">מיקום {name}<select value={selected} onChange={e=>{const [nx,ny]=e.target.value.split(",").map(Number);onPosition(nx,ny)}}>{presets.map(([px,py,label])=><option key={`${px},${py}`} value={`${px},${py}`}>{label}</option>)}{custom&&<option value={selected}>מיקום מותאם</option>}</select></label>
    <label className="axis-control">אופקי <small>0 ימין · 20 שמאל</small><input type="range" min="0" max="20" step="1" dir="rtl" value={x} onChange={e=>onPosition(Number(e.target.value),y)}/><input type="number" min="0" max="20" step="1" dir="ltr" aria-label={`מיקום אופקי של ${name}`} value={x} onChange={e=>onPosition(clamp(e.target.value),y)}/></label>
    <label className="axis-control">אנכי <small>0 למעלה · 20 למטה</small><input type="range" min="0" max="20" step="1" value={y} onChange={e=>onPosition(x,Number(e.target.value))}/><input type="number" min="0" max="20" step="1" dir="ltr" aria-label={`מיקום אנכי של ${name}`} value={y} onChange={e=>onPosition(x,clamp(e.target.value))}/></label>
  </div>;
}
async function composeImage(source: string, branding: Branding) {
  const image = new Image(); image.src = source; await image.decode();
  const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("לא הצלחנו להכין את התמונה להורדה");
  ctx.drawImage(image, 0, 0);
  const words = branding.caption.trim();
  if (words) {
    const w = canvas.width, h = canvas.height;
    const shade = ctx.createLinearGradient(0, h*.77, 0, h);
    shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.48)");
    ctx.fillStyle = shade; ctx.fillRect(0, h*.77, w, h*.23);
    let size = Math.round(w*.048);
    ctx.font = `bold ${size}px Arial, sans-serif`;
    while (ctx.measureText(words).width > w*.86 && size > 18) { size -= 2; ctx.font = `bold ${size}px Arial, sans-serif`; }
    ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.direction = "rtl";
    ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = w*.012;
    ctx.fillStyle = "#fff"; ctx.fillText(words, w/2, branding.slogan?h*.76:h*.95, w*.86);
  }
  if(branding.logo)await drawBrand(ctx,branding.logoSource,"logo",branding.logoX,branding.logoY);
  if(branding.slogan)await drawBrand(ctx,branding.sloganSource,"slogan",branding.sloganX,branding.sloganY);
  return canvas;
}

export default function Home() {
  const [file,setFile]=useState<File|null>(null);
  const [source,setSource]=useState<string|null>(null),[product,setProduct]=useState("soap");
  const [style,setStyle]=useState("boutique"),[palette,setPalette]=useState("rebecca");
  const [density,setDensity]=useState("subtle"),[ratio,setRatio]=useState("square");
  const [logo,setLogo]=useState(false),[slogan,setSlogan]=useState(false),[compare,setCompare]=useState(false),[caption,setCaption]=useState("");
  const [logoSource,setLogoSource]=useState("/assets/logo.png"),[sloganSource,setSloganSource]=useState("/assets/logo.png");
  const [logoName,setLogoName]=useState("הלוגו של רבקה"),[sloganName,setSloganName]=useState("הסלוגן של רבקה");
  const [logoX,setLogoX]=useState(0),[logoY,setLogoY]=useState(0),[sloganX,setSloganX]=useState(10),[sloganY,setSloganY]=useState(20);
  const [drawerOpen,setDrawerOpen]=useState(true);
  const [result,setResult]=useState<string|null>(null),[previewResult,setPreviewResult]=useState<string|null>(null),[downloadUrl,setDownloadUrl]=useState<string|null>(null),[downloadBlob,setDownloadBlob]=useState<Blob|null>(null),[busy,setBusy]=useState(false);
  const [history,setHistory]=useState<(SavedImage&{url:string})[]>([]),[loaded,setLoaded]=useState(false);
  const [downloadFallback,setDownloadFallback]=useState(false);
  const [message,setMessage]=useState("העלו צילום של סבון או נר כדי להתחיל"),[error,setError]=useState(false);
  const objectUrl=useRef<string|null>(null),selectedHistoryUrl=useRef<string|null>(null),historyUrls=useRef<string[]>([]),requestId=useRef(0);
  function showHistory(images:SavedImage[]){
    const urls=images.map(image=>URL.createObjectURL(image.blob));
    const previous=historyUrls.current;historyUrls.current=urls;
    setHistory(images.map((image,i)=>({...image,url:urls[i]})));
    previous.forEach(url=>URL.revokeObjectURL(url));
  }
  useEffect(()=>{
    let cancelled=false;
    loadStudio().then(({branding,images})=>{
      if(cancelled)return;
      if(branding){setLogo(branding.logo);setSlogan(branding.slogan);setLogoSource(branding.logoSource);setSloganSource(branding.sloganSource);
        setLogoName(branding.logoName);setSloganName(branding.sloganName);setLogoX(branding.logoX);setLogoY(branding.logoY);setSloganX(branding.sloganX);setSloganY(branding.sloganY)}
      showHistory(images);setLoaded(true);
    }).catch(()=>{if(!cancelled){setLoaded(true);setMessage("השמירה המקומית אינה זמינה בדפדפן הזה. אפשר להמשיך ליצור תמונות")}});
    return ()=>{cancelled=true;if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);if(selectedHistoryUrl.current)URL.revokeObjectURL(selectedHistoryUrl.current);
      historyUrls.current.forEach(url=>URL.revokeObjectURL(url))};
  },[]);
  useEffect(()=>{
    if(!loaded)return;
    const timer=setTimeout(()=>{saveBranding({logo,slogan,logoSource,sloganSource,logoName,sloganName,logoX,logoY,sloganX,sloganY}).catch(()=>setMessage("המיתוג לא נשמר בדפדפן. בדקו שאחסון האתר מאופשר"))},250);
    return ()=>clearTimeout(timer);
  },[loaded,logo,slogan,logoSource,sloganSource,logoName,sloganName,logoX,logoY,sloganX,sloganY]);
  useEffect(()=>{
    setPreviewResult(null);setDownloadUrl(null);setDownloadBlob(null);setDownloadFallback(false);
    if(!result)return;
    let cancelled=false,url:string|null=null;
    const branding={logo,slogan,logoSource,sloganSource,caption,logoX,logoY,sloganX,sloganY};
    const timer=setTimeout(async()=>{
      try{
        const canvas=await composeImage(result,branding);
        const blob=await new Promise<Blob|null>((resolve,reject)=>{try{canvas.toBlob(resolve,"image/png")}catch(e){reject(e)}});
        if(!blob)throw new Error("לא הצלחנו להכין את קובץ התמונה");
        if(cancelled)return;
        url=URL.createObjectURL(blob);setPreviewResult(url);setDownloadUrl(url);setDownloadBlob(blob);setError(false);setMessage("התמונה מוכנה להורדה. בדקו את פרטי המוצר והמיתוג");
      }catch{
        if(cancelled)return;
        try{const raw=await fetch(result).then(r=>r.blob());if(cancelled)return;url=URL.createObjectURL(raw);setDownloadUrl(url);setDownloadBlob(raw);setError(true);setMessage("המיתוג לא הוחל. אפשר להוריד את התמונה המקורית ולנסות קובץ מיתוג אחר")}
        catch{if(!cancelled){setError(true);setMessage("הכנת התמונה להורדה נכשלה. נסו ליצור אותה מחדש")}}
      }
    },120);
    return ()=>{cancelled=true;clearTimeout(timer);if(url)URL.revokeObjectURL(url)};
  },[result,logo,slogan,logoSource,sloganSource,caption,logoX,logoY,sloganX,sloganY]);
  async function chooseBrand(file:File|undefined,part:"logo"|"slogan"){
    if(!file)return;
    try{const data=await readBrandFile(file);if(part==="logo"){setLogoSource(data);setLogoName(file.name);setLogo(true)}else{setSloganSource(data);setSloganName(file.name);setSlogan(true)}setError(false)}
    catch(e){setError(true);setMessage(e instanceof Error?e.message:"לא הצלחנו להעלות את הקובץ")}
  }
  function changed(){requestId.current++;setResult(null);setBusy(false);setError(false);setMessage("הבחירות מוכנות. צרו תמונה חדשה")}
  function chooseFile(f?:File){if(!f)return;if(!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size>10*1024*1024){setError(true);setMessage("אפשר להעלות JPG, PNG או WebP עד 10 מגה־בייט");return}if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=URL.createObjectURL(f);setSource(objectUrl.current);setFile(f);changed();setMessage("הצילום נטען. בחרו סגנון וצבעים וצרו תמונה")}
  function openRecent(image:SavedImage){
    if(selectedHistoryUrl.current)URL.revokeObjectURL(selectedHistoryUrl.current);
    selectedHistoryUrl.current=URL.createObjectURL(image.blob);
    if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current=null}
    requestId.current++;setBusy(false);setFile(null);setSource(null);setCompare(false);setResult(selectedHistoryUrl.current);setStyle(image.style);setPalette(image.palette);
    setDrawerOpen(false);setError(false);setMessage("תמונה שנשמרה במכשיר הזה. אפשר לערוך מיתוג ולהוריד אותה");
  }
  async function generate(){if(!file){setError(true);setMessage("העלו קודם צילום מוצר מהמחשב או מהטלפון");return}
    const id=++requestId.current;setBusy(true);setDrawerOpen(false);setError(false);setMessage("יוצרים סצנה חדשה בתוך התמונה…");
    try{const body=new FormData();body.append("image",file);
      for(const [key,value] of Object.entries({product,style,palette,density,ratio}))body.append(key,value);
      const response=await fetch("/api/generate",{method:"POST",body});
      const payload=await response.json().catch(()=>({})) as {error?:string;image?:string};
      if(!response.ok){
        if(response.status===401||response.status===403)throw new Error(payload.error||"הגישה לאתר פגה או נחסמה. רעננו את הדף ופתחו אותו שוב מתוך החשבון שלכם");
        if(response.status===502||response.status===503)throw new Error(payload.error||"שירות יצירת התמונות אינו זמין כרגע. נסו שוב בעוד כמה דקות");
        throw new Error(payload.error||`לא הצלחנו ליצור תמונה (שגיאה ${response.status})`);
      }
      if(!payload.image)throw new Error("לא התקבלה תמונה משירות היצירה. נסו שוב");
      if(id!==requestId.current)return;
      const imageUrl="data:image/png;base64,"+payload.image;
      setResult(imageUrl);setMessage("התמונה מוכנה. בדקו את המוצר והתווית לפני שימוש");
      try{const blob=await fetch(imageUrl).then(r=>r.blob());showHistory(await saveImage(blob,style,palette))}
      catch{setMessage("התמונה נוצרה, אך לא נשמרה בארבע האחרונות. אפשר להוריד אותה כעת")}
    }catch(e){if(id!==requestId.current)return;setError(true);setMessage(e instanceof Error?e.message:"לא הצלחנו ליצור תמונה")}
    finally{if(id===requestId.current)setBusy(false)}
  }
  async function download(e:React.MouseEvent<HTMLAnchorElement>){
    if(!downloadUrl||!downloadBlob){e.preventDefault();return}
    type SaveHandle={createWritable:()=>Promise<{write:(data:Blob)=>Promise<void>;close:()=>Promise<void>}>};
    const picker=(window as Window & {showSaveFilePicker?:(options:{suggestedName:string;types:{description:string;accept:Record<string,string[]>}[]})=>Promise<SaveHandle>}).showSaveFilePicker;
    if(!picker){
      if(window.self!==window.top){e.preventDefault();setDownloadFallback(true);setError(true);setMessage("בחלון התצוגה הזה הדפדפן חוסם הורדות. פתחו את הסטודיו בחלון מלא כדי לשמור דרך הכפתור")}
      return;
    }
    e.preventDefault();
    try{
      const handle=await picker.call(window,{suggestedName:`rebecca-${style}-${palette}.png`,types:[{description:"תמונת PNG",accept:{"image/png":[".png"]}}]});
      const stream=await handle.createWritable();await stream.write(downloadBlob);await stream.close();
      setError(false);setMessage("התמונה נשמרה בהצלחה");
    }catch(err){
      if(err instanceof DOMException&&err.name==="AbortError")return;
      setDownloadFallback(true);setError(true);setMessage("הדפדפן מנע שמירה ישירה בחלון הזה. פתחו את התמונה בחלון נפרד לשמירה");
    }
  }
  return <main className={drawerOpen?"shell drawer-open":"shell"}>
    <header className="top"><div className="brand" dir="ltr">RÉBECCA <small>HANDMADE NATURAL SOAP & CANDLES</small></div><div className="top-links"><span>סטודיו התמונות · גרסת ניסיון פרטית</span><a href="/" target="_blank" rel="noopener noreferrer">פתיחה בחלון מלא</a></div></header>
    <div className="workspace">
      <section className="stage" aria-label="התמונה">
        <div className="stage-head"><h1>התמונה של רבקה</h1><p>מוצר אמיתי בסצנה חדשה, בתוך התמונה כולה</p></div>
        <div className="preview">{compare&&result&&source?<div className="comparison"><figure><img src={source} alt="צילום מקורי"/><figcaption>מקור</figcaption></figure><figure><img src={previewResult||result} alt="סצנה חדשה"/><figcaption>תוצאה</figcaption></figure></div>:previewResult||result||source?<img className="main-image" src={previewResult||result||source||""} alt={result?"תמונה מעוצבת":"צילום מוצר מקורי"}/>:<div className="empty-preview"><strong>הצילום הבא של רבקה מתחיל כאן</strong><span>העלו צילום מוצר כדי להתחיל בעיצוב</span></div>}</div>
        <div className="stage-footer">
          <p className={error?"feedback is-error":"feedback"} role="status">{busy&&<span className="spinner"/>}{message}</p>
          <div className="result-actions">
            <label className="caption-field">טקסט על התמונה<input type="text" value={caption} maxLength={60} placeholder="טקסט לבחירתכם" onChange={e=>setCaption(e.target.value)}/></label>
            <div className="brand-options">
              <div className="brand-row"><label><input type="checkbox" checked={logo} onChange={e=>setLogo(e.target.checked)}/> הצגת לוגו</label><label className="brand-upload">העלאת לוגו<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseBrand(e.target.files?.[0],"logo")}/></label><span title={logoName}>{logoName}</span></div>
              {logo&&<PositionControls name="הלוגו" x={logoX} y={logoY} onPosition={(x,y)=>{setLogoX(x);setLogoY(y)}}/>}
              <div className="brand-row"><label><input type="checkbox" checked={slogan} onChange={e=>setSlogan(e.target.checked)}/> הצגת סלוגן</label><label className="brand-upload">העלאת סלוגן<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseBrand(e.target.files?.[0],"slogan")}/></label><span title={sloganName}>{sloganName}</span></div>
              {slogan&&<PositionControls name="הסלוגן" x={sloganX} y={sloganY} onPosition={(x,y)=>{setSloganX(x);setSloganY(y)}}/>}
            </div>
            <label><input type="checkbox" checked={compare} disabled={!source} onChange={e=>setCompare(e.target.checked)}/> השוואה למקור</label>
            <a className={`download ${downloadUrl?"":"disabled"}`} href={downloadUrl||undefined} download={`rebecca-${style}-${palette}.png`} aria-disabled={!downloadUrl} onClick={download}>{result&&!downloadUrl?"מכינים להורדה…":"שמירת התמונה"}</a>
            {downloadFallback&&downloadUrl&&<a className="open-image" href={downloadUrl} target="_blank" rel="noopener noreferrer">פתיחת התמונה בחלון נפרד לשמירה</a>}
          </div>
          <p className="caution">ביצירת תמונה פרטים קטנים במוצר עלולים להשתנות. בדקו צורה, צבעים, כיתוב ותוויות לפני פרסום.</p>
        </div>
      </section>
      <aside className="panel" data-open={drawerOpen} aria-label="אפשרויות עיצוב">
        <div className="panel-heading"><h2>יוצרים תמונה חדשה</h2><button className="mobile-drawer-toggle" type="button" aria-expanded={drawerOpen} aria-controls="design-options" onClick={()=>setDrawerOpen(v=>!v)}>{drawerOpen?"סגירת האפשרויות":"אפשרויות עיצוב"} <span aria-hidden="true">{drawerOpen?"⌄":"⌃"}</span></button></div>
        <div className="panel-scroll" id="design-options"><label className="upload">העלאת צילום מהמחשב או מהטלפון<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{chooseFile(e.target.files?.[0]);e.currentTarget.value=""}}/></label>
        {file&&<p className="hint">צילום נבחר: {file.name}</p>}
        {history.length>0&&<div className="recent"><h3>ארבע התמונות האחרונות <small>נשמרות בדפדפן הזה</small></h3><div className="recent-list">{history.map(image=><button key={image.key} type="button" onClick={()=>openRecent(image)} aria-label={`פתיחת תמונה מ־${new Date(image.createdAt).toLocaleString("he-IL")}`}><img src={image.url} alt="תמונה שנוצרה לאחרונה"/><span>{new Date(image.createdAt).toLocaleDateString("he-IL")}</span></button>)}</div></div>}
        <div className="section"><h3>1 · סוג המוצר</h3><div className="segmented"><button className={product==="soap"?"selected":""} onClick={()=>{setProduct("soap");changed()}}>סבון</button><button className={product==="candle"?"selected":""} onClick={()=>{setProduct("candle");changed()}}>נר</button></div></div>
        <div className="section"><h3>2 · סגנון הסצנה</h3><div className="styles">{styles.map(([id,name,detail])=><button key={id} aria-pressed={style===id} className={style===id?"selected":""} onClick={()=>{setStyle(id);changed()}}><strong>{name}</strong><small>{detail}</small></button>)}</div></div>
        <div className="section"><h3>3 · פלטת צבעים</h3><div className="palettes">{palettes.map(([id,name,colors])=><button key={id} aria-pressed={palette===id} className={palette===id?"selected":""} onClick={()=>{setPalette(id);changed()}}><span className="chips">{colors.map(color=><i key={color} style={{background:color}}/>)}</span><strong>{name}</strong></button>)}</div></div>
        <div className="section options"><label>כמות אביזרים<select value={density} onChange={e=>{setDensity(e.target.value);changed()}}><option value="none">בלי אביזרים</option><option value="subtle">מעט</option><option value="rich">עשיר</option></select></label><label>גודל התוצאה<select value={ratio} onChange={e=>{setRatio(e.target.value);changed()}}><option value="square">ריבוע</option><option value="portrait">לאורך</option></select></label></div></div>
        <button className="generate" onClick={generate} disabled={busy||!file}>{busy?"יוצרים…":result?"יצירת גרסה נוספת":"יצירת תמונה"}</button>
      </aside>
    </div>
  </main>
}
