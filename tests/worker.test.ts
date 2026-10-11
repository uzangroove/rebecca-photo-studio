import {test} from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
const headers={authorization:`Basic ${Buffer.from("rebecca:test-password").toString("base64")}`};
const env={STUDIO_PASSWORD:"test-password",ASSETS:{fetch:async()=>new Response("asset")}};
test("unconfigured server fails closed for the API",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/api/settings"),{...env,STUDIO_PASSWORD:""} as any)).status,503)});
test("the interface loads without credentials (it holds the sign-in screen)",async()=>{const result=await worker.fetch(new Request("https://studio.test/"),env as any);assert.equal(result.status,200);assert.equal(await result.text(),"asset");assert.equal(result.headers.get("cache-control"),"private, no-store")});
test("API requires credentials and never triggers a browser password prompt",async()=>{for(const path of ["/api/generate","/api/settings"]){const r=await worker.fetch(new Request(`https://studio.test${path}`),env as any);assert.equal(r.status,401);assert.equal(r.headers.get("www-authenticate"),null)}});
test("wrong password is rejected",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/api/settings",{headers:{authorization:"Basic cmViZWNjYTpiYWQ="}}),env as any)).status,401)});
test("site account session is accepted only for admins",async()=>{
 const originalFetch=globalThis.fetch;const sbEnv={ASSETS:env.ASSETS,SUPABASE_URL:"https://sb.test",SUPABASE_ANON_KEY:"anon",STUDIO_KV:undefined};
 let admin=true;
 globalThis.fetch=async (input:any)=>{const u=String(input);
  if(u.endsWith("/auth/v1/user"))return Response.json({id:"u1"});
  if(u.endsWith("/rest/v1/rpc/is_admin"))return Response.json(admin);
  throw new Error("unexpected "+u)};
 try{
  const ok=await worker.fetch(new Request("https://studio.test/api/settings",{headers:{authorization:"Bearer token-admin"}}),sbEnv as any);
  assert.notEqual(ok.status,401);
  admin=false;
  const no=await worker.fetch(new Request("https://studio.test/api/settings",{headers:{authorization:"Bearer token-not-admin"}}),sbEnv as any);
  assert.equal(no.status,401);
 }finally{globalThis.fetch=originalFetch}
});
test("generation requires POST",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/api/generate",{headers}),env as any)).status,405)});
test("foreign origin generation is rejected",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/api/generate",{method:"POST",headers:{...headers,origin:"https://other.test"}}),env as any)).status,403)});
test("missing API key has actionable response",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/api/generate",{method:"POST",headers}),env as any)).status,503)});
test("selected palette reaches prompt and landscape uses a matching source size",async()=>{
 const originalFetch=globalThis.fetch;
 let checked=false;
 globalThis.fetch=async (_input,init)=>{
  const form=init?.body as FormData;
  assert.equal(form.get("size"),"1536x1024");
  assert.match(String(form.get("prompt")),/#2A4B3C, #6B8E76, #C6D8CB/);
  checked=true;
  return Response.json({data:[{b64_json:"dGVzdA=="}]});
 };
 try{
  const body=new FormData();body.set("image",new File([new Uint8Array(1200)],"soap.png",{type:"image/png"}));
  for(const [key,value] of Object.entries({style:"boutique",palette:"forest",density:"subtle",ratio:"landscape",product:"soap"}))body.set(key,value);
  const response=await worker.fetch(new Request("https://studio.test/api/generate",{method:"POST",headers,body}),{...env,OPENAI_API_KEY:"test-only"} as any);
  assert.equal(response.status,200);assert.equal((await response.json()).image,"dGVzdA==");assert.ok(checked);
 }finally{globalThis.fetch=originalFetch}
});
