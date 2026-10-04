import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildPrompt} from "../shared/build-prompt.ts";
import {catalog,findItem} from "../shared/catalog.ts";
import {defaultSelection,type Selection} from "../shared/selection.ts";
import {defaultSettings} from "../shared/settings.ts";

// צילומי מצב של פרומפטים שנבדקו ביד: ארבעת המתכונים המובנים ועוד שני מקרים. שינוי בהם הוא החלטה, לא תוצאת לוואי.
const snapshots=JSON.parse(readFileSync(new URL("./fixtures/prompt-snapshots.json",import.meta.url),"utf8")) as Record<string,{selection:Selection;prompt:string}>;
const settings=defaultSettings;
const base:Selection={...defaultSelection};

test("prompts match the reviewed snapshots",()=>{
  assert.equal(Object.keys(snapshots).length,6);
  for(const [name,{selection,prompt}] of Object.entries(snapshots))assert.equal(buildPrompt(selection,settings),prompt,name);
});
test("every combination carries the never-list, so marble is always avoided",()=>{
  let count=0;
  for(const product of catalog.productTypes)for(const style of catalog.styles)for(const palette of catalog.palettes)for(const props of catalog.props){
    const prompt=buildPrompt({...base,product:product.id,style:style.id,palette:palette.id,props:props.id},settings);
    assert.ok(prompt.includes("\nStrictly avoid: שיש, עומס."),`${style.id}/${palette.id}/${props.id}`);
    count++;
  }
  assert.equal(count,2*10*20*3);
});
test("palette names never reach the prompt, only HEX codes marked as environment colors",()=>{
  for(const palette of catalog.palettes){
    const prompt=buildPrompt({...base,palette:palette.id},settings);
    assert.ok(!prompt.includes(palette.label),palette.label);
    assert.ok(prompt.includes(`environment colors only: ${palette.colors.join(", ")}.`),palette.id);
  }
  // "אבן", "עץ" ו"מתכת" הן גם שמות של חומרים: לא מופיעים אפילו בתרגום
  const prompt=buildPrompt({...base,palette:"stone"},settings);
  assert.ok(!/\bstone\b/i.test(prompt));
});
test("boutique has no stone or marble, on any surface, light or palette it can reach by default",()=>{
  for(const palette of catalog.palettes)for(const props of catalog.props){
    const prompt=buildPrompt({...base,style:"boutique",palette:palette.id,props:props.id,surface:null},settings);
    assert.ok(!/stone|marble/i.test(prompt),`${palette.id}/${props.id}`);
  }
  assert.ok(!/stone|marble/i.test(findItem("styles","spa")!.prompt));
  for(const style of catalog.styles)assert.ok(!/stone|marble/i.test(style.prompt),style.id);
});
test("a style fills the defaults, and an explicit choice wins",()=>{
  const rustic=buildPrompt({...base,style:"rustic",surface:null,background:null,light:null},settings);
  assert.ok(rustic.includes("Surface: a pale oak wood surface."));
  assert.ok(rustic.includes("Lighting: soft directional natural window light."));
  const explicit=buildPrompt({...base,style:"rustic",surface:"walnut",background:"plants",light:"golden"},settings);
  assert.ok(explicit.includes("Surface: a dark walnut wood surface."));
  assert.ok(explicit.includes("Background: soft out-of-focus greenery."));
  assert.ok(explicit.includes("Lighting: warm golden hour light."));
  assert.ok(!explicit.includes("pale oak"));
});
test("the minimalism directive is constant, and props decide its last clause",()=>{
  const lead="uncluttered composition, generous negative space, ";
  assert.ok(buildPrompt({...base,props:"none"},settings).includes(lead+"no props at all."));
  assert.ok(buildPrompt({...base,props:"subtle"},settings).includes(lead+"at most one small prop."));
  assert.ok(buildPrompt({...base,props:"rich"},settings).includes(lead+"a few tasteful contextual props"));
});
test("product fidelity wording is kept verbatim",()=>{
  const prompt=buildPrompt(base,settings);
  for(const phrase of [
    "Keep the exact number, shape, silhouette, arrangement, scale, material, colors, surface details and existing labels of the actual products in the supplied photo.",
    "Do not redesign or invent products. Do not change the words on any existing label.",
    "Do not recolor the products.",
    "Keep the full product safely inside the central 60 percent."
  ])assert.ok(prompt.includes(phrase),phrase);
});
test("the special request is appended last, as a single line",()=>{
  const prompt=buildPrompt({...base,wish:"  שירגיש כמו\nבוקר שבת  "},settings);
  assert.ok(prompt.endsWith("\nAdditional wish from the maker (Hebrew): שירגיש כמו בוקר שבת"));
  assert.ok(!buildPrompt(base,settings).includes("Additional wish"));
  assert.ok(!buildPrompt({...base,wish:"   "},settings).includes("Additional wish"));
});
test("an item blocked by the never-list is left out instead of contradicting it",()=>{
  const prompt=buildPrompt({...base,surface:"marble"},settings);
  assert.ok(!prompt.includes("marble")&&!prompt.includes("Surface:"));
  const noOak=buildPrompt({...base,style:"rustic",surface:null},{neverList:["עץ בהיר"]});
  assert.ok(!noOak.includes("oak")&&noOak.includes("Strictly avoid: עץ בהיר."));
  // רשימה ריקה: אין שורת Strictly avoid, והמשטח חוזר
  const open=buildPrompt({...base,surface:"marble"},{neverList:[]});
  assert.ok(open.includes("Surface: a marble surface.")&&!open.includes("Strictly avoid"));
});
test("building a prompt is pure and deterministic",()=>{
  assert.equal(buildPrompt(base,settings),buildPrompt({...base},{neverList:[...settings.neverList]}));
});
test("a selection outside the catalog is refused",()=>{
  assert.throws(()=>buildPrompt({...base,style:"nope"},settings));
});
