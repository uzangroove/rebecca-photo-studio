import {test} from "node:test";
import assert from "node:assert/strict";
import {catalog,findItem,hasItem,favoritesFirst,isBlocked,palettes,styles} from "../shared/catalog.ts";
import {defaultSelection,parseSelection} from "../shared/selection.ts";

test("every catalog item is complete and ids are unique within a category",()=>{
  for(const [category,items] of Object.entries(catalog)){
    assert.ok(items.length>0,category);
    assert.equal(new Set(items.map(i=>i.id)).size,items.length,`${category} ids`);
    for(const item of items){
      assert.ok(item.id&&item.label&&item.prompt,`${category}/${item.id}`);
      assert.match(item.label,/[֐-׿]/,`${category}/${item.id} label is Hebrew`);
      assert.match(item.icon,/^[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+$/,`${category}/${item.id} icon is an SVG path`);
    }
  }
});
test("lookups only know catalog ids",()=>{
  assert.equal(findItem("styles","boutique")?.label,"בוטיק");
  assert.equal(findItem("styles","nope"),undefined);
  assert.ok(hasItem("palettes","mono"));
  assert.ok(!hasItem("palettes","boutique"));
  assert.ok(!hasItem("styles",undefined));
  assert.ok(!hasItem("styles",{}));
});
test("selection from the client is validated against the catalog",()=>{
  assert.deepEqual(parseSelection(defaultSelection),defaultSelection);
  // שדה ריק מטופס = ברירת המחדל של הסגנון
  assert.deepEqual(parseSelection({...defaultSelection,surface:"",background:"",light:""}),{...defaultSelection,surface:null,background:null,light:null});
  assert.equal(parseSelection({...defaultSelection,surface:"gold"}),null);
  assert.equal(parseSelection({...defaultSelection,light:"neon"}),null);
  assert.equal(parseSelection({...defaultSelection,background:"mars"}),null);
  assert.equal(parseSelection({...defaultSelection,wish:"א".repeat(200)})?.wish.length,200);
  assert.equal(parseSelection({...defaultSelection,wish:"א".repeat(201)}),null);
  assert.equal(parseSelection({...defaultSelection,wish:5}),null);
  assert.equal(parseSelection(null),null);
  assert.equal(parseSelection({...defaultSelection,style:"marble-palace"}),null);
  assert.equal(parseSelection({...defaultSelection,product:"jar"}),null);
  assert.equal(parseSelection({...defaultSelection,props:undefined}),null);
  // שדות נוספים לא עוברים הלאה
  assert.deepEqual(parseSelection({...defaultSelection,extra:"x"}),defaultSelection);
});
test("favorites are pinned first: mono and desert palettes, boutique and minimal styles",()=>{
  assert.deepEqual(favoritesFirst(palettes).slice(0,2).map(p=>p.id),["mono","desert"]);
  assert.equal(favoritesFirst(palettes).length,20);
  assert.deepEqual(favoritesFirst(styles).slice(0,2).map(s=>s.id),["boutique","minimal"]);
  assert.equal(palettes.filter(p=>p.favorite).length,2);
});
test("every style default points at a real surface, background and light",()=>{
  for(const style of styles){
    assert.ok(hasItem("surfaces",style.defaults.surface),style.id);
    assert.ok(hasItem("backgrounds",style.defaults.background),style.id);
    assert.ok(hasItem("lights",style.defaults.light),style.id);
  }
  // משטח בטון נשאר בסגנון האורבני, ואין כלי בטון לנרות
  assert.equal(findItem("styles","urban")?.defaults.surface,"concrete");
});
test("an item whose label is in the never-list is blocked",()=>{
  const marble=findItem("surfaces","marble")!;
  assert.ok(isBlocked(marble,["שיש","עומס"]));
  assert.ok(isBlocked(marble,[" שיש "]));
  assert.ok(!isBlocked(marble,["עומס"]));
  assert.ok(!isBlocked(findItem("surfaces","paper")!,["שיש"]));
});
