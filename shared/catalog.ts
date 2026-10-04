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
export type SceneDefaults = {surface: string; background: string; light: string};
export type StyleItem = CatalogItem & {defaults: SceneDefaults};
export type SurfaceItem = CatalogItem & {swatch: string};
// family קובע אילו הנחיות רלוונטיות (מצב נר לנרות, עטיפה למארז). guidance הוא מקטע הפרומפט של סוג המוצר.
export type ProductFamily = "candle" | "soap" | "melts" | "bomb" | "gift";
export type ProductItem = CatalogItem & {family: ProductFamily; guidance: string | null};
export type PaletteItem = CatalogItem & {colors: readonly [string, string, string]; iconFill?: string};

// הסגנון קובע את האווירה ואת ברירות המחדל של משטח, רקע ותאורה. בחירה מפורשת של רבקה גוברת עליהן.
// בכוונה אין כאן אבן ושיש, ואין אביזרים בטקסט של הסגנון: אביזרים נקבעים רק בבחירת האביזרים.
export const styles: readonly StyleItem[] = [
  {id:"boutique",label:"בוטיק",favorite:true,detail:"נייר, טיח ותאורה מפוסלת",icon:"M6 4h12l3 5-9 11L3 9l3-5z M3 9h18 M12 20L8.5 9 10 4 M12 20l3.5-11L14 4",
    prompt:"a refined luxury boutique product photograph, sculpted directional light, refined and quiet",defaults:{surface:"paper",background:"wall",light:"window"}},
  {id:"minimal",label:"מינימליסטי",favorite:true,detail:"מרחב נקי ושקט",icon:"M4 18h16 M9 18V10h6v8",
    prompt:"a calm minimal studio scene with generous negative space and simple surfaces",defaults:{surface:"paper",background:"wall",light:"studio"}},
  {id:"rustic",label:"כפרי",detail:"עץ טבעי ופשתן",icon:"M3 9h18v6H3z M8 9v6 M14 10.5c1 1 1 2 0 3",
    prompt:"a rustic handcrafted setting, warm and natural",defaults:{surface:"oak",background:"wall",light:"window"}},
  {id:"urban",label:"אורבני",detail:"קיר בטון ואור חלון",icon:"M4 20V9h6v11 M10 20V4h8v16 M3 20h18 M13 8h2 M13 12h2 M13 16h2 M6.5 13h1 M6.5 16.5h1",
    prompt:"a contemporary urban studio with architectural shadows",defaults:{surface:"concrete",background:"wall",light:"window"}},
  {id:"botanical",label:"בוטני",detail:"עלים ואור יום",icon:"M5 19C5 10 11 5 19 5c0 8-5 14-14 14z M5 19l9-9",
    prompt:"a fresh botanical scene with soft natural daylight",defaults:{surface:"linen",background:"plants",light:"window"}},
  {id:"spa",label:"ספא",detail:"בד מקופל ואור רך",icon:"M5 19a7 2.5 0 1 0 14 0a7 2.5 0 1 0-14 0z M7.5 14a4.5 2 0 1 0 9 0a4.5 2 0 1 0-9 0z M12 3c2 2.5 3 4 3 5.2a3 3 0 0 1-6 0C9 7 10 5.5 12 3z",
    prompt:"a peaceful spa setting with folded fabric and diffused light",defaults:{surface:"linen",background:"blur",light:"studio"}},
  {id:"mediterranean",label:"ים תיכוני",detail:"טיח, שמש וזית",icon:"M12 4v2 M5.5 7l1.4 1.4 M18.5 7l-1.4 1.4 M8 13a4 4 0 0 1 8 0 M3 13h18 M3 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0",
    prompt:"a Mediterranean scene with warm sunlight",defaults:{surface:"plaster",background:"window",light:"golden"}},
  {id:"japandi",label:"ג׳פנדי",detail:"עץ בהיר וקרמיקה",icon:"M4 12h16a8 7 0 0 1-16 0z M9 19.5h6 M13 4l-2.5 6.5 M18 5l-4 5.5",
    prompt:"a warm, quiet Japandi interior",defaults:{surface:"oak",background:"wall",light:"window"}},
  {id:"editorial",label:"אמנותי",detail:"צללים וקומפוזיציה",icon:"M4 8h3l2-3h6l2 3h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z",
    prompt:"an artistic editorial studio photograph with bold but realistic shadows",defaults:{surface:"plaster",background:"wall",light:"studio"}},
  {id:"gift",label:"מתנה ואירוח",detail:"שולחן חגיגי",icon:"M4 10h16v4H4z M5 14h14v6H5z M12 10v10 M12 10c-2-4-6-4-6-1.5S10 10 12 10c2 0 6 1 6-1.5S14 6 12 10z",
    prompt:"a thoughtful gift and hosting scene with elegant table styling",defaults:{surface:"linen",background:"blur",light:"golden"}}
];

export const surfaces: readonly SurfaceItem[] = [
  {id:"paper",label:"נייר מרקם",swatch:"#EFE9DE",icon:"M6 3h9l3 3v15H6z M15 3v3h3 M9 11h6 M9 15h6",prompt:"a textured fine paper surface"},
  {id:"plaster",label:"טיח",swatch:"#E6DACB",icon:"M4 8c3-2 5 2 8 0s5 2 8 0 M4 14c3-2 5 2 8 0s5 2 8 0 M4 20h16",prompt:"a soft plaster surface"},
  {id:"linen",label:"פשתן",swatch:"#DCD0BC",icon:"M4 8h16 M4 12h16 M4 16h16 M8 4v16 M12 4v16 M16 4v16",prompt:"a natural linen cloth surface"},
  {id:"oak",label:"עץ בהיר",swatch:"#D2B48C",icon:"M3 8h18 M3 12c4-2 6 2 10 0s6 0 8 0 M3 16h18",prompt:"a pale oak wood surface"},
  {id:"walnut",label:"עץ כהה",swatch:"#6B4A36",icon:"M3 7h18 M3 17h18 M3 12h6 M15 12h6 M12 14a3 2 0 1 0 0-4a3 2 0 1 0 0 4z",prompt:"a dark walnut wood surface"},
  {id:"ceramic",label:"קרמיקה",swatch:"#EDE6DA",icon:"M4 6h16v12H4z M4 12h16 M12 6v12",prompt:"a matte ceramic tile surface"},
  {id:"terrazzo",label:"טרצו",swatch:"#E2DDD3",icon:"M6 7h.01 M11 6l2 1 M17 8h.01 M8 12l2 1 M15 12h.01 M18 15l-2 1 M6 16h.01 M11 17h.01",prompt:"a fine terrazzo surface"},
  {id:"concrete",label:"בטון",swatch:"#A9A6A0",icon:"M4 5h16v14H4z M8 9h.01 M14 8h.01 M10 14h.01 M16 15h.01 M6 16h.01",prompt:"a smooth concrete surface"},
  {id:"marble",label:"שיש",swatch:"#F2F1EE",icon:"M4 5h16v14H4z M6 9c4 0 4 4 8 4s3 3 4 5 M10 5c0 3 3 4 3 7",prompt:"a marble surface"}
];

export const lights: readonly CatalogItem[] = [
  {id:"window",label:"חלון",icon:"M4 4h16v16H4z M12 4v16 M4 12h16",prompt:"soft directional natural window light"},
  {id:"golden",label:"שעת זהב",icon:"M5 17a7 7 0 0 1 14 0 M2 17h20 M12 5v3 M4.5 10l2 1.5 M19.5 10l-2 1.5",prompt:"warm golden hour light"},
  {id:"candle",label:"אור נרות",icon:"M12 3c2.5 3 3.5 5 3.5 7a3.5 3.5 0 0 1-7 0c0-2 1-4 3.5-7z M9 20h6 M12 13.5V20",prompt:"warm candlelight glow"},
  {id:"studio",label:"סטודיו רך",icon:"M4 6h9l5 4v4l-5 4H4z M18 12h3",prompt:"soft diffused studio light"}
];

export const backgrounds: readonly CatalogItem[] = [
  {id:"wall",label:"קיר חלק",icon:"M4 4h16v16H4z",prompt:"a plain smooth wall"},
  {id:"blur",label:"פנים מטושטש",icon:"M8 10a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M16 14a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M9 20a3 3 0 1 0 0-6a3 3 0 1 0 0 6z",prompt:"a softly blurred interior"},
  {id:"window",label:"חלון",icon:"M5 21V9a7 7 0 0 1 14 0v12z M12 2v19 M5 13h14",prompt:"a quiet window"},
  {id:"plants",label:"צמחייה",icon:"M12 21v-8 M12 13C8 13 5 10 5 6c4 0 7 3 7 7z M12 16c0-4 3-7 7-7 0 4-3 7-7 7z",prompt:"soft out-of-focus greenery"}
];

// ה-prompt של פלטה הוא קודי ה-HEX בלבד, בסדר שבו הם מוצגים.
const FAVORITE_PALETTES = new Set(["mono", "desert"]);
const palette = (id: string, label: string, colors: readonly [string, string, string], icon: string, iconFill?: string): PaletteItem =>
  ({id, label, colors, icon, iconFill, prompt: colors.join(", "), favorite: FAVORITE_PALETTES.has(id) || undefined});

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

// סוגי המוצר. אין כלי בטון לנרות. ההנחיה (guidance) נכנסת לפרומפט רק לסוג המתאים.
export const productTypes: readonly ProductItem[] = [
  {id:"glass-candle",label:"נר בכלי זכוכית",family:"candle",icon:"M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z M7 12h10 M12 8V6 M12 6c.8-.8 1-1.8 0-3-1 1.2-.8 2.2 0 3z",
    prompt:"handmade candles in glass vessels",guidance:"Render true glass refraction and reflections, with no glare or hot spot covering the label"},
  {id:"ceramic-candle",label:"נר בקרמיקה",family:"candle",icon:"M5 11h14l-1.5 7a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5z M12 11V9 M12 9c.8-.8 1-1.8 0-3-1 1.2-.8 2.2 0 3z M8 15h8",
    prompt:"handmade candles in ceramic vessels",guidance:"The ceramic vessel keeps a matte texture, with no gloss"},
  {id:"pillar-candle",label:"נר עמוד / מפוסל",family:"candle",icon:"M8 9h8v11H8z M12 9V7 M12 7c.8-.8 1-1.8 0-3-1 1.2-.8 2.2 0 3z M8 13c1.5 1 3 1 4 0s2.5-1 4 0",
    prompt:"handmade pillar and sculpted candles",guidance:"Preserve the sculpted shape of the candle exactly, including every carved detail"},
  {id:"wax-melts",label:"נמסים ריחניים",family:"melts",icon:"M3 14h5v5H3z M9.5 14h5v5h-5z M16 14h5v5h-5z M6.5 8h5v5h-5z",
    prompt:"handmade scented wax melts",guidance:null},
  {id:"cut-soap",label:"סבון חתוך",family:"soap",icon:"M3 11l5-4h13v7l-5 4H3z M3 11h13v7 M16 11l5-4",
    prompt:"handmade cut soaps",guidance:"Show the natural cut texture on the soap, with no plastic or glossy look"},
  {id:"molded-soap",label:"סבון בתבנית",family:"soap",icon:"M12 20a8 8 0 1 0 0-16a8 8 0 1 0 0 16z M12 14a2 2 0 1 0 0-4a2 2 0 1 0 0 4z M12 6.5V10 M12 14v3.5 M6.5 12H10 M14 12h3.5",
    prompt:"handmade molded soaps",guidance:null},
  {id:"bath-bomb",label:"פצצת אמבט",family:"bomb",icon:"M12 20a8 8 0 1 0 0-16a8 8 0 1 0 0 16z M9 9h.01 M14 8h.01 M15 13h.01 M9.5 14h.01 M12 11.5h.01",
    prompt:"handmade bath bombs",guidance:"Show a powdery, matte texture"},
  {id:"gift-box",label:"מארז מתנה",family:"gift",icon:"M4 10h16v4H4z M5 14h14v6H5z M12 10v10 M12 10c-2-4-6-4-6-1.5S10 10 12 10c2 0 6 1 6-1.5S14 6 12 10z",
    prompt:"a handmade gift box set",guidance:null}
];

// ערכים ישנים (עד שלב 2) שנשמרו בהיסטוריה ובבקשות: סבון ונר.
export const legacyProductIds: Readonly<Record<string, string>> = {soap: "cut-soap", candle: "glass-candle"};

// מצב הנר: רק לנרות. "כמו בצילום" משאיר את הלהבה כפי שהיא.
export const candleStates: readonly CatalogItem[] = [
  {id:"off",label:"כבוי",icon:"M8 10h8v10H8z M12 10V7",prompt:"The candle is unlit, with a clean wick and no flame"},
  {id:"lit",label:"דולק",icon:"M8 12h8v8H8z M12 12v-2 M12 10c1.4-1.2 1.8-2.8 0-5.5-1.8 2.7-1.4 4.3 0 5.5z M5 6l1.5 1 M19 6l-1.5 1",
    prompt:"The candle is lit with a true-to-size flame and a soft warm halo, and the scene is slightly dimmed so the glow reads naturally"},
  {id:"asis",label:"כמו בצילום",icon:"M4 8h3l2-3h6l2 3h3v11H4z M12 16a3 3 0 1 0 0-6a3 3 0 1 0 0 6z",prompt:"Keep the candle flame exactly as it is in the supplied photo, lit or unlit"}
];

// גוון הזכוכית: רק לנר בכלי זכוכית, ורק אם נבחר.
export const glassTints: readonly CatalogItem[] = [
  {id:"clear",label:"שקופה",icon:"M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z",prompt:"The vessel is clear glass"},
  {id:"milky",label:"חלבית",icon:"M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z M9 12h6",prompt:"The vessel is milky frosted glass"},
  {id:"amber",label:"ענברית",icon:"M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z M9 12h6 M9 16h6",prompt:"The vessel is amber-tinted glass"}
];

// מארז מתנה: כמו שהוא, או עטוף.
export const giftWraps: readonly CatalogItem[] = [
  {id:"asis",label:"המארז כמו שהוא",icon:"M4 10h16v4H4z M5 14h14v6H5z M12 10v10",prompt:"Keep the gift box exactly as it is, with its own wrapping, closure and labels"},
  {id:"wrapped",label:"עטוף בשבילי",icon:"M4 10h16v4H4z M5 14h14v6H5z M12 10v10 M12 10c-2-4-6-4-6-1.5S10 10 12 10c2 0 6 1 6-1.5S14 6 12 10z",
    prompt:"Present the gift box elegantly wrapped in plain natural paper with a simple ribbon, keeping every label on the contents legible"}
];

// זווית צילום. בלי בחירה אין הנחיה, והזווית נשארת כמו בצילום.
export const angles: readonly CatalogItem[] = [
  {id:"eye",label:"גובה עיניים",icon:"M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z M12 14.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z",prompt:"eye-level camera angle"},
  {id:"45",label:"45°",icon:"M4 20L20 4 M4 20h7 M4 20v-7",prompt:"a 45-degree camera angle"},
  {id:"top",label:"מלמעלה",icon:"M12 3v9 M8 8l4 4 4-4 M4 18h16",prompt:"a top-down camera angle"},
  {id:"macro",label:"תקריב",icon:"M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 1 0 0 13z M15.5 15.5L21 21",prompt:"a close-up macro framing"}
];

// אירוע: משפיע רק על פרטים בסצנה, אף פעם לא על המוצר. בלי בחירה = ללא.
export const occasions: readonly CatalogItem[] = [
  {id:"hanukkah",label:"חנוכה",icon:"M12 4v16 M5 8v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8 M8 20h8 M5 8h.01 M8.5 6h.01 M12 4h.01 M15.5 6h.01 M19 8h.01",prompt:"Hanukkah, with soft blue and silver accents"},
  {id:"rosh",label:"ראש השנה",icon:"M12 20c-4.5 0-7.5-3-7.5-6.5S7.5 7 12 8c4.5-1 7.5 2 7.5 5.5S16.5 20 12 20z M12 8c1-2.5 3-3.5 5-3-1 2-3 3-5 3z",prompt:"the Jewish New Year, with honey and apple tones"},
  {id:"tubshvat",label:"ט\"ו בשבט",icon:"M12 21v-7 M12 14c-4 0-7-3-7-7 4 0 7 3 7 7z M12 17c0-4 3-7 7-7 0 4-3 7-7 7z",prompt:"Tu BiShvat, with fresh spring green tones"},
  {id:"family",label:"יום המשפחה",icon:"M8 10a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M16 10a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z M3 20c0-3 2.5-5 5-5s5 2 5 5 M11 20c0-3 2.5-5 5-5s5 2 5 5",prompt:"a warm family day"},
  {id:"wedding",label:"חתונה",icon:"M9 19a5 5 0 1 0 0-10a5 5 0 1 0 0 10z M15 19a5 5 0 1 0 0-10a5 5 0 1 0 0 10z M12 5l-1.5-2h3z",prompt:"a wedding, with soft romantic white tones"},
  {id:"love",label:"ולנטיין",icon:"M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",prompt:"Valentine's Day, with soft rose tones"}
];

// ה-prompt של אביזרים משלים את ההנחיה הקבועה "uncluttered composition, generous negative space, ...".
export const props: readonly CatalogItem[] = [
  {id:"none",label:"ללא אביזרים",icon:"M12 20a8 8 0 1 0 0-16a8 8 0 1 0 0 16z M6.3 6.3l11.4 11.4",prompt:"no props at all"},
  {id:"subtle",label:"אביזר אחד עדין",icon:"M12 21v-8 M12 13C8 13 5 10 5 6c4 0 7 3 7 7z M12 16c0-4 3-7 7-7 0 4-3 7-7 7z",prompt:"at most one small prop"},
  // מוסתר בהגדרות מתקדמות
  {id:"rich",label:"עשיר",icon:"M5 20v-6 M5 14c-2-1-3-3-3-5 3 0 3 3 3 5z M12 20V9 M12 9c-3-1-4-4-3-7 3 1 4 4 3 7z M19 20v-6 M19 14c-2-1-3-3-3-5 3 0 3 3 3 5z M3 20h18",
    prompt:"a few tasteful contextual props while keeping the product clearly dominant"}
];

export const catalog = {styles, surfaces, lights, backgrounds, palettes, productTypes, candleStates, glassTints, giftWraps, angles, occasions, props} as const;
export type CatalogCategory = keyof typeof catalog;

export function findItem(category: "styles", id: string): StyleItem | undefined;
export function findItem(category: "productTypes", id: string): ProductItem | undefined;
export function findItem(category: "surfaces", id: string): SurfaceItem | undefined;
export function findItem(category: "palettes", id: string): PaletteItem | undefined;
export function findItem(category: CatalogCategory, id: string): CatalogItem | undefined;
export function findItem(category: CatalogCategory, id: string): CatalogItem | undefined {
  return catalog[category].find(item => item.id === id);
}
export function hasItem(category: CatalogCategory, id: unknown): id is string {
  return typeof id === "string" && catalog[category].some(item => item.id === id);
}

// מועדפים ראשונים, ובתוך כל קבוצה הסדר המקורי של הקטלוג.
export function favoritesFirst<T extends CatalogItem>(items: readonly T[]): T[] {
  return [...items.filter(i => i.favorite), ...items.filter(i => !i.favorite)];
}
// פריט שהשם שלו מופיע ב"אף פעם לא" חסום: לא נבחר בממשק ולא נכנס לפרומפט.
export function isBlocked(item: CatalogItem, neverList: readonly string[]): boolean {
  return neverList.some(entry => entry.trim() === item.label);
}
