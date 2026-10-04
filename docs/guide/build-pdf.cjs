// מייצר את החוברת כ-PDF: node docs/guide/build-pdf.cjs  (צריך את Playwright ו-Chromium)
const {chromium}=require("playwright");const path=require("path");
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
  const page=await browser.newPage();
  await page.goto("file://"+path.join(__dirname,"booklet.html"));
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  await page.pdf({path:path.join(__dirname,"rebecca-studio-guide.pdf"),format:"A4",printBackground:true,preferCSSPageSize:true});
  await browser.close();console.log("pdf ok");
})();
