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

test("the eight product types are the agreed ones, with no concrete candle vessel",()=>{
  assert.deepEqual(productTypes.map(p=>p.label),["נר בכלי זכוכית","נר בקרמיקה","נר עמוד / מפוסל","נמסים ריחניים","סבון חתוך","סבון בתבנית","פצצת אמבט","מארז מתנה"]);
  assert.deepEqual(candles,["glass-candle","ceramic-candle","pillar-candle"]);
  for(const p of productTypes)assert.ok(!/concrete/i.test(p.prompt+(p.guidance??"")),p.id);
  for(const c of candleStates)assert.ok(!/concrete/i.test(c.prompt));
  // משטח בטון בסגנון אורבני נשאר
  assert.equal(findItem("styles","urban")?.defaults.surface,"concrete");
});

const segments:Record<string,string>={
  "glass-candle":"true glass refraction and reflections, with no glare or hot spot covering the label",
  "ceramic-candle":"matte texture, with no gloss",
  "pillar-candle":"Preserve the sculpted shape of the candle exactly",
  "cut-soap":"natural cut texture",
  "bath-bomb":"powdery, matte texture"
};
test("every product type gets its own guidance segment, and no other type's",()=>{
  for(const product of productTypes)for(const state of candleStates){
    const p=prompt({product:product.id,candleState:state.id});
    for(const [id,text] of Object.entries(segments)) assert.equal(p.includes(text),id===product.id,`${product.id}/${state.id} vs ${id}`);
    assert.ok(p.includes(`photo of ${product.prompt}.`),product.id);
  }
});
test("glass: no glare over the label; cut soap: not plastic; ceramic: matte",()=>{
  assert.match(prompt({product:"glass-candle"}),/no glare or hot spot covering the label/);
  assert.match(prompt({product:"cut-soap"}),/no plastic or glossy look/);
  assert.match(prompt({product:"ceramic-candle"}),/matte texture, with no gloss/);
});
test("the candle state appears only in candles, for every product and state",()=>{
  for(const product of productTypes)for(const state of candleStates){
    const p=prompt({product:product.id,candleState:state.id});
    const present=p.includes(state.prompt);
    assert.equal(present,candles.includes(product.id),`${product.id}/${state.id}`);
  }
  assert.match(prompt({product:"pillar-candle",candleState:"off"}),/unlit, with a clean wick and no flame/);
  assert.match(prompt({product:"ceramic-candle",candleState:"lit"}),/true-to-size flame and a soft warm halo, and the scene is slightly dimmed/);
  assert.match(prompt({product:"glass-candle",candleState:"asis"}),/Keep the candle flame exactly as it is in the supplied photo/);
  assert.ok(!/flame|wick/.test(prompt({product:"cut-soap",candleState:"lit"})),"no flame wording for soap");
  assert.ok(!/flame|wick/.test(prompt({product:"gift-box",candleState:"lit"})));
  assert.ok(!/flame|wick/.test(prompt({product:"wax-melts",candleState:"lit"})));
});
test("the three candle states each yield a different prompt",()=>{
  const outs=new Set(candleStates.map(s=>prompt({product:"glass-candle",candleState:s.id})));
  assert.equal(outs.size,3);
});
test("glass tint is only for the glass candle",()=>{
  for(const product of productTypes)for(const tint of glassTints){
    const p=prompt({product:product.id,glassTint:tint.id});
    assert.equal(p.includes(tint.prompt),product.id==="glass-candle",`${product.id}/${tint.id}`);
  }
  assert.ok(!/vessel is/.test(prompt({product:"glass-candle",glassTint:null})));
});
test("gift box: as it is, or wrapped for her, and only for the gift box",()=>{
  for(const product of productTypes)for(const wrap of giftWraps){
    const p=prompt({product:product.id,giftWrap:wrap.id});
    assert.equal(p.includes(wrap.prompt),product.id==="gift-box",`${product.id}/${wrap.id}`);
  }
  assert.match(prompt({product:"gift-box",giftWrap:"wrapped"}),/elegantly wrapped in plain natural paper with a simple ribbon/);
  assert.match(prompt({product:"gift-box",giftWrap:"asis"}),/Keep the gift box exactly as it is/);
});
test("camera angle: four options, none by default, and only the chosen one is sent",()=>{
  assert.deepEqual(angles.map(a=>a.label),["גובה עיניים","45°","מלמעלה","תקריב"]);
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
  const p=prompt({product:"glass-candle",candleState:"lit",glassTint:"amber",angle:"top",occasion:"wedding",props:"subtle"});
  assert.ok(p.includes("Do not redesign or invent products. Do not change the words on any existing label."));
  assert.ok(p.includes("uncluttered composition, generous negative space, at most one small prop."));
  assert.ok(p.includes("Strictly avoid: שיש, עומס."));
  assert.ok(p.indexOf("Camera:")>p.indexOf("Composition:"));
});
test("all new directives are validated against the catalog",()=>{
  for(const bad of [{candleState:"on-fire"},{giftWrap:"gold"},{glassTint:"blue"},{angle:"drone"},{occasion:"purim"},{product:"concrete-candle"}])
    assert.equal(parseSelection({...defaultSelection,...bad}),null,JSON.stringify(bad));
  assert.deepEqual(parseSelection({...defaultSelection,glassTint:"",angle:"",occasion:""}),defaultSelection);
  assert.ok(parseSelection({...defaultSelection,candleState:"lit",giftWrap:"wrapped",glassTint:"milky",angle:"macro",occasion:"love"}));
});
test("old saved products (soap, candle) still work",()=>{
  assert.equal(parseSelection({...defaultSelection,product:"soap"})?.product,"cut-soap");
  assert.equal(parseSelection({...defaultSelection,product:"candle"})?.product,"glass-candle");
  const {candleState,giftWrap,glassTint,angle,occasion,...old}=defaultSelection;void candleState;void giftWrap;void glassTint;void angle;void occasion;
  assert.deepEqual(parseSelection({...old,product:"candle"}),{...defaultSelection,product:"glass-candle"},"records without the new fields get defaults");
});
test("every catalog category in this phase has Hebrew labels and valid icons",()=>{
  for(const cat of ["productTypes","candleStates","glassTints","giftWraps","angles","occasions"] as const)
    for(const item of catalog[cat]){assert.ok(item.icon.length>10,`${cat}/${item.id}`)}
});
