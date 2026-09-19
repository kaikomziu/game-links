// ===== 4月1日限定 エイプリルフールモード =====
// 判定条件:
//   ①URLの末尾に ?0401 を付ける(いつでも手動で確認できる)
//   ②実際の端末の日付が4月1日(自動で有効になる)
// 「普通の表示に戻す」を押すと、このセッション中だけ(実際の4/1でも)
// 通常表示に戻せる。?0401 を明示的に付けている時は常に優先して発動する。
// main.js / extras.js の後に読み込まれる前提(GAMES / render 等を参照)。
const AprilFools = (() => {
  function forcedByUrl() {
    try {
      return new URLSearchParams(location.search).has("0401");
    } catch (e) {
      return false;
    }
  }
  function isApril1() {
    const d = new Date();
    return d.getMonth() === 3 && d.getDate() === 1; // getMonth()は0始まりなので3=4月
  }
  function dismissedThisSession() {
    try {
      return sessionStorage.getItem("gl_no_aprilfools") === "1";
    } catch (e) {
      return false;
    }
  }
  function active() {
    if (forcedByUrl()) return true;
    if (dismissedThisSession()) return false;
    return isApril1();
  }

  const JOKE_EMOJI = "🤡";
  const JOKE_CARD_ATTR = "data-april-joke-card";

  function buildBanner() {
    const el = document.getElementById("aprilBanner");
    if (!el) return;
    el.innerHTML =
      `<span>🎉 4月1日限定のジョーク表示中です(念のため: 実際に何かが変わったり壊れたりはしていません)</span>` +
      `<button type="button" id="aprilDismissBtn">普通の表示に戻す</button>`;
    el.hidden = false;
    const btn = document.getElementById("aprilDismissBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        try { sessionStorage.setItem("gl_no_aprilfools", "1"); } catch (e) {}
        location.reload();
      });
    }
  }

  function insertJokeCard() {
    const grid = document.getElementById("gameGrid");
    if (!grid || grid.querySelector(`[${JOKE_CARD_ATTR}]`)) return;
    const card = document.createElement("article");
    card.className = "game-card april-joke-card";
    card.setAttribute(JOKE_CARD_ATTR, "1");
    card.innerHTML = `
      <div class="card-top">
        <div class="card-emoji">🎪</div>
      </div>
      <h2 class="card-title">ジョークゲーム(仮)</h2>
      <p class="card-desc">4月1日限定のジョークです。実はこのゲームは存在しません。</p>
      <div class="card-tags"><span class="card-tag">エイプリルフール</span></div>
      <a class="play-btn" href="#" data-april-joke-link>信じて遊びに行く →</a>
    `;
    grid.prepend(card);
    const link = card.querySelector("[data-april-joke-link]");
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof GameExtras !== "undefined") {
          GameExtras.showToast("🎉 ひっかかりましたね！エイプリルフールでした。");
        }
      });
    }
  }

  function swapEmojis() {
    document
      .querySelectorAll(`#gameGrid .game-card:not([${JOKE_CARD_ATTR}]) .card-emoji`)
      .forEach((el) => { el.textContent = JOKE_EMOJI; });
  }

  function swapPlayButtons() {
    document
      .querySelectorAll(`#gameGrid .game-card:not([${JOKE_CARD_ATTR}]) .play-btn`)
      .forEach((el) => { el.textContent = "たぶん遊べる →"; });
  }

  function applyToGrid() {
    insertJokeCard();
    swapEmojis();
    swapPlayButtons();
  }

  // マウスカーソルの後を絵文字がふわっと追いかける、いかにも4/1な演出。
  function initCursorTrail() {
    let last = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - last < 100) return;
      last = now;
      const el = document.createElement("span");
      el.className = "april-cursor-emoji";
      el.textContent = "🎉";
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    });
  }

  function swapLogo() {
    const emoji = document.querySelector(".logo-emoji");
    if (emoji) emoji.textContent = JOKE_EMOJI;
  }

  function init() {
    if (!active()) return;
    document.documentElement.classList.add("april-fools");
    buildBanner();
    swapLogo();
    initCursorTrail();

    const grid = document.getElementById("gameGrid");
    if (grid) {
      applyToGrid();
      const observer = new MutationObserver(() => applyToGrid());
      observer.observe(grid, { childList: true });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return { isActive: active };
})();
