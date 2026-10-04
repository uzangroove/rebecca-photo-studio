import {test} from "node:test";
import assert from "node:assert/strict";
import {catalog,findItem,hasItem} from "../shared/catalog.ts";
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
  assert.equal(parseSelection(null),null);
  assert.equal(parseSelection({...defaultSelection,style:"marble-palace"}),null);
  assert.equal(parseSelection({...defaultSelection,product:"jar"}),null);
  assert.equal(parseSelection({...defaultSelection,props:undefined}),null);
  // שדות נוספים לא עוברים הלאה
  assert.deepEqual(parseSelection({...defaultSelection,extra:"x"}),defaultSelection);
});
