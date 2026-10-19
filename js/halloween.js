// ===== ハロウィンイベント =====
// 発動条件:
//   ①URLに ?halloween を付ける(いつでも手動で確認できる)
//   ②実際の端末の日付が 10/24〜11/2(自動で有効になる)
// 「通常表示に戻す」を押すと、このセッション中だけ通常表示に戻せる(?halloween 指定時は常に優先)。
// 内容: 夜のハロウィン配色、時々画面を横切るおばけ(クリックでお菓子 or イタズラ)、お菓子カウンター。
// main.js / extras.js の後に読み込まれる前提。
const Halloween = (() => {

  function forcedByUrl() {
    try { return new URLSearchParams(location.search).has("halloween"); } catch (e) { return false; }
  }
  function inWindow(d) {
    const m = d.getMonth(), day = d.getDate(); // getMonth()は0始まり: 9=10月, 10=11月
    return (m === 9 && day >= 24) || (m === 10 && day <= 2);
  }
  function dismissedThisSession() {
    try { return sessionStorage.getItem("gl_no_halloween") === "1"; } catch (e) { return false; }
  }
  function active() {
    if (forcedByUrl()) return true;
    if (dismissedThisSession()) return false;
    return inWindow(new Date());
  }
  // before=当日より前 / day=当日(期間外のURL強制時も含む) / after=当日より後
  function phase() {
    const d = new Date();
    if (!inWindow(d)) return "day";
    if (d.getMonth() === 10) return "after";
    return d.getDate() === 31 ? "day" : "before";
  }

  const MESSAGES = {
    before: "もうすぐハロウィン！ 夜のゲームセンターにおばけが出没中…見つけたらクリックしてみよう",
    day: "今日はハロウィン当日！ おばけを見つけて、お菓子をもらおう",
    after: "ハロウィンの余韻…まだおばけが残っているかも",
  };
  const TREATS = ["🍬 お菓子ゲット！", "🍫 チョコをもらった！", "🍭 キャンディーゲット！", "🍪 クッキーゲット！"];
  const TRICKS = [
    { emoji: "👻", toast: "👻 トリック！ びっくりした？" },
    { emoji: "🕷️", toast: "🕷️ トリック！ クモが降ってきた！" },
    { emoji: "🦇", toast: "🦇 トリック！ コウモリが通りすぎた！" },
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const toast = (msg) => { if (typeof GameExtras !== "undefined") GameExtras.showToast(msg); };

  function updateCandyLabel() {
    const el = document.getElementById("hwCandy");
    if (el) el.textContent = `🍬 ${Candy.get()}`;
  }

  function buildBanner() {
    const host = document.querySelector("main.container");
    if (!host) return;
    const el = document.createElement("section");
    el.className = "halloween-banner";
    el.setAttribute("aria-label", "ハロウィンイベント");
    el.innerHTML =
      `<span class="hw-title">🎃 HALLOWEEN NIGHT 🦇</span>` +
      `<span class="hw-msg">${MESSAGES[phase()]}</span>` +
      `<span class="hw-candy" id="hwCandy">🍬 ${Candy.get()}</span>` +
      `<button type="button" id="hwShop">お菓子ショップ</button>` +
      `<button type="button" id="hwDismiss">通常表示に戻す</button>`;
    host.insertBefore(el, host.firstChild);
    document.getElementById("hwShop").addEventListener("click", () => {
      if (typeof CandyShop !== "undefined") CandyShop.open();
    });
    document.getElementById("hwDismiss").addEventListener("click", () => {
      try { sessionStorage.setItem("gl_no_halloween", "1"); } catch (e) {}
      location.reload();
    });
  }

  function pumpkinRain() {
    const box = document.createElement("div");
    box.className = "confetti-box";
    const items = ["🎃", "🍬", "🦇", "👻", "🍭"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("span");
      p.className = "emoji-rain-item";
      p.textContent = pick(items);
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.fontSize = 16 + Math.random() * 22 + "px";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
  }

  function treat(x, y) {
    const n = Candy.add(1);
    const pop = document.createElement("span");
    pop.className = "hw-pop";
    pop.textContent = "+1 🍬";
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1000);
    if (n % 5 === 0) {
      pumpkinRain();
      toast(`🎃 お菓子が${n}個になった！`);
    } else {
      toast(pick(TREATS));
    }
  }

  function trick() {
    const t = pick(TRICKS);
    const overlay = document.createElement("div");
    overlay.className = "hw-trick-overlay";
    overlay.innerHTML = `<div class="hw-trick-emoji">${t.emoji}</div><div class="hw-trick-text">TRICK!</div>`;
    document.body.appendChild(overlay);
    const grid = document.getElementById("gameGrid");
    if (grid) grid.classList.add("hw-shake");
    setTimeout(() => {
      overlay.remove();
      if (grid) grid.classList.remove("hw-shake");
    }, 1400);
    toast(t.toast);
  }

  function spawnGhost() {
    if (document.hidden) return;
    const g = document.createElement("button");
    g.type = "button";
    g.className = "hw-ghost" + (Math.random() < 0.5 ? " rtl" : "");
    g.textContent = pick(["👻", "👻", "🎃", "🦇"]);
    g.setAttribute("aria-label", "ハロウィンのおばけ(クリックでお菓子かイタズラ)");
    const dur = 7 + Math.random() * 4;
    g.style.setProperty("--dur", dur + "s");
    g.style.setProperty("--y", 15 + Math.random() * 60 + "vh");
    g.style.setProperty("--x", 10 + Math.random() * 75 + "vw");
    g.addEventListener("click", (e) => {
      const r = g.getBoundingClientRect();
      g.remove();
      if (Math.random() < 0.7) treat(r.left, r.top); else trick();
      e.stopPropagation();
    });
    document.body.appendChild(g);
    setTimeout(() => g.remove(), dur * 1000 + 500);
  }

  function scheduleGhosts() {
    const day = phase() === "day";
    const next = () => {
      const wait = day ? 10000 + Math.random() * 8000 : 18000 + Math.random() * 14000;
      setTimeout(() => { spawnGhost(); next(); }, wait);
    };
    setTimeout(() => { spawnGhost(); next(); }, 2500);
  }

  function init() {
    if (!active()) return;
    document.documentElement.classList.add("halloween");
    document.title = "🎃 " + document.title;
    const emoji = document.querySelector(".logo-emoji");
    if (emoji) emoji.textContent = "🎃";
    const insert = document.getElementById("heroInsert");
    if (insert) insert.textContent = "🎃 TRICK OR TREAT";
    const sub = document.getElementById("heroSub");
    if (sub) sub.textContent += " ─ HALLOWEEN NIGHT";
    const fog = document.createElement("div");
    fog.className = "hw-fog";
    document.body.appendChild(fog);
    buildBanner();
    Candy.onChange(updateCandyLabel);
    if (phase() === "day") pumpkinRain();
    scheduleGhosts();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { isActive: active, spawnGhost, treat, trick, pumpkinRain };
})();
