// הקטלוג המשותף: מקור אמת יחיד לאפשרויות. הלקוח בונה ממנו את הממשק והשרת מאמת מולו.
// `label` בעברית (לממשק), `prompt` באנגלית (למודל), `icon` הוא נתיב SVG בקו דק על רשת 24×24.
export type CatalogItem = {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  favorite?: boolean;
  detail?: string;
};
export type PaletteItem = CatalogItem & {colors: readonly [string, string, string]; iconFill?: string};

export const styles: readonly CatalogItem[] = [
  {id:"boutique",label:"בוטיק",detail:"תאורה מדויקת ומשטח עשיר",icon:"M6 4h12l3 5-9 11L3 9l3-5z M3 9h18 M12 20L8.5 9 10 4 M12 20l3.5-11L14 4",
    prompt:"a refined luxury boutique product photograph, premium stone or textured paper, sculptural light"},
  {id:"rustic",label:"כפרי",detail:"עץ טבעי ופשתן",icon:"M3 9h18v6H3z M8 9v6 M14 10.5c1 1 1 2 0 3",
    prompt:"a rustic handcrafted setting with natural wood and linen, warm window light"},
  {id:"urban",label:"אורבני",detail:"קיר בטון ואור חלון",icon:"M4 20V9h6v11 M10 20V4h8v16 M3 20h18 M13 8h2 M13 12h2 M13 16h2 M6.5 13h1 M6.5 16.5h1",
    prompt:"a contemporary urban studio with concrete and architectural window light"},
  {id:"minimal",label:"מינימליסטי",detail:"מרחב נקי ומעט פריטים",icon:"M4 18h16 M9 18V10h6v8",
    prompt:"a calm minimal studio scene with generous negative space and simple surfaces"},
  {id:"botanical",label:"בוטני",detail:"עלים ואור יום",icon:"M5 19C5 10 11 5 19 5c0 8-5 14-14 14z M5 19l9-9",
    prompt:"a botanical scene with real leaves and soft natural daylight"},
  {id:"spa",label:"ספא",detail:"אבן ואווירה שקטה",icon:"M5 19a7 2.5 0 1 0 14 0a7 2.5 0 1 0-14 0z M7.5 14a4.5 2 0 1 0 9 0a4.5 2 0 1 0-9 0z M12 3c2 2.5 3 4 3 5.2a3 3 0 0 1-6 0C9 7 10 5.5 12 3z",
    prompt:"a peaceful spa setting with stone, folded fabric and diffused light"},
  {id:"mediterranean",label:"ים תיכוני",detail:"טיח, שמש וזית",icon:"M12 4v2 M5.5 7l1.4 1.4 M18.5 7l-1.4 1.4 M8 13a4 4 0 0 1 8 0 M3 13h18 M3 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0",
    prompt:"a Mediterranean scene with warm plaster, sunlight and an olive branch"},
  {id:"japandi",label:"ג׳פנדי",detail:"עץ בהיר וקרמיקה",icon:"M4 12h16a8 7 0 0 1-16 0z M9 19.5h6 M13 4l-2.5 6.5 M18 5l-4 5.5",
    prompt:"a warm Japandi interior with pale wood and quiet ceramic details"},
  {id:"editorial",label:"אמנותי",detail:"צללים וקומפוזיציה נועזת",icon:"M4 8h3l2-3h6l2 3h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z",
    prompt:"an artistic editorial studio photograph with bold but realistic shadows"},
  {id:"gift",label:"מתנה ואירוח",detail:"בד ושולחן חגיגי",icon:"M4 10h16v4H4z M5 14h14v6H5z M12 10v10 M12 10c-2-4-6-4-6-1.5S10 10 12 10c2 0 6 1 6-1.5S14 6 12 10z",
    prompt:"a thoughtful gift and hosting scene with natural fabric and elegant table styling"}
];

// ה-prompt של פלטה הוא קודי ה-HEX בלבד, בסדר שבו הם מוצגים.
const palette = (id: string, label: string, colors: readonly [string, string, string], icon: string, iconFill?: string): PaletteItem =>
  ({id, label, colors, icon, iconFill, prompt: colors.join(", ")});

export const palettes: readonly PaletteItem[] = [
  palette("mono","מונוכרום",["#1A1A1A","#8C8C8C","#F5F5F5"],"M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z","M12 3a9 9 0 0 0 0 18z"),
  palette("charcoal","פחם",["#2B2D42","#8D99AE","#EDF2F4"],"M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"),
  palette("metal","מתכת",["#4A5568","#A0AEC0","#E2E8F0"],"M7.5 4h9l4.5 8-4.5 8h-9L3 12z M12 15a3 3 0 1 0 0-6a3 3 0 1 0 0 6z"),
  palette("stone","אבן",["#5C6B73","#9DB4C0","#C2DFE3"],"M4 17c0-3 3-5 7-5s7 2 7 4-3 3-7 3-7 0-7-2z M8 10c0-2 2-4 5-4s4 1.5 4 3"),
  palette("coffee","קפה",["#4A3B32","#8E735B","#D9CDBF"],"M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z M16 10h2a2.5 2.5 0 0 1 0 5h-2 M9 3c-1 1.5 1 2.5 0 4 M12.5 3c-1 1.5 1 2.5 0 4"),
  palette("vintage","וינטג׳",["#8B5A2B","#CD853F","#F5DEB3"],"M12 21a8 8 0 1 0 0-16a8 8 0 1 0 0 16z M12 9v4l2.5 2 M10 3h4"),
  palette("desert","מדבר",["#B07D62","#D8A47F","#F3E1D4"],"M16 8.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M2 18c3-5 7-6 11-2 M9 13c3-3 8-3 13 4 M2 21h20"),
  palette("spice","תבלין",["#9B2226","#CA6702","#EE9B00"],"M17 6c1.5 1 2 3 1 5-2 5-7 8-13 8-1 0-2-1-1.5-2C9 16 13 13 15 8 M17 6c0-1.5 1-2.5 2.5-3"),
  palette("autumn","סתיו",["#823329","#B85D43","#EDC4B3"],"M12 21v-6 M12 15c-4 0-7-3-7-7 2 0 3 1 4 2 0-3 1-5 3-7 2 2 3 4 3 7 1-1 2-2 4-2 0 4-3 7-7 7z"),
  palette("wood","עץ",["#3E2723","#795548","#D7CCC8"],"M12 20a8 7 0 1 0 0-14a8 7 0 1 0 0 14z M12 16.5a4 3.5 0 1 0 0-7a4 3.5 0 1 0 0 7z"),
  palette("forest","יער",["#2A4B3C","#6B8E76","#C6D8CB"],"M8 3l-4 7h2l-3 5h10l-3-5h2z M8 15v5 M17 7l-3 5h1.5L13 16h8l-2.5-4H20z M17 16v4"),
  palette("olive","זית",["#3B4D36","#708238","#A2B57B"],"M4 20C9 15 14 10 20 4 M9 15c-2-1-3-3-2.5-5 2 .5 3 2.5 2.5 5z M13 11c-1-2-.5-4 1-5.5 1.5 1.5 1.5 3.5-1 5.5z M15 13c2-1 4-.5 5 1-1.5 1.5-3.5 1-5-1z"),
  palette("mint","מנטה",["#2D6A4F","#52B788","#B7E4C7"],"M12 21V11 M12 11C8 11 5 8 5 4c4 0 7 3 7 7z M12 14c0-4 3-7 7-7 0 4-3 7-7 7z"),
  palette("ocean","אוקיינוס",["#13315C","#134074","#8DA9C4"],"M2 9c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5 0 M2 14c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5 0 M2 19c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5 0"),
  palette("space","חלל",["#1E1E3F","#4B4B7C","#A6A6CC"],"M12 17a5 5 0 1 0 0-10a5 5 0 1 0 0 10z M4 16c-1.5 2.5 3 2.5 8.5-.5S21 8.5 20 6.5 15 6 15 6"),
  palette("lilac","לילך",["#5E548E","#9F86C0","#E0B1CB"],"M12 8a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M8 12a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M16 12a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M12 15a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M12 15v6"),
  palette("peach","אפרסק",["#E29578","#FFB5A7","#FEC5BB"],"M12 20c-4.5 0-7.5-3-7.5-6.5S7.5 7 12 8c4.5-1 7.5 2 7.5 5.5S16.5 20 12 20z M12 8c1-2.5 3-3.5 5-3-1 2-3 3-5 3z"),
  palette("sunset","שקיעה",["#E07A5F","#F4A261","#F2CC8F"],"M5 17a7 7 0 0 1 14 0 M2 17h20 M5 21h14 M12 4v3 M4.5 9.5l2 1.5 M19.5 9.5l-2 1.5"),
  palette("soap","סבון",["#CDB4DB","#FFC8DD","#FFAFCC"],"M9 15a5 5 0 1 0 0-10a5 5 0 1 0 0 10z M17 20a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M18 9a1.5 1.5 0 1 0 0-3a1.5 1.5 0 1 0 0 3z"),
  palette("linen","פשתן",["#A4937A","#D6C7B3","#F2EBE1"],"M4 6h16v4H4z M4 10c0 3 2 4 4 4h12 M4 14v4h16v-4")
];

export const productTypes: readonly CatalogItem[] = [
  {id:"soap",label:"סבון",icon:"M3 11l5-4h13v7l-5 4H3z M3 11h13v7 M16 11l5-4",prompt:"handmade soaps"},
  {id:"candle",label:"נר",icon:"M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z M7 12h10 M12 8V6 M12 6c.8-.8 1-1.8 0-3-1 1.2-.8 2.2 0 3z",prompt:"handmade candles"}
];

export const props: readonly CatalogItem[] = [
  {id:"none",label:"בלי אביזרים",icon:"M12 20a8 8 0 1 0 0-16a8 8 0 1 0 0 16z M6.3 6.3l11.4 11.4",
    prompt:"No styling props. Use only the product and the surface."},
  {id:"subtle",label:"מעט",icon:"M12 21v-8 M12 13C8 13 5 10 5 6c4 0 7 3 7 7z M12 16c0-4 3-7 7-7 0 4-3 7-7 7z",
    prompt:"Use one or two subtle contextual props well away from the product."},
  {id:"rich",label:"עשיר",icon:"M5 20v-6 M5 14c-2-1-3-3-3-5 3 0 3 3 3 5z M12 20V9 M12 9c-3-1-4-4-3-7 3 1 4 4 3 7z M19 20v-6 M19 14c-2-1-3-3-3-5 3 0 3 3 3 5z M3 20h18",
    prompt:"Use a few tasteful contextual props while keeping the product clearly dominant."}
];

export const catalog = {styles, palettes, productTypes, props} as const;
export type CatalogCategory = keyof typeof catalog;

export function findItem(category: "palettes", id: string): PaletteItem | undefined;
export function findItem(category: CatalogCategory, id: string): CatalogItem | undefined;
export function findItem(category: CatalogCategory, id: string): CatalogItem | undefined {
  return catalog[category].find(item => item.id === id);
}
export function hasItem(category: CatalogCategory, id: unknown): id is string {
  return typeof id === "string" && catalog[category].some(item => item.id === id);
}
