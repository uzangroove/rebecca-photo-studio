import {test} from "node:test";
import assert from "node:assert/strict";
import {defaultSelection, parseSelection, cleanTechnique, techniqueSuggestions, MAX_TECHNIQUE_CHARS} from "../shared/selection.ts";
import {buildPrompt} from "../shared/build-prompt.ts";
import {computeProfile, NO_TECHNIQUE_LABEL} from "../shared/profile.ts";
import {initialState, reducer} from "../src/state.ts";

test("technique is optional: old selections without it read as empty", () => {
  const {technique: _t, ...old} = defaultSelection;
  assert.equal(parseSelection(old)!.technique, "");
  assert.equal(parseSelection({...old, technique: null})!.technique, "");
});

test("technique is validated: text up to 60 chars, no line breaks, spacing cleaned", () => {
  assert.equal(parseSelection({...defaultSelection, technique: "  סחרור   בקנה "})!.technique, "סחרור בקנה");
  assert.equal(parseSelection({...defaultSelection, technique: "marbled swirl"})!.technique, "marbled swirl");
  assert.equal(parseSelection({...defaultSelection, technique: "x".repeat(MAX_TECHNIQUE_CHARS + 1)}), null);
  assert.equal(parseSelection({...defaultSelection, technique: "a\nb"}), null);
  assert.equal(parseSelection({...defaultSelection, technique: 5}), null);
  assert.equal(cleanTechnique("x".repeat(100)).length, MAX_TECHNIQUE_CHARS);
});

test("technique never reaches the prompt", () => {
  const settings = {neverList: []};
  assert.equal(buildPrompt({...defaultSelection, technique: "swirl"}, settings), buildPrompt(defaultSelection, settings));
});

test("suggestions grow from what was written: deduped, most common first, newest first on ties, nothing pre-made", () => {
  assert.deepEqual(techniqueSuggestions([]), []);
  assert.deepEqual(techniqueSuggestions(["", "  "]), []);
  assert.deepEqual(techniqueSuggestions(["סחרור"]), ["סחרור"]);
  assert.deepEqual(techniqueSuggestions(["Swirl", "סחרור", "swirl ", "marbled"]), ["Swirl", "סחרור", "marbled"]);
  assert.equal(techniqueSuggestions(Array.from({length: 50}, (_, i) => "t" + i), 30).length, 30);
});

test("typing a technique keeps the picture on screen; a new photo starts empty", () => {
  const withImage = {...initialState, photo: {file: {} as File, url: "blob:a"}, result: "data:image/png;base64,AAAA"};
  const typed = reducer(withImage, {type: "technique", text: "סחרור"});
  assert.equal(typed.selection.technique, "סחרור");
  assert.equal(typed.result, withImage.result);
  assert.equal(reducer(typed, {type: "technique", text: "a\nb"}).selection.technique, "a b");
  assert.equal(reducer(typed, {type: "photo", photo: {file: {} as File, url: "blob:b"}}).selection.technique, "");
  // פתיחת תמונה מההיסטוריה מחזירה את הטכניקה שלה
  const opened = reducer(typed, {type: "openRecent", url: "blob:r", key: "image:1", selection: {...defaultSelection, technique: "marbled"}, formatId: "instagram-square"});
  assert.equal(opened.selection.technique, "marbled");
});

test("recipes never touch the technique", async () => {
  const {applyRecipe, builtInRecipes} = await import("../shared/recipes.ts");
  assert.equal(applyRecipe({...defaultSelection, technique: "סחרור"}, builtInRecipes[0]).technique, "סחרור");
});

test("profile groups by technique, case-insensitively, with an explicit 'not stated'", () => {
  const img = (technique: string) => ({selection: {...defaultSelection, technique}, rating: null as null});
  const p = computeProfile([img("Swirl"), img("swirl"), img("")]);
  assert.equal(p.products[0].dims.technique[0].value, "swirl");
  assert.equal(p.products[0].dims.technique[0].count, 2);
  assert.equal(p.products[0].dims.technique[1].value, NO_TECHNIQUE_LABEL);
});
