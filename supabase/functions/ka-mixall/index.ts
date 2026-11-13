// かるわかGAMES × MixAll(OAuth認可コードフロー + PKCE): 認可コードを MixAll のサーバーでアクセストークンに交換し、
// MixAll側のアカウントID(sub)を取り出して「チケット」(DB保存・10分)を発行する。
// コードの交換をここ(サーバー)でやる理由: このアプリ(client_id)に発行されたコードだけを受け付け、他のアプリ向けのトークンを使ったなりすましを防ぐため。
// チケットを使ったアカウント作成・ログインは DB の ka_mixall_* RPCが行う。トークンは保存もログもしない。
// デプロイ: Supabase の Edge Function `ka-mixall`(verify_jwt=false)。
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIXALL = "https://mixalls.vercel.app";
const CLIENT_ID = "mxc_8bac023deb3af73fe9e1d8af0e29b97d"; // MixAll側に登録した「かるわかGAMES」アプリ(公開クライアント・PKCE)
const REDIRECT_URI = "https://kaikomziu.github.io/game-links/mixall-login.html";
const PORTAL_ORIGIN = "https://kaikomziu.github.io";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": PORTAL_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
async function mixall(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${MIXALL}/api/dev`, { method: "POST", headers, body: JSON.stringify(body) });
  let j: any = null;
  try { j = await r.json(); } catch { /* JSONでない */ }
  return { ok: r.ok, status: r.status, body: j || {} };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (!path.endsWith("/exchange")) return json({ error: "not_found" }, 404);
  try {
    let input: any = {};
    try { input = await req.json(); } catch { /* 空 */ }
    const code = typeof input.code === "string" ? input.code.slice(0, 1000) : "";
    const verifier = typeof input.code_verifier === "string" ? input.code_verifier.slice(0, 200) : "";
    if (!code || !verifier) return json({ error: "invalid_request" }, 400);
    const t = await mixall({ action: "oauthToken", grant_type: "authorization_code", client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, code, code_verifier: verifier });
    const access = t.body && typeof t.body.access_token === "string" ? t.body.access_token : "";
    if (!t.ok || !access) return json({ error: "invalid_grant" }, 400);
    const u = await mixall({ action: "oauthUserInfo" }, access);
    const sub = u.body && typeof u.body.sub === "string" ? u.body.sub : "";
    if (!u.ok || !sub) return json({ error: "userinfo_failed" }, 502);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ka_mixall_ticket_new`, {
      method: "POST",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_sub: sub, p_suggest: typeof u.body.name === "string" ? u.body.name : "" }),
    });
    const ticket = r.ok ? await r.json() : null;
    if (!ticket) return json({ error: "busy" }, 503);
    return json({ ticket });
  } catch (_e) {
    return json({ error: "server_error" }, 500);
  }
});
