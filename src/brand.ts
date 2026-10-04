import type {BrandSettings} from "../shared/settings.ts";

export async function readBrandFile(file: File) {
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size>5*1024*1024)throw new Error("העלו PNG, JPG, WebP או SVG עד 5 מגה־בייט");
  if(file.type==="image/svg+xml"){
    const xml=new DOMParser().parseFromString(await file.text(),"image/svg+xml");
    if(xml.querySelector("parsererror")||xml.documentElement.localName!=="svg")throw new Error("קובץ SVG אינו תקין");
    for(const node of Array.from(xml.getElementsByTagName("*"))){
      if(["script","foreignObject","iframe","image","animate","set"].includes(node.localName))throw new Error("קובץ SVG כולל רכיב שאינו נתמך");
      for(const attr of Array.from(node.attributes)){
        const value=attr.value.trim();
        if(attr.name.toLowerCase().startsWith("on") || /(?:@import|url\s*\(|javascript:|data:|https?:|<|>)/i.test(value) || ((attr.localName==="href")&&!value.startsWith("#")))throw new Error("קובץ SVG כולל תוכן חיצוני שאינו נתמך");
      }
    }
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(new XMLSerializer().serializeToString(xml.documentElement));
  }
  return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("לא הצלחנו לקרוא את הקובץ"));reader.readAsDataURL(file)});
}
async function drawBrand(ctx: CanvasRenderingContext2D, source: string, part: "logo"|"slogan", x: number, y: number, scale: number) {
  const mark=new Image();mark.src=source;await mark.decode();
  const builtIn=source==="/assets/logo.png";
  const sx=builtIn?mark.naturalWidth*.027:0;
  const sy=builtIn?mark.naturalHeight*(part==="logo"?.37:.515):0;
  const sw=builtIn?mark.naturalWidth*.945:mark.naturalWidth;
  const sh=builtIn?mark.naturalHeight*(part==="logo"?.14:.125):mark.naturalHeight;
  const w=ctx.canvas.width,h=ctx.canvas.height;
  const dw=Math.min(w*(part==="logo"?.30:.34),h*.17*sw/sh)*scale/100,dh=dw*sh/sw;
  const left=w*.025+(20-x)/20*(w-dw-w*.05);
  const top=h*.025+y/20*(h-dh-h*.05);
  ctx.drawImage(mark,sx,sy,sw,sh,left,top,dw,dh);
}
export async function composeImage(source: string, branding: BrandSettings&{caption:string}, format:{width:number;height:number}) {
  const image = new Image(); image.src = source; await image.decode();
  const canvas = document.createElement("canvas"); canvas.width = format.width; canvas.height = format.height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("לא הצלחנו להכין את התמונה להורדה");
  const crop=Math.min(image.naturalWidth/format.width,image.naturalHeight/format.height);
  const sw=format.width*crop,sh=format.height*crop;
  ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,0,0,format.width,format.height);
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
  if(branding.logo)await drawBrand(ctx,branding.logoSource,"logo",branding.logoX,branding.logoY,branding.logoScale);
  if(branding.slogan)await drawBrand(ctx,branding.sloganSource,"slogan",branding.sloganX,branding.sloganY,branding.sloganScale);
  return canvas;
}

