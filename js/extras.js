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
  function pickRandom(opts) {
    opts = opts || {};
    let pool = visibleGames();
    if (opts.favorUnplayed && typeof GameStats !== "undefined") {
      const withPlays = pool.map((g) => ({ g, p: GameStats.getPlays(g.id) }));
      const minPlays = Math.min(...withPlays.map((x) => x.p));
      const leastPlayed = withPlays.filter((x) => x.p === minPlays).map((x) => x.g);
      if (leastPlayed.length) pool = leastPlayed;
    }
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

  // ---------- ロゴ連打 ----------
  let logoClicks = 0;
  let logoClickTimer = null;
  function emojiRain(emoji, count) {
    const box = document.createElement("div");
    box.className = "confetti-box";
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "emoji-rain-item";
      p.textContent = emoji;
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.fontSize = 16 + Math.random() * 22 + "px";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }
  function onLogoClick() {
    logoClicks++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => { logoClicks = 0; }, 1500);
    if (logoClicks >= 10) {
      logoClicks = 0;
      emojiRain("🎮", 40);
      showToast("🎮 ロゴを10連打しましたね…！");
    }
  }

  // ---------- カードのハイライト演出(隠しワード共通) ----------
  function highlightGameCard(title, msg) {
    showToast(msg);
    const card = [...document.querySelectorAll("#gameGrid .game-card")].find(
      (c) => c.querySelector(".card-title") && c.querySelector(".card-title").textContent === title
    );
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("egg-pulse");
      setTimeout(() => card.classList.remove("egg-pulse"), 2000);
    }
  }

  // ---------- ゴッドモード(IDDQD) ----------
  function applyGodMode(on) {
    document.documentElement.classList.toggle("godmode", on);
    try { localStorage.setItem("gl_godmode", on ? "1" : "0"); } catch (e) {}
  }
  function onGodMode() {
    const now = !document.documentElement.classList.contains("godmode");
    applyGodMode(now);
    showToast(now ? "🔫 IDDQD… 全ゲームに黄金の光が宿った。" : "ゴッドモード解除。");
  }

  // ---------- レインボーモード ----------
  function applyRainbow(on) {
    document.documentElement.classList.toggle("rainbow", on);
    try { localStorage.setItem("gl_rainbow", on ? "1" : "0"); } catch (e) {}
  }
  function onRainbow() {
    const now = !document.documentElement.classList.contains("rainbow");
    applyRainbow(now);
    showToast(now ? "🌈 レインボーモード ON" : "レインボーモード OFF");
  }

  // ---------- 単発トースト/演出系の小ネタ ----------
  function onDeepThought() {
    showToast("🐋 生命、宇宙、そして万物についての究極の疑問の答えは42。");
  }
  function onYolo() {
    confettiBurst();
    showToast("🎉 YOLO！気になったゲーム、今すぐ開こう。");
  }
  function onSushi() {
    emojiRain("🍣", 30);
    showToast("🍣 なぜかお寿司が降ってきた。");
  }

  // ---------- 隠しワード一覧 ----------
  // キーボードで打ち込むと発動する。入力欄にフォーカスがある時は反応しない。
  const WORD_EGGS = {
    "egg": () => highlightGameCard("EGG HUNT", "🥚 かくれエッグ発見！"),
    "tamago": () => highlightGameCard("EGG HUNT", "🥚 かくれエッグ発見！"),
    "tetris": () => highlightGameCard("TETRIS DELUXE", "🧱 テトリミノ、降臨。"),
    "cookie": () => highlightGameCard("Cookie Factory", "🍪 クッキーの匂いがする…"),
    "gacha": () => highlightGameCard("GACHA LIFE", "🎰 ガチャの神様が微笑んだ、かも。"),
    "suika": () => highlightGameCard("SUIKA DELUXE", "🍉 スイカ、見つけた。"),
    "sushi": onSushi,
    "42": onDeepThought,
    "yolo": onYolo,
    "iddqd": onGodMode,
    "rainbow": onRainbow,
  };
  const WORD_MAX_LEN = Math.max(...Object.keys(WORD_EGGS).map((w) => w.length));
  let typedBuffer = "";
  function checkSecretWord(ch) {
    typedBuffer = (typedBuffer + ch).slice(-WORD_MAX_LEN);
    for (const w of Object.keys(WORD_EGGS)) {
      if (typedBuffer.endsWith(w)) {
        typedBuffer = "";
        WORD_EGGS[w]();
        break;
      }
    }
  }

  // ---------- テーマ切替の高速連打 ----------
  let themeClicks = 0;
  let themeClickTimer = null;
  function discoBurst() {
    document.body.classList.add("disco-burst");
    setTimeout(() => document.body.classList.remove("disco-burst"), 1300);
  }
  function onThemeToggleClick() {
    themeClicks++;
    clearTimeout(themeClickTimer);
    themeClickTimer = setTimeout(() => { themeClicks = 0; }, 1200);
    if (themeClicks >= 7) {
      themeClicks = 0;
      discoBurst();
      showToast("🕺 高速切替チャレンジ達成！");
    }
  }

  // ---------- サイコロの高速連打(運命の一本) ----------
  let diceClicks = 0;
  let diceClickTimer = null;
  function onDiceClick() {
    diceClicks++;
    clearTimeout(diceClickTimer);
    diceClickTimer = setTimeout(() => { diceClicks = 0; }, 1200);
    if (diceClicks >= 5) {
      diceClicks = 0;
      pickRandom({ favorUnplayed: true });
      showToast("🔮 運命の女神が微笑んだ…まだ遊んでいない一本を導きました。");
      return;
    }
    pickRandom();
  }

  // ---------- 最後まで読んでくれた人へ ----------
  function initScrollBottomEasterEgg() {
    const footer = document.querySelector(".site-footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    let done = false;
    try { done = sessionStorage.getItem("gl_scrolled_bottom") === "1"; } catch (e) {}
    if (done) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showToast("🏁 一番下まで見てくれてありがとう！");
          try { sessionStorage.setItem("gl_scrolled_bottom", "1"); } catch (e) {}
          obs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    obs.observe(footer);
  }

  // ---------- ヒント ----------
  const HINTS = [
    "🎮 ロゴは見た目以上に反応がいいらしい。10回くらい？",
    "🕹️ 上上下下左右左右…な、あの並びは今も健在。最後の2つはボタンで。",
    "🥚 何かの名前を英語で打ち込んでみると、見つかるかもしれない(EGG HUNTとか)。",
    "🍪🍉🎰🧱 好きなゲームの名前を英語でそのまま打ち込んでみて。",
    "🌈 虹色を意味する英単語を打ち込むと、ヘッダーの色が変わる。",
    "🔫 古典的なチートコード、なにか一つは効くはず(id〜)。",
    "🎲 サイコロも連打すると、少し違う反応をする。",
    "🌙 テーマ切り替えボタンも、実はただの切り替えじゃない。7回くらい？",
    "📜 一番下まで読んでくれる人には、ちゃんと反応するようにできている。",
    "🐋 究極の疑問の答えを、そのまま数字で打ち込んでみて。",
  ];
  function showRandomHint() {
    showToast(HINTS[Math.floor(Math.random() * HINTS.length)]);
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
    if (e.key.length === 1) checkSecretWord(e.key.toLowerCase());
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
      if (localStorage.getItem("gl_godmode") === "1") document.documentElement.classList.add("godmode");
      if (localStorage.getItem("gl_rainbow") === "1") document.documentElement.classList.add("rainbow");
    } catch (e) {}

    const rpBtn = document.getElementById("randomPickBtn");
    if (rpBtn) rpBtn.addEventListener("click", onDiceClick);
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) shareBtn.addEventListener("click", shareSite);
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", onThemeToggleClick);
    const logoEl = document.querySelector(".logo");
    if (logoEl) {
      logoEl.style.cursor = "pointer";
      logoEl.addEventListener("click", onLogoClick);
    }
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) hintBtn.addEventListener("click", showRandomHint);

    initScrollBottomEasterEgg();
    renderDashboard();
    renderVisitorCounter();

    try {
      console.log("%c🎮 MY GAMES LINKS", "font-size:18px;font-weight:bold;color:#6c5ce7;");
      console.log("%cこのサイトには隠しコマンドがいくつか眠っています。ロゴ、テーマ切替、サイコロ、キーボード…いろいろ試してみて。", "color:#888;font-size:12px;");
    } catch (e) {}
  });

  if (typeof GameStats !== "undefined") {
    GameStats.onUpdate(() => { renderDashboard(); renderVisitorCounter(); });
  }
  if (typeof GameVotes !== "undefined") {
    GameVotes.onUpdate(renderDashboard);
  }

  return { pickRandom, shareSite, shareGame, showToast, showRandomHint };
})();
