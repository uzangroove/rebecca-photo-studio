import {test} from "node:test";
import assert from "node:assert/strict";
import {palettes,findItem} from "../shared/catalog.ts";
import {formats} from "../src/social-formats.ts";

test("twenty unique named palettes include three exact HEX colors",()=>{
  assert.equal(palettes.length,20);
  assert.equal(new Set(palettes.map(p=>p.id)).size,20);
  assert.deepEqual(findItem("palettes","forest")?.colors,["#2A4B3C","#6B8E76","#C6D8CB"]);
  assert.deepEqual(findItem("palettes","soap")?.colors,["#CDB4DB","#FFC8DD","#FFAFCC"]);
  for(const {id,label,colors} of palettes){assert.ok(id&&label);assert.equal(colors.length,3);colors.forEach(color=>assert.match(color,/^#[0-9A-F]{6}$/))}
});
test("social formats have unique identifiers and safe canvas sizes",()=>{
  assert.equal(new Set(formats.map(f=>f.id)).size,formats.length);
  for(const format of formats){assert.ok(format.width>0&&format.height>0);assert.ok(format.width*format.height<8_000_000)}
});
