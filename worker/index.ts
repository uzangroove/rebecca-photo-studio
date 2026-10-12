import {generate} from "./generate.ts";
import {authorized} from "./auth.ts";
import {settings} from "./settings.ts";
import {suggest, siteOrigin, corsHeaders} from "./suggest.ts";
import {sessionAuthorized, sessionConfigured} from "./session.ts";
type Env={ASSETS:Fetcher;STUDIO_KV?:KVNamespace;STUDIO_USER?:string;STUDIO_PASSWORD?:string;OPENAI_API_KEY?:string;OPENAI_IMAGE_MODEL?:string;OPENAI_TEXT_MODEL?:string;SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string};
// הממשק עצמו (קבצים סטטיים) פתוח, כי מסך הכניסה הוא חלק ממנו. כל פעולה בשרת (/api/) דורשת כניסה:
// חשבון האתר (Supabase), או — לתקופת המעבר — הסיסמה הישנה, אם עדיין מוגדרת.
async function apiAuthorized(request:Request,env:Env):Promise<boolean>{
  if(await sessionAuthorized(request,env))return true;
  return Boolean(env.STUDIO_PASSWORD)&&await authorized(request,env.STUDIO_USER||"rebecca",env.STUDIO_PASSWORD!);
}
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);
    // /api/suggest נקרא גם מממשק הניהול של האתר (כתובת אחרת), ולכן מקבל CORS — רק לכתובות האתר.
    const cors=url.pathname==="/api/suggest"?siteOrigin(request):null;
    const withCors=(r:Response)=>{if(!cors)return r;const out=new Response(r.body,r);for(const [k,v] of Object.entries(corsHeaders(cors)))out.headers.set(k,v);return out;};
    if(url.pathname==="/api/suggest"&&request.method==="OPTIONS")return cors?new Response(null,{status:204,headers:corsHeaders(cors)}):new Response(null,{status:403});
    let response:Response;
    if(url.pathname.startsWith("/api/")){
      if(!sessionConfigured(env)&&!env.STUDIO_PASSWORD)return withCors(Response.json({error:"יש להגדיר את חיבור הכניסה בהגדרות השרת"},{status:503}));
      if(!await apiAuthorized(request,env))return withCors(Response.json({error:"צריך להתחבר מחדש לסטודיו"},{status:401,headers:{"Cache-Control":"no-store"}}));
    }
    if(url.pathname==="/api/generate"){
      if(request.method!=="POST")return new Response("Method not allowed",{status:405,headers:{Allow:"POST"}});
      if(Number(request.headers.get("content-length")||0)>11*1024*1024)return Response.json({error:"הקובץ גדול מדי"},{status:413});
      response=await generate(request,env);
    }else if(url.pathname==="/api/suggest"){
      if(request.method!=="POST")return withCors(new Response("Method not allowed",{status:405,headers:{Allow:"POST, OPTIONS"}}));
      const origin=request.headers.get("origin");
      if(origin&&!cors&&origin!==url.origin)return Response.json({error:"בקשה לא מורשית"},{status:403});
      response=await suggest(request,env);
    }else if(url.pathname==="/api/settings"){
      response=await settings(request,env.STUDIO_KV);
    }else if(url.pathname.startsWith("/api/"))response=new Response("Not found",{status:404});
    else response=await env.ASSETS.fetch(request);
    const secured=new Response(response.body,response);
    secured.headers.set("Cache-Control","private, no-store");
    secured.headers.set("X-Content-Type-Options","nosniff");
    secured.headers.set("Referrer-Policy","same-origin");
    return withCors(secured);
  }
};
