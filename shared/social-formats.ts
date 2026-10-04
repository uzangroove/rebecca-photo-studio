export const formats = [
  {id:"instagram-square",group:"Instagram",name:"פוסט מרובע",width:1080,height:1080},
  {id:"instagram-portrait",group:"Instagram",name:"פוסט לאורך",width:1080,height:1350},
  {id:"instagram-story",group:"Instagram",name:"סטורי / תמונת שער לריל",width:1080,height:1920},
  {id:"instagram-landscape",group:"Instagram",name:"פוסט לרוחב",width:1080,height:566},
  {id:"facebook-square",group:"Facebook",name:"פוסט מרובע",width:1200,height:1200},
  {id:"facebook-portrait",group:"Facebook",name:"פוסט לאורך",width:1080,height:1350},
  {id:"facebook-story",group:"Facebook",name:"סטורי / תמונת שער לריל",width:1080,height:1920},
  {id:"facebook-landscape",group:"Facebook",name:"פוסט לרוחב",width:1200,height:630},
  {id:"facebook-cover",group:"Facebook",name:"תמונת נושא",width:1640,height:624},
  {id:"whatsapp-status",group:"WhatsApp",name:"סטטוס",width:1080,height:1920},
  {id:"tiktok-cover",group:"TikTok",name:"תמונת שער",width:1080,height:1920},
  {id:"pinterest-pin",group:"Pinterest",name:"סיכה",width:1000,height:1500},
  {id:"linkedin-post",group:"LinkedIn",name:"פוסט לרוחב",width:1200,height:627},
  {id:"linkedin-square",group:"LinkedIn",name:"פוסט מרובע",width:1080,height:1080},
  {id:"youtube-thumbnail",group:"YouTube",name:"תמונה ממוזערת",width:1280,height:720},
  {id:"x-post",group:"X",name:"פוסט לרוחב",width:1200,height:675}
] as const;
export type SocialFormat = typeof formats[number];
export const formatById = (id: string): SocialFormat => formats.find(f => f.id === id) ?? formats[0];
// היחס שנשלח לשרת, כדי שהתמונה שנוצרת תהיה קרובה לפורמט היעד.
export const ratioOf = (f: {width: number; height: number}): "square" | "portrait" | "landscape" =>
  f.width === f.height ? "square" : f.width > f.height ? "landscape" : "portrait";
