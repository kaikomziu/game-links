// ===== かるわか GAMES アカウント(共通部品) =====
// どのゲームにも1行で入れられる「かるわかGAMESアカウント」。ユーザー名+パスワードでログインし、
// ゲームのセーブデータ(localStorage)をクラウドに保存して、別の端末でも続きから遊べるようにする。
//
// ■ ゲームへの入れ方(<head> の中、ゲームのスクリプトより前に1行):
//   <script src="https://kaikomziu.github.io/game-links/js/karuwaka-account.js"
//           data-game="ゲームID" data-keys="セーブのlocalStorageキー,もう1つ,…"></script>
//   - data-game : 半角英小文字・数字・-_ だけのゲームID(かるわかGAMESの一覧のidと同じにする)
//   - data-keys : クラウドに保存したいlocalStorageのキー(カンマ区切り)。セーブ以外(音量など)も入れてよい
//   - data-badge="off" : 画面右下の小さな「☁」ボタンを出さない(自分でKaAccount.openPanel()を呼ぶとき)
//   かるわか GAMES 本体のページは data-portal を付ける(ヘッダーに 👤 ボタンを出す)。
//
// ■ しくみ
//   - ログイン状態(トークン)は localStorage "ka_session" に保存。kaikomziu.github.io の全ゲームで共通なので、
//     どれか1つでログインすれば、ほかのゲームでもログイン済みになる。
//   - セーブは「中身のハッシュ」で比較する。クラウドと端末のどちらが新しいか判定できないときは、
//     ユーザーに「どちらを使うか」を聞く(勝手に上書きしない)。
//   - パスワードはサーバーでbcrypt暗号化。このファイルには秘密の情報は入っていない(anon keyは公開用)。
(() => {
  "use strict";
  if (window.KaAccount) return;

  const URL_BASE = "https://kifnzvktwbomxthzvvgy.supabase.co";
  // 同プロジェクトで他のゲームも使っている従来形式(JWT)のanon key(公開しても問題ないキー)
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE";
  const SESSION_KEY = "ka_session";
  const CID_KEY = "gl_client_id";
  const PORTAL_URL = "https://kaikomziu.github.io/game-links/";
  const AVATARS = ["🎮", "😀", "😎", "🤖", "👾", "🐱", "🐶", "🦊", "🐼", "🐸", "🦄", "🐙", "🍄", "⭐", "🔥", "🌈", "🍀", "👻", "🎃", "🚀"];
  const script = document.currentScript;

  // ---------- 小物 ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const rawSet = Storage.prototype.setItem;   // 同期の書き戻し中に、ゲームの自動セーブで上書きされないよう差し替える前の関数を控える
  const rawRemove = Storage.prototype.removeItem;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function clientId() {
    let v = store.get(CID_KEY);
    if (!v || v.length < 16) {
      try { v = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, "0")).join(""); }
      catch (e) { v = (Math.random().toString(16).slice(2) + Date.now().toString(16)).padEnd(20, "0"); }
      store.set(CID_KEY, v);
    }
    return v;
  }
  // このブラウザ(端末)の識別子。クラウドセーブを最後に書いたのが自分かどうかの判定に使う
  function deviceId() {
    let v = store.get("ka_device");
    if (!v || v.length < 16) {
      try { v = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, "0")).join(""); }
      catch (e) { v = (Math.random().toString(16).slice(2) + Date.now().toString(16)).padEnd(24, "0"); }
      store.set("ka_device", v);
    }
    return v;
  }
  // 文字列の軽いハッシュ(cyrb53)。改ざん防止ではなく「中身が変わったか」の比較用
  function hashStr(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16) + str.length.toString(16);
  }
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  async function rpc(fn, args, opts) {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args || {}),
      keepalive: !!(opts && opts.keepalive),
    });
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  // ---------- ログイン状態 ----------
  let session = null;               // { token, profile }
  const listeners = new Set();
  const notify = () => listeners.forEach((f) => { try { f(session && session.profile); } catch (e) {} });
  function readSession() {
    try { const s = JSON.parse(store.get(SESSION_KEY)); return s && s.token && s.profile ? s : null; } catch (e) { return null; }
  }
  function setSession(s) {
    session = s;
    if (s) store.set(SESSION_KEY, JSON.stringify(s)); else store.del(SESSION_KEY);
    notify();
    renderButtons();
  }
  async function call(fn, args, opts) {
    const r = await rpc(fn, Object.assign({ p_token: session ? session.token : null }, args), opts);
    if (r && r.ok === false && r.reason === "auth" && session) { setSession(null); }
    return r;
  }

  // ---------- 画面(モーダル)の見た目: ホストのページに影響しないよう、すべて ka- 接頭辞 ----------
  function injectCss() {
    if (document.getElementById("ka-style")) return;
    const st = document.createElement("style");
    st.id = "ka-style";
    st.textContent = `
.ka-badge{position:fixed;right:10px;bottom:10px;z-index:2147483000;display:flex;align-items:center;gap:6px;max-width:70vw;padding:6px 12px;font:700 12px/1.2 system-ui,"Yu Gothic UI",sans-serif;color:#fff;background:rgba(20,16,50,.88);border:2px solid #7a5cff;border-radius:999px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ka-badge:hover{border-color:#ff3ea5}
.ka-badge.warn{border-color:#ffd23f;color:#ffd23f}
.ka-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);font:14px/1.6 system-ui,"Yu Gothic UI",sans-serif}
.ka-dialog{position:relative;box-sizing:border-box;width:min(440px,100%);max-height:92vh;overflow-y:auto;padding:20px 20px 16px;color:#eef;background:#1a1445;border:2px solid #7a5cff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.6)}
.ka-dialog *{box-sizing:border-box}
.ka-x{position:absolute;top:8px;right:10px;width:30px;height:30px;font-size:20px;color:#ccd;background:none;border:none;cursor:pointer}
.ka-h{margin:0 0 4px;font-size:17px}
.ka-sub{margin:0 0 10px;font-size:12px;color:#aab}
.ka-tabs{display:flex;gap:6px;margin:8px 0 12px}
.ka-tab{flex:1;padding:7px;font:700 13px system-ui,sans-serif;color:#eef;background:#120e33;border:2px solid #3a2f80;border-radius:8px;cursor:pointer}
.ka-tab.on{background:#ff3ea5;border-color:#ffd0ea;color:#fff}
.ka-form{display:flex;flex-direction:column;gap:9px}
.ka-label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#aab}
.ka-input{width:100%;padding:9px 11px;font:15px system-ui,"Yu Gothic UI",sans-serif;color:#fff;background:#0d0a26;border:2px solid #3a2f80;border-radius:8px}
.ka-input:focus{outline:none;border-color:#ff3ea5}
.ka-btn{padding:8px 16px;font:700 13px system-ui,"Yu Gothic UI",sans-serif;color:#fff;background:#2a2070;border:2px solid #5a48c0;border-radius:999px;cursor:pointer}
.ka-btn:hover{border-color:#ff3ea5}
.ka-btn:disabled{opacity:.55;cursor:default}
.ka-btn.pri{background:#ff3ea5;border-color:#ffd0ea}
.ka-btn.danger{color:#ff9a9a;border-color:#8a3040;background:#2a1020}
.ka-btn.sm{padding:3px 10px;font-size:11px}
.ka-row{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:4px}
.ka-err{min-height:1.3em;margin:0;font-size:12px;color:#ff9a9a}
.ka-ok{margin:0;font-size:12px;color:#7dffb0}
.ka-note{margin:0;font-size:11px;color:#99a;line-height:1.6}
.ka-me{display:flex;align-items:center;gap:12px;margin:6px 0 10px}
.ka-av{display:flex;align-items:center;justify-content:center;width:52px;height:52px;font-size:30px;background:#0d0a26;border:2px solid #7a5cff;border-radius:50%}
.ka-me b{display:block;font-size:17px}
.ka-me small{color:#aab}
.ka-avs{display:flex;flex-wrap:wrap;gap:4px}
.ka-avs button{width:34px;height:34px;font-size:19px;background:#0d0a26;border:2px solid #3a2f80;border-radius:8px;cursor:pointer}
.ka-avs button.on{border-color:#ff3ea5;background:#3a1a55}
.ka-h2{margin:14px 0 6px;padding-top:10px;font-size:13px;border-top:1px solid #3a2f80}
.ka-saves{margin:0;padding:0;list-style:none}
.ka-saves li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #2a2260;font-size:13px}
.ka-saves li span{min-width:0;overflow-wrap:anywhere}
.ka-saves small{color:#99a}
.ka-link{color:#8fd0ff}
.ka-toast{position:fixed;left:50%;bottom:56px;z-index:2147483700;max-width:90vw;transform:translateX(-50%);padding:8px 16px;font:700 13px system-ui,"Yu Gothic UI",sans-serif;color:#fff;background:rgba(20,16,50,.95);border:2px solid #7a5cff;border-radius:999px}
.ka-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
`;
    (document.head || document.documentElement).appendChild(st);
  }
  function toast(msg) {
    injectCss();
    const t = document.createElement("div");
    t.className = "ka-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function overlay(html) {
    injectCss();
    const o = document.createElement("div");
    o.className = "ka-overlay";
    o.innerHTML = `<div class="ka-dialog" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { o.remove(); document.removeEventListener("keydown", onKey, true); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    document.addEventListener("keydown", onKey, true);
    o.addEventListener("mousedown", (e) => { if (e.target === o) close(); });
    o.addEventListener("click", (e) => { if (e.target.closest("[data-ka-close]")) close(); });
    document.body.appendChild(o);
    o._close = close;
    return o;
  }

  const REASONS = {
    username: "ユーザー名は半角の英小文字・数字・「_」「-」で3〜16文字にしてください。",
    password: "パスワードは8〜72文字にしてください。",
    display: "表示名は1〜20文字にしてください。",
    avatar: "アイコンは絵文字1つを選んでください。",
    taken: "そのユーザー名はすでに使われています。",
    rate: "短い間に作りすぎです。しばらくしてからお試しください。",
    invalid: "ユーザー名かパスワードが違います。",
    locked: "失敗が続いたため、しばらくしてからもう一度お試しください。",
    client: "登録できませんでした。ページを読み込み直してください。",
  };
  const NETERR = "通信に失敗しました。もう一度お試しください。";

  // ---------- パネル: ログイン / 新規登録 ----------
  function openAuth(tab) {
    const o = overlay(`
      <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
      <h2 class="ka-h">かるわかGAMES アカウント</h2>
      <p class="ka-sub">1つ作れば、かるわかGAMESのいろんなゲームで使えます。セーブデータを保存して、別の端末でも続きから遊べます。</p>
      <div class="ka-tabs"><button type="button" class="ka-tab" data-t="login">ログイン</button><button type="button" class="ka-tab" data-t="register">新規登録</button></div>
      <form class="ka-form" autocomplete="on">
        <label class="ka-label">ユーザー名<input class="ka-input" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" required></label>
        <label class="ka-label ka-reg">表示名(ゲームで見える名前・あとで変えられます)<input class="ka-input" name="display" maxlength="20" autocomplete="nickname" placeholder="空ならユーザー名"></label>
        <label class="ka-label">パスワード<input class="ka-input" name="password" type="password" maxlength="72" required></label>
        <p class="ka-note ka-reg">ユーザー名は半角の英小文字・数字・「_」「-」で3〜16文字、パスワードは8文字以上。パスワードを忘れると自分では復旧できません(ブラウザのパスワード保存を使うのがおすすめです)。</p>
        <p class="ka-err" role="alert"></p>
        <div class="ka-row"><button type="button" class="ka-btn" data-ka-close>キャンセル</button><button type="submit" class="ka-btn pri"></button></div>
      </form>`);
    const form = o.querySelector("form");
    const err = o.querySelector(".ka-err");
    let mode = tab === "register" ? "register" : "login";
    const apply = () => {
      o.querySelectorAll(".ka-tab").forEach((b) => b.classList.toggle("on", b.dataset.t === mode));
      o.querySelectorAll(".ka-reg").forEach((e) => { e.style.display = mode === "register" ? "" : "none"; });
      form.password.autocomplete = mode === "register" ? "new-password" : "current-password";
      form.querySelector("button[type=submit]").textContent = mode === "register" ? "アカウントを作る" : "ログイン";
      err.textContent = "";
    };
    o.querySelectorAll(".ka-tab").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.t; apply(); }));
    apply();
    setTimeout(() => form.username.focus(), 50);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; err.textContent = "";
      let r;
      try {
        r = mode === "register"
          ? await rpc("ka_register", { p_username: form.username.value, p_password: form.password.value, p_display: form.display.value, p_client: clientId() })
          : await rpc("ka_login", { p_username: form.username.value, p_password: form.password.value });
      } catch (x) { err.textContent = NETERR; btn.disabled = false; return; }
      btn.disabled = false;
      if (!r || !r.ok) { err.textContent = REASONS[r && r.reason] || "うまくいきませんでした。"; return; }
      o._close(); // フォームをDOMから消す(パスワードマネージャーが保存を提案しやすくなる)
      setSession({ token: r.token, profile: r.profile });
      toast(mode === "register" ? "アカウントを作りました" : "ログインしました");
      startSync(true);
    });
  }

  // ---------- パネル: マイページ ----------
  async function openProfile() {
    const p = session.profile;
    const o = overlay(`
      <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
      <h2 class="ka-h">かるわかGAMES アカウント</h2>
      <div class="ka-me"><span class="ka-av">${esc(p.avatar)}</span><div><b>${esc(p.display_name)}</b><small>@${esc(p.username)}</small></div></div>
      ${syncGame ? `<p class="ka-ok" data-ka-state></p>` : ""}
      <form class="ka-form" data-f="profile">
        <label class="ka-label">表示名<input class="ka-input" name="display" maxlength="20" value="${esc(p.display_name)}" required></label>
        <div class="ka-label">アイコン<div class="ka-avs">${AVATARS.map((a) => `<button type="button" data-av="${esc(a)}"${a === p.avatar ? ' class="on"' : ""}>${esc(a)}</button>`).join("")}</div></div>
        <p class="ka-err" data-e="profile" role="alert"></p>
        <div class="ka-row"><button type="submit" class="ka-btn pri">保存</button></div>
      </form>
      <h3 class="ka-h2">☁ クラウドのセーブデータ</h3>
      <ul class="ka-saves"><li>読み込み中…</li></ul>
      <p class="ka-note">セーブは、対応しているゲームを遊ぶと自動で保存されます。</p>
      <h3 class="ka-h2">パスワードの変更</h3>
      <form class="ka-form" data-f="pw" autocomplete="on">
        <input class="ka-sr" type="text" name="username" autocomplete="username" value="${esc(p.username)}" tabindex="-1" aria-hidden="true" readonly>
        <label class="ka-label">いまのパスワード<input class="ka-input" name="old" type="password" autocomplete="current-password" maxlength="72" required></label>
        <label class="ka-label">新しいパスワード(8文字以上)<input class="ka-input" name="new" type="password" autocomplete="new-password" maxlength="72" required></label>
        <p class="ka-err" data-e="pw" role="alert"></p>
        <div class="ka-row"><button type="submit" class="ka-btn">変更する</button></div>
      </form>
      <h3 class="ka-h2">アカウント</h3>
      <div class="ka-row" style="justify-content:space-between"><button type="button" class="ka-btn" data-a="logout">ログアウト</button><button type="button" class="ka-btn danger" data-a="delete">アカウントを削除…</button></div>
      <p class="ka-err" data-e="acct" role="alert"></p>
      ${PORTAL_URL ? `<p class="ka-note" style="margin-top:8px"><a class="ka-link" href="${PORTAL_URL}" target="_blank" rel="noopener">かるわか GAMES のトップへ</a></p>` : ""}`);
    const q = (s) => o.querySelector(s);
    if (syncGame) refreshState(o);

    // プロフィール
    let avatar = p.avatar;
    o.querySelectorAll("[data-av]").forEach((b) => b.addEventListener("click", () => {
      avatar = b.dataset.av;
      o.querySelectorAll("[data-av]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    q('[data-f="profile"]').addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = q('[data-e="profile"]'); err.textContent = "";
      try {
        const r = await call("ka_profile_update", { p_display: e.target.display.value, p_avatar: avatar });
        if (!r || !r.ok) { err.textContent = REASONS[r && r.reason] || "保存できませんでした。"; return; }
        setSession({ token: session.token, profile: r.profile });
        toast("保存しました");
        o._close(); openProfile();
      } catch (x) { err.textContent = NETERR; }
    });

    // セーブ一覧
    const ul = q(".ka-saves");
    const loadSaves = async () => {
      try {
        const r = await call("ka_save_list", {});
        if (!r || !r.ok) { ul.innerHTML = "<li>読み込めませんでした。</li>"; return; }
        ul.innerHTML = r.saves.length
          ? r.saves.map((s) => `<li data-g="${esc(s.game_id)}"><span>${esc(s.game_id)} <small>${fmtTime(s.updated_at)} ・ ${(s.size / 1024).toFixed(1)}KB</small></span><button type="button" class="ka-btn sm danger" data-del>削除</button></li>`).join("")
          : "<li>まだありません。</li>";
      } catch (x) { ul.innerHTML = "<li>読み込めませんでした。</li>"; }
    };
    loadSaves();
    ul.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      const g = b.closest("li").dataset.g;
      if (!confirm(`「${g}」のクラウドセーブを削除しますか？\n(この端末のセーブは消えません。元に戻せません)`)) return;
      try { await call("ka_save_delete", { p_game: g }); } catch (x) {}
      if (syncGame === g) { store.del(syncKey("base")); }
      loadSaves();
    });

    // パスワード変更
    q('[data-f="pw"]').addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = q('[data-e="pw"]'); err.textContent = ""; err.className = "ka-err";
      try {
        const r = await call("ka_password_change", { p_old: e.target.old.value, p_new: e.target.new.value });
        if (!r || !r.ok) { err.textContent = r && r.reason === "invalid" ? "いまのパスワードが違います。" : REASONS[r && r.reason] || "変更できませんでした。"; return; }
        err.className = "ka-ok"; err.textContent = "変更しました(ほかの端末はログアウトされます)。";
        e.target.reset();
      } catch (x) { err.textContent = NETERR; }
    });

    // ログアウト・削除
    q('[data-a="logout"]').addEventListener("click", async () => {
      try { await call("ka_logout", {}); } catch (x) {}
      setSession(null); o._close(); toast("ログアウトしました");
    });
    q('[data-a="delete"]').addEventListener("click", async () => {
      const pw = prompt("アカウントを削除します。クラウドのセーブもすべて消え、元に戻せません。\n続けるには、パスワードを入力してください。");
      if (pw === null) return;
      const err = q('[data-e="acct"]'); err.textContent = "";
      try {
        const r = await call("ka_delete_account", { p_password: pw });
        if (!r || !r.ok) { err.textContent = r && r.reason === "invalid" ? "パスワードが違います。" : "削除できませんでした。"; return; }
        setSession(null); o._close(); toast("アカウントを削除しました");
      } catch (x) { err.textContent = NETERR; }
    });
  }

  function openPanel() {
    if (document.querySelector(".ka-overlay")) return;
    if (session) openProfile(); else openAuth("login");
  }

  // ---------- ボタン(右下のバッジ / ポータルのヘッダー) ----------
  let badge = null, portalBtn = null;
  function badgeText() {
    if (!session) return "👤 ログイン";
    const base = `${session.profile.avatar} ${session.profile.display_name}`;
    if (!syncGame) return base;
    const m = { off: "", syncing: " ☁ 同期中…", ok: " ☁ 同期済み", conflict: " ⚠ 要確認", error: " ☁ ×" }[syncStatus] || "";
    return base + m;
  }
  function renderButtons() {
    if (badge) { badge.textContent = badgeText(); badge.classList.toggle("warn", session && syncStatus === "conflict"); }
    if (portalBtn) {
      portalBtn.textContent = session ? session.profile.avatar : "👤";
      portalBtn.title = session ? `${session.profile.display_name} (@${session.profile.username}) のアカウント` : "かるわかGAMESアカウントでログイン";
    }
  }
  function mountButtons() {
    if (!script) return;
    if (script.hasAttribute("data-portal")) {
      const anchor = document.getElementById("randomPickBtn");
      if (anchor && !document.getElementById("kaAccountBtn")) {
        portalBtn = document.createElement("button");
        portalBtn.id = "kaAccountBtn";
        portalBtn.className = "icon-btn";
        portalBtn.type = "button";
        portalBtn.setAttribute("aria-label", "アカウント");
        portalBtn.addEventListener("click", () => {
          if (syncStatus === "conflict" && session) resolveConflict(); else openPanel();
        });
        anchor.parentNode.insertBefore(portalBtn, anchor);
      }
    } else if (script.getAttribute("data-badge") !== "off") {
      injectCss();
      badge = document.createElement("button");
      badge.type = "button";
      badge.className = "ka-badge";
      badge.addEventListener("click", () => {
        if (syncStatus === "conflict" && session) resolveConflict(); else openPanel();
      });
      document.body.appendChild(badge);
    }
    renderButtons();
  }

  // ---------- クラウド同期(localStorage) ----------
  let syncGame = null, syncKeys = [], syncStatus = "off", applying = false, pushTimer = null, lastPushedHash = null, pushing = false;
  let conflictCloud = null;     // 競合時にクラウド側の情報を保持
  let initialSnap = null;       // ゲームが動き出す前のセーブ内容
  const syncKey = (n) => `ka_sync_${session ? session.profile.username : "_"}_${syncGame}_${n}`;
  const setStatus = (s) => { syncStatus = s; renderButtons(); const o = document.querySelector(".ka-overlay"); if (o) refreshState(o); };
  function refreshState(o) {
    const el = o.querySelector("[data-ka-state]");
    if (!el) return;
    el.textContent = { syncing: `☁ 「${syncGame}」のセーブを同期中…`, ok: `☁ 「${syncGame}」のセーブは同期済みです`, conflict: `⚠ 「${syncGame}」のセーブがクラウドとこの端末で違います(右下のボタンから選べます)`, error: "☁ 同期できませんでした(あとで再試行します)", off: "" }[syncStatus] || "";
  }

  function snapshot() {
    const o = {};
    syncKeys.forEach((k) => { const v = store.get(k); if (v !== null) o[k] = v; });
    return o;
  }
  const snapHash = (o) => hashStr(JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]])));
  const isEmpty = (o) => Object.keys(o).length === 0;

  // 同期の書き戻し中は、ゲームの自動セーブ(unload時など)で対象のキーを上書きされないようにする
  function patchStorage() {
    Storage.prototype.setItem = function (k, v) {
      if (applying && this === window.localStorage && syncKeys.includes(k)) return;
      return rawSet.call(this, k, v);
    };
    Storage.prototype.removeItem = function (k) {
      if (applying && this === window.localStorage && syncKeys.includes(k)) return;
      return rawRemove.call(this, k);
    };
  }

  async function pushNow(force) {
    if (!session || !syncGame || pushing || applying) return;
    const snap = snapshot();
    if (isEmpty(snap)) return;
    const h = snapHash(snap);
    if (!force && h === lastPushedHash) return;
    pushing = true; setStatus("syncing");
    try {
      const r = await call("ka_save_put", { p_game: syncGame, p_data: snap, p_hash: h, p_base_hash: store.get(syncKey("base")), p_device: deviceId(), p_force: !!force }, { keepalive: JSON.stringify(snap).length < 60000 });
      if (r && r.ok) { store.set(syncKey("base"), h); lastPushedHash = h; conflictCloud = null; setStatus("ok"); }
      else if (r && r.reason === "conflict") { conflictCloud = { hash: r.cloud_hash, updated_at: r.cloud_updated_at }; setStatus("conflict"); }
      else if (r && r.reason === "toolarge") { setStatus("error"); toast("セーブデータが大きすぎて、クラウドに保存できません"); }
      else setStatus(session ? "error" : "off");
    } catch (e) { setStatus("error"); }
    pushing = false;
  }
  function schedulePush() {
    if (pushTimer || !session || syncStatus === "conflict") return;
    pushTimer = setTimeout(() => { pushTimer = null; pushNow(false); }, 4000);
  }

  // クラウドの内容をこの端末に書き込み、ページを読み直す(ゲームが新しいセーブで始まるように)
  function applyCloud(data, hash) {
    applying = true;
    syncKeys.forEach((k) => { if (Object.prototype.hasOwnProperty.call(data, k)) rawSet.call(localStorage, k, data[k]); else rawRemove.call(localStorage, k); });
    store.set(syncKey("base"), hash);
    const guard = `ka_reloaded_${syncGame}`;
    // 同じ内容を20秒以内にもう一度取り込もうとした場合(= 再読み込みを繰り返している)だけ、読み直さない
    let again = false;
    try {
      const [gh, gt] = (sessionStorage.getItem(guard) || "").split(":");
      again = gh === hash && Date.now() - Number(gt || 0) < 20000;
      sessionStorage.setItem(guard, hash + ":" + Date.now());
    } catch (e) {}
    if (again) { applying = false; toast("クラウドのセーブを読み込みました"); setStatus("ok"); return; }
    toast("クラウドのセーブを読み込みます…");
    setTimeout(() => location.reload(), 300);
  }

  async function resolveConflict() {
    if (!session || !syncGame) return;
    let r;
    try { r = await call("ka_save_get", { p_game: syncGame }); } catch (e) { toast(NETERR); return; }
    if (!r || !r.ok) return;
    if (!r.found) { pushNow(true); return; }
    const o = overlay(`
      <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
      <h2 class="ka-h">どちらのセーブを使いますか？</h2>
      <p class="ka-sub">「${esc(syncGame)}」のセーブデータが、クラウドとこの端末で違っています。選ばなかった方は上書きされて消えます。</p>
      <p class="ka-note">クラウドのセーブ: ${fmtTime(r.updated_at)} に保存(${(r.size / 1024).toFixed(1)}KB)</p>
      <div class="ka-row" style="justify-content:stretch;flex-direction:column">
        <button type="button" class="ka-btn pri" data-pick="cloud">☁ クラウドのセーブを使う(この端末のは上書き)</button>
        <button type="button" class="ka-btn" data-pick="local">📱 この端末のセーブを使う(クラウドのは上書き)</button>
        <button type="button" class="ka-btn" data-ka-close>あとで決める</button>
      </div>`);
    o.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-pick]");
      if (!b) return;
      o._close();
      if (b.dataset.pick === "cloud") { sessionStorage.removeItem(`ka_reloaded_${syncGame}`); applyCloud(r.data, r.hash); }
      else { await pushNow(true); toast("この端末のセーブをクラウドに保存しました"); }
    });
  }

  async function startSync(fromLogin) {
    if (!syncGame || !session) { if (!session) setStatus("off"); return; }
    setStatus("syncing");
    let r;
    try { r = await call("ka_save_get", { p_game: syncGame }); } catch (e) { setStatus("error"); return; }
    if (!r || !r.ok) { setStatus("off"); return; }
    // 判定には「ゲームが動き出す前(このスクリプトを読んだ時点)」のセーブを使う。
    // ゲームは起動後すぐ自動セーブして時刻などを書き換えるので、いまの中身で比べると「端末が変更された」と誤判定してしまう。
    const snap = initialSnap || snapshot(), lh = snapHash(snap), localEmpty = isEmpty(snap);
    const base = store.get(syncKey("base"));
    if (!r.found) {
      if (!localEmpty) await pushNow(true); else setStatus("ok");
    } else if (lh === r.hash) {
      store.set(syncKey("base"), r.hash); lastPushedHash = lh; setStatus("ok");
    } else if (localEmpty || (base && lh === base)) {
      applyCloud(r.data, r.hash);                    // クラウドだけが進んでいる(または端末が空) → 取り込む
    } else if (r.device === deviceId() || (base && r.hash === base)) {
      // クラウドを最後に書いたのがこの端末(画面を閉じる瞬間の保存は応答を受け取れず、基準がずれることがある)、
      // またはクラウドが前回のまま → 端末だけが進んでいるので、クラウドへ
      await pushNow(false);
    } else {
      setStatus("conflict");                         // どちらも変わっている/初めての接続 → ユーザーに聞く
      if (!document.querySelector(".ka-overlay")) resolveConflict();
    }
    if (syncStatus === "ok" || syncStatus === "syncing") lastPushedHash = lastPushedHash || lh;
  }

  function initSync() {
    patchStorage();
    // 変更の検知: 20秒ごとに中身を比べ、変わっていれば保存。画面を離れるとき・隠すときにも保存
    setInterval(() => { if (session && syncGame && syncStatus !== "conflict") { const s = snapshot(); if (!isEmpty(s) && snapHash(s) !== lastPushedHash) schedulePush(); } }, 20000);
    // 画面を隠すとき: ゲーム側の「隠れたら保存」より先にこちらが動くので、少し待ってから保存する
    document.addEventListener("visibilitychange", () => { if (document.hidden) setTimeout(() => pushNow(false), 150); });
    window.addEventListener("pagehide", () => pushNow(false));
  }

  // ---------- 起動 ----------
  const ready = (async () => {
    session = readSession();
    if (session) {
      try {
        const r = await rpc("ka_whoami", { p_token: session.token });
        if (r && r.ok) { session = { token: session.token, profile: r.profile }; store.set(SESSION_KEY, JSON.stringify(session)); }
        else { session = null; store.del(SESSION_KEY); }
      } catch (e) { /* 通信できないときは、保存してあるログイン状態をそのまま使う */ }
    }
    notify(); renderButtons();
    return session && session.profile;
  })();

  function configure() {
    if (!script) return;
    const game = (script.getAttribute("data-game") || "").trim();
    if (game && /^[a-z0-9_-]{1,60}$/.test(game)) {
      syncGame = game;
      syncKeys = (script.getAttribute("data-keys") || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!syncKeys.length) syncGame = null;
    }
  }
  configure();
  if (syncGame) { initialSnap = snapshot(); initSync(); }
  const boot = () => { mountButtons(); ready.then(() => { if (syncGame) startSync(false); }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.KaAccount = {
    ready,
    user: () => (session ? session.profile : null),
    isLoggedIn: () => !!session,
    onChange: (f) => { listeners.add(f); return () => listeners.delete(f); },
    openPanel,
    login: () => openAuth("login"),
    // ゲーム側から「いまセーブした」と知らせると、すぐクラウドへ(省略しても20秒ごとに自動で保存される)
    saveNow: () => pushNow(false),
    status: () => syncStatus,
    // テスト・上級者向け: アカウントAPIをそのまま呼ぶ
    _call: call,
  };
})();
