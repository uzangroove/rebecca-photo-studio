import {test} from "node:test";
import assert from "node:assert/strict";
import {computeProfile, canSuggest, DEFAULT_LABEL} from "../shared/profile.ts";
import {defaultSelection, type Selection} from "../shared/selection.ts";

const img = (over: Partial<Selection>, rating: "up" | "down" | null = null) => ({selection: {...defaultSelection, ...over}, rating});

test("profile groups by product and ranks choices", () => {
  const p = computeProfile([img({style: "minimal"}), img({style: "minimal"}), img({style: "spa"}), img({product: "candle", style: "boutique"})]);
  assert.equal(p.total, 4);
  assert.deepEqual(p.products.map(x => [x.product, x.images]), [["soap", 3], ["candle", 1]]);
  const soap = p.products[0];
  assert.equal(soap.dims.style[0].value, "minimal"); assert.equal(soap.dims.style[0].share, 0.67);
});

test("null scene choices count as default; custom palettes are one group", () => {
  const p = computeProfile([img({background: null, palette: "custom:#111,#222,#333"}), img({background: null, palette: "custom:#aaa,#bbb,#ccc"})]);
  assert.equal(p.products[0].dims.background[0].value, DEFAULT_LABEL);
  assert.equal(p.products[0].dims.palette[0].value, "custom");
  assert.equal(p.products[0].dims.palette[0].share, 1);
});

test("thumbs up counts double, thumbs down almost nothing, and is listed as disliked", () => {
  const p = computeProfile([img({style: "spa"}, "up"), img({style: "minimal"}), img({style: "minimal"}, "down")]);
  const style = p.products[0].dims.style;
  assert.equal(style[0].value, "spa");
  assert.equal(p.rated, 2);
  assert.ok(p.products[0].disliked.includes("style:minimal"));
});

test("canSuggest needs at least 15 images for a product", () => {
  const many = computeProfile(Array.from({length: 15}, () => img({})));
  assert.equal(canSuggest(many.products[0]), true);
  assert.equal(canSuggest(computeProfile([img({})]).products[0]), false);
});
