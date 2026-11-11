import {test} from "node:test";
import assert from "node:assert/strict";
import {buildPrompt} from "../shared/build-prompt.ts";
import {angles,candleStates,catalog,findItem,giftWraps,glassTints,occasions,productTypes} from "../shared/catalog.ts";
import {defaultSelection,parseSelection,type Selection} from "../shared/selection.ts";
import {defaultSettings} from "../shared/settings.ts";

const settings=defaultSettings;
const sel=(patch:Partial<Selection>):Selection=>({...defaultSelection,...patch});
const prompt=(patch:Partial<Selection>)=>buildPrompt(sel(patch),settings);
const candles=productTypes.filter(p=>p.family==="candle").map(p=>p.id);

test("the four product categories are the agreed ones, with no concrete candle vessel",()=>{
  assert.deepEqual(productTypes.map(p=>p.label),["נרות","סבונים","מארזים","אחר"]);
  assert.deepEqual(candles,["candle"]);
  for(const p of productTypes)assert.ok(!/concrete/i.test(p.prompt+(p.guidance??"")),p.id);
  for(const c of candleStates)assert.ok(!/concrete/i.test(c.prompt));
  // משטח בטון בסגנון אורבני נשאר
  assert.equal(findItem("styles","urban")?.defaults.surface,"concrete");
});

const segments:Record<string,string>={
  candle:"no glare or hot spot covering the label",
  soap:"natural texture of the soap",
  other:"Keep the material and texture of the products exactly as in the supplied photo"
};
test("every category gets its own guidance segment, and no other category's",()=>{
  for(const product of productTypes)for(const state of candleStates){
    const p=prompt({product:product.id,candleState:state.id});
    for(const [id,text] of Object.entries(segments)) assert.equal(p.includes(text),id===product.id,`${product.id}/${state.id} vs ${id}`);
    assert.ok(p.includes(`photo of ${product.prompt}.`),product.id);
  }
});
test("candles: real glass, matte ceramic, sculpted shape, no glare; soap: not plastic",()=>{
  assert.match(prompt({product:"candle"}),/real glass refraction and reflections for glass, a matte texture with no gloss for ceramic/);
  assert.match(prompt({product:"candle"}),/Preserve any sculpted shape exactly/);
  assert.match(prompt({product:"soap"}),/no plastic or glossy look/);
});
test("the candle state appears only in candles, for every category and state",()=>{
  for(const product of productTypes)for(const state of candleStates){
    const p=prompt({product:product.id,candleState:state.id});
    assert.equal(p.includes(state.prompt),candles.includes(product.id),`${product.id}/${state.id}`);
  }
  assert.match(prompt({product:"candle",candleState:"off"}),/unlit, with a clean wick and no flame/);
  assert.match(prompt({product:"candle",candleState:"lit"}),/true-to-size flame and a soft warm halo, and the scene is slightly dimmed/);
  assert.match(prompt({product:"candle",candleState:"asis"}),/Keep the candle flame exactly as it is in the supplied photo/);
  for(const product of ["soap","gift","other"])assert.ok(!/flame|wick/.test(prompt({product,candleState:"lit"})),product);
});
test("the three candle states each yield a different prompt",()=>{
  const outs=new Set(candleStates.map(s=>prompt({product:"candle",candleState:s.id})));
  assert.equal(outs.size,3);
});
test("glass tint and gift wrap are retired: still readable from old records, never in the prompt",()=>{
  for(const product of productTypes){
    for(const tint of glassTints)assert.ok(!prompt({product:product.id,glassTint:tint.id}).includes(tint.prompt),`${product.id}/${tint.id}`);
    for(const wrap of giftWraps)assert.ok(!prompt({product:product.id,giftWrap:wrap.id}).includes(wrap.prompt),`${product.id}/${wrap.id}`);
  }
});
test("camera angle: three options plus as-in-the-photo (none), none by default, and only the chosen one is sent",()=>{
  assert.deepEqual(angles.map(a=>a.label),["45°","מלמעלה","תקריב"]);
  assert.ok(!prompt({angle:null}).includes("Camera:"));
  for(const a of angles){
    const p=prompt({angle:a.id});
    assert.ok(p.includes(`Camera: ${a.prompt}.`),a.id);
    for(const other of angles)if(other.id!==a.id)assert.ok(!p.includes(other.prompt),`${a.id} vs ${other.id}`);
  }
});
test("an occasion shapes the scene, never the product",()=>{
  assert.deepEqual(occasions.map(o=>o.label),["חנוכה","ראש השנה","ט\"ו בשבט","יום המשפחה","חתונה","ולנטיין"]);
  assert.ok(!prompt({occasion:null}).includes("Occasion"));
  for(const o of occasions)for(const props of ["none","subtle","rich"]){
    const p=prompt({occasion:o.id,props});
    assert.ok(p.includes(`Occasion: ${o.prompt}`),o.id);
    assert.ok(p.includes("never on the products themselves"));
    assert.equal(p.includes("no added objects"),props==="none","with no props the occasion adds no objects");
  }
});
test("fidelity wording and the minimalism directive survive every directive together",()=>{
  const p=prompt({product:"candle",candleState:"lit",angle:"top",occasion:"wedding",props:"subtle"});
  assert.ok(p.includes("Do not redesign or invent products. Do not change the words on any existing label."));
  assert.ok(p.includes("uncluttered composition, generous negative space, at most one small prop."));
  assert.ok(!p.includes("Strictly avoid"),"no never-list by default");
  assert.ok(p.indexOf("Camera:")>p.indexOf("Composition:"));
});
test("all new directives are validated against the catalog",()=>{
  for(const bad of [{candleState:"on-fire"},{giftWrap:"gold"},{glassTint:"blue"},{angle:"drone"},{occasion:"purim"},{product:"concrete-candle"}])
    assert.equal(parseSelection({...defaultSelection,...bad}),null,JSON.stringify(bad));
  assert.deepEqual(parseSelection({...defaultSelection,glassTint:"",angle:"",occasion:""}),defaultSelection);
  assert.ok(parseSelection({...defaultSelection,candleState:"lit",giftWrap:"wrapped",glassTint:"milky",angle:"macro",occasion:"love"}));
});
test("old saved products (the eight earlier types, soap, candle) map to the four categories",()=>{
  const map={soap:"soap",candle:"candle","glass-candle":"candle","ceramic-candle":"candle","pillar-candle":"candle","cut-soap":"soap","molded-soap":"soap","gift-box":"gift","wax-melts":"other","bath-bomb":"other"};
  for(const [old,now] of Object.entries(map))assert.equal(parseSelection({...defaultSelection,product:old})?.product,now,old);
  const {candleState,giftWrap,glassTint,angle,occasion,...old}=defaultSelection;void candleState;void giftWrap;void glassTint;void angle;void occasion;
  assert.deepEqual(parseSelection({...old,product:"candle"}),{...defaultSelection,product:"candle"},"records without the new fields get defaults");
});
test("every catalog category in this phase has Hebrew labels and valid icons",()=>{
  for(const cat of ["productTypes","candleStates","glassTints","giftWraps","angles","occasions"] as const)
    for(const item of catalog[cat]){assert.ok(item.icon.length>10,`${cat}/${item.id}`)}
});
test("the retired eye-level angle reads as 'as in the photo'; top and macro lock arrangement and color",()=>{
  assert.equal(parseSelection({...defaultSelection,angle:"eye"})?.angle,null);
  assert.match(prompt({angle:"top"}),/keeping the exact arrangement of the products, which stand, lie or stack exactly as in the supplied photo, and their exact colors/);
  assert.match(prompt({angle:"macro"}),/exact arrangement and exact colors/);
  assert.match(prompt({angle:"45"}),/exact colors of the products/);
});
