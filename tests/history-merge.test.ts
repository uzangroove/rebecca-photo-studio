import {test} from "node:test";
import assert from "node:assert/strict";
import {cloudPaths, mergeHistory, needsUpload, parseCloudRow, type CloudImage} from "../src/history-merge.ts";
import {defaultSelection} from "../shared/selection.ts";
import type {SavedImage} from "../src/studio-storage.ts";

const blob = {} as Blob;
const local = (key: string, createdAt: number, rating: SavedImage["rating"] = null): SavedImage => ({key, createdAt, blob, selection: defaultSelection, formatId: "instagram-square", rating});
const cloud = (key: string, createdAt: number, extra: Partial<CloudImage> = {}): CloudImage => ({key, createdAt, selection: defaultSelection, formatId: "instagram-square", rating: null, sent: false, path: `p/${key}.jpg`, thumbPath: null, ...extra});

test("a cloud row becomes a CloudImage; bad rows are skipped", () => {
  const c = parseCloudRow({local_key: "image:1:a", created_at: "2026-10-17T05:00:00Z", storage_path: "2026-10/a.jpg", thumb_path: "2026-10/a-t.jpg", selection: {nope: 1}, format_id: "", rating: "up", sent_to_site: true});
  assert.ok(c);
  assert.equal(c.createdAt, Date.parse("2026-10-17T05:00:00Z"));
  assert.deepEqual(c.selection, defaultSelection);
  assert.equal(c.formatId, "instagram-square");
  assert.equal(c.rating, "up"); assert.equal(c.sent, true); assert.equal(c.thumbPath, "2026-10/a-t.jpg");
  assert.equal(parseCloudRow({local_key: "branding", storage_path: "x"}), null);
  assert.equal(parseCloudRow({local_key: "image:2", storage_path: ""}), null);
  assert.equal(parseCloudRow(null), null);
});

test("merge: no duplicates, newest first, device blob kept, cloud rating wins", () => {
  const merged = mergeHistory([local("image:a", 30, "up"), local("image:b", 20)], [cloud("image:a", 30, {rating: "down", sent: true}), cloud("image:c", 10)]);
  assert.deepEqual(merged.map(m => m.key), ["image:a", "image:b", "image:c"]);
  assert.equal(merged[0].rating, "down");
  assert.equal(merged[0].sent, true);
  assert.ok(merged[0].local && merged[0].cloud);
  assert.ok(merged[1].local && !merged[1].cloud);
  assert.ok(!merged[2].local && merged[2].cloud);
});

test("merge: an image marked sent only on this device stays marked", () => {
  const merged = mergeHistory([local("image:a", 1)], [cloud("image:a", 1)], new Set(["image:a"]));
  assert.equal(merged[0].sent, true);
});

test("history from the cloud is not limited to thirty images", () => {
  const many = Array.from({length: 75}, (_, i) => cloud(`image:${i}`, i));
  assert.equal(mergeHistory([], many).length, 75);
});

test("only images missing from the cloud are uploaded, oldest first", () => {
  const up = needsUpload([local("image:new", 50), local("image:old", 5), local("image:there", 20)], new Set(["image:there"]));
  assert.deepEqual(up.map(i => i.key), ["image:old", "image:new"]);
});

test("cloud paths are grouped by month", () => {
  assert.deepEqual(cloudPaths(Date.parse("2026-10-17T05:00:00Z"), "abc"), {path: "2026-10/abc.jpg", thumbPath: "2026-10/abc-t.jpg"});
});
