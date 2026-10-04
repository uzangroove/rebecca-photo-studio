// מצלם את מסכי האפליקציה לחוברת ההדרכה, עם מספרים על החלקים החשובים.
// שימוש: מפעילים את האתר מקומית (npm run preview), ואז:
//   BASE=http://localhost:8787 PASS=<סיסמה> node docs/guide/screenshots.cjs
// היצירה מדומה (בלי קריאה ל-OpenAI): התמונות שמופיעות כתוצאה הן קבצים מ-public/assets.
const {chromium}=require("playwright");const fs=require("fs");const path=require("path");
const BASE=process.env.BASE||"http://localhost:8787",PASS=process.env.PASS||"localtest";
const OUT=path.join(__dirname,"img"),ASSETS=path.join(__dirname,"..","..","public","assets");
const b64=f=>fs.readFileSync(path.join(ASSETS,f)).toString("base64");
const results=["candle-cactus.jpg","candle-flower.jpg","candle-garden.jpg"];let gen=0;

async function mark(page,items){
  const boxes=[];
  for(const it of items){const b=await page.locator(it.sel).first().boundingBox();if(!b){console.warn("missing",it.sel);continue}boxes.push({...it,b})}
  await page.evaluate(boxes=>{
    const layer=document.createElement("div");layer.id="__ann";layer.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:99999";document.body.appendChild(layer);
    for(const {b,n,pos,outline} of boxes){
      if(outline!==false){const o=document.createElement("div");o.style.cssText=`position:absolute;left:${b.x-4}px;top:${b.y-4}px;width:${b.width+8}px;height:${b.height+8}px;border:3px solid #D93F7C;border-radius:12px;box-shadow:0 0 0 2px rgba(255,255,255,.6)`;layer.appendChild(o)}
      const d=document.createElement("div");d.textContent=n;
      const P={tr:[b.x+b.width-6,b.y-22],tl:[b.x-22,b.y-22],br:[b.x+b.width-6,b.y+b.height-6],bl:[b.x-22,b.y+b.height-6],t:[b.x+b.width/2-17,b.y-24],b:[b.x+b.width/2-17,b.y+b.height-8],l:[b.x-26,b.y+b.height/2-17],r:[b.x+b.width-8,b.y+b.height/2-17],c:[b.x+b.width/2-17,b.y+b.height/2-17]}[pos||"tr"];
      d.style.cssText=`position:absolute;left:${P[0]}px;top:${P[1]}px;width:34px;height:34px;border-radius:50%;background:#D93F7C;color:#fff;font:700 18px Assistant,Arial,sans-serif;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.4);border:2px solid #fff`;
      layer.appendChild(d);
    }
  },boxes);
}
const clear=page=>page.evaluate(()=>document.getElementById("__ann")?.remove());
async function shot(page,name,items=[],clip){
  await page.waitForTimeout(350);if(items.length)await mark(page,items);
  await page.screenshot({path:path.join(OUT,name+".png"),clip});await clear(page);
}
const tab=(page,t)=>page.click(`.rail-btn:has-text("${t}")`);

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
  const ctx=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5,httpCredentials:{username:"rebecca",password:PASS}});
  const page=await ctx.newPage();
  await page.route("**/api/generate",async route=>{await route.fulfill({json:{image:b64(results[gen++%results.length])}})});
  await page.goto(BASE+"/");await page.waitForSelector(".intro");await page.waitForTimeout(1500);
  await page.screenshot({path:path.join(OUT,"intro.png")});
  await page.keyboard.press("Escape");await page.waitForSelector(".app");await page.waitForTimeout(600);

  // מסך פתיחה, בלי תמונה
  await shot(page,"empty",[{sel:".empty .upload",n:1,pos:"r"},{sel:".tab-rail",n:2,pos:"l"},{sel:".recipes-toggle",n:3,pos:"b"}]);

  await page.setInputFiles('.empty input[type=file]',path.join(ASSETS,"candle-garden.jpg"));
  await tab(page,"מוצר");await page.click('.tile:has-text("נר בכלי זכוכית")');
  await shot(page,"tab-product",[{sel:".tile:has-text('נר בכלי זכוכית')",n:1,pos:"tl"},{sel:".group:has-text('מצב הנר')",n:2,pos:"tl"},{sel:".group:has-text('הזכוכית')",n:3,pos:"tl"},{sel:".group:has-text('זווית צילום')",n:4,pos:"tl"},{sel:".group:has-text('אירוע')",n:5,pos:"tl"}],{x:810,y:68,width:470,height:732});
  await tab(page,"סגנון");
  await shot(page,"tab-style",[{sel:".tile:has-text('מינימליסטי')",n:1,pos:"tl"},{sel:".group:has-text('אביזרים')",n:2,pos:"tl"},{sel:".never",n:3,pos:"tl"}],{x:810,y:68,width:470,height:732});
  await tab(page,"פרטים");await page.click('.tile:has-text("שעת זהב")');
  await shot(page,"tab-details",[{sel:".group:has-text('משטח')",n:1,pos:"tl"},{sel:".group:has-text('תאורה')",n:2,pos:"tl"},{sel:".group:has-text('רקע')",n:3,pos:"tl"},{sel:".field:has-text('בקשה מיוחדת')",n:4,pos:"tl"},{sel:".link-btn",n:5,pos:"b"}],{x:810,y:68,width:470,height:732});
  await page.click('.link-btn');
  await tab(page,"צבעים");await page.click('.tile:has-text("מדבר")');
  await shot(page,"tab-colors",[{sel:".tile-big >> nth=0",n:1,pos:"tl"},{sel:".grid-3",n:2,pos:"tl"}],{x:810,y:68,width:470,height:732});
  await tab(page,"פורמט");await page.click('.tile:has-text("פוסט לאורך") >> nth=0');
  await shot(page,"tab-format",[{sel:".grid-2",n:1,pos:"tl"},{sel:".tile.is-selected",n:2,pos:"bl"}],{x:810,y:68,width:470,height:732});
  await page.click('.tile:has-text("פוסט מרובע") >> nth=0');

  // יצירה
  await tab(page,"סגנון");await page.click('.tile:has-text("מינימליסטי")');
  await page.click(".cta");await page.waitForSelector(".thumb");await page.waitForTimeout(900);
  // מיתוג
  await tab(page,"מיתוג");
  await page.check('.brand-row2:has-text("לוגו") input[type=checkbox]');await page.check('.brand-row2:has-text("סלוגן") input[type=checkbox]');
  await page.check('.brand-row2:has-text("טקסט חופשי") input[type=checkbox]');await page.fill(".text-field input","נר ריחני בעבודת יד");await page.waitForTimeout(900);
  await shot(page,"tab-brand",[{sel:".brand-row2 >> nth=0",n:1,pos:"tl"},{sel:".brand-row2 >> nth=1",n:2,pos:"tl"},{sel:".brand-row2 >> nth=2",n:3,pos:"tl"},{sel:".text-field",n:4,pos:"tl"},{sel:".cta-green",n:5,pos:"tl"}],{x:810,y:68,width:470,height:732});
  await tab(page,"סגנון");await page.click('button[aria-label="תמונה טובה"]');
  await page.waitForTimeout(500);

  await shot(page,"overview",[
    {sel:".recipes-toggle",n:1,pos:"b"},{sel:".header-brand",n:2,pos:"b"},{sel:".header-end",n:3,pos:"b"},{sel:".tab-rail",n:4,pos:"l"},{sel:".option-panel",n:5,pos:"tl"},
    {sel:".views >> nth=0",n:6,pos:"b"},{sel:".canvas",n:7,pos:"tl"},{sel:".status-row",n:8,pos:"tr"},{sel:".actions",n:9,pos:"tl"},{sel:".history",n:10,pos:"tl"}]);
  await shot(page,"actions",[{sel:".cta",n:1,pos:"tl"},{sel:".actions .upload",n:2,pos:"tl"},{sel:".actions .pill:has(.btn-label)",n:3,pos:"tl"},{sel:".save",n:4,pos:"tl"}],{x:0,y:625,width:830,height:175});
  await shot(page,"views",[{sel:".views >> nth=0",n:1,pos:"b"},{sel:".views-zoom",n:2,pos:"b"},{sel:".rate",n:3,pos:"b"}],{x:0,y:68,width:830,height:700});

  // תצוגת לפני ואחרי
  await page.click('.view-btn:has-text("לפני ואחרי")');await page.fill(".compare-range","45");
  await shot(page,"compare",[{sel:".compare-range",n:1,pos:"c",outline:false}],{x:0,y:68,width:830,height:620});
  await page.click('.view-btn:has-text("זה לצד זה")');

  // מתכונים
  await page.click(".recipes-toggle");await page.click(".recipe-btn >> nth=0");
  await page.click(".recipes-toggle");
  await shot(page,"recipes",[{sel:".recipes-toggle",n:1,pos:"b"},{sel:".recipe >> nth=1",n:2,pos:"r"},{sel:".recipe-del",n:3,pos:"l"},{sel:".recipe-btn.dashed",n:4,pos:"l"}],{x:700,y:0,width:580,height:400});
  await page.click(".recipes-toggle");
  // ערכת צבעים
  await page.click('button[aria-label="צבעי הממשק"]');
  await shot(page,"theme",[{sel:'button[aria-label="צבעי הממשק"]',n:1,pos:"b"},{sel:".theme-grid",n:2,pos:"tl"}],{x:0,y:0,width:520,height:700});
  await page.click('.theme-pop .pill-opt:has-text("יער")');await page.waitForTimeout(400);
  await shot(page,"theme-forest",[],{x:0,y:0,width:1280,height:800});
  await page.click('button[aria-label="צבעי הממשק"]');await page.click('.theme-pop .pill-opt:has-text("ברירת מחדל")');await page.waitForTimeout(300);

  // עוד יצירות להיסטוריה
  for(const [style] of [["בוטיק"],["כפרי"]]){await tab(page,"סגנון");await page.click(`.tile:has-text("${style}") >> nth=0`);await page.click(".cta");await page.waitForFunction(()=>document.querySelectorAll(".thumb").length>=2);await page.waitForTimeout(600)}
  await page.click('button:has-text("הכל (")');await page.waitForSelector("dialog[open]");
  await shot(page,"gallery",[{sel:".gallery-grid .card >> nth=0",n:1,pos:"tl"},{sel:".gallery-head .icon-btn",n:2,pos:"b"}]);
  await page.click('.gallery-head .icon-btn');await page.waitForTimeout(300);

  // עורך המיתוג
  await tab(page,"מיתוג");await page.click('button:has-text("פתיחת עורך המיתוג")');await page.waitForSelector(".editor");await page.waitForTimeout(1200);
  await page.click(".layer-row >> nth=0 >> .layer-main");await page.waitForTimeout(400);
  await shot(page,"editor",[{sel:".layer-list",n:1,pos:"tl"},{sel:".props",n:2,pos:"tl"},{sel:".align-bar",n:3,pos:"b"},{sel:".canvas-frame",n:4,pos:"tl"},{sel:".format-strip",n:5,pos:"tl"},{sel:".save-layout",n:6,pos:"b"}]);
  await page.click('button:has-text("חזרה לסטודיו")');await page.waitForSelector(".app");

  // טלפון
  const pctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,httpCredentials:{username:"rebecca",password:PASS}});
  const p=await pctx.newPage();await p.route("**/api/generate",route=>route.fulfill({json:{image:b64("candle-cactus.jpg")}}));
  await p.goto(BASE+"/");await p.waitForSelector(".intro");await p.keyboard.press("Escape");await p.waitForSelector(".app");await p.waitForTimeout(500);
  await p.screenshot({path:path.join(OUT,"phone-empty.png")});
  await p.setInputFiles('.empty input[type=file]',path.join(ASSETS,"candle-garden.jpg"));await p.click(".cta");await p.waitForSelector(".thumb",{state:"attached"});await p.waitForTimeout(900);
  await p.screenshot({path:path.join(OUT,"phone-main.png")});
  await p.click('.rail-btn:has-text("צבעים")');await p.waitForTimeout(300);await p.screenshot({path:path.join(OUT,"phone-colors.png")});
  await p.click(".recipes-toggle");await p.waitForTimeout(300);await p.screenshot({path:path.join(OUT,"phone-recipes.png")});
  await browser.close();console.log("done");
})();
