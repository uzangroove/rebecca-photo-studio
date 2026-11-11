import {test} from "node:test";
import assert from "node:assert/strict";
import {buildEvent, isRepeat, toRow} from "../shared/events.ts";
import {defaultSelection} from "../shared/selection.ts";

test("buildEvent: valid event keeps fields, bad selection becomes null", () => {
  const e = buildEvent({type: "generate", imageKey: "image:1", sourceId: "s1", selection: defaultSelection, formatId: "instagram-square", detail: {repeat: false}});
  assert.ok(e); assert.equal(e.type, "generate"); assert.deepEqual(e.selection, defaultSelection); assert.deepEqual(e.detail, {repeat: false});
  assert.equal(buildEvent({type: "download", selection: {nope: 1}})!.selection, null);
  assert.equal(buildEvent({type: "bogus" as never}), null);
});

test("buildEvent: detail is limited and objects are dropped", () => {
  const detail: Record<string, unknown> = {long: "x".repeat(500), nested: {a: 1}};
  for (let i = 0; i < 20; i++) detail["k" + i] = i;
  const e = buildEvent({type: "rate", detail})!;
  assert.ok(Object.keys(e.detail).length <= 8);
  assert.equal((e.detail.long as string).length, 100);
  assert.equal("nested" in e.detail, false);
});

test("toRow maps to table columns", () => {
  const row = toRow(buildEvent({type: "send", imageKey: "image:2"})!);
  assert.equal(row.event_type, "send"); assert.equal(row.image_key, "image:2"); assert.equal(row.selection, null);
});

test("isRepeat: same source and same selection only", () => {
  const a = {sourceId: "s1", selection: defaultSelection};
  assert.equal(isRepeat(null, a), false);
  assert.equal(isRepeat(a, {sourceId: "s1", selection: {...defaultSelection}}), true);
  assert.equal(isRepeat(a, {sourceId: "s2", selection: defaultSelection}), false);
  assert.equal(isRepeat(a, {sourceId: "s1", selection: {...defaultSelection, style: "spa"}}), false);
  assert.equal(isRepeat({sourceId: null, selection: defaultSelection}, {sourceId: null, selection: defaultSelection}), false);
});

test("tab events are valid and carry the tab name; downloads can carry the format",()=>{
  const tab=buildEvent({type:"tab",detail:{tab:"palette"}});
  assert.deepEqual(toRow(tab!).detail,{tab:"palette"});
  assert.equal(toRow(tab!).event_type,"tab");
  const dl=buildEvent({type:"download",formatId:"instagram-square",detail:{branded:true}});
  assert.equal(toRow(dl!).format_id,"instagram-square");
});
