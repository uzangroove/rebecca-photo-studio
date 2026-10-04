import {test} from "node:test";
import assert from "node:assert/strict";
import {defaultLayout,layoutFor,layoutFromLegacy,layoutsFromLegacy,parseLayout,parseLayouts,LOGO_ASPECT,SLOGAN_ASPECT,MAX_TEXT_CHARS,MAX_LABEL_CHARS,fonts,isFontRef,systemFontRef,systemFontName,fontLabel,parseImageLayer} from "../shared/brand-layout.ts";
import {imageBox,pctToPx} from "../shared/brand-geometry.ts";
import {formats} from "../shared/social-formats.ts";

const inside=(b:{x:number;y:number;w:number;h:number},w:number,h:number)=>b.x>=-0.5&&b.y>=-0.5&&b.x+b.w<=w+0.5&&b.y+b.h<=h+0.5;

test("the default layout fits inside every format, logo above slogan, nothing overlapping",()=>{
  for(const f of formats){
    const c={w:f.width,h:f.height},l=defaultLayout(f);
    const logo=imageBox(l.logo,LOGO_ASPECT,c),slogan=imageBox(l.slogan,SLOGAN_ASPECT,c);
    assert.ok(inside(logo,c.w,c.h),`${f.id} logo`);assert.ok(inside(slogan,c.w,c.h),`${f.id} slogan`);
    assert.ok(logo.y+logo.h<=slogan.y+0.5,`${f.id} stacked`);
    assert.ok(logo.y+logo.h<c.h*0.3,`${f.id} the pair stays at the top`);
    assert.equal(l.logo.cx,50);assert.equal(l.slogan.cx,50);
    assert.ok(!l.logo.visible&&!l.slogan.visible&&!l.text.visible,"nothing shows until asked");
    assert.ok(l.text.size>0&&l.text.cy>85);
  }
});
test("branding stays out of the product area by default in every format",()=>{
  for(const f of formats){
    const c={w:f.width,h:f.height},l=defaultLayout(f),slogan=imageBox(l.slogan,SLOGAN_ASPECT,c);
    assert.ok(slogan.y+slogan.h<=pctToPx(20,c.h)+1,`${f.id}`);
  }
});
test("a format without a saved layout gets its own default; a saved one wins",()=>{
  const f=formats.find(x=>x.id==="instagram-story")!;
  assert.deepEqual(layoutFor({},f),defaultLayout(f));
  const saved={...defaultLayout(f),logo:{...defaultLayout(f).logo,cx:12}};
  assert.equal(layoutFor({[f.id]:saved},f).logo.cx,12);
});
test("layouts survive validation unchanged, and bad ones do not",()=>{
  const layouts=Object.fromEntries(formats.map(f=>[f.id,defaultLayout(f)]));
  assert.deepEqual(parseLayouts(layouts),layouts);
  const l=defaultLayout(formats[0]);
  assert.ok(parseLayout(l));
  assert.equal(parseLayout({...l,text:{...l.text,text:"א".repeat(MAX_TEXT_CHARS+1)}}),null);
  assert.equal(parseLayout({...l,text:{...l.text,size:0}}),null);
  assert.equal(parseLayout({...l,logo:{...l.logo,tone:"neon"}}),null);
  assert.equal(parseLayout({...l,logo:{...l.logo,legibility:"glow"}}),null);
  assert.equal(parseLayout({...l,logo:{...l.logo,stretch:9}}),null);
  assert.equal(parseLayout({...l,logo:undefined}),null);
  assert.equal(parseLayout(null),null);
  assert.ok(parseLayout({...l,text:{...l.text,color:"#a1B2c3"}}));
});
test("every text font is one of the four Hebrew fonts",()=>{
  assert.deepEqual(fonts.map(f=>f.label),["Heebo","Assistant","Rubik","Frank Ruhl Libre"]);
});
test("old position grid: 0,0 is the top corner on the right, 20,20 the bottom corner on the left",()=>{
  const f=formats.find(x=>x.id==="instagram-square")!;
  const old={logo:true,slogan:true,logoX:0,logoY:0,logoScale:100,sloganX:20,sloganY:20,sloganScale:100};
  const l=layoutFromLegacy(old,f);
  assert.ok(l.logo.cx>50&&l.logo.cy<15&&l.logo.visible);
  assert.ok(l.slogan.cx<50&&l.slogan.cy>85&&l.slogan.visible);
  const c={w:f.width,h:f.height};
  assert.ok(inside(imageBox(l.logo,LOGO_ASPECT,c),c.w,c.h));assert.ok(inside(imageBox(l.slogan,SLOGAN_ASPECT,c),c.w,c.h));
  assert.equal(Object.keys(layoutsFromLegacy(old)).length,16);
});
test("old size: 160 percent is larger than 100, and 30 smaller",()=>{
  const f=formats[0],base={logo:true,slogan:true,logoX:10,logoY:0,logoScale:100,sloganX:10,sloganY:20,sloganScale:100};
  assert.ok(layoutFromLegacy({...base,logoScale:60},f).logo.w<layoutFromLegacy(base,f).logo.w);
  assert.ok(layoutFromLegacy({...base,logoScale:60},f).logo.w>layoutFromLegacy({...base,logoScale:30},f).logo.w);
});

test("a layout saved before colors and fonts existed still loads, with the defaults filled in",()=>{
  const l=defaultLayout(formats[0]);
  const {color:_c,asText:_a,label:_l,font:_f,bold:_b,...legacyLogo}=l.logo;
  const {color:_c2,asText:_a2,label:_l2,font:_f2,bold:_b2,...legacySlogan}=l.slogan;
  const parsed=parseLayout({...l,logo:legacyLogo,slogan:legacySlogan})!;
  assert.ok(parsed);
  assert.deepEqual(parsed.logo,l.logo);assert.deepEqual(parsed.slogan,l.slogan);
  assert.equal(parsed.logo.color,null);assert.equal(parsed.logo.asText,false);
  assert.equal(parsed.logo.label,"RÈBECCA");assert.equal(parsed.slogan.label,"HANDMADE NATURAL\nSOAP & CANDLES");
});
test("logo and slogan accept any #RRGGBB color and reject anything else",()=>{
  const l=defaultLayout(formats[0]);
  for(const color of ["#000000","#a1B2c3","#FFFFFF"])assert.ok(parseLayout({...l,logo:{...l.logo,color}}),color);
  for(const color of ["red","#fff","#12345","#1234567","rgb(1,2,3)","javascript:1",7])assert.equal(parseLayout({...l,slogan:{...l.slogan,color:color as any}}),null,String(color));
});
test("logo and slogan can be drawn as text: up to two lines, bundled or system font",()=>{
  const l=defaultLayout(formats[0]);
  const asText={...l.logo,asText:true,label:"Rebecca\nSoaps",font:"sys:Georgia",bold:true};
  assert.deepEqual(parseImageLayer(asText),asText);
  assert.equal(parseImageLayer({...asText,label:"a\nb\nc"}),null,"three lines");
  assert.equal(parseImageLayer({...asText,label:"a\r\nb"}),null,"carriage return");
  assert.equal(parseImageLayer({...asText,label:"x".repeat(MAX_LABEL_CHARS+1)}),null,"too long");
  assert.equal(parseImageLayer({...asText,asText:"yes"}),null);
  assert.ok(parseImageLayer({...asText,label:""}),"an empty label is allowed (nothing is drawn)");
});
test("a system font is a safe name, never something that can break out of a CSS font list",()=>{
  for(const name of ["Arial","Segoe UI","Frank Ruhl Libre","דוד","Noto Sans Hebrew","Comic Sans MS"])assert.ok(isFontRef("sys:"+name),name);
  for(const bad of ["sys:","sys: Arial","sys:Arial ",'sys:Ar"ial',"sys:Ar'ial","sys:a;b","sys:a,b","sys:a{b}","sys:a\nb","sys:a\\b","sys:<b>","sys:"+"x".repeat(61),"comic-sans","","sys",7,null])assert.equal(isFontRef(bad as any),false,String(bad));
  assert.equal(systemFontRef("  Arial  "),"sys:Arial");
  assert.equal(systemFontRef('Ar"ial'),null);assert.equal(systemFontRef("   "),null);
  assert.equal(systemFontName("sys:Georgia"),"Georgia");assert.equal(systemFontName("heebo"),null);
  assert.equal(fontLabel("heebo"),"Heebo");assert.equal(fontLabel("sys:Georgia"),"Georgia");
});
test("the free text accepts system fonts too, and still rejects unknown ids",()=>{
  const l=defaultLayout(formats[0]);
  assert.ok(parseLayout({...l,text:{...l.text,font:"sys:Georgia"}}));
  assert.equal(parseLayout({...l,text:{...l.text,font:"comic-sans"}}),null);
  assert.equal(parseLayout({...l,text:{...l.text,font:'sys:x";}'}}),null);
});
