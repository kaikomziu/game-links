// ===== イベント =====
// - 「夏のホラー特集」「ハロウィン」のように、季節やテーマごとにゲームをまとめて見せるタブ。
// - 中身は、すでにサイトにあるゲーム({game:"id"})か、イベント限定のゲーム({title,emoji,url,desc})。
// - 期間(月-日)が決まっているイベントは、その期間中だけ「開催中」になって上に出る(年をまたぐ期間もOK)。
// - 管理者(記事と同じログイン)だけが、追加・編集・削除・並べ替えができる。保存はサーバー側で管理者かどうか確認される。
// js/articles.js の後、js/main.js より前に読み込む。
const EventsTab = (() => {
  const SUPABASE_URL = "https://kifnzvktwbomxthzvvgy.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE";

  let client = null;
  function sb() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return client;
  }

  let events = [];     // 表示用(管理者なら下書きも)
  let loaded = false;
  let loadError = false;
  let loading = false;

  const A = () => Articles.api;                 // 記事側の共通部品(ログイン状態など)
  const admin = () => A().getAdmin();
  const esc = (s) => A().esc(s);
  const toast = (m) => A().toast(m);

  // ---------- 期間 ----------
  const md = (s) => { const m = /^(\d\d)-(\d\d)$/.exec(s || ""); return m ? Number(m[1]) * 100 + Number(m[2]) : 0; };
  function isActive(e, now = new Date()) {
    const s = md(e.start_md), t = md(e.end_md);
    if (!s || !t) return false;
    const cur = (now.getMonth() + 1) * 100 + now.getDate();
    return s <= t ? cur >= s && cur <= t : cur >= s || cur <= t; // 12-20〜01-05 のような年またぎ
  }
  function periodText(e) {
    const s = md(e.start_md), t = md(e.end_md);
    if (!s || !t) return "いつでも";
    const f = (v) => `${Math.floor(v / 100)}/${v % 100}`;
    return `${f(s)} 〜 ${f(t)}`;
  }
  function ordered(list) {
    return [...list].sort((a, b) => {
      const aa = isActive(a) ? 0 : 1, bb = isActive(b) ? 0 : 1;
      if (aa !== bb) return aa - bb;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return String(a.created_at).localeCompare(String(b.created_at));
    });
  }

  // ---------- 読み込み ----------
  async function load() {
    if (loading) return;
    loading = true;
    loadError = false;
    try {
      const c = sb();
      if (!c) throw new Error("no client");
      if (admin()) {
        const { data, error } = await c.rpc("gl_events_admin_list", { p_token: admin().token });
        if (error) throw error;
        if (data && data.ok) events = data.events || [];
        else events = await loadPublic(c); // 期限切れ(記事側が通知する)
      } else {
        events = await loadPublic(c);
      }
      loaded = true;
    } catch (e) {
      loadError = true;
    } finally {
      loading = false;
    }
    updateTab();
    if (typeof currentView !== "undefined" && currentView === "events") renderEventsView();
  }
  async function loadPublic(c) {
    const { data, error } = await c
      .from("gl_events")
      .select("id,title,emoji,description,start_md,end_md,sort_order,items,published,author_name,created_at,updated_at")
      .eq("published", true);
    if (error) throw error;
    return data || [];
  }
  function updateTab() {
    const el = document.getElementById("tabEventsCount");
    if (el) el.textContent = events.filter((e) => e.published !== false).length || "";
  }

  // ---------- 一覧 ----------
  function gameById(id) { return (typeof GAMES !== "undefined" ? GAMES : []).find((g) => g.id === id); }

  // イベント限定のゲームを、通常のタイルとほぼ同じ見た目で作る
  function customTile(it) {
    const el = document.createElement("a");
    el.className = "game-card tile is-event-custom";
    el.href = it.url;
    el.target = "_blank";
    el.rel = "noopener";
    el.dataset.genre = "イベント限定";
    el.title = it.desc || it.title;
    el.innerHTML = `
      <div class="card-emoji tile-emoji">${esc(it.emoji || "🎪")}</div>
      <div class="tile-main">
        <h3 class="card-title">${esc(it.title)}</h3>
        <div class="tile-meta"><span class="tile-chip event">🎪 イベント限定</span></div>
        ${it.desc ? `<p class="ev-custom-desc">${esc(it.desc)}</p>` : ""}
      </div>
      <div class="tile-side"><span class="play-btn tile-play" aria-hidden="true">▶</span></div>`;
    return el;
  }

  function eventMatches(e, q) {
    if (!q) return true;
    if ((e.title + " " + e.description).toLowerCase().includes(q)) return true;
    return (e.items || []).some((it) => {
      const g = it.game ? gameById(it.game) : null;
      const t = g ? g.title : it.title || "";
      return t.toLowerCase().includes(q);
    });
  }

  function renderEventsView() {
    const wrap = document.getElementById("eventList");
    const bar = document.getElementById("eventAdmin");
    if (!wrap || !bar) return;
    wrap.hidden = false;
    const ad = admin();
    if (ad) {
      bar.hidden = false;
      bar.innerHTML = `
        <span class="ad-who">🔓 ログイン中: <b>${esc(ad.name)}</b></span>
        <button type="button" class="ad-btn primary" data-ev="new">➕ イベントを追加</button>
        <button type="button" class="ad-btn" data-ev="admins">👥 管理者の管理</button>
        <button type="button" class="ad-btn" data-ev="logout">ログアウト</button>`;
    } else {
      bar.hidden = true;
      bar.innerHTML = "";
    }
    if (!loaded && !loadError) { wrap.innerHTML = `<p class="ar-empty">読み込み中…</p>`; return; }
    if (loadError) { wrap.innerHTML = `<p class="ar-empty">イベントを読み込めませんでした。<button type="button" class="empty-switch" data-ev="reload">もう一度読み込む</button></p>`; return; }

    const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const list = ordered(events).filter((e) => eventMatches(e, q));
    wrap.innerHTML = "";
    const viewGames = [];
    if (!list.length) {
      wrap.innerHTML = `<p class="ar-empty">${events.length ? "該当するイベントがありません。" : "いまイベントはありません。"}</p>`;
    }
    list.forEach((e) => {
      const active = isActive(e);
      const sec = document.createElement("section");
      sec.className = "event-block" + (active ? " is-active" : "") + (e.published === false ? " is-draft" : "");
      sec.dataset.id = e.id;
      sec.innerHTML = `
        <header class="ev-head">
          <span class="ev-emoji" aria-hidden="true">${esc(e.emoji || "🎪")}</span>
          <div class="ev-titles">
            <h2 class="ev-title">${esc(e.title)}
              ${active ? `<span class="ev-badge on">開催中</span>` : ""}${e.published === false ? `<span class="ar-draft">下書き</span>` : ""}</h2>
            <p class="ev-period">📅 ${esc(periodText(e))}</p>
          </div>
          ${ad ? `<button type="button" class="ad-btn small" data-ev="edit" data-id="${esc(e.id)}">✏️ 編集</button>` : ""}
        </header>
        ${e.description ? `<p class="ev-desc">${esc(e.description)}</p>` : ""}
        <div class="game-grid ev-grid"></div>`;
      const g = sec.querySelector(".ev-grid");
      let n = 0;
      (e.items || []).forEach((it) => {
        if (it.game) {
          const game = gameById(it.game);
          if (!game) return; // 消えたゲームは出さない
          g.appendChild(buildTile(game));
          viewGames.push(game);
          n++;
        } else if (it.url) {
          g.appendChild(customTile(it));
          n++;
        }
      });
      if (!n) g.outerHTML = `<p class="ev-none">まだゲームが入っていません。</p>`;
      wrap.appendChild(sec);
    });
    window.__viewList = viewGames; // 詳細ウィンドウの「前へ/次へ」で、イベントの並び順どおりに進める
  }
  function hideEventsView() {
    const wrap = document.getElementById("eventList");
    const bar = document.getElementById("eventAdmin");
    if (wrap) wrap.hidden = true;
    if (bar) bar.hidden = true;
  }

  // ---------- 編集(管理者のみ) ----------
  function openEditor(ev) {
    const isNew = !ev;
    const e = ev || { id: null, title: "", emoji: "🎪", description: "", start_md: "", end_md: "", sort_order: (events.length + 1) * 10, items: [], published: false };
    let items = JSON.parse(JSON.stringify(e.items || []));
    const [sm, sd] = (e.start_md || "").split("-").map(Number);
    const [em, ed] = (e.end_md || "").split("-").map(Number);
    const monthOpts = (sel) => `<option value="">--</option>` + Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${sel === i + 1 ? " selected" : ""}>${i + 1}月</option>`).join("");
    const dayOpts = (sel) => `<option value="">--</option>` + Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}"${sel === i + 1 ? " selected" : ""}>${i + 1}日</option>`).join("");

    const m = A().openModal("ar-editor ev-editor", `
      <div class="rp-dialog ar-dialog ed-dialog ev-dialog" role="dialog" aria-modal="true" aria-label="イベントの編集">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">🎪 ${isNew ? "新しいイベント" : "イベントの編集"}</p>
        <div class="ev-form">
          <div class="ev-row">
            <label class="ad-label ev-emoji-in">絵文字<input class="ad-input" name="emoji" maxlength="8" value="${esc(e.emoji)}"></label>
            <label class="ad-label ev-grow">イベント名(60字まで)<input class="ad-input" name="title" maxlength="60" value="${esc(e.title)}" placeholder="例: 夏のホラー特集"></label>
          </div>
          <label class="ad-label">ひとこと説明(400字まで)<textarea class="ad-input" name="description" rows="2" maxlength="400">${esc(e.description)}</textarea></label>
          <div class="ev-row ev-period-row">
            <span class="ad-label">期間(毎年。両方「--」で期間なし)</span>
            <select class="ad-input" name="sm">${monthOpts(sm)}</select><select class="ad-input" name="sd">${dayOpts(sd)}</select>
            <span>〜</span>
            <select class="ad-input" name="em">${monthOpts(em)}</select><select class="ad-input" name="ed">${dayOpts(ed)}</select>
          </div>
          <label class="ad-label">表示順(小さいほど上。開催中のイベントは自動で上に出ます)<input class="ad-input" name="sort_order" type="number" value="${Number(e.sort_order) || 0}"></label>

          <h4 class="ad-h">中に入れるゲーム(<span class="ev-count"></span>)</h4>
          <ul class="ev-items"></ul>
          <div class="ev-add">
            <input class="ad-input" type="search" name="q" placeholder="サイトのゲームを探して追加(名前で検索)" autocomplete="off">
            <ul class="ev-hits"></ul>
          </div>
          <details class="ev-custom">
            <summary>＋ このイベント限定のゲームを追加(外部サイトのリンク)</summary>
            <div class="ev-row">
              <input class="ad-input ev-emoji-in" name="c_emoji" maxlength="8" placeholder="🎮">
              <input class="ad-input ev-grow" name="c_title" maxlength="60" placeholder="ゲーム名">
            </div>
            <input class="ad-input" name="c_url" type="url" placeholder="https://…(遊べるページのURL)">
            <input class="ad-input" name="c_desc" maxlength="200" placeholder="ひとこと説明(任意・200字まで)">
            <div class="ad-row"><button type="button" class="ad-btn" data-ev-addcustom>追加</button></div>
          </details>

          <p class="ad-error" role="alert"></p>
          <div class="ed-foot">
            <label class="ed-pub"><input type="checkbox" name="published"${e.published ? " checked" : ""}> 公開する <small>(外すと下書き。管理者にだけ見えます)</small></label>
            <div class="ad-row">
              ${isNew ? "" : `<button type="button" class="ad-btn danger" data-ev-delete>🗑 削除</button>`}
              <button type="button" class="ad-btn" data-ar-close>閉じる</button>
              <button type="button" class="ad-btn primary" data-ev-save>保存</button>
            </div>
          </div>
        </div>
      </div>`);

    const $ = (n) => m.querySelector(`[name="${n}"]`);
    const listEl = m.querySelector(".ev-items");
    const hitsEl = m.querySelector(".ev-hits");
    const errEl = m.querySelector(".ad-error");
    let dirty = false;

    function renderItems() {
      m.querySelector(".ev-count").textContent = items.length + "件";
      listEl.innerHTML = items.map((it, i) => {
        const g = it.game ? gameById(it.game) : null;
        const label = it.game ? (g ? `${g.emoji} ${esc(g.title)}` : `⚠ 見つからない: ${esc(it.game)}`) : `🎪 ${esc(it.emoji || "")} ${esc(it.title)} <small>(限定)</small>`;
        return `<li class="ev-item" data-i="${i}"><span class="ev-item-name">${label}</span>
          <span class="ev-item-btns"><button type="button" class="ad-btn small" data-mv="-1" ${i === 0 ? "disabled" : ""} aria-label="上へ">▲</button><button type="button" class="ad-btn small" data-mv="1" ${i === items.length - 1 ? "disabled" : ""} aria-label="下へ">▼</button><button type="button" class="ad-btn small danger" data-rm aria-label="外す">✕</button></span></li>`;
      }).join("") || `<li class="ev-item ev-item-empty">まだ入っていません。下から追加してください。</li>`;
    }
    function renderHits() {
      const q = $("q").value.trim().toLowerCase();
      if (!q) { hitsEl.innerHTML = ""; return; }
      const have = new Set(items.filter((i) => i.game).map((i) => i.game));
      const hit = GAMES.filter((g) => !have.has(g.id) && (g.title.toLowerCase().includes(q) || g.id.includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)))).slice(0, 8);
      hitsEl.innerHTML = hit.length
        ? hit.map((g) => `<li><button type="button" class="ev-hit" data-add="${esc(g.id)}">${g.emoji} ${esc(g.title)} <small>${esc(g.tags[0] || "")}</small></button></li>`).join("")
        : `<li class="ev-hit-none">該当なし(すでに入っているか、名前が違うかも)</li>`;
    }
    renderItems();

    m._beforeClose = () => !dirty || confirm("保存していない変更があります。閉じますか？");
    m.addEventListener("input", () => { dirty = true; });
    $("q").addEventListener("input", renderHits);

    m.addEventListener("click", async (ev) => {
      const t = ev.target;
      const add = t.closest("[data-add]");
      if (add) { items.push({ game: add.dataset.add }); dirty = true; $("q").value = ""; renderHits(); renderItems(); return; }
      const li = t.closest(".ev-item[data-i]");
      if (li) {
        const i = Number(li.dataset.i);
        if (t.closest("[data-rm]")) { items.splice(i, 1); dirty = true; renderItems(); }
        else if (t.closest("[data-mv]")) {
          const j = i + Number(t.closest("[data-mv]").dataset.mv);
          if (j >= 0 && j < items.length) { [items[i], items[j]] = [items[j], items[i]]; dirty = true; renderItems(); }
        }
        return;
      }
      if (t.closest("[data-ev-addcustom]")) {
        const title = $("c_title").value.trim(), url = $("c_url").value.trim();
        if (!title) { errEl.textContent = "限定ゲームの名前を入れてください。"; return; }
        if (!/^https?:\/\/\S+$/i.test(url)) { errEl.textContent = "限定ゲームのURLは https:// から始めてください。"; return; }
        items.push({ title, url, emoji: $("c_emoji").value.trim(), desc: $("c_desc").value.trim() });
        ["c_emoji", "c_title", "c_url", "c_desc"].forEach((n) => { $(n).value = ""; });
        errEl.textContent = ""; dirty = true; renderItems();
        return;
      }
      if (t.closest("[data-ev-save]")) { await save(t.closest("[data-ev-save]")); return; }
      if (t.closest("[data-ev-delete]")) {
        if (!confirm(`イベント「${e.title}」を削除しますか？\n(中のゲーム自体は消えません。元に戻せません)`)) return;
        const r = await A().callRpc("gl_event_delete", { p_id: e.id });
        if (r && r.ok) { dirty = false; toast("イベントを削除しました"); A().closeModal(m); await load(); }
      }
    });

    const REASON = {
      title: "イベント名を1〜60字で入れてください。", emoji: "絵文字が長すぎます。", description: "説明が長すぎます(400字まで)。",
      period: "期間は、開始と終了の月日をどちらも選ぶか、どちらも「--」にしてください。", items: "ゲームの一覧に問題があります(100件まで、URLはhttp(s)のみ)。",
      notfound: "このイベントは見つかりません(すでに削除されたかもしれません)。",
    };
    async function save(btn) {
      errEl.textContent = "";
      const two = (v) => String(v).padStart(2, "0");
      const part = (mn, dn) => ($(mn).value && $(dn).value ? `${two($(mn).value)}-${two($(dn).value)}` : "");
      const start = part("sm", "sd"), end = part("em", "ed");
      if ((($("sm").value || $("sd").value) && !start) || (($("em").value || $("ed").value) && !end)) { errEl.textContent = REASON.period; return; }
      btn.disabled = true;
      const r = await A().callRpc("gl_event_save", {
        p_id: e.id, p_title: $("title").value, p_emoji: $("emoji").value, p_description: $("description").value,
        p_start_md: start, p_end_md: end, p_sort_order: Number($("sort_order").value) || 0, p_items: items, p_published: $("published").checked,
      });
      btn.disabled = false;
      if (!r) return;
      if (!r.ok) { errEl.textContent = REASON[r.reason] || "保存できませんでした。"; return; }
      dirty = false;
      toast($("published").checked ? "イベントを公開しました" : "下書きとして保存しました");
      A().closeModal(m);
      await load();
    }
  }

  // ---------- イベント ----------
  function init() {
    const wrap = document.getElementById("eventList");
    const bar = document.getElementById("eventAdmin");
    if (wrap) wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ev]");
      if (!b) return;
      if (b.dataset.ev === "edit") { const ev = events.find((x) => x.id === b.dataset.id); if (ev) openEditor(ev); }
      else if (b.dataset.ev === "reload") load();
    });
    if (bar) bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ev]");
      if (!b) return;
      if (b.dataset.ev === "new") openEditor(null);
      else if (b.dataset.ev === "admins") A().openAdminManager();
      else if (b.dataset.ev === "logout") A().logout();
    });
    // ログイン/ログアウトしたら読み直す(下書きの表示が変わる)
    document.addEventListener("gl-admin-change", () => { loaded = false; events = []; load(); });
    // 記事側のログイン確認(期限切れチェック)が終わるのを少し待ってから読む
    setTimeout(load, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { renderView: renderEventsView, hideView: hideEventsView, isActive, state: () => ({ count: events.length }) };
})();

// main.js の render() から呼ばれる入口
function renderEventsView() { EventsTab.renderView(); }
function hideEventsView() { EventsTab.hideView(); }
