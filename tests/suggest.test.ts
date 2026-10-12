import {test} from "node:test";
import assert from "node:assert/strict";
import {parseSuggestInput,buildSuggestMessages,cleanSuggestion,RULES} from "../shared/suggest.ts";

const ctx="סוג המוצר: סבון\nמתכון: שקדים וחלב — שיטת ייצור: CP — תהליך קר\nריח: לא נבחר ריח\nרכיבים: שמן זית 30%, שמן שקדים 20%";
const tinyJpeg="data:image/jpeg;base64,"+"A".repeat(400);

test("input: names and describe need product details; analyze needs an image from an allowed place",()=>{
  assert.equal(parseSuggestInput({task:"names",context:""}),null);
  assert.equal(parseSuggestInput({task:"describe"}),null);
  assert.equal(parseSuggestInput({task:"other",context:ctx}),null);
  assert.ok(parseSuggestInput({task:"names",context:ctx}));
  assert.equal(parseSuggestInput({task:"analyze",context:ctx}),null,"no image");
  assert.equal(parseSuggestInput({task:"analyze",image:"https://evil.example.com/x.jpg"}),null,"foreign host");
  assert.equal(parseSuggestInput({task:"analyze",image:"data:text/html;base64,AAAA"}),null,"not an image");
  assert.ok(parseSuggestInput({task:"analyze",image:tinyJpeg}));
  assert.ok(parseSuggestInput({task:"analyze",image:"https://nvtpngjecdzerbbzqmtg.supabase.co/storage/v1/object/public/media/products/a.jpg"}));
  assert.ok(parseSuggestInput({task:"analyze",image:"https://rebecca-studio.netlify.app/images/products/soap-stone.jpg"}));
  assert.ok(parseSuggestInput({task:"analyze",image:"https://deploy-preview-2--rebecca-studio.netlify.app/images/products/soap-stone.jpg"}));
});
test("input is clipped and the avoid list is bounded",()=>{
  const p=parseSuggestInput({task:"names",context:"x".repeat(9000),avoid:Array.from({length:50},(_,i)=>"שם "+i)})!;
  assert.equal(p.context.length,3000);assert.equal(p.avoid!.length,30);
});
test("prompts: five names, the writing rules, the avoid list, and the image only for analysis",()=>{
  const names=buildSuggestMessages(parseSuggestInput({task:"names",context:ctx,avoid:["שיש מדבר"]})!);
  const text=String(names[1].content);
  assert.match(text,/בדיוק 5 שמות/);assert.ok(text.includes(RULES));assert.match(text,/שיש מדבר/);assert.match(text,/תהליך קר/);
  const desc=String(buildSuggestMessages(parseSuggestInput({task:"describe",context:ctx,name:"אבן מדבר"})!)[1].content);
  assert.match(desc,/"אבן מדבר"/);assert.match(desc,/אם לא נבחר ריח — אל תתאר ריח/);
  const an=buildSuggestMessages(parseSuggestInput({task:"analyze",image:tinyJpeg,materials:"ADD-CHR=פחם פעיל"})!);
  const parts=an[1].content as Array<{type:string}>;
  assert.deepEqual(parts.map(p=>p.type),["text","image_url"]);
  assert.match((parts[0] as {text:string}).text,/ADD-CHR=פחם פעיל/);
});
test("output: names are cut to five, empty ones dropped, fields clipped",()=>{
  const raw={names:[...Array.from({length:7},(_,i)=>({style:"פיוטי",name:"שם "+i,short:"ש",en:"N",why:"x".repeat(500)})),{name:""}]};
  const out=cleanSuggestion("names",raw) as {names:Array<{why:string}>};
  assert.equal(out.names.length,5);assert.equal(out.names[0].why.length,200);
  assert.equal(cleanSuggestion("names",{names:[{name:""}]}),null);
});
test("output: descriptions get # on every hashtag; analysis keeps only real material ids",()=>{
  const d=cleanSuggestion("describe",{he:"תיאור",hashtags:["סבון","#handmade"],seo:["סבון טבעי"]}) as {hashtags:string[]};
  assert.deepEqual(d.hashtags,["#סבון","#handmade"]);
  const a=cleanSuggestion("analyze",{type:"סבון",colors:["אפור"],material_ids:["ADD-CHR","bad id","<script>"]}) as {material_ids:string[]};
  assert.deepEqual(a.material_ids,["ADD-CHR"]);
  assert.equal(cleanSuggestion("analyze",{}),null);
  assert.equal(cleanSuggestion("describe","nonsense"),null);
});
