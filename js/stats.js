// ===== プレイ数カウンター + 訪問者数 (Supabase, 全員共有) =====
// - game_links_plays: 「遊びに行く」が押された累計回数(ゲームごと)
// - game_links_counters: 汎用カウンター。ここでは 'visits'(訪問者数)を使う
// どちらも加算は SECURITY DEFINER 関数(rpc)経由。テーブルが未作成でも
// 例外を握りつぶして「—」表示にフォールバックする。
const GameStats = (() => {
  const SUPABASE_URL = "https://kifnzvktwbomxthzvvgy.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE";
  const PLAYS_TABLE = "game_links_plays";
  const COUNTERS_TABLE = "game_links_counters";

  let client = null;
  function sb() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "gl-stats-noauth" },
      global: { headers: { Authorization: "Bearer " + KEY } },
    });
    return client;
  }

  const state = { plays: {}, visits: null, loaded: false, error: null };
  const listeners = [];
  const notify = () => listeners.forEach((cb) => { try { cb(); } catch (e) { /* ignore */ } });
  const onUpdate = (cb) => listeners.push(cb);

  async function load() {
    const c = sb();
    if (!c) { state.error = "no-supabase"; notify(); return; }
    try {
      const playsRes = await c.from(PLAYS_TABLE).select("game_id,count");
      if (playsRes.error) throw playsRes.error;
      const plays = {};
      (playsRes.data || []).forEach((r) => { plays[r.game_id] = Number(r.count) || 0; });
      state.plays = plays;
      state.loaded = true;
      state.error = null;
    } catch (err) {
      state.error = err;
    }
    try {
      const visitsRes = await c.from(COUNTERS_TABLE).select("count").eq("name", "visits").limit(1);
      if (!visitsRes.error && visitsRes.data && visitsRes.data[0]) {
        state.visits = Number(visitsRes.data[0].count) || 0;
      }
    } catch (e) { /* 未作成なら null のまま */ }
    notify();
  }

  function getPlays(gameId) { return state.plays[gameId] || 0; }
  function totalPlays() {
    return Object.values(state.plays).reduce((a, b) => a + b, 0);
  }
  function getVisits() { return state.visits; }
  function isLoaded() { return state.loaded; }

  // 「同じゲームは1時間に1回まで」カウント(連打での水増し防止)
  function canCountPlay(gameId) {
    try {
      const k = "gl_play_" + gameId;
      const last = Number(localStorage.getItem(k) || 0);
      if (Date.now() - last < 3600000) return false;
      localStorage.setItem(k, String(Date.now()));
      return true;
    } catch (e) { return true; }
  }

  async function recordPlay(gameId) {
    if (!canCountPlay(gameId)) return;
    const c = sb();
    if (!c) return;
    state.plays[gameId] = (state.plays[gameId] || 0) + 1; // 楽観的更新
    notify();
    try {
      const { data, error } = await c.rpc("game_links_add_play", { gid: gameId });
      if (!error && data != null) {
        state.plays[gameId] = Number(data);
      } else {
        state.plays[gameId] = Math.max(0, (state.plays[gameId] || 1) - 1); // 失敗したら戻す
      }
    } catch (e) {
      state.plays[gameId] = Math.max(0, (state.plays[gameId] || 1) - 1);
    }
    notify();
  }

  // 訪問者カウンター: このタブのセッション中、最初の1回だけ +1 する
  async function bumpVisitOnce() {
    const c = sb();
    if (!c) return;
    let first = false;
    try {
      if (!sessionStorage.getItem("gl_visited")) {
        sessionStorage.setItem("gl_visited", "1");
        first = true;
      }
    } catch (e) { first = true; }
    if (!first) return;
    try {
      const { data, error } = await c.rpc("game_links_bump_counter", { cname: "visits" });
      if (!error && data != null) { state.visits = Number(data); notify(); }
    } catch (e) { /* ignore */ }
  }

  load();
  bumpVisitOnce();

  return { onUpdate, getPlays, totalPlays, getVisits, isLoaded, recordPlay };
})();
