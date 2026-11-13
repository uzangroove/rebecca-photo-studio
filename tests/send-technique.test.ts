import {test} from "node:test";
import assert from "node:assert/strict";
import {withTechnique} from "../shared/selection.ts";

test("the technique goes to the site only when Rebecca wrote one", () => {
  const meta = {style: "boutique", palette: "desert", product: "soap", formatId: "instagram-square"};
  assert.deepEqual(withTechnique(meta, "  סווירל   בשתי שכבות "), {...meta, technique: "סווירל בשתי שכבות"});
  assert.deepEqual(withTechnique(meta, ""), meta);
  assert.deepEqual(withTechnique(meta, "   "), meta);
  assert.deepEqual(withTechnique(meta, undefined), meta);
  assert.ok(!("technique" in withTechnique(meta, "")));
});
