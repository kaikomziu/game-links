// ===== クリスマスイベント(毎年 12/1〜1/31 に自動で始まって終わる) =====
// 発動条件:
//   ①URLに ?christmas を付ける(いつでも手動で確認できる。?christmas=12-24 のように日付も指定できる。省略時は 12/24 扱い)
//   ②実際の端末の日付が 12/1〜1/31(自動で有効になる)
// 「通常表示に戻す」を押すと、このセッション中だけ通常表示に戻せる(?christmas 指定時は常に優先)。
// 内容: 冬の夜の配色、降る雪、時々画面を横切るサンタ(クリックでプレゼント)、プレゼントカウンター、アドベントカレンダー、ショップ。
// 保存: プレゼント・買ったもの・開けた窓は localStorage(gl_xmas_*)。年をまたいで残る。
// 毎年の追加: xmasshop.js の YEAR_ITEMS に、その年の限定アイテムを足すだけ(ふつうのアイテムは毎年出る)。
// main.js / extras.js の後に読み込まれる前提(xmasshop.js より前)。

// ---- プレゼントと持ち物の保存(ハロウィンの Candy と同じ作り) ----
const XmasStore = (() => {
  const K_GIFT = "gl_xmas_gifts";
  const K_OWNED = "gl_xmas_owned";
  const K_ON = "gl_xmas_on";
  const K_ADVENT = "gl_xmas_advent"; // { "2026": [1, 2, 3] }
  const listeners = [];
  const state = { gifts: 0, owned: [], on: [], advent: {} };

  function readJson(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function load() {
    try { state.gifts = parseInt(localStorage.getItem(K_GIFT), 10) || 0; } catch (e) { state.gifts = 0; }
    const o = readJson(K_OWNED, []); state.owned = Array.isArray(o) ? o.filter((x) => typeof x === "string") : [];
    const n = readJson(K_ON, []); state.on = Array.isArray(n) ? n.filter((x) => typeof x === "string") : [];
    const a = readJson(K_ADVENT, {}); state.advent = a && typeof a === "object" && !Array.isArray(a) ? a : {};
  }
  function notify() { listeners.forEach((fn) => { try { fn(); } catch (e) {} }); }
  function save() {
    try {
      localStorage.setItem(K_GIFT, String(state.gifts));
      localStorage.setItem(K_OWNED, JSON.stringify(state.owned));
      localStorage.setItem(K_ON, JSON.stringify(state.on));
      localStorage.setItem(K_ADVENT, JSON.stringify(state.advent));
    } catch (e) {}
    notify();
  }
  load();
  // 別タブで貯めた/買った内容にも追従する
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.indexOf("gl_xmas") === 0) { load(); notify(); }
  });

  return {
    get: () => state.gifts,
    add(n) { state.gifts += n; save(); return state.gifts; },
    spend(n) {
      if (state.gifts < n) return false;
      state.gifts -= n;
      save();
      return true;
    },
    owned: () => state.owned.slice(),
    has: (id) => state.owned.includes(id),
    isOn: (id) => state.owned.includes(id) && state.on.includes(id),
    own(id) {
      if (!state.owned.includes(id)) state.owned.push(id);
      if (!state.on.includes(id)) state.on.push(id);
      save();
    },
    setOn(id, on) {
      state.on = state.on.filter((x) => x !== id);
      if (on) state.on.push(id);
      save();
    },
    // アドベントカレンダー: その年に開けた窓(1〜24)
    opened(year) { const a = state.advent[String(year)]; return Array.isArray(a) ? a.slice() : []; },
    markOpened(year, day) {
      const k = String(year);
      const a = Array.isArray(state.advent[k]) ? state.advent[k] : [];
      if (!a.includes(day)) a.push(day);
      state.advent[k] = a;
      save();
    },
    onChange: (fn) => { listeners.push(fn); },
  };
})();

const Xmas = (() => {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const toast = (msg) => { if (typeof GameExtras !== "undefined") GameExtras.showToast(msg); };

  // ---- 日付まわり ----
  function params() { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(""); } }
  function forcedByUrl() { return params().has("christmas"); }
  function inWindow(d) { const m = d.getMonth(); return m === 11 || m === 0; } // 12月と1月
  // 「いま」: ?christmas=12-10 のように日付を指定すると、その日として動く(確認用)。期間外の ?christmas は 12/24 扱い
  function now() {
    const real = new Date();
    if (!forcedByUrl()) return real;
    const v = params().get("christmas") || "";
    const m = v.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (m) {
      const d = new Date(real.getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
      if (!isNaN(d)) return d;
    }
    return inWindow(real) ? real : new Date(real.getFullYear(), 11, 24);
  }
  // 12月のうちはその年、1月は前の年の「シーズン」(2027年1月 = 2026年のクリスマスシーズン)
  function seasonYear() { const d = now(); return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(); }
  function dismissedThisSession() {
    try { return sessionStorage.getItem("gl_no_christmas") === "1"; } catch (e) { return false; }
  }
  function active() {
    if (forcedByUrl()) return true;
    if (dismissedThisSession()) return false;
    return inWindow(new Date());
  }
  // advent=12/1〜23 / day=12/24〜25 / after=12/26〜31 / winter=1月
  function phase() {
    const d = now(), m = d.getMonth(), day = d.getDate();
    if (m === 0) return "winter";
    if (day <= 23) return "advent";
    if (day <= 25) return "day";
    return "after";
  }
  // アドベントの窓は、その日以前のものが開けられる(12/26 以降〜1月は全部。開け忘れても取り返せる)
  function adventUnlockedDay() {
    const d = now();
    if (d.getMonth() === 0 || d.getDate() > 24) return 24;
    return d.getDate();
  }

  const MESSAGES = {
    advent: "クリスマスまでカウントダウン！ 毎日アドベントカレンダーの窓を開けて、サンタを見つけたらクリックしよう",
    day: "メリークリスマス！ 今日はサンタがたくさん来ているよ",
    after: "クリスマスの余韻…まだサンタが残っているかも。アドベントの開け忘れもまだ間に合うよ",
    winter: "冬のゲームセンターは1月いっぱい。雪の中を、ときどきサンタが通るよ",
  };
  const TITLES = {
    advent: "🎄 MERRY CHRISTMAS 🎅",
    day: "🎄 MERRY CHRISTMAS 🎅",
    after: "🎄 MERRY CHRISTMAS 🎅",
    winter: "❄ WINTER ARCADE ⛄",
  };
  const GET = ["🎁 プレゼントゲット！", "🎁 リボンつきのプレゼントをもらった！", "🎁 サンタさんからのプレゼント！", "🎁 いい子にしてたからプレゼント！"];

  // ---- 控えめ表示(動きが苦手な人・重い端末向け)。動きを減らす設定の端末では最初から控えめ ----
  function isCalm() {
    if (reduceMotion) return true;
    try { return localStorage.getItem("gl_xmas_calm") === "1"; } catch (e) { return false; }
  }
  function setCalm(on) {
    try { localStorage.setItem("gl_xmas_calm", on ? "1" : "0"); } catch (e) {}
  }

  // ---- 雪 ----
  let snowBox = null;
  function startSnow() {
    if (snowBox || reduceMotion) return;
    snowBox = document.createElement("div");
    snowBox.className = "xm-snow";
    snowBox.setAttribute("aria-hidden", "true");
    const small = window.innerWidth < 700;
    const n = isCalm() ? 14 : small ? 30 : 64;
    for (let i = 0; i < n; i++) {
      const f = document.createElement("span");
      f.textContent = Math.random() < 0.8 ? "❄" : "❅";
      f.style.left = (Math.random() * 100).toFixed(1) + "vw";
      f.style.fontSize = (9 + Math.random() * 14).toFixed(0) + "px";
      f.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
      f.style.animationDuration = (9 + Math.random() * 12).toFixed(1) + "s, " + (3 + Math.random() * 3).toFixed(1) + "s";
      f.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s, " + (-Math.random() * 4).toFixed(1) + "s";
      snowBox.appendChild(f);
    }
    document.body.appendChild(snowBox);
  }
  function stopSnow() {
    if (snowBox) { snowBox.remove(); snowBox = null; }
  }

  // ---- プレゼントの雨 ----
  function giftRain() {
    const box = document.createElement("div");
    box.className = "confetti-box";
    const items = ["🎁", "🎄", "⭐", "❄️", "🔔", "🍬"];
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

  function updateGiftLabel() {
    const el = document.getElementById("xmGift");
    if (el) el.textContent = `🎁 ${XmasStore.get()}`;
  }

  function popAt(x, y, text) {
    const pop = document.createElement("span");
    pop.className = "xm-pop";
    pop.textContent = text;
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1000);
  }

  // プレゼントを増やす(n個)。5の倍数をまたいだら雨
  function giveGifts(n, x, y, label) {
    const before = XmasStore.get();
    const total = XmasStore.add(n);
    if (typeof XmasFx !== "undefined") XmasFx.sfx("gift");
    if (x !== undefined) popAt(x, y, `+${n} 🎁`);
    if (Math.floor(total / 5) > Math.floor(before / 5)) {
      giftRain();
      toast(`🎄 プレゼントが${total}個になった！`);
    } else if (label) {
      toast(label);
    }
    return total;
  }

  // ---- 横切るサンタ ----
  function spawnSanta() {
    if (document.hidden) return;
    const g = document.createElement("button");
    g.type = "button";
    const golden = Math.random() < 0.12; // たまに金のプレゼント(3個)
    g.className = "xm-santa" + (Math.random() < 0.5 ? " rtl" : "") + (golden ? " gold" : "");
    g.textContent = golden ? "🎁" : pick(["🎅", "🎅", "🛷", "🦌"]);
    g.setAttribute("aria-label", golden ? "金のプレゼント(クリックで3個もらえる)" : "サンタ(クリックでプレゼント)");
    const dur = 7 + Math.random() * 4;
    g.style.setProperty("--dur", dur + "s");
    g.style.setProperty("--y", 15 + Math.random() * 60 + "vh");
    g.style.setProperty("--x", 10 + Math.random() * 75 + "vw");
    g.addEventListener("click", (e) => {
      const r = g.getBoundingClientRect();
      g.remove();
      giveGifts(golden ? 3 : 1, r.left, r.top, golden ? "✨ 金のプレゼント！ 3個ゲット！" : pick(GET));
      e.stopPropagation();
    });
    document.body.appendChild(g);
    setTimeout(() => g.remove(), dur * 1000 + 500);
  }
  function scheduleSantas() {
    const busy = phase() === "day";
    const next = () => {
      const wait = busy ? 9000 + Math.random() * 7000 : 17000 + Math.random() * 13000;
      setTimeout(() => { spawnSanta(); next(); }, wait);
    };
    setTimeout(() => { spawnSanta(); next(); }, 2500);
  }

  function buildBanner() {
    const host = document.querySelector("main.container");
    if (!host) return;
    const el = document.createElement("section");
    el.className = "christmas-banner";
    el.setAttribute("aria-label", "クリスマスイベント");
    el.innerHTML =
      `<span class="xm-title">${TITLES[phase()]}</span>` +
      `<span class="xm-msg">${MESSAGES[phase()]}</span>` +
      `<span class="xm-gift" id="xmGift">🎁 ${XmasStore.get()}</span>` +
      `<button type="button" id="xmAdventBtn">アドベント</button>` +
      `<button type="button" id="xmShopBtn">ショップ</button>` +
      `<button type="button" id="xmTreeBtn">🎄マイツリー</button>` +
      `<button type="button" id="xmSoundBtn" aria-pressed="false">🔇 音</button>` +
      `<button type="button" id="xmCalmBtn" title="動きを控えめにする/派手に戻す">${isCalm() ? "✨ 派手に" : "🌙 控えめ"}</button>` +
      `<button type="button" id="xmDismiss">通常表示に戻す</button>`;
    host.insertBefore(el, host.firstChild);
    document.getElementById("xmAdventBtn").addEventListener("click", () => {
      if (typeof XmasShop !== "undefined") XmasShop.openAdvent();
    });
    document.getElementById("xmShopBtn").addEventListener("click", () => {
      if (typeof XmasShop !== "undefined") XmasShop.open();
    });
    document.getElementById("xmTreeBtn").addEventListener("click", () => {
      if (typeof XmasFx !== "undefined") XmasFx.openTree();
    });
    document.getElementById("xmSoundBtn").addEventListener("click", () => {
      if (typeof XmasFx !== "undefined") XmasFx.toggleSound();
    });
    document.getElementById("xmCalmBtn").addEventListener("click", () => {
      if (reduceMotion) { toast("この端末は「動きを減らす」設定のため、いつも控えめ表示です"); return; }
      setCalm(!isCalm());
      location.reload();
    });
    document.getElementById("xmDismiss").addEventListener("click", () => {
      try { sessionStorage.setItem("gl_no_christmas", "1"); } catch (e) {}
      location.reload();
    });
  }

  function init() {
    if (!active()) return;
    document.documentElement.classList.add("christmas");
    if (isCalm()) document.documentElement.classList.add("xm-calm");
    document.title = "🎄 " + document.title;
    const insert = document.getElementById("heroInsert");
    if (insert) insert.textContent = "🎄 MERRY CHRISTMAS";
    const sub = document.getElementById("heroSub");
    if (sub) sub.textContent += " ─ CHRISTMAS ARCADE";
    startSnow();
    buildBanner();
    XmasStore.onChange(updateGiftLabel);
    if (phase() === "day") giftRain();
    scheduleSantas();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    isActive: active, phase, now, seasonYear, adventUnlockedDay,
    startSnow, stopSnow, giftRain, spawnSanta, giveGifts, reduceMotion, isCalm, toast, popAt,
  };
})();
