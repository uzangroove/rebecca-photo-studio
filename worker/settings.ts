import {MAX_SETTINGS_BYTES, defaultSettings, parseSettings, type StudioSettings} from "../shared/settings.ts";

const KEY = "settings";
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {"Cache-Control": "no-store"}});

// קורא את ההגדרות השמורות; בלי KV או בלי ערך שמור מחזיר ברירות מחדל. ערך פגום זורק, כדי שלא ניצור תמונה בלי רשימת "אף פעם לא".
export async function readSettings(kv: KVNamespace | undefined): Promise<StudioSettings> {
  const stored = kv ? await kv.get(KEY, "text") : null;
  if (stored === null) return defaultSettings;
  const parsed = parseSettings(JSON.parse(stored));
  if (!parsed) throw new Error("Stored settings are invalid");
  return parsed;
}

// GET /api/settings → {settings} (או null אם עוד לא נשמר דבר). PUT /api/settings → שומר אחרי אימות מלא.
export async function settings(request: Request, kv: KVNamespace | undefined): Promise<Response> {
  if (request.method !== "GET" && request.method !== "PUT")
    return new Response("Method not allowed", {status: 405, headers: {Allow: "GET, PUT"}});
  if (!kv) return json({error: "סנכרון ההגדרות עדיין אינו מחובר בשרת."}, 503);
  if (request.method === "GET") {
    try {
      const stored = await kv.get(KEY, "text");
      if (stored === null) return json({settings: null});
      return json({settings: await readSettings(kv)});
    } catch {
      return json({error: "ההגדרות השמורות בשרת פגומות."}, 500);
    }
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({error: "בקשה לא מורשית"}, 403);
  if (Number(request.headers.get("content-length") || 0) > MAX_SETTINGS_BYTES) return json({error: "ההגדרות גדולות מדי לסנכרון"}, 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_SETTINGS_BYTES) return json({error: "ההגדרות גדולות מדי לסנכרון"}, 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json({error: "ההגדרות אינן תקינות"}, 400); }
  const parsed = parseSettings(body);
  if (!parsed) return json({error: "ההגדרות אינן תקינות"}, 400);
  await kv.put(KEY, JSON.stringify(parsed));
  return json({settings: parsed});
}
