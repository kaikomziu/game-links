// ===== 一覧のタイル表示と詳細ウィンドウ =====
// js/main.js より前に読み込む(関数は main.js の render() などから呼ばれる。
// favorites / toggleFavorite / isNewGame / isSoftware などは main.js 側のものを、呼ばれた時点で参照する)。

// 説明文の最初の1文だけを取り出す(タイルのツールチップ用)。句点が無ければ全文。
function firstSentence(desc) {
  const idx = desc.indexOf("。");
  return idx === -1 ? desc : desc.slice(0, idx + 1);
}

function tileMeta(g) {
  const parts = [];
  if (isSoftware(g)) {
    parts.push(`<span class="tile-chip soft">${g.kind === "mod" ? "🧩 MOD" : "💻 ソフト"}${g.platform ? "・" + escapeTileHtml(g.platform) : ""}</span>`);
  }
  parts.push(`<span class="tile-chip genre">${escapeTileHtml(g.tags[0] || "")}</span>`);
  return parts.join("");
}

function escapeTileHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// プレイ/ダウンロードを開くボタンのアイコンと説明
function playIcon(g) {
  const act = g.action || (isSoftware(g) ? "見に行く →" : "遊びに行く →");
  const icon = /ダウンロード/.test(act) ? "⬇" : isSoftware(g) ? "↗" : "▶";
  return { act: act.replace(/\s*→$/, ""), icon };
}

// ---------- タイル ----------
function buildTile(g) {
  const maint = !!g.maintenance;
  const isNew = isNewGame(g) && !maint;
  const isSoft = isSoftware(g);
  const isFav = favorites.has(g.id);
  const likes = typeof GameVotes !== "undefined" ? GameVotes.getCounts(g.id).like : 0;
  const { act, icon } = playIcon(g);

  const el = document.createElement("article");
  el.className = "game-card tile" + (isNew ? " is-new" : "") + (maint ? " is-maintenance" : "") + (isSoft ? " is-soft" : "");
  el.dataset.id = g.id;
  el.dataset.genre = isSoft ? (g.kind === "mod" ? "MOD" : "ソフト") : g.tags[0] || "";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `${g.title} の詳細を開く`);
  el.title = firstSentence(g.desc);

  el.innerHTML = `
    <div class="card-emoji tile-emoji">${g.emoji}</div>
    <div class="tile-main">
      <h2 class="card-title">${escapeTileHtml(g.title)}</h2>
      <div class="tile-meta">
        ${isNew ? `<span class="tile-chip new">NEW</span>` : ""}${maint ? `<span class="tile-chip maint">🔧 メンテ中</span>` : ""}${tileMeta(g)}${likes > 0 ? `<span class="tile-like">👍${likes}</span>` : ""}
      </div>
    </div>
    <div class="tile-side">
      <button class="fav-btn ${isFav ? "active" : ""}" type="button" aria-label="お気に入り切替">${isFav ? "★" : "☆"}</button>
      ${maint
        ? `<span class="play-btn tile-play maintenance-btn" title="修正中のため遊べません" aria-disabled="true">🔧</span>`
        : `<a class="play-btn tile-play" href="${escapeTileHtml(g.url)}" target="_blank" rel="noopener" title="${escapeTileHtml(act)}" aria-label="${escapeTileHtml(g.title)}を開く(${escapeTileHtml(act)})">${icon}</a>`}
    </div>`;

  el.querySelector(".fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(g.id);
  });
  const play = el.querySelector("a.play-btn");
  if (play) {
    play.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof GameStats !== "undefined") GameStats.recordPlay(g.id);
    });
  }
  el.addEventListener("click", () => openDetail(g.id));
  el.addEventListener("keydown", (e) => {
    if (e.target !== el) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(g.id); }
  });
  return el;
}

// ---------- 詳細ウィンドウ ----------
let detailId = null;

function detailEl() {
  let modal = document.getElementById("dtModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "dtModal";
  modal.className = "rp-modal dt-modal";
  modal.innerHTML = `
    <div class="rp-backdrop" data-dt-close></div>
    <div class="rp-dialog dt-dialog" role="dialog" aria-modal="true" aria-label="作品の詳細">
      <button class="rp-close" data-dt-close aria-label="閉じる">×</button>
      <div class="dt-body"></div>
      <div class="dt-nav">
        <button type="button" class="dt-step" data-step="-1">◀ 前へ</button>
        <span class="dt-pos"></span>
        <button type="button" class="dt-step" data-step="1">次へ ▶</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-dt-close")) { closeDetail(); return; }
    const step = e.target.closest("[data-step]");
    if (step) stepDetail(Number(step.dataset.step));
  });
  return modal;
}

function currentViewList() {
  return window.__viewList && window.__viewList.length ? window.__viewList : GAMES;
}

function openDetail(id) {
  detailId = id;
  const modal = detailEl();
  renderDetail();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  const close = modal.querySelector(".rp-close");
  if (close) close.focus({ preventScroll: true });
}

function closeDetail() {
  const modal = document.getElementById("dtModal");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
  detailId = null;
}

function stepDetail(dir) {
  const list = currentViewList();
  const i = list.findIndex((g) => g.id === detailId);
  if (i < 0) return;
  detailId = list[(i + dir + list.length) % list.length].id;
  renderDetail();
}

function refreshDetailIfOpen() {
  const modal = document.getElementById("dtModal");
  if (modal && modal.classList.contains("open") && detailId) renderDetail();
}

function renderDetail() {
  const g = GAMES.find((x) => x.id === detailId);
  const modal = document.getElementById("dtModal");
  if (!g || !modal) return;
  const list = currentViewList();
  const idx = list.findIndex((x) => x.id === g.id);
  const maint = !!g.maintenance;
  const isNew = isNewGame(g) && !maint;
  const isSoft = isSoftware(g);
  const isFav = favorites.has(g.id);
  const hasVotes = typeof GameVotes !== "undefined";
  const counts = hasVotes ? GameVotes.getCounts(g.id) : { like: 0, dislike: 0 };
  const myVote = hasVotes ? GameVotes.getMyVote(g.id) : null;
  const plays = typeof GameStats !== "undefined" ? GameStats.getPlays(g.id) : 0;
  const trivia = typeof TRIVIA !== "undefined" ? TRIVIA[g.id] : null;
  const { act } = playIcon(g);

  const badges = [
    isNew ? `<span class="tile-chip new">NEW</span>` : "",
    maint ? `<span class="tile-chip maint">🔧 メンテナンス中</span>` : "",
    tileMeta(g),
  ].join("");

  modal.querySelector(".dt-body").innerHTML = `
    <div class="dt-head">
      <div class="card-emoji dt-emoji">${g.emoji}</div>
      <div class="dt-titlebox">
        <h2 class="dt-title">${escapeTileHtml(g.title)}</h2>
        <div class="dt-badges">${badges}</div>
        <p class="dt-author">作者: ${escapeTileHtml(g.author || "Claude AI")}${plays > 0 ? ` ・ ▶ ${plays.toLocaleString()} 回プレイ` : ""}</p>
      </div>
    </div>
    <p class="dt-desc">${escapeTileHtml(g.desc)}</p>
    ${trivia ? `<p class="dt-trivia">💭 ${escapeTileHtml(trivia)}</p>` : ""}
    <div class="dt-actions">
      ${maint
        ? `<span class="play-btn dt-play maintenance-btn" aria-disabled="true">修正中のため遊べません</span>`
        : `<a class="play-btn dt-play" href="${escapeTileHtml(g.url)}" target="_blank" rel="noopener">${escapeTileHtml(g.action || (isSoft ? "見に行く →" : "遊びに行く →"))}</a>`}
      <button type="button" class="dt-btn dt-fav ${isFav ? "active" : ""}" aria-label="お気に入り切替">${isFav ? "★ お気に入り" : "☆ お気に入り"}</button>
      <button type="button" class="dt-btn dt-share" aria-label="共有">🔗 共有</button>
    </div>
    ${hasVotes ? `
    <div class="vote-row dt-votes">
      <button class="vote-btn like ${myVote === "like" ? "active" : ""}" data-vote="like" ${myVote ? "disabled" : ""} aria-label="高評価">👍 <span class="vote-count">${counts.like}</span></button>
      <button class="vote-btn dislike ${myVote === "dislike" ? "active" : ""}" data-vote="dislike" ${myVote ? "disabled" : ""} aria-label="低評価">👎 <span class="vote-count">${counts.dislike}</span></button>
    </div>` : ""}`;
  modal.querySelector(".dt-pos").textContent = idx >= 0 ? `${idx + 1} / ${list.length}` : "";

  const body = modal.querySelector(".dt-body");
  const play = body.querySelector("a.dt-play");
  if (play) play.addEventListener("click", () => { if (typeof GameStats !== "undefined") GameStats.recordPlay(g.id); });
  body.querySelector(".dt-fav").addEventListener("click", () => { toggleFavorite(g.id); renderDetail(); });
  body.querySelector(".dt-share").addEventListener("click", () => {
    if (typeof GameExtras !== "undefined") GameExtras.shareGame(g.title, g.url);
  });
  body.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (btn.disabled) return;
      body.querySelectorAll(".vote-btn").forEach((b) => (b.disabled = true)); // 連打での二重送信を防止
      const result = await GameVotes.vote(g.id, btn.dataset.vote);
      renderDetail();
      if (!result.ok && result.reason === "error") {
        alert("投票に失敗しました。通信環境をご確認のうえ、もう一度お試しください。");
      }
    });
  });
}

document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("dtModal");
  if (!modal || !modal.classList.contains("open")) return;
  if (e.key === "Escape") { closeDetail(); e.stopPropagation(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); stepDetail(-1); }
  else if (e.key === "ArrowRight") { e.preventDefault(); stepDetail(1); }
}, true);

// 固定する閲覧バーの位置は、ヘッダーの高さ(折り返しで変わる)に合わせる
(function () {
  const hdr = document.querySelector(".site-header");
  if (!hdr) return;
  const sync = () => document.documentElement.style.setProperty("--hdr-h", hdr.offsetHeight + "px");
  sync();
  window.addEventListener("resize", sync);
  if (window.ResizeObserver) new ResizeObserver(sync).observe(hdr);
})();
