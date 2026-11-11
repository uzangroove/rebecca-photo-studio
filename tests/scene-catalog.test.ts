import {test} from "node:test";
import assert from "node:assert/strict";
import {buildPrompt} from "../shared/build-prompt.ts";
import {backgrounds,findItem,surfaceGroups,surfaces} from "../shared/catalog.ts";
import {defaultSelection,parseSelection} from "../shared/selection.ts";
import {defaultSettings} from "../shared/settings.ts";

// שלב 4: 14 משטחים ו-10 קירות חדשים, והמשטחים בארבע קבוצות.
const newSurfaces=["muslin","gauze","velvet","satin","jute","felt","kraft","washi","olivewood","reclaimed","rattan","cork","sand","terracotta"];
const newWalls=["limewash","brick","slats","zellige","arch","curtain","seamless","leafshadow","shelves","bathroom"];

test("the new surfaces and walls are in the catalog",()=>{
  for(const id of newSurfaces)assert.ok(findItem("surfaces",id),id);
  for(const id of newWalls)assert.ok(findItem("backgrounds",id),id);
  assert.equal(surfaces.length,23);
  assert.equal(backgrounds.length,14);
});

test("every surface sits in one of the four groups and has a HEX swatch",()=>{
  const groups=new Set(surfaceGroups.map(g=>g.id));
  for(const s of surfaces){
    assert.ok(groups.has(s.group),s.id);
    assert.match(s.swatch,/^#[0-9A-F]{6}$/i,s.id);
  }
  for(const g of surfaceGroups)assert.ok(surfaces.some(s=>s.group===g.id),g.id);
});

test("new prompts are English and bring no stone or marble into the scene",()=>{
  for(const item of [...newSurfaces.map(id=>findItem("surfaces",id)!),...newWalls.map(id=>findItem("backgrounds",id)!)]){
    assert.match(item.prompt,/^[\x20-\x7E]+$/,item.id);
    assert.doesNotMatch(item.prompt,/stone|marble|slate/i,item.id);
  }
});

test("a chosen surface and wall reach the prompt, and the server accepts them",()=>{
  const selection={...defaultSelection,surface:"olivewood",background:"leafshadow"};
  assert.deepEqual(parseSelection(selection),selection);
  const prompt=buildPrompt(selection,defaultSettings);
  assert.ok(prompt.includes("an olive wood board surface with its distinctive swirling grain"));
  assert.ok(prompt.includes("a plain wall with soft dappled shadows of leaves"));
  assert.ok(!prompt.includes("Strictly avoid"));
});
