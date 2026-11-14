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
      headers: { apikey: KEY, Authorization: "Bearer " + ((opts && opts.jwt) || KEY), "Content-Type": "application/json" },
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

  // ---------- OAuth(Google / Discord / GitHub)でログイン・アカウント作成 ----------
  // しくみ: Supabase Auth のOAuthでログイン → 戻り先ページ(oauth.html)が「#ka_oauth=…」に名前を変えて元のページへ返す →
  //   ここで受け取って、RPC(ka_oauth_*)で「かるわかGAMESのセッション」に変換する。Supabaseのログイン自体はすぐ破棄する。
  //   どのサービスが使えるかは、Supabase側の設定(/auth/v1/settings)を見て決める。設定されていないサービスのボタンは出ない。
  const OAUTH_URL = PORTAL_URL + "oauth.html";
  const PROVIDER_LABEL = { google: "Google", discord: "Discord", github: "GitHub", mixall: "MixAll" };
  const MIXALL_API = "https://mixalls.vercel.app/api/dev";   // MixAll(友人のサイト)のOAuth。入口は mixall-login.html
  const MIXALL_CLIENT = "mxc_8184495951de4b83144caa121de5cdee";
  const MIXALL_REDIRECT = PORTAL_URL + "mixall-login.html";
  const MIXALL_BASE = "https://mixalls.vercel.app";
  const MIXALL_VERIFY = `${URL_BASE}/functions/v1/ka-mixall/verify`; // MixAllの証明書を、サーバー側で確かめてチケットに換える
  let oauthReturn = null; // 戻ってきたとき: { jwt, mode } または { error }
  {
    const h = location.hash || "";
    if (h.indexOf("ka_oauth") >= 0 || h.indexOf("ka_mixall") >= 0) {
      const p = new URLSearchParams(h.replace(/^#/, ""));
      if (p.get("ka_oauth")) oauthReturn = { jwt: p.get("ka_oauth"), mode: p.get("ka_mode") === "link" ? "link" : "login" };
      else if (p.get("ka_mixall")) oauthReturn = { ticket: p.get("ka_mixall"), mode: p.get("ka_mode") === "link" ? "link" : "login" };
      else if (p.get("ka_oauth_error")) oauthReturn = { error: p.get("ka_oauth_error") };
      // ゲーム側のページ(ハッシュで画面を切り替えるものなど)に見せないよう、すぐ消す
      if (oauthReturn) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
    }
  }
  let providersPromise = null;
  // MixAllの「MixAllでログイン」(権限の一覧 loginLinksCatalog)が動いているときだけ、ボタンを出す(MixAllが止まっているときは出さない)
  function mixallAvailable() {
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), 4000) : null;
    return fetch(MIXALL_API, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ac ? ac.signal : undefined,
      body: JSON.stringify({ action: "loginLinksCatalog" }),
    }).then((r) => r.ok).catch(() => false).then((v) => { if (timer) clearTimeout(timer); return v; });
  }

  // ---- MixAllでログイン(ポップアップ方式) ----
  // MixAll公式SDK(mixall-login.js)と同じやり取りを、ここに直接書いている(第三者のスクリプトを、全ゲーム共通のこのサイトの中で動かさないため)。
  // MixAllの了承画面(/login-links)をポップアップで開き、postMessageで要求(名前だけ)を渡し、返ってきた certificate を受け取る。
  // certificate は、そのサイト(origin)でしか使えない。信用はせず、必ずサーバー(ka-mixall /verify)がMixAllに問い合わせて確かめる。
  function mixallPopup() {
    return new Promise((resolve, reject) => {
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
      const w = window.open(MIXALL_BASE + "/login-links", "mixall-login", "width=520,height=720"); // ボタンのクリックの中で呼ぶこと
      if (!w) return reject({ blocked: true });
      let done = false, sent = false, watch = 0, timer = 0;
      const finish = (fn, v) => { if (done) return; done = true; clearInterval(watch); clearTimeout(timer); window.removeEventListener("message", onMsg); fn(v); };
      timer = setTimeout(() => { finish(reject, { timeout: true }); try { w.close(); } catch (e) {} }, 15 * 60000);
      watch = setInterval(() => { if (w.closed) setTimeout(() => finish(reject, { cancelled: true }), 400); }, 500);
      function onMsg(e) {
        if (e.origin !== MIXALL_BASE || e.source !== w) return;
        const d = e.data || {};
        if (d.mixallLogin !== 1) return;
        if (d.type === "ready" && !sent) { sent = true; w.postMessage({ mixallLogin: 1, type: "request", nonce, authority: ["name"] }, MIXALL_BASE); }
        else if (d.type === "result" && d.nonce === nonce) {
          if (!d.ok || !d.certificate) return finish(reject, { denied: d.error === "denied" });
          finish(resolve, d.certificate);
        }
      }
      window.addEventListener("message", onMsg);
    });
  }
  // 全画面で移動する方式(予備。ポップアップが使えないときや、ポップアップ方式の確認が通らなかったとき、ポータル以外のサイトで使う)
  function mixallRedirect(mode) {
    const ret = location.href.split("#")[0];
    // URLが長くならないよう、ポータル内の戻り先は「/game-links/…」の形だけ渡す(m=l は連携モード)
    const origin = new URL(PORTAL_URL).origin;
    const rel = ret.startsWith(origin + "/") ? ret.slice(origin.length) : ret;
    location.href = `${MIXALL_REDIRECT}?${mode === "link" ? "m=l&" : ""}r=${encodeURIComponent(rel)}`;
  }
  async function mixallPopupLogin(mode) {
    let certificate;
    try { certificate = await mixallPopup(); }
    catch (e) {
      if (e && e.blocked) return mixallRedirect(mode); // ポップアップがブロックされた
      toast(e && (e.denied || e.cancelled) ? "ログインをやめました" : "MixAllでのログインに失敗しました。もう一度お試しください", 5000);
      return;
    }
    let v = null;
    try {
      const res = await fetch(MIXALL_VERIFY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certificate, origin: location.origin }) });
      v = await res.json().catch(() => null);
    } catch (e) { /* つながらない */ }
    if (!v || !v.ticket) { toast("確認できなかったので、別の方法でもう一度ためします", 4000); setTimeout(() => mixallRedirect(mode), 900); return; }
    // ログイン画面(ボタンを押した画面)を閉じて、続きの画面(アカウントを作る/結びつける)を出す
    document.querySelectorAll(".ka-overlay").forEach((o) => { if (o._close) o._close(); else o.remove(); });
    oauthReturn = { ticket: v.ticket, mode };
    await handleOAuthReturn();
  }
  function oauthProviders() {
    if (!providersPromise) {
      providersPromise = Promise.all([
        fetch(`${URL_BASE}/auth/v1/settings`, { headers: { apikey: KEY } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => Object.keys(PROVIDER_LABEL).filter((p) => p !== "mixall" && d && d.external && d.external[p]))
          .catch(() => []),
        mixallAvailable(),
      ]).then(([list, mx]) => (mx ? list.concat("mixall") : list));
    }
    return providersPromise;
  }
  function startOAuth(provider) {
    const mode = session ? "link" : "login"; // ログイン中なら「いまのアカウントに連携」
    const ret = location.href.split("#")[0];
    if (provider === "mixall") {
      // ポータル(と同じoriginの全ゲーム)ではポップアップ方式。それ以外のサイトは、ポータルを通る全画面方式
      if (location.origin === new URL(PORTAL_URL).origin || location.hostname === "localhost") mixallPopupLogin(mode);
      else mixallRedirect(mode);
      return;
    }
    const redirect = `${OAUTH_URL}?mode=${mode}&return=${encodeURIComponent(ret)}`;
    let url = `${URL_BASE}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirect)}`;
    if (provider === "google") url += "&prompt=select_account"; // 複数のGoogleアカウントがあるとき、選べるように
    location.href = url;
  }
  const OAUTH_REASONS = {
    auth: "ログインの確認が切れました。もう一度、サービスのボタンからやり直してください。",
    oauth: "サービスでのログインを確認できませんでした。もう一度やり直してください。",
    taken: "そのサービスのアカウントは、すでに別のかるわかGAMESアカウントに連携されています。",
    already: "このアカウントには、すでに同じサービスが連携されています。",
    linked: "そのサービスは、すでに連携されています。ページを読み込み直して、もう一度ログインしてください。",
    last: "パスワードがなく、ほかの連携もないため、解除するとログインできなくなります。先に「パスワードを設定」してください。",
    notfound: "連携が見つかりませんでした。",
    exists: "すでにパスワードが設定されています。",
  };
  // 「ログイン画面で押す」サービスのボタンを、いま使えるサービスの分だけ作る
  function fillOAuthButtons(o) {
    const box = o.querySelector(".ka-oauth");
    if (!box) return;
    oauthProviders().then((list) => {
      if (!list.length || !o.isConnected) return;
      box.querySelector(".ka-oauth-btns").innerHTML = list.map((p) => `<button type="button" class="ka-ob ka-ob-${p}" data-p="${p}">${PROVIDER_LABEL[p]}で続ける</button>`).join("");
      box.hidden = false;
      box.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => startOAuth(b.dataset.p)));
    });
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
.ka-tabs{display:flex;gap:8px;margin:10px 0 12px}
.ka-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 6px;font:700 13px system-ui,"Yu Gothic UI",sans-serif;color:#cfd0ff;background:#120e33;border:2px solid #3a2f80;border-radius:10px;cursor:pointer}
.ka-tab small{font-weight:400;font-size:11px;opacity:.85}
.ka-tab.on{background:#ff3ea5;border-color:#ffd0ea;color:#fff}
.ka-benefits{margin:6px 0 4px;padding:8px 12px 8px 12px;list-style:none;font-size:13px;background:#120e33;border-radius:10px;border:1px solid #3a2f80}
.ka-benefits li{margin:3px 0}
.ka-benefits b{color:#ffd23f}
.ka-step{display:flex;align-items:center;gap:8px;margin:6px 0 0;font-weight:700;font-size:14px}
.ka-step span{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;font-size:12px;color:#fff;background:#ff3ea5;border-radius:50%}
.ka-help{display:block;margin:0 0 4px;font-size:12px;font-weight:400;color:#aab;line-height:1.55}
.ka-help b{color:#ffd23f}
.ka-live{margin:0;min-height:1.2em;font-size:12px;font-weight:700;color:#99a}
.ka-live.ok{color:#7dffb0}
.ka-live.ng{color:#ff9a9a}
.ka-warn{margin:2px 0;padding:7px 10px;font-size:12px;line-height:1.6;color:#ffe9a8;background:#3a2f10;border:1px solid #7a6020;border-radius:8px}
.ka-pw{display:flex;gap:6px}
.ka-pw .ka-input{flex:1;min-width:0}
.ka-eye{flex:0 0 auto;padding:0 12px;font:700 12px system-ui,"Yu Gothic UI",sans-serif;color:#eef;background:#2a2070;border:2px solid #5a48c0;border-radius:8px;cursor:pointer}
.ka-trouble{margin-top:10px;font-size:12px;color:#aab}
.ka-trouble summary{cursor:pointer;font-weight:700;color:#8fd0ff}
.ka-trouble ul{margin:6px 0 0;padding-left:18px;line-height:1.7}
.ka-btn.big{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:10px 14px;border-radius:12px;text-align:left}
.ka-btn.big small{font-weight:400;font-size:11px;opacity:.9;line-height:1.5}
.ka-login-pill{width:auto!important;padding:0 12px!important;font-size:.78rem!important;font-weight:700;border-radius:999px!important;white-space:nowrap}
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
.ka-dialog [hidden]{display:none!important}
.ka-oauth{margin:4px 0 10px}
.ka-oauth-btns{display:flex;flex-direction:column;gap:8px}
.ka-ob{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px 14px;font:700 14px system-ui,"Yu Gothic UI",sans-serif;color:#fff;background:#120e33;border:2px solid #3a2f80;border-left-width:6px;border-radius:10px;cursor:pointer}
.ka-ob:hover{border-color:#ff3ea5}
.ka-ob-google{border-left-color:#4285f4}
.ka-ob-discord{border-left-color:#5865f2}
.ka-ob-github{border-left-color:#8b949e}
.ka-ob-mixall{border-left-color:#22c3a6}
.ka-or{display:flex;align-items:center;gap:8px;margin:12px 0 0;font-size:11px;color:#99a}
.ka-or::before,.ka-or::after{content:"";flex:1;height:1px;background:#3a2f80}
.ka-prov{margin:0;padding:0;list-style:none}
.ka-prov li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #2a2260;font-size:13px}
.ka-prov small{color:#7dffb0}
`;
    (document.head || document.documentElement).appendChild(st);
  }
  function toast(msg, ms = 3200) {
    injectCss();
    const t = document.createElement("div");
    t.className = "ka-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  function overlay(html, onClose) {
    injectCss();
    const o = document.createElement("div");
    o.className = "ka-overlay";
    o.innerHTML = `<div class="ka-dialog" role="dialog" aria-modal="true">${html}</div>`;
    let closed = false;
    const close = () => { if (closed) return; closed = true; o.remove(); document.removeEventListener("keydown", onKey, true); if (onClose) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    document.addEventListener("keydown", onKey, true);
    o.addEventListener("mousedown", (e) => { if (e.target === o) close(); });
    o.addEventListener("click", (e) => { if (e.target.closest("[data-ka-close]")) close(); });
    document.body.appendChild(o);
    o._close = close;
    return o;
  }

  const REASONS = {
    username: "ユーザー名は、半角の英小文字・数字・「_」「-」で、3〜16文字にしてください。(例: karuwaka_123)",
    password: "パスワードは、8文字以上にしてください。",
    display: "表示名は1〜20文字にしてください。",
    avatar: "アイコンは絵文字1つを選んでください。",
    taken: "そのユーザー名は、すでに使われています。別の名前にしてください。",
    rate: "短い時間にたくさん作りすぎです。しばらくしてからもう一度どうぞ。",
    invalid: "ユーザー名かパスワードが違います。ユーザー名は、表示名ではなく、登録のときに決めた半角の名前です。",
    locked: "ログインの失敗が続いたため、いったん止めています。10分ほどしてから、もう一度お試しください。",
    client: "登録できませんでした。ページを読み込み直してください。",
  };
  const NETERR = "通信に失敗しました。もう一度お試しください。";

  // ---------- パネル: ログイン / 新規登録 ----------
  // はじめての人にも迷わないよう、「はじめての人(作る)」と「持っている人(ログイン)」に分け、
  // 入力欄ごとに何を書くかを説明し、入力しながらその場で使えるかどうかを知らせる。
  const USER_RE = /^[a-z0-9_-]{3,16}$/;
  function openAuth(tab, onClose) {
    const o = overlay(`
      <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
      <h2 class="ka-h">かるわかGAMES アカウント</h2>
      <ul class="ka-benefits">
        <li>🎮 1つ作れば、かるわかGAMESの<b>たくさんのゲーム</b>で使える</li>
        <li>☁ セーブデータが保存されて、<b>別の端末でも続き</b>から遊べる</li>
        <li>🆓 無料で、<b>メールアドレスは不要</b></li>
      </ul>
      <div class="ka-tabs">
        <button type="button" class="ka-tab" data-t="register"><b>🆕 はじめての人</b><small>アカウントを作る</small></button>
        <button type="button" class="ka-tab" data-t="login"><b>🔑 持っている人</b><small>ログインする</small></button>
      </div>
      <div class="ka-oauth" hidden><div class="ka-oauth-btns"></div><p class="ka-or"><span>または、ユーザー名とパスワードで</span></p></div>
      <form class="ka-form" autocomplete="on">
        <div class="ka-step ka-reg"><span>1</span>ユーザー名を決める</div>
        <label class="ka-label"><span class="ka-lab-login">ユーザー名</span>
          <small class="ka-help ka-reg">ログインに使う名前です。半角の英小文字・数字・ _ - で3〜16文字。<b>あとから変更できません。</b></small>
          <small class="ka-help ka-log">登録のときに決めた名前です。(ゲームの中で見える「表示名」ではありません)</small>
          <input class="ka-input" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" placeholder="例: karuwaka_123" required></label>
        <p class="ka-live ka-reg" data-live="user"></p>
        <div class="ka-step ka-reg"><span>2</span>表示名を決める</div>
        <label class="ka-label ka-reg">
          <small class="ka-help">ゲームの中で、ほかの人に見える名前です。日本語もOK。あとで変えられます。</small>
          <input class="ka-input" name="display" maxlength="20" autocomplete="nickname" placeholder="例: かるわか(空なら、ユーザー名と同じ)"></label>
        <div class="ka-step ka-reg"><span>3</span>パスワードを決める</div>
        <label class="ka-label"><span class="ka-lab-login">パスワード</span>
          <small class="ka-help ka-reg">8文字以上。ほかのサイトと同じものは避けましょう。</small>
          <span class="ka-pw"><input class="ka-input" name="password" type="password" maxlength="72" placeholder="8文字以上" required><button type="button" class="ka-eye" data-eye aria-label="パスワードを表示する">表示</button></span></label>
        <p class="ka-live ka-reg" data-live="pw"></p>
        <p class="ka-warn ka-reg">⚠ パスワードを忘れると、自分では元に戻せません。ブラウザの「パスワードを保存」を使うか、メモしておいてください。</p>
        <p class="ka-err" role="alert"></p>
        <div class="ka-row"><button type="button" class="ka-btn" data-ka-close>キャンセル</button><button type="submit" class="ka-btn pri"></button></div>
        <details class="ka-trouble ka-log"><summary>ログインできないとき</summary>
          <ul>
            <li>「ユーザー名」は、表示名ではなく、登録のときに決めた半角の名前です。</li>
            <li>まだアカウントがないなら、上の「はじめての人」から作れます。</li>
            <li>パスワードを忘れたときは、自分では戻せません。かるわかに連絡してもらえれば、再設定できます。</li>
          </ul></details>
      </form>`, onClose);
    const form = o.querySelector("form");
    fillOAuthButtons(o);
    const err = o.querySelector(".ka-err");
    const liveUser = o.querySelector('[data-live="user"]'), livePw = o.querySelector('[data-live="pw"]');
    let mode = tab === "register" ? "register" : "login";
    const apply = () => {
      o.querySelectorAll(".ka-tab").forEach((b) => b.classList.toggle("on", b.dataset.t === mode));
      o.querySelectorAll(".ka-reg").forEach((e) => { e.style.display = mode === "register" ? "" : "none"; });
      o.querySelectorAll(".ka-log").forEach((e) => { e.style.display = mode === "login" ? "" : "none"; });
      o.querySelectorAll(".ka-lab-login").forEach((e) => { e.style.display = mode === "login" ? "" : "none"; });
      o.querySelector(".ka-benefits").style.display = mode === "register" ? "" : "none";
      form.password.autocomplete = mode === "register" ? "new-password" : "current-password";
      form.querySelector("button[type=submit]").textContent = mode === "register" ? "アカウントを作る" : "ログインする";
      err.textContent = "";
    };
    o.querySelectorAll(".ka-tab").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.t; apply(); form.username.focus(); }));
    apply();
    setTimeout(() => form.username.focus(), 50);

    // パスワードの表示/非表示
    o.querySelector("[data-eye]").addEventListener("click", (e) => {
      const show = form.password.type === "password";
      form.password.type = show ? "text" : "password";
      e.target.textContent = show ? "隠す" : "表示";
      e.target.setAttribute("aria-label", show ? "パスワードを隠す" : "パスワードを表示する");
    });
    // 入力しながら、その場で知らせる
    let userTimer = null, userSeq = 0;
    const setLive = (el, ok, text) => { el.textContent = text; el.className = "ka-live ka-reg " + (ok === null ? "" : ok ? "ok" : "ng"); el.style.display = mode === "register" ? "" : "none"; };
    form.username.addEventListener("input", () => {
      clearTimeout(userTimer);
      const v = form.username.value.trim();
      if (!v) { setLive(liveUser, null, ""); return; }
      if (/[A-Z]/.test(v)) { setLive(liveUser, false, "✗ 大文字は使えません(小文字にしてください)"); return; }
      if (/[^a-z0-9_-]/.test(v)) { setLive(liveUser, false, "✗ 使えない文字があります(半角の英小文字・数字・ _ - だけ)"); return; }
      if (v.length < 3) { setLive(liveUser, false, `✗ あと${3 - v.length}文字以上、入れてください(3〜16文字)`); return; }
      setLive(liveUser, null, "確認中…");
      const seq = ++userSeq;
      userTimer = setTimeout(async () => {
        try {
          const r = await rpc("ka_username_available", { p_username: v });
          if (seq !== userSeq) return;
          setLive(liveUser, !!r, r ? "✓ このユーザー名は使えます" : "✗ このユーザー名は、すでに使われています");
        } catch (e) { if (seq === userSeq) setLive(liveUser, null, ""); }
      }, 400);
    });
    form.password.addEventListener("input", () => {
      const n = form.password.value.length;
      if (!n) { setLive(livePw, null, ""); return; }
      setLive(livePw, n >= 8, n >= 8 ? "✓ OK" : `✗ あと${8 - n}文字以上、入れてください`);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      err.textContent = "";
      if (mode === "register") {
        if (!USER_RE.test(form.username.value.trim())) { err.textContent = REASONS.username; form.username.focus(); return; }
        if (form.password.value.length < 8) { err.textContent = REASONS.password; form.password.focus(); return; }
      }
      btn.disabled = true;
      let r;
      try {
        r = mode === "register"
          ? await rpc("ka_register", { p_username: form.username.value, p_password: form.password.value, p_display: form.display.value, p_client: clientId() })
          : await rpc("ka_login", { p_username: form.username.value, p_password: form.password.value });
      } catch (x) { err.textContent = NETERR; btn.disabled = false; return; }
      btn.disabled = false;
      if (!r || !r.ok) { err.textContent = REASONS[r && r.reason] || "うまくいきませんでした。"; return; }
      setSession({ token: r.token, profile: r.profile });
      o._close(); // フォームをDOMから消す(パスワードマネージャーが保存を提案しやすくなる)
      toast(mode === "register" ? `🎉 アカウントを作りました！ ユーザー名は「${r.profile.username}」です` : `ログインしました(${r.profile.display_name})`, mode === "register" ? 7000 : 3200);
      startSync(true);
    });
  }

  // ---------- OAuthから戻ってきたとき ----------
  async function handleOAuthReturn() {
    const r = oauthReturn;
    oauthReturn = null;
    if (!r) return;
    if (r.error) { toast(/denied|cancel/i.test(r.error) ? "ログインをやめました" : "サービスでのログインに失敗しました。もう一度お試しください", 5000); return; }
    const jwt = r.jwt, ticket = r.ticket; // ticket があるのは MixAll(Edge Function ka-mixall が発行した10分のチケット)
    // サービス側のログイン(Supabaseのセッション)は、変換が終わったらすぐ破棄する(MixAllはチケットなので不要)
    const done = ticket ? () => {} : () => { try { fetch(`${URL_BASE}/auth/v1/logout?scope=local`, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + jwt }, keepalive: true }).catch(() => {}); } catch (e) {} };
    let keepOpen = false;
    try {
      if (r.mode === "link" && session) {
        const x = ticket ? await rpc("ka_mixall_link", { p_token: session.token, p_ticket: ticket }) : await rpc("ka_oauth_link", { p_token: session.token }, { jwt });
        if (x && x.ok) {
          setSession({ token: session.token, profile: x.profile });
          const label = PROVIDER_LABEL[x.provider] || "サービス";
          toast(`${label}を連携しました。次からは、${label}でもログインできます`, 5000);
          if (!document.querySelector(".ka-overlay")) openProfile();
        } else toast(OAUTH_REASONS[x && x.reason] || "連携できませんでした。", 6000);
        return;
      }
      const x = ticket ? await rpc("ka_mixall_login", { p_ticket: ticket }) : await rpc("ka_oauth_login", {}, { jwt });
      if (!x || !x.ok) { toast(OAUTH_REASONS[x && x.reason] || OAUTH_REASONS.oauth, 6000); return; }
      if (x.linked) {
        setSession({ token: x.token, profile: x.profile });
        toast(`${PROVIDER_LABEL[x.provider] || "サービス"}でログインしました(${x.profile.display_name})`);
        startSync(true);
        return;
      }
      keepOpen = true; // 未連携: 新しく作るか、持っているアカウントに結びつけるかを選んでもらう(閉じるまでjwtを使う)
      openOAuthChoice(x, jwt, done, ticket);
    } catch (e) {
      toast("ログインの確認に失敗しました。もう一度お試しください。", 5000);
    } finally {
      if (!keepOpen) done();
    }
  }

  // ユーザー名の入力欄に、入力しながら「使えるか」を知らせる
  function bindUsernameLive(input, live) {
    let timer = null, seq = 0;
    const set = (ok, text) => { live.textContent = text; live.className = "ka-live " + (ok === null ? "" : ok ? "ok" : "ng"); };
    const check = () => {
      clearTimeout(timer);
      const v = input.value.trim();
      if (!v) { set(null, ""); return; }
      if (/[A-Z]/.test(v)) { set(false, "✗ 大文字は使えません(小文字にしてください)"); return; }
      if (/[^a-z0-9_-]/.test(v)) { set(false, "✗ 使えない文字があります(半角の英小文字・数字・ _ - だけ)"); return; }
      if (v.length < 3) { set(false, `✗ あと${3 - v.length}文字以上、入れてください(3〜16文字)`); return; }
      set(null, "確認中…");
      const my = ++seq;
      timer = setTimeout(async () => {
        try {
          const r = await rpc("ka_username_available", { p_username: v });
          if (my !== seq) return;
          set(!!r, r ? "✓ このユーザー名は使えます" : "✗ このユーザー名は、すでに使われています");
        } catch (e) { if (my === seq) set(null, ""); }
      }, 400);
    };
    input.addEventListener("input", check);
    return check;
  }

  // 未連携のサービスでログインした人に、「新しく作る」か「持っているアカウントに結びつける」かを選んでもらう
  function openOAuthChoice(info, jwt, done, ticket) {
    const label = PROVIDER_LABEL[info.provider] || "このサービス";
    const o = overlay(`
      <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
      <h2 class="ka-h">${esc(label)}でログインしました</h2>
      <p class="ka-sub">この${esc(label)}は、まだ「かるわかGAMESアカウント」と結びついていません。どちらにしますか？</p>
      <div class="ka-form" data-step="choice">
        <button type="button" class="ka-btn big pri" data-pick="new"><b>🆕 はじめて(アカウントを作る)</b><small>かるわかGAMESアカウントを新しく作ります。パスワードは要りません。次からは${esc(label)}でログインできます</small></button>
        <button type="button" class="ka-btn big" data-pick="claim"><b>🔑 もうアカウントを持っている</b><small>持っているアカウントのユーザー名とパスワードで、${esc(label)}と結びつけます。セーブデータはそのまま使えます</small></button>
      </div>
      <form class="ka-form" data-step="new" hidden>
        <label class="ka-label">ユーザー名
          <small class="ka-help">アカウントを区別するための名前です。半角の英小文字・数字・ _ - で3〜16文字。<b>あとから変更できません。</b></small>
          <input class="ka-input" name="username" autocapitalize="none" spellcheck="false" maxlength="16" required></label>
        <p class="ka-live" data-live="user"></p>
        <label class="ka-label">表示名
          <small class="ka-help">ゲームの中で、ほかの人に見える名前です。日本語もOK。あとで変えられます。</small>
          <input class="ka-input" name="display" maxlength="20"></label>
        <p class="ka-err" data-e="new" role="alert"></p>
        <div class="ka-row"><button type="button" class="ka-btn" data-back>← 戻る</button><button type="submit" class="ka-btn pri">アカウントを作る</button></div>
      </form>
      <form class="ka-form" data-step="claim" hidden autocomplete="on">
        <p class="ka-help">持っているアカウントの「ユーザー名」と「パスワード」を入れてください。(ゲームの中の表示名ではありません)</p>
        <label class="ka-label">ユーザー名<input class="ka-input" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" required></label>
        <label class="ka-label">パスワード<input class="ka-input" name="password" type="password" autocomplete="current-password" maxlength="72" required></label>
        <p class="ka-err" data-e="claim" role="alert"></p>
        <div class="ka-row"><button type="button" class="ka-btn" data-back>← 戻る</button><button type="submit" class="ka-btn pri">結びつける</button></div>
      </form>`, done);
    const show = (s) => o.querySelectorAll("[data-step]").forEach((e) => { e.hidden = e.dataset.step !== s; });
    const fNew = o.querySelector('[data-step="new"]'), fClaim = o.querySelector('[data-step="claim"]');
    const check = bindUsernameLive(fNew.username, o.querySelector('[data-live="user"]'));
    // 名前の候補(サービスの名前から、使える文字だけ取り出す)
    let u = String(info.suggest || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 12);
    if (u.length < 3) u = "user" + Math.floor(1000 + Math.random() * 9000);
    fNew.username.value = u;
    fNew.display.value = String(info.suggest || "").slice(0, 20);
    o.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
      show(b.dataset.pick);
      if (b.dataset.pick === "new") { check(); fNew.username.focus(); } else fClaim.username.focus();
    }));
    o.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => show("choice")));

    const finish = (r, msg) => { setSession({ token: r.token, profile: r.profile }); o._close(); toast(msg, 7000); startSync(true); };
    const reason = (r) => REASONS[r && r.reason] || OAUTH_REASONS[r && r.reason] || "うまくいきませんでした。";
    fNew.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = o.querySelector('[data-e="new"]'), btn = fNew.querySelector("button[type=submit]");
      err.textContent = "";
      if (!USER_RE.test(fNew.username.value.trim())) { err.textContent = REASONS.username; fNew.username.focus(); return; }
      btn.disabled = true;
      try {
        const a = { p_username: fNew.username.value, p_display: fNew.display.value, p_client: clientId() };
        const r = ticket ? await rpc("ka_mixall_register", Object.assign({ p_ticket: ticket }, a)) : await rpc("ka_oauth_register", a, { jwt });
        if (r && r.ok) finish(r, `🎉 アカウントを作りました！ ユーザー名は「${r.profile.username}」です`);
        else err.textContent = reason(r);
      } catch (x) { err.textContent = NETERR; }
      btn.disabled = false;
    });
    fClaim.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = o.querySelector('[data-e="claim"]'), btn = fClaim.querySelector("button[type=submit]");
      err.textContent = "";
      btn.disabled = true;
      try {
        const a = { p_username: fClaim.username.value, p_password: fClaim.password.value };
        const r = ticket ? await rpc("ka_mixall_claim", Object.assign({ p_ticket: ticket }, a)) : await rpc("ka_oauth_claim", a, { jwt });
        if (r && r.ok) finish(r, `${label}を結びつけました(${r.profile.display_name})。次からは${label}でもログインできます`);
        else err.textContent = reason(r);
      } catch (x) { err.textContent = NETERR; }
      btn.disabled = false;
    });
  }

  // ---------- パネル: マイページ ----------
  async function openProfile() {
    const p = session.profile;
    const hasPw = p.has_password !== false; // OAuthだけで作ったアカウントは false
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
      <div class="ka-provbox" hidden>
        <h3 class="ka-h2">ほかのサービスでログイン</h3>
        <ul class="ka-prov"></ul>
        <p class="ka-err" data-e="prov" role="alert"></p>
      </div>
      <h3 class="ka-h2">${hasPw ? "パスワードの変更" : "パスワードを設定(あとからでもOK)"}</h3>
      ${hasPw ? "" : '<p class="ka-note">いまは、サービスでのログインだけでアカウントに入れます。パスワードを設定すると、ユーザー名とパスワードでもログインできます。</p>'}
      <form class="ka-form" data-f="pw" autocomplete="on">
        <input class="ka-sr" type="text" name="username" autocomplete="username" value="${esc(p.username)}" tabindex="-1" aria-hidden="true" readonly>
        ${hasPw ? '<label class="ka-label">いまのパスワード<input class="ka-input" name="old" type="password" autocomplete="current-password" maxlength="72" required></label>' : ""}
        <label class="ka-label">${hasPw ? "新しいパスワード" : "パスワード"}(8文字以上)<input class="ka-input" name="new" type="password" autocomplete="new-password" maxlength="72" required></label>
        <p class="ka-err" data-e="pw" role="alert"></p>
        <div class="ka-row"><button type="submit" class="ka-btn">${hasPw ? "変更する" : "設定する"}</button></div>
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

    // 連携しているサービス
    const provBox = q(".ka-provbox"), provUl = q(".ka-prov"), provErr = q('[data-e="prov"]');
    let enabled = [];
    const renderProv = () => {
      const linked = session.profile.providers || [];
      const all = Object.keys(PROVIDER_LABEL).filter((k) => enabled.includes(k) || linked.includes(k));
      provBox.hidden = !all.length;
      provUl.innerHTML = all.map((k) => linked.includes(k)
        ? `<li data-p="${k}"><span>${PROVIDER_LABEL[k]} <small>✓ 連携中</small></span><button type="button" class="ka-btn sm danger" data-unlink>解除</button></li>`
        : `<li data-p="${k}"><span>${PROVIDER_LABEL[k]}</span><button type="button" class="ka-btn sm" data-link>連携する</button></li>`).join("");
    };
    renderProv();
    oauthProviders().then((list) => { enabled = list; if (o.isConnected) renderProv(); });
    provUl.addEventListener("click", async (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const k = li.dataset.p;
      provErr.textContent = "";
      if (e.target.closest("[data-link]")) { startOAuth(k); return; }
      if (!e.target.closest("[data-unlink]")) return;
      if (!confirm(`${PROVIDER_LABEL[k]}との連携を解除しますか？\n(解除すると、${PROVIDER_LABEL[k]}ではログインできなくなります)`)) return;
      try {
        const r = await call("ka_oauth_unlink", { p_provider: k });
        if (!r || !r.ok) { provErr.textContent = OAUTH_REASONS[r && r.reason] || "解除できませんでした。"; return; }
        setSession({ token: session.token, profile: r.profile });
        toast(`${PROVIDER_LABEL[k]}との連携を解除しました`);
        renderProv();
      } catch (x) { provErr.textContent = NETERR; }
    });

    // パスワード変更
    q('[data-f="pw"]').addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = q('[data-e="pw"]'); err.textContent = ""; err.className = "ka-err";
      try {
        if (!hasPw) {
          const r = await call("ka_password_set", { p_new: e.target.new.value });
          if (!r || !r.ok) { err.textContent = REASONS[r && r.reason] || OAUTH_REASONS[r && r.reason] || "設定できませんでした。"; return; }
          setSession({ token: session.token, profile: r.profile });
          toast("パスワードを設定しました。ユーザー名とパスワードでもログインできます", 5000);
          o._close(); openProfile();
          return;
        }
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
      const pw = prompt(hasPw
        ? "アカウントを削除します。クラウドのセーブもすべて消え、元に戻せません。\n続けるには、パスワードを入力してください。"
        : `アカウントを削除します。クラウドのセーブもすべて消え、元に戻せません。\n続けるには、確認のため、ユーザー名「${p.username}」を入力してください。`);
      if (pw === null) return;
      const err = q('[data-e="acct"]'); err.textContent = "";
      try {
        const r = await call("ka_delete_account", { p_password: pw });
        if (!r || !r.ok) { err.textContent = r && r.reason === "invalid" ? (hasPw ? "パスワードが違います。" : "ユーザー名が違います。") : "削除できませんでした。"; return; }
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
      portalBtn.textContent = session ? session.profile.avatar : "👤 ログイン";
      portalBtn.classList.toggle("ka-login-pill", !session);
      portalBtn.title = session ? `${session.profile.display_name} (@${session.profile.username}) のアカウント` : "かるわかGAMESアカウントでログイン";
    }
  }
  function mountButtons() {
    if (!script) return;
    if (script.hasAttribute("data-portal")) {
      injectCss(); // ヘッダーのボタンの見た目(ログインのときは文字つき)を先に読み込む
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
  const boot = () => { mountButtons(); ready.then(() => { if (syncGame) startSync(false); handleOAuthReturn(); }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  // ---------- Supabase Auth を使うゲーム向け: かるわかGAMESアカウントでログインして、そのゲームのSupabaseセッションを得る ----------
  // 橋渡し(Edge Function ka-auth-bridge)が、かるわかGAMESアカウントに紐づいたSupabaseユーザーのセッションを発行する。
  // ゲーム側のデータ(auth.uid() で守られたテーブル)はそのまま使える。ゲームごとに別ユーザー(アプリ名 app で区別)。
  const BRIDGE_ERR = {
    KA_USED: "このかるわかGAMESアカウントは、すでにこのゲームの別のアカウントと紐づいています。",
    ALREADY_LINKED: "そのアカウントは、すでに別のかるわかGAMESアカウントに引き継がれています。",
    LOCKED: "失敗が続いたため、しばらくしてからお試しください。",
    BAD_LOGIN: "IDかパスワードが違います。",
    AUTH: "かるわかGAMESのログインの有効期限が切れました。もう一度ログインしてください。",
  };
  async function bridge(app, action, legacy) {
    const res = await fetch(`${URL_BASE}/functions/v1/ka-auth-bridge`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ action, app, ka_token: session ? session.token : null, legacy }),
    });
    let j = null;
    try { j = await res.json(); } catch (e) {}
    if (!j) throw new Error("bridge " + res.status);
    if (j.error === "AUTH" && session) setSession(null);
    return j;
  }
  async function applySupabaseSession(client, s) {
    const { error } = await client.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
    return !error;
  }
  // opts: { app, supabase(クライアント), idLabel('メールアドレス'など), toEmail(入力→メール。省略時はそのまま) }
  // 戻り値: true(ログインできた) / false(閉じた・失敗)
  async function supabaseLogin(opts) {
    const { app, supabase: client } = opts;
    const toEmail = opts.toEmail || ((s) => s);
    if (!(await requireLogin())) return false;
    let r;
    try { r = await bridge(app, "status"); } catch (e) { toast("通信に失敗しました。もう一度お試しください"); return false; }
    if (!r.ok) { toast(BRIDGE_ERR[r.error] || "ログインできませんでした"); return false; }
    if (r.linked) return applySupabaseSession(client, r.session);
    // 初めて: 新しく始めるか、以前のアカウントを引き継ぐか
    let hasSession = false;
    try { hasSession = !!(await client.auth.getSession()).data.session; } catch (e) {}
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const o = overlay(`
        <button class="ka-x" data-ka-close aria-label="閉じる">×</button>
        <h2 class="ka-h">このゲームは、はじめてですか？</h2>
        <p class="ka-sub">「${esc(r.display || (session && session.profile.display_name) || "")}」でログインしました。次のどれかを選んでください。</p>
        <div class="ka-form" data-step="choice">
          <button type="button" class="ka-btn big pri" data-pick="new"><b>🆕 はじめて遊ぶ</b><small>新しく始めます</small></button>
          ${hasSession ? `<button type="button" class="ka-btn big" data-pick="current"><b>📱 いま使っているデータを引き継ぐ</b><small>ゲストや、いまログイン中のアカウントのデータを、そのまま使います</small></button>` : ""}
          <button type="button" class="ka-btn big" data-pick="legacy"><b>🔁 以前作ったアカウントを引き継ぐ</b><small>このゲーム専用に作った${esc(opts.idLabel || "ID")}とパスワードを入れると、データをそのまま使えます</small></button>
        </div>
        <form class="ka-form" data-step="legacy" style="display:none" autocomplete="off">
          <p class="ka-help">以前このゲームで使っていた、${esc(opts.idLabel || "ID")}とパスワードです。</p>
          <label class="ka-label">${esc(opts.idLabel || "ID")}<input class="ka-input" name="lid" autocomplete="off" required></label>
          <label class="ka-label">パスワード<input class="ka-input" name="lpw" type="password" autocomplete="off" required></label>
          <div class="ka-row"><button type="button" class="ka-btn" data-pick="back">戻る</button><button type="submit" class="ka-btn pri">引き継ぐ</button></div>
        </form>
        <p class="ka-err" role="alert"></p>`, () => finish(false));
      const err = o.querySelector(".ka-err");
      const choice = o.querySelector('[data-step="choice"]'), legacyForm = o.querySelector('[data-step="legacy"]');
      const run = async (action, legacy) => {
        err.textContent = "";
        o.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        let res;
        try { res = await bridge(app, action, legacy); } catch (e) { res = { ok: false, error: "NET" }; }
        o.querySelectorAll("button").forEach((b) => { b.disabled = false; });
        if (!res.ok) { err.textContent = BRIDGE_ERR[res.error] || NETERR; return; }
        if (!(await applySupabaseSession(client, res.session))) { err.textContent = "ログインに失敗しました。もう一度お試しください。"; return; }
        finish(true); o._close();
      };
      o.addEventListener("click", (e) => {
        const b = e.target.closest("[data-pick]");
        if (!b) return;
        const p = b.dataset.pick;
        if (p === "new") run("create");
        else if (p === "legacy") { choice.style.display = "none"; legacyForm.style.display = ""; legacyForm.lid.focus(); }
        else if (p === "back") { legacyForm.style.display = "none"; choice.style.display = ""; err.textContent = ""; }
        else if (p === "current") {
          client.auth.getSession().then(({ data }) => { if (data.session) run("link", { jwt: data.session.access_token }); });
        }
      });
      legacyForm.addEventListener("submit", (e) => { e.preventDefault(); run("link", { email: toEmail(legacyForm.lid.value.trim()), password: legacyForm.lpw.value }); });
    });
  }
  // かるわかGAMESにログイン済み(ほかのゲームで)で、このゲームのSupabaseセッションがなければ、紐づけ済みの場合だけ自動でログインする
  async function supabaseAuto(opts) {
    try {
      await ready;
      if (!session) return false;
      if ((await opts.supabase.auth.getSession()).data.session) return false;
      const r = await bridge(opts.app, "status");
      return !!(r.ok && r.linked && (await applySupabaseSession(opts.supabase, r.session)));
    } catch (e) { return false; }
  }
  function requireLogin(tab) {
    return new Promise((resolve) => {
      if (session) { resolve(session.profile); return; }
      const off = (() => { const f = (p) => { if (p) { listeners.delete(f); resolve(p); } }; listeners.add(f); return () => listeners.delete(f); })();
      openAuth(tab === "register" ? "register" : "login", () => { off(); resolve(session ? session.profile : null); });
    });
  }

  window.KaAccount = {
    supabaseLogin,
    supabaseAuto,
    ready,
    user: () => (session ? session.profile : null),
    isLoggedIn: () => !!session,
    onChange: (f) => { listeners.add(f); return () => listeners.delete(f); },
    openPanel,
    login: (tab) => openAuth(tab === "register" ? "register" : "login"),
    // ログアウト(サーバーのセッションも消す)
    logout: async () => { try { await call("ka_logout", {}); } catch (e) {} setSession(null); },
    // ログイン中のトークン。ゲーム自身のサーバー(RPCやSocket.io)に渡して、サーバー側で ka_whoami で確かめてもらう用
    token: () => (session ? session.token : null),
    // ログインしていなければログイン画面を出し、ログインできたら(閉じたらnull)プロフィールを返す
    requireLogin,
    // ゲーム側から「いまセーブした」と知らせると、すぐクラウドへ(省略しても20秒ごとに自動で保存される)
    saveNow: () => pushNow(false),
    status: () => syncStatus,
    // テスト・上級者向け: アカウントAPIをそのまま呼ぶ
    _call: call,
  };
})();
