// ===== 高評価/低評価 (Supabase, 全員共有カウント) =====
// - 集計は共有Supabaseプロジェクトに保存し、誰が見ても同じ合計数になる。
// - 「一回押した人はもう押せない」は、
//   (1) ブラウザCookieに匿名の voter_id を保存してクライアント側で判定
//   (2) DB側の UNIQUE(game_id, voter_id) 制約でも二重投票を拒否
//   の二重で担保する。ログイン等の個人情報は一切扱わない。
const GameVotes = (() => {
  const SUPABASE_URL = "https://kifnzvktwbomxthzvvgy.supabase.co";
  // 同プロジェクトで実際に書き込みに使われている従来形式(JWT)のanon key。
  // 新形式のpublishable keyはINSERTが403で弾かれるため使わない(hold-on等と同じ)。
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE";
  const TABLE = "game_links_votes";

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; SameSite=Lax`;
  }
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function voterId() {
    let id = getCookie("gl_voter_id");
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setCookie("gl_voter_id", id, 3650); // 10年
    }
    return id;
  }

  let client = null;
  function sb() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    // kaikomziu.github.io は全ゲーム共通オリジン = localStorage共有。
    // 他ゲームのSupabaseログインセッションを拾って authenticated ロールで
    // 送信してしまわないよう、認証状態を一切持たせない(hold-onと同じ対策)。
    client = window.supabase.createClient(SUPABASE_URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: "Bearer " + KEY } },
    });
    return client;
  }

  // state.counts: { [gameId]: { like: n, dislike: n } }
  // state.mine:   { [gameId]: "like" | "dislike" }
  const state = { counts: {}, mine: {}, loaded: false, error: null };
  const listeners = [];

  function notify() {
    listeners.forEach((cb) => {
      try { cb(); } catch (e) { /* ignore */ }
    });
  }

  function onUpdate(cb) {
    listeners.push(cb);
  }

  async function load() {
    const c = sb();
    if (!c) {
      state.error = "supabase-js が読み込まれていません";
      notify();
      return;
    }
    try {
      const [allRes, mineRes] = await Promise.all([
        c.from(TABLE).select("game_id,vote"),
        c.from(TABLE).select("game_id,vote").eq("voter_id", voterId()),
      ]);
      if (allRes.error) throw allRes.error;
      if (mineRes.error) throw mineRes.error;

      const counts = {};
      (allRes.data || []).forEach((r) => {
        if (!counts[r.game_id]) counts[r.game_id] = { like: 0, dislike: 0 };
        counts[r.game_id][r.vote] = (counts[r.game_id][r.vote] || 0) + 1;
      });
      const mine = {};
      (mineRes.data || []).forEach((r) => { mine[r.game_id] = r.vote; });

      state.counts = counts;
      state.mine = mine;
      state.loaded = true;
      state.error = null;
    } catch (err) {
      state.error = err;
    }
    notify();
  }

  function getCounts(gameId) {
    return state.counts[gameId] || { like: 0, dislike: 0 };
  }
  function getMyVote(gameId) {
    return state.mine[gameId] || null;
  }
  function hasVoted(gameId) {
    return !!state.mine[gameId];
  }

  async function vote(gameId, type) {
    if (type !== "like" && type !== "dislike") return { ok: false, reason: "invalid-type" };
    if (hasVoted(gameId)) return { ok: false, reason: "already-voted" };
    const c = sb();
    if (!c) return { ok: false, reason: "no-client" };

    // 楽観的更新: すぐにUIへ反映し、失敗したら戻す
    state.mine[gameId] = type;
    if (!state.counts[gameId]) state.counts[gameId] = { like: 0, dislike: 0 };
    state.counts[gameId][type]++;
    notify();

    const { error } = await c.from(TABLE).insert({
      game_id: gameId,
      voter_id: voterId(),
      vote: type,
    });

    if (error) {
      if (error.code === "23505") {
        // UNIQUE制約違反 = DB側でも「既に投票済み」と判定された。
        // 表示はそのまま(既に押した扱い)にして、状態だけ再取得して整合させる。
        load();
        return { ok: false, reason: "already-voted" };
      }
      // それ以外のエラーはロールバック
      state.mine[gameId] = null;
      state.counts[gameId][type]--;
      notify();
      return { ok: false, reason: "error", error };
    }
    return { ok: true };
  }

  load();

  return { onUpdate, getCounts, getMyVote, hasVoted, vote };
})();
