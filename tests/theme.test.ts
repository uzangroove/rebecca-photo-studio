import {test} from "node:test";
import assert from "node:assert/strict";
import {contrast,cssVarNames,defaultTheme,luminance,mix,themeFromColors} from "../shared/theme.ts";
import {palettes} from "../shared/catalog.ts";

test("contrast math matches the WCAG reference values",()=>{
  assert.equal(Math.round(contrast("#000000","#FFFFFF")),21);
  assert.equal(contrast("#777777","#777777"),1);
  assert.ok(luminance("#FFFFFF")>luminance("#808080")&&luminance("#808080")>luminance("#000000"));
  assert.equal(mix("#000000","#FFFFFF",0.5),"#808080");
});
test("the default theme is Rebecca's green and gold, and is readable",()=>{
  const t=defaultTheme;
  assert.equal(t.green,"#163B30");assert.equal(t.gold,"#8A6A2F");assert.equal(t.bg,"#F3EDE1");
  assert.ok(contrast(t.cream,t.green)>=6&&contrast("#FFFFFF",t.gold)>=4.5&&contrast(t.text,t.bg)>=9&&contrast(t.muted,t.bg)>=4.5);
});
test("every one of the 20 palettes gives a theme whose text is readable",()=>{
  assert.equal(palettes.length,20);
  for(const p of palettes){
    const t=themeFromColors(p.colors);
    for(const [k,v] of Object.entries(t))assert.match(v,/^#[0-9A-F]{6}$/,`${p.id}.${k}`);
    assert.ok(contrast(t.cream,t.green)>=4.5,`${p.id}: light text on the primary color`);
    assert.ok(contrast("#FFFFFF",t.gold)>=4.5,`${p.id}: white text on the main button`);
    assert.ok(contrast(t.text,t.bg)>=7,`${p.id}: body text`);
    assert.ok(contrast(t.muted,t.bg)>=4.5,`${p.id}: secondary text`);
    assert.ok(contrast(t.text,t.surface)>=7,`${p.id}: text on cards`);
    assert.ok(contrast(t.okFg,t.okBg)>=4.5,`${p.id}: status text`);
    assert.ok(contrast(t.goldLight,t.green)>=4.5,`${p.id}: accent icons on the primary color`);
    assert.ok(luminance(t.bg)>0.6,`${p.id}: the page stays light`);
    assert.ok(contrast(t.green,t.bg)>=4.5,`${p.id}: primary color against the page`);
  }
});
test("the theme follows the palette: forest is greenish, desert is warm",()=>{
  const forest=themeFromColors(palettes.find(p=>p.id==="forest")!.colors),desert=themeFromColors(palettes.find(p=>p.id==="desert")!.colors);
  const hex=(h:string)=>parseInt(h.slice(1),16);
  assert.ok(((hex(forest.green)>>8)&255)>(hex(forest.green)>>16)&&((hex(forest.green)>>8)&255)>=(hex(forest.green)&255),"green dominates");
  assert.ok((hex(desert.green)>>16)>(hex(desert.green)&255),"red dominates over blue");
  assert.notEqual(forest.green,desert.green);
});
test("every token has a css variable name",()=>{
  assert.deepEqual(Object.keys(cssVarNames).sort(),Object.keys(defaultTheme).sort());
});
