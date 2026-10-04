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
