// ===== 記事 =====
// - 誰でも公開された記事を読める。書けるのは管理者だけ。
// - 管理者ログイン: キーボードで「admin」と入力 → パスワードを入力。
//   パスワードはサーバー(Supabase)側でbcryptのハッシュと照合する。このファイルにも、リポジトリのどこにも、
//   パスワードは入っていない。ログインすると30日有効のトークンがこの端末に保存される。
// - 管理者は「👥 管理者の管理」から、新しい管理者を追加できる(パスワードは自動生成も可能)。
// - 本文はMarkdownの一部(見出し・太字・斜体・リンク・画像・リスト・引用・コード・水平線)に対応。
//   HTMLは必ずエスケープするので、本文にタグを書いても動かない。
// js/main.js より前に読み込む(render() から renderArticlesView() が呼ばれる)。
const Articles = (() => {
  const SUPABASE_URL = "https://kifnzvktwbomxthzvvgy.supabase.co";
  // 同プロジェクトで他のゲームも使っている従来形式(JWT)のanon key(公開しても問題ないキー)
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE";
  const SESSION_KEY = "gl_admin_session";
  const ADMIN_TRIGGER = "admin";

  let client = null;
  function sb() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    // 全ゲーム共通オリジンの認証セッションを拾わないよう、認証状態を持たせない
    client = window.supabase.createClient(SUPABASE_URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return client;
  }

  // ---------- 状態 ----------
  let admin = null;           // { token, name } ログイン中の管理者
  let list = [];              // 表示用の記事(管理者なら下書きも)
  let loaded = false;
  let loadError = false;
  let loading = false;
  let counts = {};            // 記事ID → コメント数

  function readSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s && s.token && s.name ? s : null;
    } catch (e) { return null; }
  }
  function writeSession(s) {
    // 他の画面(イベント)にログイン状態の変化を知らせる
    setTimeout(() => document.dispatchEvent(new CustomEvent("gl-admin-change")), 0);
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }
  const toast = (msg) => { if (typeof GameExtras !== "undefined") GameExtras.showToast(msg); };

  // ---------- 安全なMarkdown変換 ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function inline(raw) {
    let s = esc(raw);
    const codes = [];
    s = s.replace(/`([^`\n]+)`/g, (m, c) => { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    s = s.replace(/!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)/g, (m, alt, url) => `<img src="${url}" alt="${alt}" loading="lazy">`);
    s = s.replace(/\[\[game:([a-z0-9-]+)\]\]/g, (m, id) => {
      const g = typeof GAMES !== "undefined" ? GAMES.find((x) => x.id === id) : null;
      return g ? `<a href="#" class="ar-gamelink" data-game="${id}">${esc(g.emoji)} ${esc(g.title)}</a>` : m;
    });
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, t, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codes[i]}</code>`);
  }
  function renderMarkdown(src) {
    const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
    let html = "", para = [], list = null, quote = [], inCode = false, code = [];
    const flushPara = () => { if (para.length) { html += "<p>" + para.map(inline).join("<br>") + "</p>"; para = []; } };
    const flushList = () => { if (list) { html += `</${list}>`; list = null; } };
    const flushQuote = () => { if (quote.length) { html += "<blockquote>" + quote.map(inline).join("<br>") + "</blockquote>"; quote = []; } };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };
    for (const line of lines) {
      if (/^```/.test(line)) {
        if (inCode) { html += `<pre><code>${esc(code.join("\n"))}</code></pre>`; code = []; inCode = false; }
        else { flushAll(); inCode = true; }
        continue;
      }
      if (inCode) { code.push(line); continue; }
      if (/^\s*$/.test(line)) { flushAll(); continue; }
      let m;
      if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushAll(); const lv = m[1].length + 1; html += `<h${lv}>${inline(m[2])}</h${lv}>`; }
      else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { flushAll(); html += "<hr>"; }
      else if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); }
      else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (list !== "ul") { flushList(); html += "<ul>"; list = "ul"; }
        html += `<li>${inline(m[1])}</li>`;
      } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (list !== "ol") { flushList(); html += "<ol>"; list = "ol"; }
        html += `<li>${inline(m[1])}</li>`;
      } else { flushList(); flushQuote(); para.push(line); }
    }
    if (inCode) html += `<pre><code>${esc(code.join("\n"))}</code></pre>`;
    flushAll();
    return html;
  }
  function plainSummary(a) {
    if (a.summary) return a.summary;
    return String(a.body || "").replace(/```[\s\S]*?```/g, "").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*`~_\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 110);
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  // ---------- 読み込み ----------
  async function load() {
    if (loading) return;
    loading = true;
    loadError = false;
    try {
      const c = sb();
      if (!c) throw new Error("no client");
      if (admin) {
        const { data, error } = await c.rpc("gl_articles_admin_list", { p_token: admin.token });
        if (error) throw error;
        if (data && data.ok) list = data.articles || [];
        else { expireSession(); loading = false; return load(); }
      } else {
        const { data, error } = await c
          .from("gl_articles")
          .select("id,title,summary,body,author_name,published,published_at,created_at,updated_at")
          .eq("published", true)
          .order("published_at", { ascending: false });
        if (error) throw error;
        list = data || [];
      }
      loaded = true;
      try {
        const r = await c.rpc("gl_comment_counts");
        counts = (r && r.data) || {};
      } catch (e2) { counts = {}; }
    } catch (e) {
      loadError = true;
    } finally {
      loading = false;
    }
    updateTab();
    if (typeof currentView !== "undefined" && currentView === "articles") renderArticlesView();
    openFromUrl();
  }

  function expireSession() {
    admin = null;
    writeSession(null);
    toast("ログインの有効期限が切れました。もう一度ログインしてください");
  }

  function updateTab() {
    const el = document.getElementById("tabArticlesCount");
    if (el) el.textContent = list.filter((a) => a.published !== false).length;
  }

  // ---------- 一覧(記事タブ) ----------
  function renderArticlesView() {
    const wrap = document.getElementById("articleList");
    const bar = document.getElementById("articleAdmin");
    if (!wrap || !bar) return;
    wrap.hidden = false;
    // 管理者バー
    if (admin) {
      bar.hidden = false;
      bar.innerHTML = `
        <span class="ad-who">🔓 ログイン中: <b>${esc(admin.name)}</b></span>
        <button type="button" class="ad-btn primary" data-ad="new">✏️ 新しい記事を書く</button>
        <button type="button" class="ad-btn" data-ad="admins">👥 管理者の管理</button>
        <button type="button" class="ad-btn" data-ad="logout">ログアウト</button>`;
    } else {
      bar.hidden = true;
      bar.innerHTML = "";
    }
    const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const items = list.filter((a) => !q || a.title.toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q) || (a.body || "").toLowerCase().includes(q));
    if (!loaded && !loadError) { wrap.innerHTML = `<p class="ar-empty">読み込み中…</p>`; return; }
    if (loadError) { wrap.innerHTML = `<p class="ar-empty">記事を読み込めませんでした。通信環境を確認して、<button type="button" class="empty-switch" data-ad="reload">もう一度読み込む</button></p>`; return; }
    if (!items.length) {
      wrap.innerHTML = `<p class="ar-empty">${list.length ? "該当する記事がありません。" : "まだ記事はありません。"}</p>`;
      return;
    }
    wrap.innerHTML = items.map((a) => `
      <article class="ar-card${a.published === false ? " is-draft" : ""}" data-id="${esc(a.id)}" tabindex="0" role="button" aria-label="${esc(a.title)} を読む">
        <h3 class="ar-card-title">${esc(a.title)}${a.published === false ? ` <span class="ar-draft">下書き</span>` : ""}</h3>
        <p class="ar-card-meta">${fmtDate(a.published_at || a.created_at)} ・ ${esc(a.author_name)}${counts[a.id] ? ` ・ 💬 ${counts[a.id]}` : ""}</p>
        <p class="ar-card-summary">${esc(plainSummary(a))}</p>
      </article>`).join("");
  }
  function hideArticlesView() {
    const wrap = document.getElementById("articleList");
    const bar = document.getElementById("articleAdmin");
    if (wrap) wrap.hidden = true;
    if (bar) bar.hidden = true;
  }

  // ---------- モーダル共通 ----------
  function openModal(cls, html) {
    const m = document.createElement("div");
    m.className = "rp-modal ar-modal open " + cls;
    m.innerHTML = `<div class="rp-backdrop" data-ar-close></div>${html}`;
    document.body.appendChild(m);
    document.body.style.overflow = "hidden";
    return m;
  }
  function closeModal(m) {
    if (!m || !m.isConnected) return;
    if (m._beforeClose && m._beforeClose() === false) return;
    m.remove();
    if (!document.querySelector(".ar-modal")) document.body.style.overflow = "";
  }
  function topModal() {
    const all = document.querySelectorAll(".ar-modal");
    return all[all.length - 1] || null;
  }

  // ---------- 記事を読む ----------
  function articleUrl(id) {
    return location.origin + location.pathname + "?article=" + encodeURIComponent(id);
  }
  function openArticle(id) {
    const a = list.find((x) => x.id === id);
    if (!a) return;
    const m = openModal("ar-reader", `
      <div class="rp-dialog ar-dialog" role="dialog" aria-modal="true" aria-label="記事">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <article>
          <p class="ar-kicker">📝 記事${a.published === false ? ` <span class="ar-draft">下書き</span>` : ""}</p>
          <h2 class="ar-h1">${esc(a.title)}</h2>
          <p class="ar-meta">${fmtDate(a.published_at || a.created_at)} ・ ${esc(a.author_name)}${a.updated_at && fmtDate(a.updated_at) !== fmtDate(a.published_at || a.created_at) ? ` ・ 更新 ${fmtDate(a.updated_at)}` : ""}</p>
          <div class="ar-body">${renderMarkdown(a.body)}</div>
        </article>
        ${a.published === false ? "" : `<section class="cm" aria-label="コメント">
          <h3 class="cm-h">💬 コメント <span class="cm-count"></span></h3>
          <ul class="cm-list"><li class="cm-empty">読み込み中…</li></ul>
          <form class="cm-form" autocomplete="off">
            <input class="ad-input" name="cname" maxlength="20" placeholder="名前(ニックネーム)" ${admin ? `value="${esc(admin.name)}" readonly` : ""} required>
            <textarea class="ad-input" name="cbody" rows="3" maxlength="500" placeholder="コメントを書く(500字まで)" required></textarea>
            <p class="ad-error" role="alert"></p>
            <div class="cm-row"><small class="cm-len">0 / 500</small><button type="submit" class="ad-btn primary">コメントする</button></div>
          </form>
        </section>`}
        <div class="ar-actions">
          <button type="button" class="ad-btn" data-ar-share>🔗 リンクをコピー</button>
          ${admin ? `<button type="button" class="ad-btn primary" data-ar-edit>✏️ 編集</button><button type="button" class="ad-btn danger" data-ar-delete>🗑 削除</button>` : ""}
        </div>
      </div>`);
    if (a.published !== false) initComments(m, a);
    m.addEventListener("click", async (e) => {
      if (e.target.hasAttribute("data-ar-close")) { closeModal(m); return; }
      const g = e.target.closest(".ar-gamelink");
      if (g) { e.preventDefault(); closeModal(m); if (typeof openDetail === "function") openDetail(g.dataset.game); return; }
      if (e.target.closest("[data-ar-share]")) {
        try { await navigator.clipboard.writeText(articleUrl(a.id)); toast("リンクをコピーしました"); }
        catch (err) { toast(articleUrl(a.id)); }
      } else if (e.target.closest("[data-ar-edit]")) {
        closeModal(m); openEditor(a);
      } else if (e.target.closest("[data-ar-delete]")) {
        if (!confirm(`「${a.title}」を削除しますか？\n(元に戻せません)`)) return;
        const r = await callRpc("gl_article_delete", { p_id: a.id });
        if (r && r.ok) { toast("記事を削除しました"); closeModal(m); await load(); }
      }
    });
  }
  // ---------- コメント ----------
  const NAME_KEY = "gl_comment_name", CID_KEY = "gl_client_id";
  function clientId() {
    try {
      let v = localStorage.getItem(CID_KEY);
      if (!v || v.length < 16) {
        v = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, "0")).join("");
        localStorage.setItem(CID_KEY, v);
      }
      return v;
    } catch (e) { return "anon-" + Math.random().toString(16).slice(2) + Date.now().toString(16); }
  }
  function fmtDateTime(iso) {
    const d = new Date(iso);
    const p2 = (n) => String(n).padStart(2, "0");
    return isNaN(d) ? "" : (d.getMonth() + 1) + "/" + d.getDate() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes());
  }
  const CM_ERR = {
    rate: "短い間にコメントしすぎです。少し待ってからもう一度どうぞ。",
    busy: "いまコメントが集中しています。しばらくしてからお試しください。",
    dup: "同じ内容のコメントがすでにあります。",
    name: "名前は1〜20字で入れてください。",
    body: "コメントは1〜500字で入れてください。",
    notfound: "この記事は見つかりません。",
    client: "投稿できませんでした。ページを読み込み直してください。",
  };
  function initComments(m, a) {
    const listEl = m.querySelector(".cm-list");
    const form = m.querySelector(".cm-form");
    if (!listEl || !form) return;
    const err = form.querySelector(".ad-error");
    const len = form.querySelector(".cm-len");
    try { if (!admin) form.cname.value = localStorage.getItem(NAME_KEY) || ""; } catch (e) {}
    form.cbody.addEventListener("input", () => { len.textContent = form.cbody.value.length + " / 500"; });

    async function loadComments() {
      const c = sb();
      let rows = null;
      try {
        const r = c ? await c.from("gl_comments").select("id,name,body,is_admin,created_at").eq("article_id", a.id).order("created_at", { ascending: true }) : null;
        rows = r && !r.error ? r.data : null;
      } catch (e) {}
      if (!m.isConnected) return;
      if (!rows) { listEl.innerHTML = '<li class="cm-empty">コメントを読み込めませんでした。</li>'; return; }
      counts[a.id] = rows.length;
      if (typeof currentView !== "undefined" && currentView === "articles") renderArticlesView(); // 一覧の💬の数も更新
      m.querySelector(".cm-count").textContent = rows.length ? "(" + rows.length + ")" : "";
      listEl.innerHTML = rows.length ? rows.map((r) => '<li class="cm-item" data-id="' + esc(r.id) + '">'
        + '<p class="cm-meta"><b class="cm-name">' + esc(r.name) + '</b>' + (r.is_admin ? ' <span class="cm-admin">管理者</span>' : '')
        + ' <time>' + fmtDateTime(r.created_at) + '</time>'
        + (admin ? ' <button type="button" class="ad-btn small danger" data-cm-del aria-label="このコメントを削除">削除</button>' : '') + '</p>'
        + '<p class="cm-body">' + esc(r.body).replace(/\n/g, "<br>") + '</p></li>').join("")
        : '<li class="cm-empty">まだコメントはありません。最初のコメントをどうぞ。</li>';
    }
    loadComments();

    listEl.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-cm-del]");
      if (!b) return;
      if (!confirm("このコメントを削除しますか？(元に戻せません)")) return;
      const r = await callRpc("gl_comment_delete", { p_id: b.closest(".cm-item").dataset.id });
      if (r && r.ok) { toast("コメントを削除しました"); loadComments(); }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      const c = sb();
      const { data, error } = c
        ? await c.rpc("gl_comment_add", { p_article: a.id, p_name: form.cname.value, p_body: form.cbody.value, p_client: clientId(), p_token: admin ? admin.token : null })
        : { error: true };
      btn.disabled = false;
      if (error || !data) { err.textContent = "通信に失敗しました。もう一度お試しください。"; return; }
      if (!data.ok) { err.textContent = CM_ERR[data.reason] || "投稿できませんでした。"; return; }
      try { if (!admin) localStorage.setItem(NAME_KEY, form.cname.value.trim()); } catch (e2) {}
      form.cbody.value = ""; len.textContent = "0 / 500";
      toast("コメントしました");
      loadComments();
    });
  }

  function openFromUrl() {
    let id = null;
    try { id = new URLSearchParams(location.search).get("article"); } catch (e) {}
    if (!id || openFromUrl.done || !loaded) return;
    const a = list.find((x) => x.id === id);
    openFromUrl.done = true;
    if (a) {
      if (typeof setView === "function" && currentView !== "articles") setView("articles");
      openArticle(id);
    }
  }

  // ---------- 管理者ログイン ----------
  async function callRpc(fn, args) {
    const c = sb();
    if (!c) { toast("通信できませんでした"); return null; }
    const { data, error } = await c.rpc(fn, Object.assign({ p_token: admin ? admin.token : null }, args || {}));
    if (error) { toast("通信に失敗しました。もう一度お試しください"); return null; }
    if (data && data.ok === false && data.reason === "auth") {
      expireSession();
      renderArticlesView();
      return null;
    }
    return data;
  }

  function openLogin() {
    if (admin) { toast(`ログイン中です(${admin.name})`); if (typeof setView === "function") setView("articles"); return; }
    if (document.querySelector(".ad-login")) return;
    const m = openModal("ad-login", `
      <div class="rp-dialog ar-dialog ad-dialog" role="dialog" aria-modal="true" aria-label="管理者ログイン">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">🔐 管理者ログイン</p>
        <form class="ad-form" autocomplete="on">
          <!-- パスワードマネージャーが保存・入力しやすいよう、見えないユーザー名欄を置く -->
          <input class="sr-only" type="text" name="username" autocomplete="username" value="かるわか GAMES 管理者" tabindex="-1" aria-hidden="true" readonly>
          <label class="ad-label">パスワード
            <input class="ad-input" type="password" name="password" autocomplete="current-password" required autofocus>
          </label>
          <p class="ad-error" role="alert"></p>
          <div class="ad-row"><button type="submit" class="ad-btn primary">ログイン</button><button type="button" class="ad-btn" data-ar-close>キャンセル</button></div>
        </form>
      </div>`);
    const form = m.querySelector("form");
    const input = form.password;
    const err = m.querySelector(".ad-error");
    setTimeout(() => input.focus(), 50);
    m.addEventListener("click", (e) => { if (e.target.hasAttribute("data-ar-close")) closeModal(m); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; err.textContent = "";
      const c = sb();
      const { data, error } = c ? await c.rpc("gl_admin_login", { p_password: input.value }) : { error: true };
      btn.disabled = false;
      if (error || !data) { err.textContent = "通信に失敗しました。もう一度お試しください。"; return; }
      if (!data.ok) {
        err.textContent = data.reason === "locked" ? "失敗が続いたため、しばらくしてからもう一度お試しください。" : "パスワードが違います。";
        input.select();
        return;
      }
      admin = { token: data.token, name: data.name };
      writeSession(admin);
      closeModal(m); // フォームをDOMから消す(パスワードマネージャーが保存を提案しやすくなる)
      toast(`ログインしました(${admin.name})`);
      loaded = false; list = [];
      if (typeof setView === "function") setView("articles");
      await load();
      renderArticlesView();
    });
  }

  async function logout() {
    const c = sb();
    if (c && admin) { try { await c.rpc("gl_admin_logout", { p_token: admin.token }); } catch (e) {} }
    admin = null;
    writeSession(null);
    toast("ログアウトしました");
    loaded = false; list = [];
    await load();
    renderArticlesView();
  }

  // ---------- 記事を書く ----------
  function openEditor(article) {
    const isNew = !article;
    const a = article || { id: null, title: "", summary: "", body: "", published: false };
    const tools = [
      ["見出し", "## ", "", "見出し"], ["太字", "**", "**", "太字"], ["斜体", "*", "*", "斜体"], ["リンク", "[", "](https://)", "リンクの文字"],
      ["画像", "![", "](https://)", "説明"], ["リスト", "- ", "", "項目"], ["引用", "> ", "", "引用"], ["コード", "`", "`", "コード"], ["ゲーム", "[[game:", "]]", "ゲームのid"],
    ];
    const m = openModal("ar-editor", `
      <div class="rp-dialog ar-dialog ed-dialog" role="dialog" aria-modal="true" aria-label="記事を書く">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">${isNew ? "✏️ 新しい記事" : "✏️ 記事を編集"}</p>
        <div class="ed-grid">
          <div class="ed-col">
            <label class="ad-label">タイトル(100文字まで)<input class="ad-input" id="edTitle" maxlength="100" value="${esc(a.title)}" placeholder="タイトル"></label>
            <label class="ad-label">要約(任意・200文字まで。空なら本文の先頭から自動)<input class="ad-input" id="edSummary" maxlength="200" value="${esc(a.summary)}"></label>
            <div class="ed-tools" role="toolbar" aria-label="書式">
              ${tools.map((t, i) => `<button type="button" class="ed-tool" data-tool="${i}" title="${t[0]}">${t[0]}</button>`).join("")}
            </div>
            <textarea class="ad-input ed-body" id="edBody" maxlength="60000" placeholder="本文(Markdownで書けます)&#10;&#10;## 見出し&#10;**太字**  *斜体*  [リンク](https://…)&#10;- 箇条書き&#10;[[game:smash-room]] でゲームへのリンク">${esc(a.body)}</textarea>
          </div>
          <div class="ed-col ed-preview-col">
            <p class="ed-preview-label">プレビュー</p>
            <div class="ar-body ed-preview" id="edPreview"></div>
          </div>
        </div>
        <p class="ad-error" id="edError" role="alert"></p>
        <div class="ed-foot">
          <label class="ed-pub"><input type="checkbox" id="edPublished" ${a.published ? "checked" : ""}> 公開する <small>(外すと下書き。管理者だけが見られる)</small></label>
          <div class="ad-row">
            ${isNew ? "" : `<button type="button" class="ad-btn danger" id="edDelete">🗑 削除</button>`}
            <button type="button" class="ad-btn" data-ar-close>キャンセル</button>
            <button type="button" class="ad-btn primary" id="edSave">保存</button>
          </div>
        </div>
      </div>`);
    const $ = (id) => m.querySelector("#" + id);
    const body = $("edBody"), title = $("edTitle");
    const initial = JSON.stringify([a.title, a.summary, a.body, !!a.published]);
    const state = () => JSON.stringify([title.value, $("edSummary").value, body.value, $("edPublished").checked]);
    const preview = () => { $("edPreview").innerHTML = body.value.trim() ? renderMarkdown(body.value) : `<p class="ar-empty">ここに本文のプレビューが出ます</p>`; };
    preview();
    body.addEventListener("input", preview);
    m._beforeClose = () => (state() === initial || confirm("保存していない変更があります。閉じますか？"));
    m.addEventListener("click", async (e) => {
      if (e.target.hasAttribute("data-ar-close")) { closeModal(m); return; }
      const tool = e.target.closest("[data-tool]");
      if (tool) {
        const [, pre, post, ph] = tools[Number(tool.dataset.tool)];
        const s = body.selectionStart, en = body.selectionEnd;
        const sel = body.value.slice(s, en) || ph;
        body.setRangeText(pre + sel + post, s, en, "select");
        body.focus();
        body.setSelectionRange(s + pre.length, s + pre.length + sel.length);
        preview();
        return;
      }
      if (e.target.closest("#edSave")) {
        const btn = $("edSave");
        const willPublish = $("edPublished").checked;
        $("edError").textContent = "";
        if (!title.value.trim()) { $("edError").textContent = "タイトルを入力してください。"; title.focus(); return; }
        btn.disabled = true; btn.textContent = "保存中…";
        const r = await callRpc("gl_article_save", {
          p_id: a.id, p_title: title.value, p_summary: $("edSummary").value, p_body: body.value, p_published: $("edPublished").checked,
        });
        btn.disabled = false; btn.textContent = "保存";
        if (!r) return;
        if (!r.ok) { $("edError").textContent = ({ title: "タイトルは1〜100文字にしてください。", body: "本文が長すぎます(6万文字まで)。", notfound: "この記事は見つかりません(削除された可能性があります)。" })[r.reason] || "保存できませんでした。"; return; }
        m._beforeClose = null;
        closeModal(m);
        toast(willPublish ? "公開しました" : "下書きとして保存しました");
        await load();
      } else if (e.target.closest("#edDelete")) {
        if (!confirm(`「${a.title}」を削除しますか？\n(元に戻せません)`)) return;
        const r = await callRpc("gl_article_delete", { p_id: a.id });
        if (r && r.ok) { m._beforeClose = null; closeModal(m); toast("記事を削除しました"); await load(); }
      }
    });
    setTimeout(() => (isNew ? title : body).focus(), 50);
  }

  // ---------- 管理者の管理 ----------
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // 紛らわしい文字(0/O,1/l/I)を除く
  function randomPassword(len = 14) {
    const a = new Uint32Array(len);
    crypto.getRandomValues(a);
    return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join("");
  }
  const ADMIN_ERR = {
    name: "名前は1〜30文字にしてください。", name_taken: "その名前の管理者は、すでにいます。",
    password_length: "パスワードは8文字以上にしてください。", password_taken: "そのパスワードは他の管理者が使っています(別のものにしてください)。",
    self: "自分自身は削除できません。", notfound: "管理者が見つかりません。",
  };
  async function openAdminManager() {
    if (!admin) return;
    const m = openModal("ar-admins", `
      <div class="rp-dialog ar-dialog ad-dialog" role="dialog" aria-modal="true" aria-label="管理者の管理">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">👥 管理者の管理</p>
        <ul class="ad-list" id="adList"><li>読み込み中…</li></ul>
        <h3 class="ad-h">管理者を追加する</h3>
        <p class="ad-note">追加した人は、サイトを開いてキーボードで「admin」と入力し、渡されたパスワードでログインできます。</p>
        <form class="ad-form" id="adAddForm" autocomplete="off">
          <label class="ad-label">名前(記事の著者として表示されます)<input class="ad-input" name="name" maxlength="30" required></label>
          <label class="ad-label">パスワード(8文字以上)
            <span class="ad-pw-row"><input class="ad-input" name="password" type="text" minlength="8" maxlength="100" required autocomplete="off" spellcheck="false"><button type="button" class="ad-btn" id="adGen">🎲 自動生成</button></span>
          </label>
          <p class="ad-error" id="adAddMsg" role="alert"></p>
          <button type="submit" class="ad-btn primary">管理者を追加</button>
        </form>
        <h3 class="ad-h">自分のパスワードを変更する</h3>
        <form class="ad-form" id="adPwForm" autocomplete="on">
          <input class="sr-only" type="text" name="username" autocomplete="username" value="かるわか GAMES 管理者" tabindex="-1" aria-hidden="true" readonly>
          <label class="ad-label">新しいパスワード(8文字以上)<input class="ad-input" name="password" type="password" minlength="8" maxlength="100" required autocomplete="new-password"></label>
          <p class="ad-error" id="adPwMsg" role="alert"></p>
          <button type="submit" class="ad-btn">変更する</button>
        </form>
      </div>`);
    const listEl = m.querySelector("#adList");
    async function refreshList() {
      const r = await callRpc("gl_admin_list");
      if (!r) { closeModal(m); return; }
      listEl.innerHTML = (r.admins || []).map((a) => `
        <li class="ad-item"><span><b>${esc(a.name)}</b>${a.you ? ` <span class="ad-you">あなた</span>` : ""} <small>${fmtDate(a.created_at)} に追加</small></span>
        ${a.you ? "" : `<button type="button" class="ad-btn danger small" data-rm="${esc(a.name)}">削除</button>`}</li>`).join("");
    }
    refreshList();
    m.addEventListener("click", async (e) => {
      if (e.target.hasAttribute("data-ar-close")) { closeModal(m); return; }
      if (e.target.closest("#adGen")) { m.querySelector("#adAddForm").password.value = randomPassword(); return; }
      const rm = e.target.closest("[data-rm]");
      if (rm) {
        if (!confirm(`管理者「${rm.dataset.rm}」を削除しますか？\n(この人はログインできなくなります。書いた記事は残ります)`)) return;
        const r = await callRpc("gl_admin_remove", { p_name: rm.dataset.rm });
        if (r && r.ok) { toast("管理者を削除しました"); refreshList(); }
        else if (r) toast(ADMIN_ERR[r.reason] || "削除できませんでした");
      }
    });
    m.querySelector("#adAddForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = m.querySelector("#adAddMsg");
      msg.className = "ad-error"; msg.textContent = "";
      const pw = f.password.value;
      const r = await callRpc("gl_admin_add", { p_name: f.name.value, p_password: pw });
      if (!r) return;
      if (!r.ok) { msg.textContent = ADMIN_ERR[r.reason] || "追加できませんでした。"; return; }
      msg.className = "ad-ok";
      msg.innerHTML = `追加しました。名前: <b>${esc(r.name)}</b> / パスワード: <code>${esc(pw)}</code> <button type="button" class="ad-btn small" id="adCopy">コピー</button><br><small>パスワードはこの画面でしか見られません。本人に渡してください。</small>`;
      msg.querySelector("#adCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(pw); toast("パスワードをコピーしました"); } catch (err) {} });
      f.reset();
      refreshList();
    });
    m.querySelector("#adPwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = m.querySelector("#adPwMsg");
      msg.className = "ad-error"; msg.textContent = "";
      const r = await callRpc("gl_admin_set_password", { p_password: f.password.value });
      if (!r) return;
      if (!r.ok) { msg.textContent = ADMIN_ERR[r.reason] || "変更できませんでした。"; return; }
      msg.className = "ad-ok"; msg.textContent = "パスワードを変更しました。";
      f.reset();
    });
  }

  // ---------- イベント ----------
  function init() {
    admin = readSession();
    const list0 = document.getElementById("articleList");
    const bar = document.getElementById("articleAdmin");
    if (list0) {
      list0.addEventListener("click", (e) => {
        const card = e.target.closest(".ar-card");
        if (card) { openArticle(card.dataset.id); return; }
        if (e.target.closest("[data-ad=reload]")) load();
      });
      list0.addEventListener("keydown", (e) => {
        const card = e.target.closest && e.target.closest(".ar-card");
        if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openArticle(card.dataset.id); }
      });
    }
    if (bar) {
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-ad]");
        if (!b) return;
        if (b.dataset.ad === "new") openEditor(null);
        else if (b.dataset.ad === "admins") openAdminManager();
        else if (b.dataset.ad === "logout") logout();
      });
    }
    // 外のどこかを押して閉じる/Escで閉じる
    document.addEventListener("click", (e) => {
      const m = e.target.closest && e.target.closest(".ar-modal");
      if (m && e.target.hasAttribute("data-ar-close")) closeModal(m);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const m = topModal();
        if (m) { e.stopPropagation(); closeModal(m); }
      }
    }, true);

    // キーボードで「admin」と入力するとログイン画面(入力欄に打っているときは無視)
    let buf = "";
    document.addEventListener("keydown", (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-ADMIN_TRIGGER.length);
      if (buf === ADMIN_TRIGGER) { buf = ""; openLogin(); }
    });
    // キーボードが無いスマホ向け: フッターの「作者」の行を長押し
    const authorLine = [...document.querySelectorAll(".site-footer .footer-hint")].find((p) => /作者/.test(p.textContent));
    if (authorLine) {
      let timer = null;
      const cancel = () => { clearTimeout(timer); timer = null; };
      authorLine.addEventListener("pointerdown", () => { cancel(); timer = setTimeout(() => { timer = null; openLogin(); }, 1200); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => authorLine.addEventListener(ev, cancel));
    }

    // ログイン状態を確認してから記事を読み込む(期限切れならログアウト扱い)
    (async () => {
      if (admin) {
        const c = sb();
        try {
          const { data } = c ? await c.rpc("gl_admin_whoami", { p_token: admin.token }) : {};
          if (!data || !data.ok) { admin = null; writeSession(null); }
          else admin.name = data.name;
        } catch (e) { /* 通信エラー時はそのまま試す */ }
      }
      load();
    })();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return {
    renderMarkdown, openLogin, renderView: renderArticlesView, hideView: hideArticlesView,
    state: () => ({ admin: !!admin, name: admin && admin.name, count: list.length }),
    // イベントタブなど、他の機能がログイン状態と共通部品を使うための口
    api: { getAdmin: () => admin, callRpc, openModal, closeModal, esc, toast, openAdminManager, logout },
  };
})();

// main.js の render() から呼ばれる入口
function renderArticlesView() { Articles.renderView(); }
function hideArticlesView() { Articles.hideView(); }
