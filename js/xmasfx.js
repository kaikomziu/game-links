// ===== クリスマスの派手な演出(イルミネーション・夜空・サンタ大行進・開幕と当日の大演出・マイツリー・音) =====
// christmas.js / xmasshop.js の後に読み込まれる前提。Xmas.isActive() のときだけ動く。
// 「控えめ表示」(バナーのボタン。動きを減らす設定の端末は最初から控えめ)では、動きの大きいもの(夜空・流れ星・吹雪・大行進・花火・開幕演出)は出ない。
// 音は最初OFF。バナーの「音」ボタンを押した人にだけ鳴る(短いジングル風)。
const XmasFx = (() => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const K_SOUND = "gl_xmas_sound";
  const K_TREE_OFF = "gl_xmas_tree_off";
  const calm = () => Xmas.isCalm();
  const el = (cls, tag) => { const e = document.createElement(tag || "div"); e.className = cls; return e; };
  const COLORS = ["#ff4d5a", "#ffd166", "#5ee08a", "#8be9ff", "#ff9ad5", "#ffffff"];

  // =====================================================================
  // 音(WebAudio。ファイルは使わず、短い音をその場で作る)
  // =====================================================================
  let ac = null;
  let soundOn = store.get(K_SOUND) === "1";
  function ctx() {
    if (!soundOn) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function tone(c, freq, at, dur, gain) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    const t = c.currentTime + at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // ジングルベルの出だし(E E E, E E E, E G C D E)
  const JINGLE = [[659, 0, 0.18], [659, 0.22, 0.18], [659, 0.44, 0.4], [659, 0.88, 0.18], [659, 1.1, 0.18], [659, 1.32, 0.4], [659, 1.76, 0.18], [784, 1.98, 0.18], [523, 2.2, 0.28], [587, 2.5, 0.12], [659, 2.66, 0.6]];
  function sfx(kind) {
    const c = ctx();
    if (!c) return;
    if (kind === "gift") { tone(c, 880, 0, 0.12, 0.05); tone(c, 1175, 0.07, 0.16, 0.05); }
    else if (kind === "door") { [659, 784, 988].forEach((f, i) => tone(c, f, i * 0.09, 0.2, 0.06)); }
    else if (kind === "buy") { [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.08, 0.2, 0.06)); }
    else if (kind === "jingle") { JINGLE.forEach((n) => tone(c, n[0], n[1], n[2] + 0.1, 0.06)); }
  }
  function updateSoundBtn() {
    const b = document.getElementById("xmSoundBtn");
    if (!b) return;
    b.textContent = soundOn ? "🔔 音ON" : "🔇 音";
    b.setAttribute("aria-pressed", soundOn ? "true" : "false");
  }
  function toggleSound() {
    soundOn = !soundOn;
    store.set(K_SOUND, soundOn ? "1" : "0");
    updateSoundBtn();
    if (soundOn) sfx("jingle"); // ボタンを押した操作の中で鳴らす(ブラウザの自動再生の決まり)
  }

  // =====================================================================
  // イルミネーション(画面の上の電飾)・夜空(オーロラ・流れ星)・吹雪
  // =====================================================================
  function buildLights() {
    const box = el("xm-lights");
    box.setAttribute("aria-hidden", "true");
    ["a r", "b y", "a g", "b c"].forEach((c) => box.appendChild(el("xm-bulbs " + c, "i")));
    document.body.appendChild(box);
  }
  function buildAurora() {
    const box = el("xm-aurora");
    box.setAttribute("aria-hidden", "true");
    box.appendChild(el("g1", "i"));
    box.appendChild(el("g2", "i"));
    document.body.appendChild(box);
  }
  function meteor() {
    if (document.hidden || calm()) return;
    const m = el("xm-meteor", "i");
    m.style.left = rnd(30, 100) + "vw";
    m.style.top = rnd(2, 32) + "vh";
    document.body.appendChild(m);
    setTimeout(() => m.remove(), 1400);
  }
  function blizzard() {
    if (document.hidden || calm()) return;
    if (Xmas.blizzard(12000)) Xmas.toast("❄ 吹雪だ！ しばらく雪がすごいよ");
  }

  // =====================================================================
  // 重い端末の自動対策: 開いて10秒後に4秒間コマ数を測り、20fps未満なら自動で控えめにする(本人が「派手に」を選んでいたら下げない)
  // =====================================================================
  function checkFps(fps) {
    if (fps < 20 && !calm() && store.get("gl_xmas_calm") !== "0") { Xmas.autoCalm(); return true; }
    return false;
  }
  function watchFps() {
    if (store.get("gl_xmas_calm") === "0") return;
    setTimeout(() => {
      if (document.hidden || calm()) return;
      let frames = 0, away = false;
      const t0 = performance.now();
      const onVis = () => { away = true; };
      document.addEventListener("visibilitychange", onVis);
      const tick = () => {
        frames++;
        const ms = performance.now() - t0;
        if (ms < 4000) { requestAnimationFrame(tick); return; }
        document.removeEventListener("visibilitychange", onVis);
        if (!away) checkFps(frames / (ms / 1000)); // 別のタブに行った間は測り直さない(止まって見えるだけなので)
      };
      requestAnimationFrame(tick);
    }, 10000);
  }

  // =====================================================================
  // 花火(絵文字ではなく小さな粒。1回の打ち上げで28粒)
  // =====================================================================
  function firework(x, y) {
    const color = pick(COLORS), color2 = pick(COLORS);
    const box = el("xm-fw");
    box.style.left = x + "px";
    box.style.top = y + "px";
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("i");
      const a = (Math.PI * 2 * i) / 28 + rnd(-0.1, 0.1), r = rnd(70, 150);
      p.style.setProperty("--dx", Math.cos(a) * r + "px");
      p.style.setProperty("--dy", Math.sin(a) * r + 30 + "px");
      p.style.setProperty("--c", i % 2 ? color : color2);
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1500);
  }
  function fireworkShow(n) {
    if (calm()) return;
    for (let i = 0; i < n; i++) {
      setTimeout(() => firework(rnd(0.12, 0.88) * window.innerWidth, rnd(0.12, 0.5) * window.innerHeight), i * 450 + rnd(0, 250));
    }
  }
  function scheduleFireworks() {
    const festive = Xmas.phase() === "day" || (Xmas.now().getMonth() === 0 && Xmas.now().getDate() <= 3);
    if (!festive) return;
    const next = () => setTimeout(() => { if (!document.hidden) fireworkShow(2); next(); }, rnd(11000, 18000));
    next();
  }

  // =====================================================================
  // サンタ大行進: 大きなそりとトナカイが横切って、プレゼントをばらまく(落ちてくるのをクリックで拾う)
  // =====================================================================
  let paradeBusy = false;
  function parade() {
    if (document.hidden || calm() || paradeBusy) return;
    paradeBusy = true;
    const rtl = Math.random() < 0.5;
    const box = el("xm-parade" + (rtl ? " rtl" : ""));
    box.setAttribute("aria-hidden", "true");
    box.style.setProperty("--y", rnd(10, 45).toFixed(0) + "vh");
    const dur = rnd(14, 18);
    box.style.setProperty("--dur", dur.toFixed(1) + "s");
    box.innerHTML = '<span class="row"><i>🦌</i><i>🦌</i><i>🦌</i><i class="sleigh">🛷</i><i>🎅</i></span>';
    document.body.appendChild(box);
    Xmas.toast("🎅 サンタ大行進だ！ 落ちてくるプレゼントを拾おう");
    sfx("jingle");
    const sleigh = box.querySelector(".sleigh");
    let drops = 0;
    const timer = setInterval(() => {
      if (drops >= 14) { clearInterval(timer); return; }
      const r = sleigh.getBoundingClientRect();
      if (r.right < 0 || r.left > window.innerWidth) return; // まだ画面の外
      drops++;
      dropGift(r.left + r.width / 2, r.top + r.height);
    }, 800);
    setTimeout(() => { clearInterval(timer); box.remove(); paradeBusy = false; }, dur * 1000 + 800);
  }
  function dropGift(x, y) {
    const gold = Math.random() < 0.15;
    const g = el("xm-drop" + (gold ? " gold" : ""), "button");
    g.type = "button";
    g.textContent = gold ? "🎁" : pick(["🎁", "🎁", "🍬", "⭐"]);
    g.setAttribute("aria-label", gold ? "金のプレゼント(2個)" : "プレゼント");
    g.style.left = x + "px";
    g.style.top = y + "px";
    g.style.setProperty("--fall", Math.max(120, window.innerHeight - y - 30) + "px");
    g.style.setProperty("--tilt", rnd(-40, 40).toFixed(0) + "deg");
    g.addEventListener("click", (e) => {
      const r = g.getBoundingClientRect();
      g.remove();
      Xmas.giveGifts(gold ? 2 : 1, r.left, r.top);
      e.stopPropagation();
    });
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 5200);
  }
  function scheduleParade(first) {
    const busy = Xmas.phase() === "day";
    const next = (ms) => setTimeout(() => { parade(); next(busy ? rnd(42000, 60000) : rnd(80000, 120000)); }, ms);
    next(first || 22000);
  }

  // =====================================================================
  // 開幕・当日の大演出(その日の最初の訪問で1回。「あそぶ」で閉じる。自動でも閉じる)
  // =====================================================================
  function dateKey(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function introTexts() {
    const d = Xmas.now(), ph = Xmas.phase(), day = d.getDate(), m = d.getMonth() + 1;
    if (ph === "day") return { title: "MERRY CHRISTMAS!", sub: `${m}月${day}日 ─ 今日は特別な日。サンタ大行進と花火の日だよ`, fw: true };
    if (ph === "after") return { title: "HAPPY HOLIDAYS", sub: day === 31 ? "今年もありがとう。良いお年を！" : "クリスマスのあとも、冬のゲームセンターは営業中", fw: day === 31 };
    if (ph === "winter") {
      if (day <= 3) return { title: `HAPPY NEW YEAR ${d.getFullYear()}`, sub: "あけましておめでとう。今年もよろしくね", fw: true };
      return { title: "WINTER ARCADE", sub: "冬のイベントは1月いっぱい。残りのプレゼントを集めよう", fw: false };
    }
    const left = Math.max(0, Math.round((new Date(d.getFullYear(), 11, 25) - new Date(d.getFullYear(), d.getMonth(), day)) / 86400000));
    return { title: `${m}月${day}日`, sub: left > 0 ? `クリスマスまで あと ${left} 日！ 今日のアドベントの窓を開けよう` : "今日はクリスマス！", fw: false };
  }
  function maybeIntro() {
    if (calm()) return false;
    const forced = Xmas.forced();
    const key = dateKey(forced ? Xmas.now() : new Date());
    const seenKey = forced ? "gl_xmas_intro_s" : "gl_xmas_intro";
    let seen = null;
    try { seen = forced ? sessionStorage.getItem(seenKey) : localStorage.getItem(seenKey); } catch (e) {}
    if (seen === key) return false;
    try { if (forced) sessionStorage.setItem(seenKey, key); else localStorage.setItem(seenKey, key); } catch (e) {}
    const t = introTexts();
    const o = el("xm-intro");
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-label", "クリスマスのお知らせ");
    o.innerHTML = `
      <div class="xm-intro-inner">
        <div class="xm-intro-star">🎄 ⭐ 🎅 ⭐ 🎄</div>
        <div class="xm-intro-title"></div>
        <div class="xm-intro-sub"></div>
        <div class="xm-intro-btns"><button type="button" data-a="advent">アドベントを開く</button><button type="button" data-a="close" class="pri">あそぶ</button></div>
      </div>`;
    o.querySelector(".xm-intro-title").textContent = t.title;
    o.querySelector(".xm-intro-sub").textContent = t.sub;
    document.body.appendChild(o);
    let closed = false;
    const close = (after) => {
      if (closed) return;
      closed = true;
      o.classList.add("out");
      setTimeout(() => { o.remove(); if (after) after(); }, 450);
      document.removeEventListener("keydown", onKey, true);
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey, true);
    o.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && b.dataset.a === "advent") close(() => { if (typeof XmasShop !== "undefined") XmasShop.openAdvent(); });
      else if (b || e.target === o) close();
    });
    setTimeout(() => close(), 9000);
    Xmas.giftRain();
    if (t.fw) fireworkShow(6);
    return true;
  }

  // =====================================================================
  // マイツリー: 開けたアドベントの窓の数だけ電球が灯り、買ったものが飾られ、プレゼントが増えるとツリーの下に並ぶ
  // =====================================================================
  const ROWS = [1, 2, 3, 4, 4, 5, 5]; // 合計24 = アドベントの窓の数
  function bulbSlots() {
    const out = [];
    ROWS.forEach((n, r) => {
      const y = 58 + r * 26, hw = 8 + (y - 50) * 0.4;
      for (let i = 0; i < n; i++) out.push([Math.round(n === 1 ? 100 : 100 - hw * 0.78 + (i * 1.56 * hw) / (n - 1)), y]);
    });
    return out;
  }
  const SLOTS = bulbSlots();
  const BULB = ["#ff4d5a", "#ffd166", "#8be9ff", "#ff9ad5", "#ffffff"];
  const PRESENTS = [[56, 236, "#e63946"], [144, 236, "#5ee08a"], [78, 240, "#ffd166"], [122, 240, "#8be9ff"], [66, 228, "#ff9ad5"], [134, 228, "#e63946"], [100, 242, "#5ee08a"], [100, 232, "#ffd166"]];
  let uid = 0;
  function treeInfo() {
    const year = Xmas.seasonYear();
    const opened = XmasStore.opened(year);
    const owned = XmasStore.owned();
    const level = 1 + Math.floor((opened.length + owned.length) / 4);
    return { year, opened, owned, level, gifts: XmasStore.get() };
  }
  function treeSvg() {
    const t = treeInfo();
    const id = "xmg" + ++uid;
    const has = (x) => XmasStore.has(x);
    const parts = [];
    parts.push(`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34b566"/><stop offset="1" stop-color="#12613a"/></linearGradient></defs>`);
    parts.push(`<rect x="88" y="224" width="24" height="24" rx="3" fill="#6b3f1d"/>`);
    [[100, 26, 152, 100, 48, 100], [100, 62, 170, 160, 30, 160], [100, 102, 190, 228, 10, 228]].forEach((p) => {
      parts.push(`<polygon points="${p[0]},${p[1]} ${p[2]},${p[3]} ${p[4]},${p[5]}" fill="url(#${id})" stroke="#0b3d24" stroke-width="2" stroke-linejoin="round"/>`);
    });
    // 灯った電球は3グループにまとめて、グループごとに瞬かせる(1つずつアニメにしない)
    const lit = [[], [], []];
    SLOTS.forEach((s, i) => {
      if (t.opened.includes(i + 1)) lit[i % 3].push(`<circle cx="${s[0]}" cy="${s[1]}" r="6" fill="${BULB[i % BULB.length]}"/>`);
      else parts.push(`<circle cx="${s[0]}" cy="${s[1]}" r="2.5" fill="#0b3d24"/>`);
    });
    lit.forEach((g, k) => { if (g.length) parts.push(`<g class="xm-bgrp b${k}">${g.join("")}</g>`); });
    parts.push(`<text x="100" y="32" text-anchor="middle" font-size="28">${has("master") ? "👑" : has("orn-2026") ? "⭐" : "✨"}</text>`);
    if (has("palette")) { parts.push(`<text x="64" y="140" font-size="18">🔔</text>`, `<text x="120" y="190" font-size="18">🔔</text>`); }
    if (has("snow")) { parts.push(`<text x="14" y="60" font-size="16">❄️</text>`, `<text x="168" y="80" font-size="16">❄️</text>`); }
    if (has("snowman")) parts.push(`<text x="14" y="246" font-size="26">⛄</text>`);
    if (has("reindeer")) parts.push(`<text x="160" y="246" font-size="26">🦌</text>`);
    if (has("hat-2026")) parts.push(`<text x="104" y="214" font-size="20">🎅</text>`);
    if (has("tree-logo")) parts.push(`<text x="40" y="214" font-size="18">🎄</text>`);
    const n = Math.min(PRESENTS.length, Math.floor(t.gifts / 5));
    for (let i = 0; i < n; i++) {
      const p = PRESENTS[i];
      parts.push(`<rect x="${p[0] - 9}" y="${p[1] - 7}" width="18" height="14" rx="2" fill="${p[2]}"/><rect x="${p[0] - 1.5}" y="${p[1] - 7}" width="3" height="14" fill="#fff" opacity=".85"/>`);
    }
    return `<svg viewBox="0 0 200 260" role="img" aria-label="マイツリー(レベル${t.level})">${parts.join("")}</svg>`;
  }
  let cornerKey = "";
  function renderCorner() {
    let box = document.getElementById("xmTreeBox");
    const off = store.get(K_TREE_OFF) === "1";
    if (off || !Xmas.isActive()) { if (box) box.remove(); cornerKey = ""; return; }
    const t = treeInfo();
    const key = [t.opened.join(","), t.owned.join(","), Math.floor(t.gifts / 5)].join("|"); // プレゼントは5個ごとにしか絵が変わらない
    if (box && key === cornerKey) return;
    cornerKey = key;
    if (!box) {
      box = el("xm-tree-box", "button");
      box.id = "xmTreeBox";
      box.type = "button";
      box.setAttribute("aria-label", "マイツリーを開く");
      box.addEventListener("click", openTree);
      document.body.appendChild(box);
    }
    box.innerHTML = treeSvg();
  }
  function openTree() {
    let modal = document.getElementById("xmTreeModal");
    if (!modal) {
      modal = el("rp-modal cs-modal");
      modal.id = "xmTreeModal";
      modal.innerHTML = `
        <div class="rp-backdrop" data-close></div>
        <div class="rp-dialog cs-dialog xm-tree-dialog" role="dialog" aria-modal="true" aria-label="マイツリー">
          <button class="rp-close" data-close aria-label="閉じる">×</button>
          <p class="rp-caption">🎄 マイツリー <span class="xm-tree-lv"></span></p>
          <div class="xm-tree-big"></div>
          <p class="cs-balance xm-tree-stat"></p>
          <p class="cs-note">アドベントの窓を開けると、ツリーの電球が1つずつ灯ります(全部で24個)。プレゼントが5個たまるごとに、ツリーの下にプレゼントが増えます。ショップで買ったものも飾られます。</p>
          <label class="xm-tree-opt"><input type="checkbox" id="xmTreeCorner"> 画面の角に小さなツリーを出す</label>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeTree(); });
      modal.querySelector("#xmTreeCorner").addEventListener("change", (e) => {
        store.set(K_TREE_OFF, e.target.checked ? "0" : "1");
        renderCorner();
      });
    }
    renderTreeModal();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeTree() {
    const m = document.getElementById("xmTreeModal");
    if (m) m.classList.remove("open");
    if (!document.querySelector(".rp-modal.open")) document.body.style.overflow = "";
  }
  function renderTreeModal() {
    const m = document.getElementById("xmTreeModal");
    if (!m) return;
    const t = treeInfo();
    m.querySelector(".xm-tree-big").innerHTML = treeSvg();
    m.querySelector(".xm-tree-lv").textContent = `Lv.${t.level}`;
    m.querySelector(".xm-tree-stat").innerHTML = `${t.year}年 開けた窓 <b>${t.opened.length}</b>/24 ・ 持っているアイテム <b>${t.owned.length}</b> ・ プレゼント <b>${t.gifts}</b>🎁`;
    m.querySelector("#xmTreeCorner").checked = store.get(K_TREE_OFF) !== "1";
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTree(); });
  // 別のタブを見ている間は、CSSの動きも止める(CPU・GPUと電池を使わない)
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("xm-away", document.hidden);
  });

  // =====================================================================
  function init() {
    if (!Xmas.isActive()) return;
    updateSoundBtn();
    buildLights();
    renderCorner();
    XmasStore.onChange(() => {
      renderCorner();
      const m = document.getElementById("xmTreeModal");
      if (m && m.classList.contains("open")) renderTreeModal();
    });
    if (calm()) return; // 控えめ表示: 電飾(止まったまま)とツリーだけ
    buildAurora();
    setInterval(meteor, 9000);
    setTimeout(meteor, 3500);
    const stormEvery = Xmas.phase() === "day" ? 90000 : 150000;
    setInterval(blizzard, stormEvery);
    scheduleFireworks();
    const introShown = maybeIntro();
    scheduleParade(introShown ? 14000 : 22000);
    watchFps();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { sfx, toggleSound, checkFps, parade, firework, fireworkShow, blizzard, meteor, openTree, closeTree, maybeIntro, isSoundOn: () => soundOn };
})();
