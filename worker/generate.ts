

const scenes: Record<string,string> = {
  boutique:"a refined luxury boutique product photograph, premium stone or textured paper, sculptural light",
  rustic:"a rustic handcrafted setting with natural wood and linen, warm window light",
  urban:"a contemporary urban studio with concrete and architectural window light",
  minimal:"a calm minimal studio scene with generous negative space and simple surfaces",
  botanical:"a botanical scene with real leaves and soft natural daylight",
  spa:"a peaceful spa setting with stone, folded fabric and diffused light",
  mediterranean:"a Mediterranean scene with warm plaster, sunlight and an olive branch",
  japandi:"a warm Japandi interior with pale wood and quiet ceramic details",
  editorial:"an artistic editorial studio photograph with bold but realistic shadows",
  gift:"a thoughtful gift and hosting scene with natural fabric and elegant table styling"
};
const colors: Record<string,string> = {
  rebecca:"warm cream, deep forest green and restrained antique gold",
  earth:"sand, terracotta brown and muted olive",
  city:"soft concrete gray, charcoal and warm copper",
  clean:"ivory, pale sage and cool green",
  garden:"leaf green, soft moss and pale peach",
  romance:"blush, dusty rose and warm mauve",
  sea:"chalk white, sea glass blue-green and sand",
  evening:"deep forest green, muted charcoal and warm brass"
};
const props: Record<string,string> = {
  none:"No styling props. Use only the product and the surface.",
  subtle:"Use one or two subtle contextual props well away from the product.",
  rich:"Use a few tasteful contextual props while keeping the product clearly dominant."
};
let active = 0;
export async function generate(request: Request, env: {OPENAI_API_KEY?: string; OPENAI_IMAGE_MODEL?: string}) {
  const origin=request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:"בקשה לא מורשית"}, {status:403});
  const key=env.OPENAI_API_KEY;
  if (!key) return Response.json({error:"יצירת התמונות עדיין אינה מחוברת. נדרש חיבור מאובטח לשירות התמונות."},{status:503});
  if (active>=2) return Response.json({error:"יש כבר יצירה בתהליך. נסו שוב בעוד רגע."},{status:429});
  active++;
  try {
    const form=await request.formData(),photo=form.get("image");
    const style=String(form.get("style")||""),palette=String(form.get("palette")||"");
    const density=String(form.get("density")||""),ratio=String(form.get("ratio")||"");
    const product=String(form.get("product")||"");
    if (!(photo instanceof File) || !["image/png","image/jpeg","image/webp"].includes(photo.type) || photo.size<1000 || photo.size>10*1024*1024 ||
      !scenes[style] || !colors[palette] || !props[density] || !["square","portrait"].includes(ratio) || !["soap","candle"].includes(product))
      return Response.json({error:"הצילום או אפשרויות העיצוב אינם תקינים"},{status:400});
    const item=product==="soap"?"handmade soaps":"handmade candles";
    const prompt=`Create a single photorealistic commercial product photograph by editing the supplied photo of ${item}.
The image itself must become one coherent edge-to-edge scene. No frames, mats, borders, poster layouts, inset source photos, cards, text overlays, typography, additional logos or watermarks.
Keep the exact number, shape, silhouette, arrangement, scale, material, colors, surface details and existing labels of the actual products in the supplied photo. Do not redesign or invent products. Do not change the words on any existing label. Keep the products central and recognizable.
Replace and integrate the background and surrounding surface as ${scenes[style]}. Use this color direction in the ENVIRONMENT ONLY: ${colors[palette]}. Do not recolor the products. ${props[density]}
Make perspective, natural lighting, contact shadows and reflections consistent so the products feel physically present. Leave sufficient breathing room. Output one finished photograph, no graphic layout.`;
    const upstream=new FormData();
    upstream.append("model",env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst");
    upstream.append("prompt",prompt);
    upstream.append("size",ratio==="portrait"?"1024x1536":"1024x1024");
    upstream.append("quality","medium");
    upstream.append("image",photo,photo.name||"product.png");
    const response=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",headers:{Authorization:`Bearer ${key}`},body:upstream,
      signal:AbortSignal.timeout(120000)
    });
    if (!response.ok) {
      let code="";
      try {
        const detail=await response.json() as {error?:{code?:string;type?:string}};
        code=String(detail.error?.code||detail.error?.type||"").replace(/[^a-z0-9_]/gi,"").slice(0,80);
      } catch {}
      const requestId=response.headers.get("x-request-id")||"";
      console.warn("Image API rejected request", {status:response.status,code,requestId});
      const creditCodes=new Set(["insufficient_quota","credit_balance_exhausted","billing_hard_limit_reached"]);
      const limitCodes=new Set(["organization_usage_limit_exceeded","organization_spend_limit_exceeded","project_spend_limit_exceeded"]);
      if (response.status===429 && creditCodes.has(code))
        return Response.json({error:"אין כרגע יתרת שימוש זמינה בחשבון OpenAI API. בדקו את יתרת ה־API ואת הגדרות החיוב.",code},{status:402});
      if (response.status===429 && limitCodes.has(code))
        return Response.json({error:"חשבון OpenAI API הגיע למגבלת שימוש או הוצאה. בדקו את המגבלה של הארגון או הפרויקט.",code},{status:402});
      if (response.status===429)
        return Response.json({error:"שירות התמונות החזיר מגבלת בקשות זמנית. המתינו מעט ונסו שוב. אם זה חוזר, בדקו את מגבלות ה־API.",code},{status:429});
      if (response.status===401 || response.status===403)
        return Response.json({error:"מפתח ה־API או הרשאת מודל התמונות דורשים בדיקה.",code},{status:502});
      return Response.json({error:"שירות התמונות דחה את הבקשה. נסו צילום אחר או פנו לבדיקה.",code},{status:502});
    }
    const data=await response.json() as {data?:Array<{b64_json?:string}>};
    const image=data.data?.[0]?.b64_json;
    if (!image) return Response.json({error:"לא התקבלה תמונה חדשה. נסו שוב."},{status:502});
    return Response.json({image},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return Response.json({error:"החיבור ליצירת התמונות הופסק. נסו שוב."},{status:502});
  } finally {active--}
}
