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
  const PARTY_EMOJIS = ["🎉", "🎊", "🤡", "🎪", "🥳", "✨", "🎈", "🌈"];

  function buildBanner() {
    const el = document.getElementById("aprilBanner");
    if (!el) return;
    el.innerHTML =
      `<span>🎉🎪🤡 4月1日限定のジョーク表示中です！！ 🤡🎪🎉<br>` +
      `<small>(念のため: 実際に何かが変わったり壊れたりはしていません)</small></span>` +
      `<button type="button" id="aprilDismissBtn">普通の表示に戻す</button>` +
      `<div class="april-marquee"><div class="april-marquee-track">${buildMarqueeText()}</div></div>`;
    el.hidden = false;
    const btn = document.getElementById("aprilDismissBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        try { sessionStorage.setItem("gl_no_aprilfools", "1"); } catch (e) {}
        location.reload();
      });
    }
  }

  function buildMarqueeText() {
    const messages = [
      "🎉 エイプリルフール開催中！！！",
      "🤡 ぜんぶウソです！",
      "🎪 かるわか GAMES 特別バージョン",
      "🥳 何も壊れてません、ご安心を",
      "✨ 明日には元に戻ります",
      "🎊 ジョークゲーム(仮)、絶賛存在しません",
    ];
    // 2周分つなげて途切れなく流れるようにする
    return (messages.join("　★　") + "　★　").repeat(2);
  }

  // 数秒おきに紙吹雪を降らせ続ける、いかにもお祭り騒ぎな演出。
  function confettiBurst() {
    const box = document.createElement("div");
    box.className = "confetti-box";
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("span");
      p.className = "emoji-rain-item";
      p.textContent = PARTY_EMOJIS[Math.floor(Math.random() * PARTY_EMOJIS.length)];
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.fontSize = 14 + Math.random() * 22 + "px";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }
  function startConfettiLoop() {
    confettiBurst();
    setInterval(confettiBurst, 4000);
  }

  // ブラウザのタブ名も交互に切り替えて、隅々まで気づいてもらう。
  function startTitleFlicker() {
    const original = document.title;
    const alt = "🤡 エイプリルフール中！";
    let showAlt = false;
    setInterval(() => {
      showAlt = !showAlt;
      document.title = showAlt ? alt : original;
    }, 2000);
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
      .forEach((el, i) => {
        // 全部🤡だと単調なので、たまに違う絵文字も混ぜてお祭り感を出す
        el.textContent = i % 5 === 0 ? PARTY_EMOJIS[i % PARTY_EMOJIS.length] : JOKE_EMOJI;
      });
  }

  function swapPlayButtons() {
    document
      .querySelectorAll(`#gameGrid .game-card:not([${JOKE_CARD_ATTR}]) .play-btn`)
      .forEach((el) => { el.textContent = "たぶん遊べる →"; });
  }

  // 全カードを常時ふわふわ揺らす。カードごとにズレた開始タイミング・
  // 揺れ幅にして、統一感のない賑やかさを出す。
  function floatCards() {
    document.querySelectorAll("#gameGrid .game-card").forEach((el, i) => {
      if (el.dataset.aprilFloatSet) return;
      el.dataset.aprilFloatSet = "1";
      el.style.animationDelay = (i % 12) * 0.17 + "s";
      el.style.setProperty("--april-tilt", (i % 2 === 0 ? 1 : -1) * (1 + (i % 3)) + "deg");
    });
  }

  function applyToGrid() {
    insertJokeCard();
    swapEmojis();
    swapPlayButtons();
    floatCards();
  }

  // マウスカーソルの後をカラフルな絵文字がわらわらと追いかける演出。
  function initCursorTrail() {
    let last = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const el = document.createElement("span");
      el.className = "april-cursor-emoji";
      el.textContent = PARTY_EMOJIS[Math.floor(Math.random() * PARTY_EMOJIS.length)];
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      el.style.fontSize = 14 + Math.random() * 14 + "px";
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
    // 既存の隠しコマンド演出(パーティーモード/ゴッドモード/レインボー)も
    // 全部乗せにして、とにかく派手にする。
    document.documentElement.classList.add("april-fools", "party", "godmode", "rainbow");
    buildBanner();
    swapLogo();
    initCursorTrail();
    startConfettiLoop();
    startTitleFlicker();

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
