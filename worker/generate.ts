

import {parseSelection} from "../shared/selection.ts";
import {buildPrompt} from "../shared/build-prompt.ts";
import {readSettings} from "./settings.ts";
let active = 0;
export async function generate(request: Request, env: {OPENAI_API_KEY?: string; OPENAI_IMAGE_MODEL?: string; STUDIO_KV?: KVNamespace}) {
  const origin=request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:"בקשה לא מורשית"}, {status:403});
  const key=env.OPENAI_API_KEY;
  if (!key) return Response.json({error:"יצירת התמונות עדיין אינה מחוברת. נדרש חיבור מאובטח לשירות התמונות."},{status:503});
  if (active>=2) return Response.json({error:"יש כבר יצירה בתהליך. נסו שוב בעוד רגע."},{status:429});
  active++;
  try {
    const form=await request.formData(),photo=form.get("image");
    const ratio=String(form.get("ratio")||"");
    // השדה "density" נשאר בשם הישן בבקשה; בקטלוג הוא קטגוריית "props". שדות המראה הריקים משמעם ברירת המחדל של הסגנון.
    const field=(name:string)=>form.get(name);
    const selection=parseSelection({product:field("product"),style:field("style"),palette:field("palette"),props:field("density"),
      surface:field("surface"),background:field("background"),light:field("light"),
      candleState:field("candleState"),giftWrap:field("giftWrap"),glassTint:field("glassTint"),angle:field("angle"),occasion:field("occasion"),wish:field("wish")});
    if (!(photo instanceof File) || !["image/png","image/jpeg","image/webp"].includes(photo.type) || photo.size<1000 || photo.size>10*1024*1024 ||
      !selection || !["square","portrait","landscape"].includes(ratio))
      return Response.json({error:"הצילום או אפשרויות העיצוב אינם תקינים"},{status:400});
    const prompt=buildPrompt(selection,await readSettings(env.STUDIO_KV));
    const upstream=new FormData();
    upstream.append("model",env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst");
    upstream.append("prompt",prompt);
    upstream.append("size",ratio==="portrait"?"1024x1536":ratio==="landscape"?"1536x1024":"1024x1024");
    upstream.append("quality","medium");
    upstream.append("image",photo,photo.name||"product.png");
    const response=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",headers:{Authorization:`Bearer ${key.trim()}`},body:upstream,
      signal:AbortSignal.timeout(120000)
    });
    if (!response.ok) {
      let code="",detail="";
      try {
        const body=await response.json() as {error?:{code?:string;type?:string;message?:string}};
        code=String(body.error?.code||body.error?.type||"").replace(/[^a-z0-9_]/gi,"").slice(0,80);
        // ההודעה של OpenAI מוצגת לרבקה כדי שיהיה ברור מה לתקן. מסירים ממנה כל דבר שנראה כמו מפתח.
        detail=String(body.error?.message||"").replace(/sk-[\w*.-]*/gi,"sk-…").replace(/[\u0000-\u001f]/g," ").slice(0,220);
      } catch {}
      const requestId=response.headers.get("x-request-id")||"";
      console.warn("Image API rejected request", {status:response.status,code,requestId});
      const creditCodes=new Set(["insufficient_quota","credit_balance_exhausted","billing_hard_limit_reached"]);
      const limitCodes=new Set(["organization_usage_limit_exceeded","organization_spend_limit_exceeded","project_spend_limit_exceeded"]);
      if (response.status===429 && creditCodes.has(code))
        return Response.json({error:"אין כרגע יתרת שימוש זמינה בחשבון OpenAI API. בדקו את יתרת ה־API ואת הגדרות החיוב.",code,detail},{status:402});
      if (response.status===429 && limitCodes.has(code))
        return Response.json({error:"חשבון OpenAI API הגיע למגבלת שימוש או הוצאה. בדקו את המגבלה של הארגון או הפרויקט.",code,detail},{status:402});
      if (response.status===429)
        return Response.json({error:"שירות התמונות החזיר מגבלת בקשות זמנית. המתינו מעט ונסו שוב. אם זה חוזר, בדקו את מגבלות ה־API.",code,detail},{status:429});
      // ארבעת התווים האחרונים של המפתח שהשרת שלח, כדי שאפשר יהיה לוודא שהוא המפתח החדש (לא נחשף מפתח שלם).
      const keyHint=key.trim().slice(-4);
      if (response.status===401)
        return Response.json({error:`מפתח ה־OpenAI API לא התקבל (401). המפתח שהשרת השתמש בו מסתיים ב־${keyHint}. בדקו שזה המפתח החדש, שהוא הועתק במלואו בלי רווחים, ושהוא פעיל.`,code,detail,keyHint},{status:502});
      if (response.status===403)
        return Response.json({error:"ל־OpenAI אין הרשאה למודל התמונות בחשבון הזה (403). ייתכן שנדרש אימות ארגון, או שהמפתח מוגבל למודלים אחרים.",code,detail},{status:502});
      if (response.status===404)
        return Response.json({error:"מודל התמונות שהוגדר אינו זמין בחשבון (404). יש לבדוק את OPENAI_IMAGE_MODEL.",code,detail},{status:502});
      return Response.json({error:"שירות התמונות דחה את הבקשה. נסו צילום אחר או פנו לבדיקה.",code,detail},{status:502});
    }
    const data=await response.json() as {data?:Array<{b64_json?:string}>};
    const image=data.data?.[0]?.b64_json;
    if (!image) return Response.json({error:"לא התקבלה תמונה חדשה. נסו שוב."},{status:502});
    return Response.json({image},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return Response.json({error:"החיבור ליצירת התמונות הופסק. נסו שוב."},{status:502});
  } finally {active--}
}
