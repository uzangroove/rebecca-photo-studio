import {parseSuggestInput, buildSuggestMessages, cleanSuggestion} from "../shared/suggest.ts";

// הצעות טקסט (ניתוח תמונה, 5 שמות, תיאור) עבור ממשק הניהול של האתר.
// האימות (מנהלת מחוברת) נעשה ב-index.ts לפני שמגיעים לכאן; כאן רק בונים פרומפט, פונים ל-OpenAI ומנקים את התשובה.
type Env = {OPENAI_API_KEY?: string; OPENAI_TEXT_MODEL?: string};
let active = 0;

export async function suggest(request: Request, env: Env): Promise<Response> {
  const key = env.OPENAI_API_KEY;
  if (!key) return Response.json({error: "ההצעות החכמות עדיין אינן מחוברות: חסר מפתח OpenAI בשרת."}, {status: 503});
  if (Number(request.headers.get("content-length") || 0) > 2_500_000) return Response.json({error: "התמונה גדולה מדי"}, {status: 413});
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({error: "הבקשה אינה תקינה"}, {status: 400}); }
  const input = parseSuggestInput(body);
  if (!input) return Response.json({error: "חסרים נתונים להצעה (תמונה או פרטי מוצר)"}, {status: 400});
  if (active >= 3) return Response.json({error: "יש כבר כמה בקשות בתהליך. נסו שוב בעוד רגע."}, {status: 429});
  active++;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {Authorization: `Bearer ${key.trim()}`, "Content-Type": "application/json"},
      body: JSON.stringify({model: env.OPENAI_TEXT_MODEL || "gpt-4o-mini", messages: buildSuggestMessages(input), response_format: {type: "json_object"}, temperature: input.task === "analyze" ? 0.2 : 0.8, max_tokens: 1400}),
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) {
      let code = "";
      try { const b = await response.json() as {error?: {code?: string; type?: string}}; code = String(b.error?.code || b.error?.type || "").replace(/[^a-z0-9_]/gi, "").slice(0, 80); } catch {}
      console.warn("Text API rejected request", {status: response.status, code});
      if (response.status === 429) return Response.json({error: "OpenAI החזיר מגבלת שימוש או שאין יתרה. נסו שוב מאוחר יותר או בדקו את החשבון.", code}, {status: 429});
      if (response.status === 404) return Response.json({error: "מודל הטקסט שהוגדר אינו זמין בחשבון. יש לבדוק את OPENAI_TEXT_MODEL.", code}, {status: 502});
      return Response.json({error: "שירות ההצעות דחה את הבקשה. נסו שוב.", code}, {status: 502});
    }
    const data = await response.json() as {choices?: Array<{message?: {content?: string}}>};
    let parsed: unknown = null;
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content || ""); } catch {}
    const result = cleanSuggestion(input.task, parsed);
    if (!result) return Response.json({error: "התשובה לא התקבלה כמו שצריך. נסו שוב."}, {status: 502});
    return Response.json(result, {headers: {"Cache-Control": "no-store"}});
  } catch {
    return Response.json({error: "החיבור לשירות ההצעות הופסק. נסו שוב."}, {status: 502});
  } finally { active--; }
}

// ממשק הניהול של האתר נמצא בכתובת אחרת (Netlify), ולכן צריך CORS — רק לכתובות של האתר.
const ALLOWED = [/^https:\/\/rebecca-studio\.netlify\.app$/, /^https:\/\/[a-z0-9-]+--rebecca-studio\.netlify\.app$/, /^https:\/\/(www\.)?rebecca-studio\.co\.il$/];
export function siteOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  return origin && ALLOWED.some(rx => rx.test(origin)) ? origin : null;
}
export function corsHeaders(origin: string): Record<string, string> {
  return {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin"};
}
