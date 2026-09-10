// ===== 追加要素 =====
// - 今日の1本(ランダムピック)
// - 共有ボタン(サイト全体 / 各ゲーム)
// - 統計ダッシュボード
// - レトロ訪問者カウンター
// - キーボードショートカット( / 検索 / r ランダム / Esc 閉じる )
// - 隠しコマンド(コナミコマンド → パーティーモード)
// main.js / votes.js / stats.js の後に読み込まれる前提(GAMES 等を参照)。

const GameExtras = (() => {
  // ---------- トースト ----------
  let toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById("glToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "glToast";
      el.className = "gl-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => { el.hidden = true; }, 300);
    }, 2600);
  }

  // ---------- 共有 ----------
  async function share(title, url) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // ユーザーがキャンセル
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("URLをコピーしました");
    } catch (e) {
      showToast(url);
    }
  }
  function shareSite() {
    share("MY GAMES LINKS", "https://kaikomziu.github.io/game-links/");
  }
  function shareGame(title, url) {
    share(`${title} ｜ MY GAMES LINKS`, url);
  }

  // ---------- 今日の1本(ランダムピック) ----------
  function visibleGames() {
    // 検索・タグの絞り込みが効いていれば、その中から選ぶ
    const cards = [...document.querySelectorAll("#gameGrid .game-card .card-title")].map((h) => h.textContent);
    if (cards.length && cards.length < GAMES.length) {
      const set = new Set(cards);
      const filtered = GAMES.filter((g) => set.has(g.title));
      if (filtered.length) return filtered;
    }
    return GAMES;
  }
  let lastPickId = null;
  function pickRandom() {
    const pool = visibleGames();
    let g = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && g.id === lastPickId) {
      g = pool[(pool.indexOf(g) + 1) % pool.length];
    }
    lastPickId = g.id;
    openPickModal(g);
  }
  function openPickModal(g) {
    let modal = document.getElementById("rpModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "rpModal";
      modal.className = "rp-modal";
      modal.innerHTML = `
        <div class="rp-backdrop" data-close></div>
        <div class="rp-dialog" role="dialog" aria-modal="true" aria-label="今日の1本">
          <button class="rp-close" data-close aria-label="閉じる">×</button>
          <p class="rp-caption">🎲 今日の1本</p>
          <div class="rp-body"></div>
          <div class="rp-actions">
            <button class="rp-reroll" type="button">別のゲーム 🔄</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close")) closePickModal();
      });
      modal.querySelector(".rp-reroll").addEventListener("click", pickRandom);
    }
    const body = modal.querySelector(".rp-body");
    body.innerHTML = `
      <div class="rp-emoji">${g.emoji}</div>
      <h3 class="rp-title">${escapeHtml(g.title)}</h3>
      <p class="rp-desc">${escapeHtml(clip(g.desc, 140))}</p>
      <div class="rp-tags">${g.tags.map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`).join("")}</div>
      <a class="play-btn rp-play" href="${escapeHtml(g.url)}" target="_blank" rel="noopener">これで遊ぶ →</a>`;
    body.querySelector(".rp-play").addEventListener("click", () => {
      if (typeof GameStats !== "undefined") GameStats.recordPlay(g.id);
    });
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closePickModal() {
    const modal = document.getElementById("rpModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- 統計ダッシュボード ----------
  function animateNumber(el, to) {
    const from = Number(el.dataset.v || 0);
    if (from === to) { el.textContent = to.toLocaleString(); return; }
    el.dataset.v = to;
    const start = performance.now();
    const dur = 700;
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function renderDashboard() {
    const wrap = document.getElementById("statDashboard");
    if (!wrap) return;
    const totalGames = typeof GAMES !== "undefined" ? GAMES.length : 0;
    const statsReady = typeof GameStats !== "undefined" && GameStats.isLoaded();
    const totalPlays = statsReady ? GameStats.totalPlays() : null;
    let totalLikes = 0;
    if (typeof GameVotes !== "undefined" && typeof GAMES !== "undefined") {
      GAMES.forEach((g) => { totalLikes += GameVotes.getCounts(g.id).like; });
    }
    const visits = typeof GameStats !== "undefined" ? GameStats.getVisits() : null;

    const items = [
      { k: "ゲーム数", v: totalGames },
      { k: "総プレイ数", v: totalPlays },
      { k: "総いいね", v: totalLikes },
      { k: "訪問者数", v: visits },
    ];
    if (!wrap.dataset.built) {
      wrap.innerHTML = items
        .map((it) => `<div class="stat-tile"><span class="stat-num" data-key="${it.k}">—</span><span class="stat-key">${it.k}</span></div>`)
        .join("");
      wrap.dataset.built = "1";
    }
    items.forEach((it) => {
      const el = wrap.querySelector(`.stat-num[data-key="${it.k}"]`);
      if (!el) return;
      if (it.v == null) { el.textContent = "—"; return; }
      animateNumber(el, it.v);
    });
  }

  // ---------- レトロ訪問者カウンター ----------
  function renderVisitorCounter() {
    const el = document.getElementById("visitorCounter");
    if (!el) return;
    const n = typeof GameStats !== "undefined" ? GameStats.getVisits() : null;
    if (n == null) { el.hidden = true; return; }
    const digits = String(n).padStart(6, "0");
    el.innerHTML = `<span class="vc-label">あなたは</span>` +
      [...digits].map((d) => `<span class="vc-digit">${d}</span>`).join("") +
      `<span class="vc-label">人目の訪問者です</span>`;
    el.hidden = false;
  }

  // ---------- コナミコマンド ----------
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiPos = 0;
  function applyParty(on) {
    document.documentElement.classList.toggle("party", on);
    try { localStorage.setItem("gl_party", on ? "1" : "0"); } catch (e) {}
  }
  function confettiBurst() {
    const colors = ["#6c5ce7", "#f5a623", "#34c759", "#ff4d4f", "#00b8d4", "#ff8ac2"];
    const box = document.createElement("div");
    box.className = "confetti-box";
    for (let i = 0; i < 90; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }
  function onKonami() {
    const now = !document.documentElement.classList.contains("party");
    applyParty(now);
    if (now) {
      confettiBurst();
      showToast("🎮 隠しコマンド発見！パーティーモード ON");
    } else {
      showToast("パーティーモード OFF");
    }
  }

  // ---------- キーボードショートカット ----------
  function isTyping(e) {
    const t = e.target;
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  }
  document.addEventListener("keydown", (e) => {
    // コナミ
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[konamiPos]) {
      konamiPos++;
      if (konamiPos === KONAMI.length) { konamiPos = 0; onKonami(); }
    } else {
      konamiPos = key === KONAMI[0] ? 1 : 0;
    }

    if (e.key === "Escape") {
      const modal = document.getElementById("rpModal");
      if (modal && modal.classList.contains("open")) { closePickModal(); return; }
      const s = document.getElementById("searchInput");
      if (s && s.value) { s.value = ""; s.dispatchEvent(new Event("input")); }
      return;
    }
    if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      const s = document.getElementById("searchInput");
      if (s) s.focus();
    } else if (e.key.toLowerCase() === "r") {
      pickRandom();
    }
  });

  // ---------- 初期化 ----------
  document.addEventListener("DOMContentLoaded", () => {
    try {
      if (localStorage.getItem("gl_party") === "1") document.documentElement.classList.add("party");
    } catch (e) {}

    const rpBtn = document.getElementById("randomPickBtn");
    if (rpBtn) rpBtn.addEventListener("click", pickRandom);
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) shareBtn.addEventListener("click", shareSite);

    renderDashboard();
    renderVisitorCounter();
  });

  if (typeof GameStats !== "undefined") {
    GameStats.onUpdate(() => { renderDashboard(); renderVisitorCounter(); });
  }
  if (typeof GameVotes !== "undefined") {
    GameVotes.onUpdate(renderDashboard);
  }

  return { pickRandom, shareSite, shareGame, showToast };
})();
