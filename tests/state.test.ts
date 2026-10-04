import {test} from "node:test";
import assert from "node:assert/strict";
import {initialState,reducer,imageToShow,currentImage,currentLayout,type State} from "../src/state.ts";
import {defaultLayout} from "../shared/brand-layout.ts";
import {builtInRecipes} from "../shared/recipes.ts";
import {defaultSettings} from "../shared/settings.ts";
import {formatById,ratioOf} from "../shared/social-formats.ts";

const photo={file:{name:"a.png"} as File,url:"blob:photo"};
const withResult=():State=>({...initialState,photo,result:"data:image/png;base64,AAAA",composed:{url:"blob:c",blob:{} as Blob,branded:true}});

test("opening state: the minimalist black-and-white recipe on soap, nothing generated",()=>{
  assert.deepEqual(initialState.selection,{product:"cut-soap",style:"minimal",palette:"mono",props:"none",surface:"paper",background:null,light:null,candleState:"asis",giftWrap:"asis",glassTint:null,angle:null,occasion:null,wish:""});
  assert.deepEqual(initialState.neverList,["שיש","עומס"]);
  assert.equal(initialState.recipes.length,4);
  assert.equal(initialState.result,null);
  assert.equal(initialState.tab,"style");
});
test("a new selection clears the previous result and says so",()=>{
  const next=reducer({...withResult(),busy:true},{type:"select",key:"palette",id:"mono"});
  assert.equal(next.selection.palette,"mono");
  assert.equal(next.selection.style,"minimal");
  assert.equal(next.result,null);assert.equal(next.composed,null);assert.equal(next.busy,false);
  assert.equal(next.status.error,false);
});
test("format, brand, caption and view changes keep the result",()=>{
  let s=withResult();
  s=reducer(s,{type:"format",id:"instagram-story"});
  s=reducer(s,{type:"brand",patch:{logoName:"חדש"}});
  s=reducer(s,{type:"view",view:"compare"});
  assert.equal(s.result,"data:image/png;base64,AAAA");
  assert.deepEqual([s.formatId,s.brand.logoName,s.view],["instagram-story","חדש","compare"]);
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
test("opening a saved image restores every setting that created it",()=>{
  const selection={...initialState.selection,style:"spa",palette:"desert",surface:"linen",wish:"בוקר"};
  const next=reducer(withResult(),{type:"openRecent",url:"blob:recent",key:"image:1",selection,formatId:"instagram-story"});
  assert.deepEqual([next.photo,next.result,next.view,next.currentKey,next.formatId],[null,"blob:recent","single","image:1","instagram-story"]);
  assert.deepEqual(next.selection,selection);
});
test("saved settings replace brand, never-list and recipes",()=>{
  const layouts={"instagram-story":defaultLayout({width:1080,height:1920})};
  const next=reducer(initialState,{type:"settings",settings:{...defaultSettings,neverList:["ורוד"],recipes:[],brand:{...defaultSettings.brand,logoName:"x"},layouts}});
  assert.deepEqual([next.neverList,next.recipes,next.brand.logoName,next.layouts],[["ורוד"],[],"x",layouts]);
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

test("applying a recipe sets the look, keeps product and special request, and clears the result",()=>{
  const recipe=builtInRecipes.find(r=>r.id==="boutique-desert")!;
  const start={...withResult(),selection:{...initialState.selection,product:"candle",wish:"בוקר"}};
  const next=reducer(start,{type:"recipe",recipe});
  assert.deepEqual([next.selection.style,next.selection.palette,next.selection.surface,next.selection.props],["boutique","desert","plaster","subtle"]);
  assert.deepEqual([next.selection.product,next.selection.wish,next.result],["candle","בוקר",null]);
});
test("detail choices are explicit, and can go back to the style defaults",()=>{
  let s=reducer(initialState,{type:"select",key:"light",id:"golden"});
  s=reducer(s,{type:"select",key:"background",id:"plants"});
  assert.deepEqual([s.selection.light,s.selection.background],["golden","plants"]);
  s=reducer(s,{type:"select",key:"style",id:"rustic"});
  assert.equal(s.selection.light,"golden","an explicit choice survives a style change");
  s=reducer(s,{type:"resetScene"});
  assert.deepEqual([s.selection.surface,s.selection.background,s.selection.light],[null,null,null]);
});
test("typing a special request keeps the image and stops at 200 characters",()=>{
  const next=reducer(withResult(),{type:"wish",text:"א".repeat(250)});
  assert.equal(next.selection.wish.length,200);
  assert.equal(next.result,"data:image/png;base64,AAAA");
});
test("never-list: add, de-duplicate, remove, and release an explicit choice it now blocks",()=>{
  let s=reducer(initialState,{type:"select",key:"surface",id:"oak"});
  s=reducer(s,{type:"select",key:"light",id:"golden"});
  s=reducer(s,{type:"neverAdd",text:"  עץ   בהיר "});
  assert.deepEqual(s.neverList,["שיש","עומס","עץ בהיר"]);
  assert.equal(s.selection.surface,null,"oak was blocked");
  assert.equal(s.selection.light,"golden");
  assert.equal(reducer(s,{type:"neverAdd",text:"שיש"}).neverList.length,3);
  assert.equal(reducer(s,{type:"neverAdd",text:"   "}).neverList.length,3);
  assert.equal(reducer(s,{type:"neverAdd",text:"x".repeat(41)}).neverList.length,3);
  assert.deepEqual(reducer(s,{type:"neverRemove",text:"שיש"}).neverList,["עומס","עץ בהיר"]);
});
test("recipes can be saved and deleted",()=>{
  const mine={id:"mine",name:"שלי",look:builtInRecipes[0].look};
  let s=reducer(initialState,{type:"saveRecipe",recipe:mine});
  assert.equal(s.recipes.length,5);
  s=reducer(s,{type:"deleteRecipe",id:"boutique-bw"});
  assert.deepEqual(s.recipes.map(r=>r.id),["boutique-desert","minimal-bw","minimal-desert","mine"]);
});
test("a rating lands on the image it belongs to",()=>{
  const item=(key:string)=>({key,createdAt:1,blob:{} as Blob,selection:initialState.selection,formatId:"instagram-square",rating:null,url:"blob:"+key});
  const s=reducer({...initialState,history:[item("a"),item("b")],currentKey:"b"},{type:"rated",key:"b",rating:"up"});
  assert.deepEqual(s.history.map(h=>h.rating),[null,"up"]);
  assert.equal(currentImage(s)?.key,"b");
  assert.equal(currentImage(initialState),null);
  const generated=reducer(s,{type:"generated",image:"data:x"});
  assert.equal(generated.currentKey,null,"a new image is not yet saved, so it has no rating");
});

test("the brand layout is kept per format, and a format without one gets its own default",()=>{
  let s=reducer(initialState,{type:"format",id:"instagram-portrait"});
  const portrait=currentLayout(s);
  assert.deepEqual(portrait,defaultLayout({width:1080,height:1350}));
  s=reducer(s,{type:"layout",layout:{...portrait,logo:{...portrait.logo,visible:true,cx:30}}});
  assert.equal(currentLayout(s).logo.cx,30);
  s=reducer(s,{type:"format",id:"instagram-story"});
  assert.equal(currentLayout(s).logo.cx,50,"story is untouched");
  assert.deepEqual(currentLayout(s),defaultLayout({width:1080,height:1920}));
  s=reducer(s,{type:"format",id:"instagram-portrait"});
  assert.equal(currentLayout(s).logo.cx,30,"portrait kept its layout");
});
test("apply to all formats copies the current layout to all sixteen, and reset returns one format to default",()=>{
  let s=reducer(initialState,{type:"format",id:"instagram-portrait"});
  const layout=currentLayout(s);
  s=reducer(s,{type:"layout",layout:{...layout,slogan:{...layout.slogan,visible:true,opacity:77}}});
  s=reducer(s,{type:"layoutAll"});
  assert.equal(Object.keys(s.layouts).length,16);
  for(const l of Object.values(s.layouts))assert.equal(l.slogan.opacity,77);
  s=reducer(s,{type:"layoutReset"});
  assert.equal(Object.keys(s.layouts).length,15);
  assert.equal(currentLayout(s).slogan.opacity,100);
});
test("a manual crop is kept per format and dropped with the picture",()=>{
  let s=reducer(withResult(),{type:"crop",formatId:"instagram-story",focal:{x:0.2,y:0.5}});
  assert.deepEqual(s.crops["instagram-story"],{x:0.2,y:0.5});
  s=reducer(s,{type:"generated",image:"data:new"});
  assert.deepEqual(s.crops,{},"a new image starts centered");
});
test("the editor is a separate screen",()=>{
  assert.equal(initialState.screen,"studio");
  assert.equal(reducer(initialState,{type:"screen",screen:"editor"}).screen,"editor");
});

test("the picture is shown fitted to the screen by default, and 100% is a choice",()=>{
  assert.equal(initialState.zoom,"fit");
  assert.equal(reducer(initialState,{type:"zoom",zoom:"full"}).zoom,"full");
  assert.equal(reducer(withResult(),{type:"zoom",zoom:"full"}).result,"data:image/png;base64,AAAA");
});
test("the interface theme is a palette choice or the default",()=>{
  assert.equal(initialState.theme,null);
  assert.equal(reducer(initialState,{type:"theme",id:"desert"}).theme,"desert");
  assert.equal(reducer(reducer(initialState,{type:"theme",id:"desert"}),{type:"theme",id:null}).theme,null);
  assert.equal(reducer(initialState,{type:"settings",settings:{...defaultSettings,theme:"mint"}}).theme,"mint");
});
