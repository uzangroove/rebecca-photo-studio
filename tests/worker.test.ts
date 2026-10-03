import {test} from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
const headers={authorization:`Basic ${Buffer.from("rebecca:test-password").toString("base64")}`};
const env={STUDIO_PASSWORD:"test-password",ASSETS:{fetch:async()=>new Response("asset")}};
test("unconfigured server fails closed",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/"),{...env,STUDIO_PASSWORD:""} as any)).status,503)});
test("assets and generation both require credentials",async()=>{for(const path of ["/","/assets/logo.png","/api/generate"]){assert.equal((await worker.fetch(new Request(`https://studio.test${path}`),env as any)).status,401)}});
test("wrong password is rejected",async()=>{assert.equal((await worker.fetch(new Request("https://studio.test/",{headers:{authorization:"Basic cmViZWNjYTpiYWQ="}}),env as any)).status,401)});
test("authenticated assets are private",async()=>{const result=await worker.fetch(new Request("https://studio.test/",{headers}),env as any);assert.equal(await result.text(),"asset");assert.equal(result.headers.get("cache-control"),"private, no-store")});
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
