import {test} from "node:test";
import assert from "node:assert/strict";
import {initialState,reducer,imageToShow,type State} from "../src/state.ts";
import {defaultSettings} from "../shared/settings.ts";
import {formatById,ratioOf} from "../src/social-formats.ts";

const photo={file:{name:"a.png"} as File,url:"blob:photo"};
const withResult=():State=>({...initialState,photo,result:"data:image/png;base64,AAAA",composed:{url:"blob:c",blob:{} as Blob,branded:true}});

test("opening state: soap, boutique, forest, subtle props, nothing generated",()=>{
  assert.deepEqual(initialState.selection,{product:"soap",style:"boutique",palette:"forest",props:"subtle"});
  assert.equal(initialState.result,null);
  assert.equal(initialState.tab,"style");
});
test("a new selection clears the previous result and says so",()=>{
  const next=reducer({...withResult(),busy:true},{type:"select",key:"palette",id:"mono"});
  assert.equal(next.selection.palette,"mono");
  assert.equal(next.selection.style,"boutique");
  assert.equal(next.result,null);assert.equal(next.composed,null);assert.equal(next.busy,false);
  assert.equal(next.status.error,false);
});
test("format, brand, caption and view changes keep the result",()=>{
  let s=withResult();
  s=reducer(s,{type:"format",id:"instagram-story"});
  s=reducer(s,{type:"brand",patch:{logo:true,logoX:7}});
  s=reducer(s,{type:"caption",text:"שלום"});
  s=reducer(s,{type:"view",view:"compare"});
  assert.equal(s.result,"data:image/png;base64,AAAA");
  assert.deepEqual([s.formatId,s.brand.logo,s.brand.logoX,s.brand.slogan,s.caption,s.view],["instagram-story",true,7,false,"שלום","compare"]);
});
test("choosing a photo starts a fresh scene",()=>{
  const next=reducer(withResult(),{type:"photo",photo:{file:{name:"b.png"} as File,url:"blob:b"}});
  assert.equal(next.photo?.url,"blob:b");assert.equal(next.result,null);
});
test("generation flow: busy, then result or error",()=>{
  const busy=reducer(initialState,{type:"generating"});
  assert.ok(busy.busy);
  const done=reducer(busy,{type:"generated",image:"data:x"});
  assert.deepEqual([done.busy,done.result,done.status.error],[false,"data:x",false]);
  const failed=reducer(busy,{type:"failed",text:"נכשל"});
  assert.deepEqual([failed.busy,failed.status],[false,{text:"נכשל",error:true}]);
});
test("opening a saved image restores its style and palette",()=>{
  const next=reducer(withResult(),{type:"openRecent",url:"blob:recent",style:"spa",palette:"desert"});
  assert.deepEqual([next.photo,next.result,next.selection.style,next.selection.palette,next.view],[null,"blob:recent","spa","desert","single"]);
});
test("saved settings replace brand and never-list",()=>{
  const next=reducer(initialState,{type:"settings",settings:{...defaultSettings,neverList:["שיש"],brand:{...defaultSettings.brand,logo:true}}});
  assert.deepEqual([next.neverList,next.brand.logo],[["שיש"],true]);
});
test("branded composite is shown; if branding failed the plain result is shown",()=>{
  assert.equal(imageToShow(withResult()),"blob:c");
  const plain={...withResult(),composed:{url:"blob:raw",blob:{} as Blob,branded:false}};
  assert.equal(imageToShow(plain),plain.result);
  assert.equal(imageToShow(initialState),null);
});
test("generation ratio follows the chosen format",()=>{
  assert.equal(ratioOf(formatById("instagram-square")),"square");
  assert.equal(ratioOf(formatById("instagram-story")),"portrait");
  assert.equal(ratioOf(formatById("youtube-thumbnail")),"landscape");
  assert.equal(formatById("unknown").id,"instagram-square");
});
