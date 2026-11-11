// שימוש: node --experimental-strip-types scripts/profile.ts rows.json
// rows.json: שורות מהטבלה studio_images (selection, rating, sent_to_site). מדפיס דוח פרופיל בעברית.
import {readFileSync} from "node:fs";
import {parseSelection} from "../shared/selection.ts";
import {computeProfile, canSuggest, PROFILE_DIMS} from "../shared/profile.ts";

const names: Record<string, string> = {style: "סגנון", palette: "פלטה", props: "אביזרים", surface: "משטח", background: "רקע", light: "תאורה"};
const rows = JSON.parse(readFileSync(process.argv[2] ?? "rows.json", "utf8")) as Array<Record<string, unknown>>;
const inputs = rows.flatMap(r => { const selection = parseSelection(r.selection); return selection ? [{selection, rating: r.rating === "up" || r.rating === "down" ? r.rating : null, sent: r.sent_to_site === true}] : []; });
const p = computeProfile(inputs);
console.log(`# פרופיל רבקה\n${p.total} תמונות, ${p.rated} מדורגות\n`);
for (const prod of p.products) {
  console.log(`## ${prod.product} (${prod.images} תמונות${canSuggest(prod) ? "" : ", עדיין מעט מדי להצעה אוטומטית"})`);
  for (const d of PROFILE_DIMS) console.log(`- ${names[d]}: ` + prod.dims[d].map(c => `${c.value} ${Math.round(c.share * 100)}%`).join(", "));
  if (prod.disliked.length) console.log(`- דורגו 👎: ${prod.disliked.join(", ")}`);
  console.log("");
}
