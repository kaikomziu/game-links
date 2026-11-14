// かるわかGAMES × MixAll(OAuth認可コードフロー + PKCE): 認可コードを MixAll のサーバーでアクセストークンに交換し、
// MixAll側のアカウントID(sub)を取り出して「チケット」(DB保存・10分)を発行する。
// コードの交換をここ(サーバー)でやる理由: このアプリ(client_id)に発行されたコードだけを受け付け、他のアプリ向けのトークンを使ったなりすましを防ぐため。
// チケットを使ったアカウント作成・ログインは DB の ka_mixall_* RPCが行う。トークンは保存もログもしない。
// デプロイ: Supabase の Edge Function `ka-mixall`(verify_jwt=false)。
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIXALL = "https://mixalls.vercel.app";
const CLIENT_ID = "mxc_8184495951de4b83144caa121de5cdee"; // MixAll側に登録した「かるわかGAMES」アプリ(公開クライアント・PKCE)
const REDIRECT_URI = "https://kaikomziu.github.io/game-links/mixall-login.html";
const PORTAL_ORIGIN = "https://kaikomziu.github.io";
const VERIFY_ORIGINS = [PORTAL_ORIGIN]; // ポップアップ方式の証明書を受け付けるサイト(ポータルと、同じoriginのゲーム)

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": PORTAL_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
async function mixall(body: Record<string, unknown>, token?: string, origin?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (origin) headers["Origin"] = origin;
  const r = await fetch(`${MIXALL}/api/dev`, { method: "POST", headers, body: JSON.stringify(body) });
  let j: any = null;
  try { j = await r.json(); } catch { /* JSONでない */ }
  return { ok: r.ok, status: r.status, body: j || {} };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  const isVerify = path.endsWith("/verify");
  if (!isVerify && !path.endsWith("/exchange")) return json({ error: "not_found" }, 404);
  try {
    if (isVerify) {
      // ---- ポップアップ方式: MixAllの証明書(certificate)をサーバー側で確かめる ----
      // certificate は発行されたサイト(origin)でしか使えない。受け付けるoriginは下の許可リストだけにして、
      // MixAllへの問い合わせにそのoriginをつける(MixAll側が「そのサイトのものか」を確かめる)。originなしで通す、ということはしない。
      let inp: any = {};
      try { inp = await req.json(); } catch { /* 空 */ }
      const cert = typeof inp.certificate === "string" ? inp.certificate.slice(0, 4000) : "";
      const origin = typeof inp.origin === "string" ? inp.origin : "";
      if (!cert) return json({ error: "invalid_request" }, 400);
      if (!VERIFY_ORIGINS.includes(origin)) return json({ error: "origin_not_allowed" }, 400);
      const use = await mixall({ action: "loginLinksUse", certificate: cert }, undefined, origin);
      const vsub = use.body && typeof use.body.sub === "string" ? use.body.sub : "";
      if (!use.ok || !vsub) return json({ error: "invalid_certificate" }, 401);
      const vname = typeof use.body.name === "string" ? use.body.name : "";
      const tr = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ka_mixall_ticket_new`, {
        method: "POST",
        headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_sub: vsub, p_suggest: vname }),
      });
      const tk = tr.ok ? await tr.json() : null;
      if (!tk) return json({ error: "busy" }, 503);
      // 使い終わった証明書は、MixAll側で取り消す(30日ぶんの許可を残さない)。失敗しても、ログインは続ける
      mixall({ action: "loginLinksLogout", certificate: cert }, undefined, origin).catch(() => {});
      return json({ ticket: tk, name: vname });
    }
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
