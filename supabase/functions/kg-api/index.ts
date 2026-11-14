// かるわかGAMES API(読み取り専用)。APIキー(X-API-Key か Authorization: Bearer)が必要。
// 作品データ: GitHub Pages の data/api-games.json(js/main.js と data/catalog.json から自動で作られる)
// 評価・プレイ数・注目・イベント・記事: Supabase から読む。
// キーの確認と使用回数の制限(1分60回・1日5000回)は DB の kg_api_check がやる。
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const DATA_URL = "https://kaikomziu.github.io/game-links/data/api-games.json";
const SITE = "https://kaikomziu.github.io/game-links/";
const NEW_DAYS = 7;

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-API-Key, Authorization, Content-Type",
  "Access-Control-Expose-Headers": "X-RateLimit-Remaining-Minute, X-RateLimit-Remaining-Day, Retry-After",
  "Access-Control-Max-Age": "86400",
};
function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body, null, 1), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
}
function fail(status: number, code: string, message: string, extra: Record<string, string> = {}) {
  return json({ error: { code, message } }, status, extra);
}

// ---- 少しの間だけ覚えておく(毎回取りに行かない) ----
const memo = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  const v = await load();
  memo.set(key, { at: Date.now(), v });
  return v;
}
async function rest(path: string, key: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`rest ${path} ${r.status}`);
  return r.json();
}
const rpc = (fn: string, args: Record<string, unknown>, key: string) => rest(`rpc/${fn}`, key, { method: "POST", body: JSON.stringify(args) });

async function loadGames(): Promise<{ generated_at: string; games: any[] }> {
  return cached("games", 5 * 60 * 1000, async () => {
    const r = await fetch(DATA_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("games " + r.status);
    return await r.json();
  });
}
async function loadStats(): Promise<{ games: Record<string, { likes: number; dislikes: number; plays: number }>; visits: number }> {
  return cached("stats", 60 * 1000, () => rpc("kg_api_stats", {}, SERVICE));
}

function isNew(g: any) {
  if (!g.added) return false;
  const t = Date.parse(g.added + "T00:00:00+09:00");
  return !isNaN(t) && Date.now() - t < NEW_DAYS * 86400000 && !g.maintenance;
}
function shape(g: any, stats: Record<string, any>) {
  const s = stats[g.id] || { likes: 0, dislikes: 0, plays: 0 };
  return {
    id: g.id, title: g.title, emoji: g.emoji, kind: g.kind, platform: g.platform || null, genres: g.genres,
    description: g.description, url: g.url, author: g.author, added: g.added, is_new: isNew(g), beta: g.beta, maintenance: g.maintenance,
    stats: { likes: s.likes, dislikes: s.dislikes, score: s.likes - s.dislikes, plays: s.plays },
  };
}
const KIND_ALIAS: Record<string, string> = { game: "game", games: "game", software: "software", soft: "software", app: "software", mod: "mod" };

async function handle(req: Request, route: string, q: URLSearchParams) {
  // ---- 作品の一覧 ----
  if (route === "/v1/games") {
    const [{ games, generated_at }, stats] = await Promise.all([loadGames(), loadStats()]);
    let list = games;
    const kind = q.get("kind");
    if (kind) {
      const k = KIND_ALIAS[kind.toLowerCase()];
      if (!k) return fail(400, "bad_request", "kind は game / software / mod のどれかです");
      list = list.filter((g) => g.kind === k);
    }
    const genre = q.get("genre");
    if (genre) list = list.filter((g) => g.genres.includes(genre));
    const text = (q.get("q") || "").trim().toLowerCase();
    if (text) list = list.filter((g) => (g.title + " " + g.description + " " + g.genres.join(" ") + " " + g.author).toLowerCase().includes(text));
    if (q.get("new") === "1" || q.get("new") === "true") list = list.filter(isNew);
    const sort = q.get("sort") || "name";
    const st = (g: any) => stats.games[g.id] || { likes: 0, dislikes: 0, plays: 0 };
    const byName = (a: any, b: any) => a.title.localeCompare(b.title, "ja");
    const sorters: Record<string, (a: any, b: any) => number> = {
      name: byName,
      new: (a, b) => (b.added || "").localeCompare(a.added || "") || byName(a, b),
      plays: (a, b) => st(b).plays - st(a).plays || byName(a, b),
      likes: (a, b) => st(b).likes - st(a).likes || byName(a, b),
      score: (a, b) => (st(b).likes - st(b).dislikes) - (st(a).likes - st(a).dislikes) || byName(a, b),
    };
    if (!sorters[sort]) return fail(400, "bad_request", "sort は name / new / plays / likes / score のどれかです");
    list = [...list].sort(sorters[sort]);
    const total = list.length;
    const limit = Math.min(100, Math.max(1, parseInt(q.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(q.get("offset") || "0", 10) || 0);
    return json({ data: list.slice(offset, offset + limit).map((g) => shape(g, stats.games)), meta: { total, limit, offset, data_updated_at: generated_at } });
  }
  // ---- 作品1つ ----
  const one = route.match(/^\/v1\/games\/([^/]+)$/);
  if (one) {
    const [{ games }, stats] = await Promise.all([loadGames(), loadStats()]);
    const id = decodeURIComponent(one[1]);
    const g = games.find((x) => x.id === id);
    if (!g) return fail(404, "not_found", "その作品は見つかりません");
    return json({ data: shape(g, stats.games) });
  }
  // ---- ジャンル ----
  if (route === "/v1/genres") {
    const { games } = await loadGames();
    const count = new Map<string, number>();
    games.forEach((g) => g.genres.forEach((t: string) => count.set(t, (count.get(t) || 0) + 1)));
    return json({ data: [...count].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja")) });
  }
  // ---- 注目の作品(表示順どおり) ----
  if (route === "/v1/featured") {
    const [{ games }, stats, f] = await Promise.all([loadGames(), loadStats(), cached("featured", 60 * 1000, () => rpc("gl_featured_game_get", {}, ANON))]);
    const ids: string[] = Array.isArray(f?.game_ids) ? f.game_ids : [];
    return json({ data: ids.map((id) => games.find((g) => g.id === id)).filter(Boolean).map((g) => shape(g, stats.games)) });
  }
  // ---- 全体の数字 ----
  if (route === "/v1/stats") {
    const [{ games }, stats] = await Promise.all([loadGames(), loadStats()]);
    const all = Object.values(stats.games);
    return json({ data: {
      works: games.length, games: games.filter((g) => g.kind === "game").length, software: games.filter((g) => g.kind === "software").length, mods: games.filter((g) => g.kind === "mod").length,
      visits: stats.visits, plays: all.reduce((n, s) => n + s.plays, 0), likes: all.reduce((n, s) => n + s.likes, 0), dislikes: all.reduce((n, s) => n + s.dislikes, 0),
    } });
  }
  // ---- イベント(公開中) ----
  if (route === "/v1/events") {
    const rows = await cached("events", 60 * 1000, () => rest("gl_events?select=id,title,emoji,description,start_md,end_md,sort_order,items,author_name,updated_at&published=eq.true&order=sort_order.asc", ANON));
    return json({ data: rows.map((e: any) => ({ id: e.id, title: e.title, emoji: e.emoji, description: e.description, start: e.start_md, end: e.end_md, items: e.items, author: e.author_name, updated_at: e.updated_at })) });
  }
  // ---- 記事(公開中。一覧は本文なし、1本は本文つき) ----
  if (route === "/v1/articles") {
    const rows = await cached("articles", 60 * 1000, () => rest("gl_articles?select=id,title,summary,author_name,published_at,created_at&published=eq.true&order=published_at.desc.nullslast&limit=100", ANON));
    return json({ data: rows });
  }
  const art = route.match(/^\/v1\/articles\/([0-9a-fA-F-]{36})$/);
  if (art) {
    const rows = await rest(`gl_articles?select=id,title,summary,body,author_name,published_at,created_at&published=eq.true&id=eq.${art[1]}`, ANON);
    if (!rows.length) return fail(404, "not_found", "その記事は見つかりません");
    return json({ data: rows[0] });
  }
  return fail(404, "not_found", "そのAPIはありません。使えるもの: /v1/games, /v1/games/{id}, /v1/genres, /v1/featured, /v1/stats, /v1/events, /v1/articles, /v1/articles/{id}, /v1/ping");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET") return fail(405, "method_not_allowed", "読み取り専用です(GETだけ使えます)");
  const url = new URL(req.url);
  const at = url.pathname.indexOf("/kg-api");
  let route = at >= 0 ? url.pathname.slice(at + 7) : url.pathname;
  route = route.replace(/\/+$/, "") || "/";
  try {
    // 目次(キー不要)
    if (route === "/" || route === "/v1") {
      return json({ name: "かるわかGAMES API", version: "v1", docs: SITE + "api.html", auth: "X-API-Key ヘッダー(または Authorization: Bearer)にAPIキーを付けてください", endpoints: ["/v1/games", "/v1/games/{id}", "/v1/genres", "/v1/featured", "/v1/stats", "/v1/events", "/v1/articles", "/v1/articles/{id}", "/v1/ping"] });
    }
    // キーの確認(キーの値はログに出さない)
    const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(kgk_\S+)$/i);
    const key = req.headers.get("x-api-key") || (bearer ? bearer[1] : "");
    if (!key) return fail(401, "missing_key", "APIキーがありません。X-API-Key ヘッダーに付けてください(キーは " + SITE + "api.html で作れます)");
    const c = await rpc("kg_api_check", { p_key: key }, SERVICE);
    if (!c || !c.ok) {
      if (c && (c.reason === "rate_minute" || c.reason === "rate_day")) {
        return fail(429, "rate_limited", c.reason === "rate_minute" ? "1分あたり60回までです。少し待ってください" : "1日あたり5000回までです。明日またどうぞ", { "Retry-After": String(c.retry_after || 60) });
      }
      return fail(401, "invalid_key", "APIキーが正しくないか、取り消されています");
    }
    const lim = { "X-RateLimit-Remaining-Minute": String(c.minute_left), "X-RateLimit-Remaining-Day": String(c.day_left) };
    if (route === "/v1/ping") return json({ ok: true, key: { name: c.name }, limits: { per_minute: 60, per_day: 5000, remaining_minute: c.minute_left, remaining_day: c.day_left } }, 200, lim);
    const res = await handle(req, route, url.searchParams);
    Object.entries(lim).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (_e) {
    return fail(502, "upstream_error", "データを読み込めませんでした。少し待ってからもう一度お試しください");
  }
});
