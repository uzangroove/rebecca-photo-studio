import {test} from "node:test";
import assert from "node:assert/strict";
import {buildPrompt} from "../shared/build-prompt.ts";
import {palettes} from "../shared/catalog.ts";
import {customToken, extractPalette, hexToHsl, hslToHex, isPaletteValue, paletteLabel, parseCustomPalettes, parseCustomToken, parseHiddenPalettes, normHex} from "../shared/palette-custom.ts";
import {defaultSelection, parseSelection} from "../shared/selection.ts";
import {defaultSettings, parseSettings} from "../shared/settings.ts";
import {initialState, reducer} from "../src/state.ts";

const rose = {id: "c-rose01", label: "ורד עתיק", colors: ["#8E5B4A", "#D9B8A3", "#F7EFE8"] as const};
const token = customToken(rose.colors);

test("a custom palette is stored as its three colors, and only valid HEX passes", () => {
  assert.equal(token, "custom:#8E5B4A,#D9B8A3,#F7EFE8");
  assert.deepEqual(parseCustomToken(token), ["#8E5B4A", "#D9B8A3", "#F7EFE8"]);
  for (const bad of ["custom:#8E5B4A,#D9B8A3", "custom:red,green,blue", "custom:#8e5b4a,#D9B8A3,#F7EFE8", "mono", 5, null]) assert.equal(parseCustomToken(bad), null, String(bad));
  assert.ok(isPaletteValue("mono") && isPaletteValue(token) && !isPaletteValue("custom:"));
  assert.equal(normHex("8e5b4a"), "#8E5B4A"); assert.equal(normHex("#abc"), "#AABBCC"); assert.equal(normHex("#12"), null);
});

test("the server accepts a custom palette in a selection, and the prompt gets only the HEX codes", () => {
  const selection = {...defaultSelection, palette: token};
  assert.deepEqual(parseSelection(selection), selection);
  assert.equal(parseSelection({...defaultSelection, palette: "custom:#000000,#FFFFFF"}), null);
  const prompt = buildPrompt(selection, defaultSettings);
  assert.ok(prompt.includes("environment colors only: #8E5B4A, #D9B8A3, #F7EFE8."));
  assert.ok(!prompt.includes("ורד") && !prompt.includes("custom:"));
});

test("names: the palette's own name, and 'פלטה אישית' after it was deleted", () => {
  assert.equal(paletteLabel(token, [rose]), "ורד עתיק");
  assert.equal(paletteLabel(token, []), "פלטה אישית");
  assert.equal(paletteLabel("desert"), "מדבר");
});

test("synced settings keep custom and hidden palettes; old settings read with empty lists", () => {
  const saved = {...defaultSettings, customPalettes: [rose], hiddenPalettes: ["space", "spice"]};
  assert.deepEqual(parseSettings(JSON.parse(JSON.stringify(saved))), saved);
  const {customPalettes: _c, hiddenPalettes: _h, ...old} = defaultSettings;
  assert.deepEqual(parseSettings(old), defaultSettings);
  assert.equal(parseSettings({...defaultSettings, customPalettes: [{...rose, colors: ["red", "#000000", "#FFFFFF"]}]}), null);
  assert.equal(parseSettings({...defaultSettings, customPalettes: [rose, rose]}), null, "duplicate ids");
  assert.equal(parseCustomPalettes(Array.from({length: 25}, (_, i) => ({...rose, id: `c-x${i}aa`}))), null, "at most 24");
  assert.equal(parseHiddenPalettes(["mono"]), null, "Rebecca's favorites cannot be hidden");
  assert.equal(parseHiddenPalettes(["nope"]), null);
});

test("saving selects the new palette; deleting keeps the current selection working", () => {
  let s = reducer({...initialState}, {type: "paletteSave", palette: rose});
  assert.equal(s.customPalettes.length, 1);
  assert.equal(s.selection.palette, token);
  s = reducer(s, {type: "paletteDelete", id: rose.id});
  assert.equal(s.customPalettes.length, 0);
  assert.equal(s.selection.palette, token);
  assert.ok(parseSelection(s.selection));
});

test("hiding and restoring built-in palettes; favorites stay", () => {
  let s = reducer({...initialState}, {type: "paletteHide", id: "space"});
  s = reducer(s, {type: "paletteHide", id: "mono"});
  s = reducer(s, {type: "paletteHide", id: "space"});
  assert.deepEqual(s.hiddenPalettes, ["space"]);
  s = reducer(reducer(s, {type: "paletteHide", id: "spice"}), {type: "paletteShow", id: "space"});
  assert.deepEqual(s.hiddenPalettes, ["spice"]);
  assert.deepEqual(reducer(s, {type: "paletteShow", id: null}).hiddenPalettes, []);
  assert.equal(palettes.filter(p => p.favorite).length, 2);
});

test("HSL conversion round-trips", () => {
  for (const hex of ["#8E5B4A", "#163B30", "#F7EFE8", "#000000", "#FFFFFF", "#13315C"]) {
    const back = hslToHex(hexToHsl(hex));
    const d = [1, 3, 5].map(i => Math.abs(parseInt(back.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)));
    assert.ok(Math.max(...d) <= 3, `${hex} → ${back}`);
  }
  assert.equal(hslToHex({h: 0, s: 100, l: 50}), "#FF0000");
});

test("colors from the product: the three most common distinct colors, dark to light", () => {
  const px: number[] = [];
  const add = (r: number, g: number, b: number, n: number) => { for (let i = 0; i < n; i++) px.push(r, g, b, 255); };
  add(240, 236, 228, 500);   // רקע בהיר
  add(242, 238, 230, 300);   // כמעט אותו צבע — לא נספר כצבע שני
  add(46, 92, 60, 300);      // ירוק כהה
  add(201, 167, 106, 200);   // זהב
  add(10, 10, 10, 20);       // מעט שחור — פחות נפוץ
  add(0, 0, 0, 50); px.splice(px.length - 200, 200, ...Array(200).fill(0)); // שקוף — לא נספר
  const [dark, mid, light] = extractPalette(px);
  assert.equal(dark.slice(0, 3), "#2E");
  assert.equal(mid.slice(0, 3), "#C9");
  assert.ok(light.startsWith("#F"));
});
