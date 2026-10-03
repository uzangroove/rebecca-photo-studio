export const palettes = [
  ["mono","מונוכרום",["#1A1A1A","#8C8C8C","#F5F5F5"]],
  ["charcoal","פחם",["#2B2D42","#8D99AE","#EDF2F4"]],
  ["metal","מתכת",["#4A5568","#A0AEC0","#E2E8F0"]],
  ["stone","אבן",["#5C6B73","#9DB4C0","#C2DFE3"]],
  ["coffee","קפה",["#4A3B32","#8E735B","#D9CDBF"]],
  ["vintage","וינטג׳",["#8B5A2B","#CD853F","#F5DEB3"]],
  ["desert","מדבר",["#B07D62","#D8A47F","#F3E1D4"]],
  ["spice","תבלין",["#9B2226","#CA6702","#EE9B00"]],
  ["autumn","סתיו",["#823329","#B85D43","#EDC4B3"]],
  ["wood","עץ",["#3E2723","#795548","#D7CCC8"]],
  ["forest","יער",["#2A4B3C","#6B8E76","#C6D8CB"]],
  ["olive","זית",["#3B4D36","#708238","#A2B57B"]],
  ["mint","מנטה",["#2D6A4F","#52B788","#B7E4C7"]],
  ["ocean","אוקיינוס",["#13315C","#134074","#8DA9C4"]],
  ["space","חלל",["#1E1E3F","#4B4B7C","#A6A6CC"]],
  ["lilac","לילך",["#5E548E","#9F86C0","#E0B1CB"]],
  ["peach","אפרסק",["#E29578","#FFB5A7","#FEC5BB"]],
  ["sunset","שקיעה",["#E07A5F","#F4A261","#F2CC8F"]],
  ["soap","סבון",["#CDB4DB","#FFC8DD","#FFAFCC"]],
  ["linen","פשתן",["#A4937A","#D6C7B3","#F2EBE1"]]
] as const;

export const paletteById = Object.fromEntries(palettes.map(([id,name,colors])=>[id,{name,colors}])) as Record<string,{name:string;colors:readonly string[]}>;
