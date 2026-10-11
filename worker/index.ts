import {generate} from "./generate.ts";
import {authorized} from "./auth.ts";
import {settings} from "./settings.ts";
import {sessionAuthorized, sessionConfigured} from "./session.ts";
type Env={ASSETS:Fetcher;STUDIO_KV?:KVNamespace;STUDIO_USER?:string;STUDIO_PASSWORD?:string;OPENAI_API_KEY?:string;OPENAI_IMAGE_MODEL?:string;SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string};
// הממשק עצמו (קבצים סטטיים) פתוח, כי מסך הכניסה הוא חלק ממנו. כל פעולה בשרת (/api/) דורשת כניסה:
// חשבון האתר (Supabase), או — לתקופת המעבר — הסיסמה הישנה, אם עדיין מוגדרת.
async function apiAuthorized(request:Request,env:Env):Promise<boolean>{
  if(await sessionAuthorized(request,env))return true;
  return Boolean(env.STUDIO_PASSWORD)&&await authorized(request,env.STUDIO_USER||"rebecca",env.STUDIO_PASSWORD!);
}
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);let response:Response;
    if(url.pathname.startsWith("/api/")){
      if(!sessionConfigured(env)&&!env.STUDIO_PASSWORD)return Response.json({error:"יש להגדיר את חיבור הכניסה בהגדרות השרת"},{status:503});
      if(!await apiAuthorized(request,env))return Response.json({error:"צריך להתחבר מחדש לסטודיו"},{status:401,headers:{"Cache-Control":"no-store"}});
    }
    if(url.pathname==="/api/generate"){
      if(request.method!=="POST")return new Response("Method not allowed",{status:405,headers:{Allow:"POST"}});
      if(Number(request.headers.get("content-length")||0)>11*1024*1024)return Response.json({error:"הקובץ גדול מדי"},{status:413});
      response=await generate(request,env);
    }else if(url.pathname==="/api/settings"){
      response=await settings(request,env.STUDIO_KV);
    }else if(url.pathname.startsWith("/api/"))response=new Response("Not found",{status:404});
    else response=await env.ASSETS.fetch(request);
    const secured=new Response(response.body,response);
    secured.headers.set("Cache-Control","private, no-store");
    secured.headers.set("X-Content-Type-Options","nosniff");
    secured.headers.set("Referrer-Policy","same-origin");
    return secured;
  }
};
