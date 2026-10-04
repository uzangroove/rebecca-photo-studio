import {generate} from "./generate.ts";
import {authorized} from "./auth.ts";
import {settings} from "./settings.ts";
type Env={ASSETS:Fetcher;STUDIO_KV?:KVNamespace;STUDIO_USER?:string;STUDIO_PASSWORD?:string;OPENAI_API_KEY?:string;OPENAI_IMAGE_MODEL?:string};
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    if(!env.STUDIO_PASSWORD)return new Response("יש להגדיר סיסמת כניסה בהגדרות השרת",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    if(!await authorized(request,env.STUDIO_USER||"rebecca",env.STUDIO_PASSWORD))return new Response("נדרשת כניסה לסטודיו",{status:401,headers:{"WWW-Authenticate":'Basic realm="Rebecca Studio", charset="UTF-8"',"Cache-Control":"no-store"}});
    const url=new URL(request.url);let response:Response;
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
