import {test} from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
import {defaultLayout} from "../shared/brand-layout.ts";
import {defaultSettings,defaultNeverList,parseSettings,validSource,MAX_SETTINGS_BYTES,MAX_NEVER_ITEMS,type StudioSettings} from "../shared/settings.ts";

const headers={authorization:`Basic ${Buffer.from("rebecca:test-password").toString("base64")}`};
const fakeKv=()=>{const data=new Map<string,string>();return {data,get:async(key:string)=>data.get(key)??null,put:async(key:string,value:string)=>{data.set(key,value)}}};
const call=(path:string,init:RequestInit={},kv:ReturnType<typeof fakeKv>|null=fakeKv(),extra:object={})=>
  worker.fetch(new Request(`https://studio.test${path}`,{headers,...init}),{STUDIO_PASSWORD:"test-password",ASSETS:{fetch:async()=>new Response("asset")},STUDIO_KV:kv??undefined,...extra} as any);
const put=(body:unknown,kv?:ReturnType<typeof fakeKv>,extraHeaders:Record<string,string>={})=>
  call("/api/settings",{method:"PUT",headers:{...headers,...extraHeaders},body:typeof body==="string"?body:JSON.stringify(body)},kv);
const customLayout={...defaultLayout({width:1080,height:1350}),logo:{...defaultLayout({width:1080,height:1350}).logo,visible:true,cx:42.5,w:33}};
const settings=(patch:Partial<StudioSettings>={}):StudioSettings=>({...defaultSettings,...patch});

test("settings require credentials",async()=>{
  const response=await worker.fetch(new Request("https://studio.test/api/settings"),{STUDIO_PASSWORD:"test-password",STUDIO_KV:fakeKv()} as any);
  assert.equal(response.status,401);
});
test("empty store returns null settings; saved settings round-trip",async()=>{
  const kv=fakeKv();
  assert.deepEqual(await (await call("/api/settings",{},kv)).json(),{settings:null});
  const next=settings({neverList:["שיש","עומס"],brand:{...defaultSettings.brand,logoName:"הלוגו שלי"},layouts:{"instagram-portrait":customLayout}});
  assert.equal((await put(next,kv)).status,200);
  assert.deepEqual(await (await call("/api/settings",{},kv)).json(),{settings:next});
});
test("settings responses are never cached",async()=>{
  assert.match((await call("/api/settings")).headers.get("cache-control")||"",/no-store/);
});
test("invalid settings are rejected and not stored",async()=>{
  const kv=fakeKv();
  const bad:unknown[]=[
    "not json","[]",{},{...settings(),version:4},
    settings({neverList:"שיש" as any}),
    settings({neverList:["a\nb"]}),
    settings({neverList:Array.from({length:MAX_NEVER_ITEMS+1},(_,i)=>`x${i}`)}),
    settings({neverList:["x".repeat(41)]}),
    settings({brand:{...defaultSettings.brand,logoName:5 as any}}),
    settings({layouts:{"instagram-portrait":{...customLayout,logo:{...customLayout.logo,cx:101}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,logo:{...customLayout.logo,w:0}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,slogan:{...customLayout.slogan,cy:Number.NaN}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,logo:{...customLayout.logo,lock:"yes" as any}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,text:{...customLayout.text,font:"comic-sans" as any}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,text:{...customLayout.text,text:"a\nb"}}}}),
    settings({layouts:{"instagram-portrait":{...customLayout,text:{...customLayout.text,color:"red" as any}}}}),
    settings({layouts:{"not-a-format":customLayout}}),
    settings({layouts:[] as any}),
    settings({brand:{...defaultSettings.brand,logoSource:"https://evil.test/logo.png"}}),
    settings({brand:{...defaultSettings.brand,logoSource:"javascript:alert(1)"}})
  ];
  for(const body of bad)assert.equal((await put(body as any,kv)).status,400,JSON.stringify(body)?.slice(0,80));
  assert.equal(kv.data.size,0);
});
test("oversized settings are refused with 413",async()=>{
  const kv=fakeKv();
  const huge=settings({brand:{...defaultSettings.brand,logoName:"x".repeat(MAX_SETTINGS_BYTES)}});
  assert.equal((await put(huge,kv)).status,413);
  assert.equal(kv.data.size,0);
});
test("logo and slogan sources: built-in files and raster or clean SVG data URIs only",()=>{
  assert.ok(validSource("/assets/rebecca_studio_logo.png"));
  assert.ok(validSource("data:image/png;base64,iVBORw0KGgo="));
  assert.ok(validSource("data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1"/></svg>')));
  assert.ok(!validSource("data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg><script>alert(1)</script></svg>')));
  assert.ok(!validSource("data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg onload="x()"></svg>')));
  assert.ok(!validSource("data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg><image href="https://evil.test/a.png"/></svg>')));
  assert.ok(!validSource("data:text/html;base64,PGgxPg=="));
  assert.ok(!validSource("/assets/other.png"));
  assert.ok(!validSource(""));
  assert.ok(!validSource(42));
});
test("parseSettings drops unknown fields and de-duplicates the never-list",()=>{
  const parsed=parseSettings({...settings({neverList:["שיש"," שיש ","עומס"]}),secret:"x",brand:{...defaultSettings.brand,extra:1}});
  assert.deepEqual(parsed,settings({neverList:["שיש","עומס"]}));
});
test("only same-origin pages may write settings",async()=>{
  assert.equal((await put(settings(),fakeKv(),{origin:"https://other.test"})).status,403);
  assert.equal((await put(settings(),fakeKv(),{origin:"https://studio.test"})).status,200);
});
test("settings need the KV binding and allow only GET and PUT",async()=>{
  assert.equal((await call("/api/settings",{},null)).status,503);
  assert.equal((await call("/api/settings",{method:"DELETE"})).status,405);
  assert.equal((await call("/api/settings",{method:"POST",body:"{}"})).status,405);
});
test("corrupt stored settings are reported, not served",async()=>{
  const kv=fakeKv();kv.data.set("settings","{broken");
  assert.equal((await call("/api/settings",{},kv)).status,500);
});
test("the saved never-list reaches the generation prompt",async()=>{
  const kv=fakeKv();await put(settings({neverList:["שיש","עומס"]}),kv);
  const originalFetch=globalThis.fetch;let prompt="";
  globalThis.fetch=async(_input,init)=>{prompt=String((init?.body as FormData).get("prompt"));return Response.json({data:[{b64_json:"dGVzdA=="}]})};
  try{
    const body=new FormData();body.set("image",new File([new Uint8Array(1200)],"soap.png",{type:"image/png"}));
    for(const [key,value] of Object.entries({style:"boutique",palette:"forest",density:"none",ratio:"square",product:"soap"}))body.set(key,value);
    const response=await call("/api/generate",{method:"POST",body},kv,{OPENAI_API_KEY:"test-only"});
    assert.equal(response.status,200);
    assert.ok(prompt.endsWith("\nStrictly avoid: שיש, עומס."));
  }finally{globalThis.fetch=originalFetch}
});
test("generation rejects values outside the catalog",async()=>{
  const originalFetch=globalThis.fetch;let called=false;
  globalThis.fetch=async()=>{called=true;return Response.json({})};
  try{
    for(const bad of [{style:"nope"},{palette:"nope"},{density:"nope"},{product:"jar"},{ratio:"wide"}]){
      const body=new FormData();body.set("image",new File([new Uint8Array(1200)],"soap.png",{type:"image/png"}));
      for(const [key,value] of Object.entries({style:"boutique",palette:"forest",density:"none",ratio:"square",product:"soap",...bad}))body.set(key,value);
      assert.equal((await call("/api/generate",{method:"POST",body},fakeKv(),{OPENAI_API_KEY:"test-only"})).status,400,JSON.stringify(bad));
    }
    assert.ok(!called);
  }finally{globalThis.fetch=originalFetch}
});
test("defaults: never-list has marble and clutter, and the four built-in recipes are present",()=>{
  assert.deepEqual(defaultSettings.neverList,["שיש","עומס"]);
  assert.deepEqual(defaultSettings.recipes.map(r=>r.id),["boutique-bw","boutique-desert","minimal-bw","minimal-desert"]);
  assert.equal(defaultSettings.version,3);
  assert.deepEqual(defaultSettings.layouts,{});
});
test("recipes sync with the rest of the settings and invalid ones are refused",async()=>{
  const kv=fakeKv();
  const mine={id:"mine-1",name:"הסתיו שלי",look:{style:"rustic",palette:"autumn",props:"subtle",surface:"oak",background:null,light:"golden"}};
  const next=settings({recipes:[...defaultSettings.recipes,mine]});
  assert.equal((await put(next,kv)).status,200);
  assert.deepEqual(await (await call("/api/settings",{},kv)).json(),{settings:next});
  assert.equal((await put(settings({recipes:[{...mine,look:{...mine.look,palette:"nope"}}]}),kv)).status,400);
  assert.equal((await put({...settings(),recipes:"x"},kv)).status,400);
});
test("settings saved by phase 0 (version 1) are upgraded: empty never-list becomes the default",()=>{
  const legacyBrand={logo:false,slogan:false,logoSource:"/assets/rebecca_studio_logo.png",sloganSource:"/assets/rebecca_studio_slogan.png",logoName:"הלוגו של רבקה",sloganName:"הסלוגן של רבקה",
    logoX:0,logoY:0,logoScale:100,sloganX:10,sloganY:20,sloganScale:100};
  const v1=parseSettings({version:1,neverList:[],brand:legacyBrand});
  assert.deepEqual(v1?.neverList,["שיש","עומס"]);
  assert.equal(v1?.recipes.length,4);
  assert.equal(v1?.version,3);
  const custom=parseSettings({version:1,neverList:["ורוד"],brand:legacyBrand});
  assert.deepEqual(custom?.neverList,["ורוד"]);
  assert.deepEqual(defaultNeverList,["שיש","עומס"]);
});
test("generation accepts the look fields and the special request, and refuses bad ones",async()=>{
  const originalFetch=globalThis.fetch;let prompt="";
  globalThis.fetch=async(_input,init)=>{prompt=String((init?.body as FormData).get("prompt"));return Response.json({data:[{b64_json:"dGVzdA=="}]})};
  const send=async(extra:Record<string,string>)=>{
    const body=new FormData();body.set("image",new File([new Uint8Array(1200)],"soap.png",{type:"image/png"}));
    for(const [key,value] of Object.entries({style:"boutique",palette:"desert",density:"none",ratio:"square",product:"soap",...extra}))body.set(key,value);
    return call("/api/generate",{method:"POST",body},fakeKv(),{OPENAI_API_KEY:"test-only"});
  };
  try{
    assert.equal((await send({surface:"plaster",background:"blur",light:"golden",wish:"בוקר שבת"})).status,200);
    assert.ok(prompt.includes("Surface: a soft plaster surface.")&&prompt.includes("Background: a softly blurred interior.")&&prompt.includes("Lighting: warm golden hour light."));
    assert.ok(prompt.endsWith("Additional wish from the maker (Hebrew): בוקר שבת"));
    assert.equal((await send({surface:"",background:"",light:""})).status,200);
    assert.ok(prompt.includes("Surface: a textured fine paper surface."),"empty field falls back to the style default");
    for(const bad of [{surface:"gold"},{background:"mars"},{light:"neon"},{wish:"א".repeat(201)}])assert.equal((await send(bad)).status,400,JSON.stringify(bad));
  }finally{globalThis.fetch=originalFetch}
});
test("settings saved by phase 1 (version 2, one position for all formats) become a layout in every format",()=>{
  const legacy={logo:true,slogan:true,logoSource:"/assets/rebecca_studio_logo.png",sloganSource:"/assets/rebecca_studio_slogan.png",logoName:"x",sloganName:"y",
    logoX:10,logoY:0,logoScale:100,sloganX:10,sloganY:20,sloganScale:100};
  const parsed=parseSettings({version:2,neverList:["שיש"],recipes:defaultSettings.recipes,brand:legacy});
  assert.equal(Object.keys(parsed!.layouts).length,16);
  const layout=parsed!.layouts["instagram-portrait"];
  assert.ok(layout.logo.visible&&layout.slogan.visible&&!layout.text.visible);
  assert.ok(Math.abs(layout.logo.cx-50)<0.01,"x=10 on the old grid is the center");
  assert.ok(layout.slogan.cy>85,"y=20 on the old grid is the bottom");
});
test("a broken old brand block does not make the whole settings object unreadable",()=>{
  const parsed=parseSettings({version:2,neverList:["שיש"],recipes:defaultSettings.recipes,brand:{logo:true,slogan:false,logoSource:"/assets/rebecca_studio_logo.png",sloganSource:"/assets/rebecca_studio_slogan.png",logoName:"x",sloganName:"y",logoX:99}});
  assert.deepEqual(parsed?.layouts,{});
  assert.equal(parsed?.brand.logoName,"x");
});
test("the old combined logo file is replaced by the separate logo and slogan files",()=>{
  const parsed=parseSettings({...defaultSettings,brand:{...defaultSettings.brand,logoSource:"/assets/logo.png",sloganSource:"/assets/logo.png"}});
  assert.equal(parsed?.brand.logoSource,"/assets/rebecca_studio_logo.png");
  assert.equal(parsed?.brand.sloganSource,"/assets/rebecca_studio_slogan.png");
});

test("the interface theme is a palette id (or none), synced with the other settings",async()=>{
  const kv=fakeKv();
  assert.equal(defaultSettings.theme,null);
  const next=settings({theme:"forest"});
  assert.equal((await put(next,kv)).status,200);
  assert.deepEqual(await (await call("/api/settings",{},kv)).json(),{settings:next});
  assert.equal((await put(settings({theme:"not-a-palette"}),kv)).status,400);
  assert.equal((await put(settings({theme:5 as any}),kv)).status,400);
  assert.equal(parseSettings({...defaultSettings,theme:undefined})?.theme,null,"settings saved before themes existed read as the default theme");
  assert.equal((await put(settings({theme:null}),kv)).status,200);
});
test("when the image service rejects the key, the answer says why and never echoes a key",async()=>{
  const originalFetch=globalThis.fetch;
  const send=async(status:number,body:unknown)=>{
    globalThis.fetch=async()=>Response.json(body,{status});
    const form=new FormData();form.set("image",new File([new Uint8Array(1200)],"soap.png",{type:"image/png"}));
    for(const [key,value] of Object.entries({style:"boutique",palette:"forest",density:"none",ratio:"square",product:"soap"}))form.set(key,value);
    const response=await call("/api/generate",{method:"POST",body:form},fakeKv(),{OPENAI_API_KEY:"  sk-test-only-secretbytes  "});
    return {status:response.status,json:await response.json() as {error:string;code:string;detail:string}};
  };
  try{
    const bad=await send(401,{error:{code:"invalid_api_key",message:"Incorrect API key provided: sk-proj-abcd***wxyz. You can find your API key at https://platform.openai.com."}});
    assert.equal(bad.status,502);assert.match(bad.json.error,/401/);assert.match(bad.json.error,/מסתיים ב־ytes/,"only the last four characters of the key are shown");assert.ok(!bad.json.error.includes("secretby"));assert.equal(bad.json.code,"invalid_api_key");
    assert.ok(bad.json.detail.includes("Incorrect API key provided"));assert.ok(!/sk-proj/.test(bad.json.detail),"the key is masked");
    const verify=await send(403,{error:{code:"model_not_found",message:"Your organization must be verified to use the model."}});
    assert.match(verify.json.error,/403/);assert.match(verify.json.detail,/must be verified/);
    const missing=await send(404,{error:{code:"model_not_found",message:"The model does not exist."}});
    assert.match(missing.json.error,/OPENAI_IMAGE_MODEL/);
    const other=await send(500,{});assert.equal(other.status,502);assert.equal(other.json.detail,"");
  }finally{globalThis.fetch=originalFetch}
});
