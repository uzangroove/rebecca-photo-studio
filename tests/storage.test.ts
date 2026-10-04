import {test} from "node:test";
import assert from "node:assert/strict";
import {MAX_HISTORY,normalizeImage} from "../src/studio-storage.ts";
import {defaultSelection} from "../shared/selection.ts";

const blob={} as Blob;

test("history keeps thirty images",()=>assert.equal(MAX_HISTORY,30));
test("an image saved by phase 0 (style and palette only) becomes a full record",()=>{
  const image=normalizeImage({key:"image:1",createdAt:5,blob,style:"spa",palette:"desert"});
  assert.deepEqual(image.selection,{...defaultSelection,style:"spa",palette:"desert"});
  assert.equal(image.rating,null);
  assert.equal(image.formatId,"instagram-square");
});
test("unknown legacy values fall back to the defaults instead of breaking the history",()=>{
  const image=normalizeImage({key:"image:2",createdAt:5,blob,style:"gone",palette:"gone"});
  assert.equal(image.selection.style,defaultSelection.style);
  assert.equal(image.selection.palette,defaultSelection.palette);
});
test("a current record keeps its settings, format and rating",()=>{
  const selection={...defaultSelection,style:"rustic",palette:"coffee",surface:"walnut",light:"golden",wish:"בוקר"};
  const image=normalizeImage({key:"image:3",createdAt:7,blob,selection,formatId:"instagram-story",rating:"down"});
  assert.deepEqual(image.selection,selection);
  assert.deepEqual([image.formatId,image.rating],["instagram-story","down"]);
});
test("a corrupt rating or selection is cleaned",()=>{
  const image=normalizeImage({key:"image:4",createdAt:7,blob,selection:{style:"nope"},rating:"maybe",formatId:5});
  assert.deepEqual([image.rating,image.formatId],[null,"instagram-square"]);
  assert.deepEqual(image.selection,defaultSelection);
});
