import {fonts, type FontId} from "../../shared/brand-layout";
import assistantHebrew400 from "@fontsource/assistant/files/assistant-hebrew-400-normal.woff2?url";
import assistantHebrew700 from "@fontsource/assistant/files/assistant-hebrew-700-normal.woff2?url";
import assistantLatin400 from "@fontsource/assistant/files/assistant-latin-400-normal.woff2?url";
import assistantLatin700 from "@fontsource/assistant/files/assistant-latin-700-normal.woff2?url";
import frankHebrew400 from "@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-hebrew-400-normal.woff2?url";
import frankHebrew700 from "@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-hebrew-700-normal.woff2?url";
import frankLatin400 from "@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-latin-400-normal.woff2?url";
import frankLatin700 from "@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-latin-700-normal.woff2?url";
import heeboHebrew400 from "@fontsource/heebo/files/heebo-hebrew-400-normal.woff2?url";
import heeboHebrew700 from "@fontsource/heebo/files/heebo-hebrew-700-normal.woff2?url";
import heeboLatin400 from "@fontsource/heebo/files/heebo-latin-400-normal.woff2?url";
import heeboLatin700 from "@fontsource/heebo/files/heebo-latin-700-normal.woff2?url";
import rubikHebrew400 from "@fontsource/rubik/files/rubik-hebrew-400-normal.woff2?url";
import rubikHebrew700 from "@fontsource/rubik/files/rubik-hebrew-700-normal.woff2?url";
import rubikLatin400 from "@fontsource/rubik/files/rubik-latin-400-normal.woff2?url";
import rubikLatin700 from "@fontsource/rubik/files/rubik-latin-700-normal.woff2?url";

// גופני הטקסט נטענים עם FontFace לפני כל ציור, כדי שהתצוגה והייצוא ישתמשו באותם גופנים.
// הקבצים נארזים עם האתר (@fontsource), בלי תלות ב-Google Fonts.
const hebrewRange = "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F";
const latinRange = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const files: Record<FontId, {hebrew: [string, string]; latin: [string, string]}> = {
  heebo: {hebrew: [heeboHebrew400, heeboHebrew700], latin: [heeboLatin400, heeboLatin700]},
  assistant: {hebrew: [assistantHebrew400, assistantHebrew700], latin: [assistantLatin400, assistantLatin700]},
  rubik: {hebrew: [rubikHebrew400, rubikHebrew700], latin: [rubikLatin400, rubikLatin700]},
  "frank-ruhl-libre": {hebrew: [frankHebrew400, frankHebrew700], latin: [frankLatin400, frankLatin700]}
};

// שם משפחה ייחודי, כדי שלא יתנגש בגופנים שהדף עצמו טוען.
export const canvasFamily = (id: FontId) => `RB ${fonts.find(f => f.id === id)!.family}`;

const loading = new Map<FontId, Promise<void>>();
export function loadBrandFont(id: FontId): Promise<void> {
  let promise = loading.get(id);
  if (!promise) {
    promise = (async () => {
      const faces: FontFace[] = [];
      for (const [subset, range] of [["hebrew", hebrewRange], ["latin", latinRange]] as const)
        ([400, 700] as const).forEach((weight, i) => faces.push(new FontFace(canvasFamily(id), `url(${files[id][subset][i]}) format("woff2")`, {weight: String(weight), unicodeRange: range})));
      await Promise.all(faces.map(async face => { await face.load(); document.fonts.add(face); }));
    })();
    loading.set(id, promise);
    promise.catch(() => loading.delete(id));
  }
  return promise;
}
