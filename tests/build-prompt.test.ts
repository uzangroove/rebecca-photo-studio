import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildPrompt} from "../shared/build-prompt.ts";
import {catalog,findItem} from "../shared/catalog.ts";

// הפרומפטים בקובץ נלכדו מהקוד שלפני הפירוק לקטלוג. הם מוכיחים שההנחיה למודל לא השתנתה.
const snapshots=JSON.parse(readFileSync(new URL("./fixtures/prompt-snapshots.json",import.meta.url),"utf8")) as Record<string,string>;

test("prompt is identical to the pre-catalog prompt for sampled selections",()=>{
  assert.equal(Object.keys(snapshots).length,6);
  for(const [key,expected] of Object.entries(snapshots)){
    const [product,style,palette,props]=key.split("|");
    assert.equal(buildPrompt({product,style,palette,props}),expected,key);
  }
});
test("every catalog combination yields a prompt with its own scene, palette HEX codes and props line",()=>{
  let count=0;
  for(const product of catalog.productTypes)for(const style of catalog.styles)for(const palette of catalog.palettes)for(const props of catalog.props){
    const prompt=buildPrompt({product:product.id,style:style.id,palette:palette.id,props:props.id});
    assert.ok(prompt.includes(`photo of ${product.prompt}.`));
    assert.ok(prompt.includes(`as ${style.prompt}.`));
    assert.ok(prompt.includes(`guidance: ${palette.colors.join(", ")}.`));
    assert.ok(prompt.includes(props.prompt));
    count++;
  }
  assert.equal(count,2*10*20*3);
});
test("product fidelity wording is kept verbatim",()=>{
  const prompt=buildPrompt({product:"soap",style:"minimal",palette:"mono",props:"none"});
  for(const phrase of [
    "Keep the exact number, shape, silhouette, arrangement, scale, material, colors, surface details and existing labels of the actual products in the supplied photo.",
    "Do not redesign or invent products. Do not change the words on any existing label.",
    "Do not recolor the products.",
    "Keep the full product safely inside the central 60 percent."
  ])assert.ok(prompt.includes(phrase),phrase);
});
test("building a prompt is pure and deterministic",()=>{
  const selection={product:"candle",style:"rustic",palette:"coffee",props:"subtle"};
  assert.equal(buildPrompt(selection),buildPrompt({...selection}));
});
test("the never-list is appended as a Strictly avoid line, and only when it has items",()=>{
  const selection={product:"soap",style:"boutique",palette:"forest",props:"none"};
  const base=buildPrompt(selection);
  assert.ok(!base.includes("Strictly avoid"));
  assert.equal(buildPrompt(selection,{neverList:[]}),base);
  assert.equal(buildPrompt(selection,{neverList:["  ",""]}),base);
  const prompt=buildPrompt(selection,{neverList:["שיש","עומס"]});
  assert.ok(prompt.startsWith(base));
  assert.ok(prompt.endsWith("\nStrictly avoid: שיש, עומס."));
});
test("a selection outside the catalog is refused",()=>{
  assert.throws(()=>buildPrompt({product:"soap",style:"nope",palette:"mono",props:"none"}));
  assert.ok(findItem("styles","boutique"));
});
