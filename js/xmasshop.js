// ===== クリスマスのショップ & アドベントカレンダー =====
// サンタ(christmas.js)とアドベントカレンダーでもらったプレゼントで買えるアイテム。
// プレゼントが貯まるのはクリスマス期間(12/1〜1/31)だけだが、買ったものは期間外もずっと使える。
// 毎年少しずつ変える: YEAR_ITEMS にその年の限定アイテムを足す(その年のシーズン中だけ買える。買った人は翌年以降も持ち続ける)。
// christmas.js の後に読み込まれる前提。
const XmasShop = (() => {
  const reduceMotion = Xmas.reduceMotion;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const toast = (msg) => { if (typeof GameExtras !== "undefined") GameExtras.showToast(msg); };
  const root = document.documentElement;

  // ---- ロゴの飾り: サンタ帽 / ツリー / 王冠(ロゴ画像の上に重ねる)。クリスマス期間中はツリーが自動で立つ ----
  function refreshLogo() {
    const logo = document.querySelector(".logo");
    if (!logo) return;
    const hat = XmasStore.isOn("hat-2026");
    const tree = XmasStore.isOn("tree-logo") || Xmas.isActive();
    const crown = XmasStore.isOn("master");
    let deco = logo.querySelector(".xm-logo-deco");
    if (!hat && !tree && !crown) { if (deco) deco.remove(); return; }
    if (!deco) {
      deco = document.createElement("span");
      deco.className = "xm-logo-deco";
      deco.setAttribute("aria-hidden", "true");
      logo.appendChild(deco);
    }
    deco.innerHTML = (hat ? '<i class="hat">🎅</i>' : "") + (tree ? '<i class="tree">🎄</i>' : "") + (crown ? '<i class="crown">👑</i>' : "");
  }

  // ---- ゆきだるまのおとも: マウスカーソルをゆっくり追いかける ----
  let buddy = null;
  let buddyRaf = 0;
  function startBuddy() {
    if (buddy) return;
    buddy = document.createElement("div");
    buddy.className = "xm-buddy";
    buddy.textContent = "⛄";
    document.body.appendChild(buddy);
    if (reduceMotion) return;
    let x = window.innerWidth - 70, y = window.innerHeight - 70;
    let tx = x, ty = y;
    const onMove = (e) => { tx = e.clientX + 18; ty = e.clientY + 18; };
    document.addEventListener("mousemove", onMove);
    buddy._onMove = onMove;
    const tick = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      buddy.style.transform = `translate(${x}px, ${y}px)`;
      buddyRaf = requestAnimationFrame(tick);
    };
    tick();
  }
  function stopBuddy() {
    if (!buddy) return;
    cancelAnimationFrame(buddyRaf);
    if (buddy._onMove) document.removeEventListener("mousemove", buddy._onMove);
    buddy.remove();
    buddy = null;
  }

  // ---- トナカイの群れ: ときどき数頭が画面を横切る ----
  let deerTimer = 0;
  function flyDeer() {
    if (document.hidden) return;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const b = document.createElement("span");
      b.className = "xm-deer" + (Math.random() < 0.5 ? " rtl" : "");
      b.textContent = "🦌";
      const dur = 5 + Math.random() * 3;
      b.style.setProperty("--dur", dur + "s");
      b.style.setProperty("--y", 10 + Math.random() * 70 + "vh");
      b.style.animationDelay = Math.random() * 1.2 + "s, 0s";
      document.body.appendChild(b);
      setTimeout(() => b.remove(), (dur + 1.5) * 1000);
    }
  }
  function startDeer() {
    if (deerTimer || reduceMotion) return;
    setTimeout(flyDeer, 4000);
    deerTimer = setInterval(flyDeer, 40000);
  }
  function stopDeer() {
    clearInterval(deerTimer);
    deerTimer = 0;
  }

  // ---- アイテム ----
  // ふつうのアイテム(毎年買える)
  const BASE_ITEMS = [
    {
      id: "tree-logo", emoji: "🎄", name: "ツリーロゴ", price: 5,
      desc: "ロゴのそばに、小さなクリスマスツリーがずっと立つ",
      apply: refreshLogo, remove: refreshLogo,
    },
    {
      id: "snow", emoji: "❄️", name: "雪の降る毎日", price: 8,
      desc: "クリスマス期間以外も、サイトにずっと雪が降る",
      apply() { Xmas.startSnow(); },
      remove() { if (!Xmas.isActive()) Xmas.stopSnow(); },
    },
    {
      id: "rain-toy", emoji: "🎁", name: "プレゼントの雨", price: 10,
      desc: "ボタンを押すと、いつでもプレゼントとツリーが降ってくる",
      toy: true,
    },
    {
      id: "snowman", emoji: "⛄", name: "ゆきだるまのおとも", price: 12,
      desc: "小さなゆきだるまがマウスカーソルを追いかけてくる",
      apply: startBuddy,
      remove: stopBuddy,
    },
    {
      id: "palette", emoji: "🔔", name: "クリスマスカラー", price: 15,
      desc: "サイト全体が赤×緑×金の冬の配色になる",
      apply() { root.classList.add("xm-palette"); },
      remove() { root.classList.remove("xm-palette"); },
    },
    {
      id: "reindeer", emoji: "🦌", name: "トナカイの群れ", price: 18,
      desc: "ときどきトナカイが数頭、画面を横切っていく",
      apply: startDeer,
      remove: stopDeer,
    },
    {
      id: "master", emoji: "👑", name: "クリスマスマスター", price: 30,
      desc: "ロゴの上に、金の王冠がのる(全部そろえた人のしるし)",
      apply: refreshLogo, remove: refreshLogo,
    },
  ];

  // その年だけ買える限定アイテム(毎年ここに足す。id は「名前-年」にして、年をまたいで重ならないようにする)
  const YEAR_ITEMS = {
    2026: [
      {
        id: "orn-2026", emoji: "⭐", name: "きらきらオーナメント", price: 20,
        desc: "ゲームカードの角に、金色の星のオーナメントがつく",
        apply() { root.classList.add("xm-orn"); },
        remove() { root.classList.remove("xm-orn"); },
      },
      {
        id: "hat-2026", emoji: "🎅", name: "サンタ帽ロゴ", price: 25,
        desc: "ロゴにサンタ帽がずっとかぶさる",
        apply: refreshLogo, remove: refreshLogo,
      },
    ],
  };
  const YEARS = Object.keys(YEAR_ITEMS).map(Number).sort((a, b) => b - a); // 新しい年が先
  YEARS.forEach((y) => YEAR_ITEMS[y].forEach((i) => { i.year = y; }));
  const ALL_ITEMS = BASE_ITEMS.concat(...YEARS.map((y) => YEAR_ITEMS[y]));
  const byId = (id) => ALL_ITEMS.find((i) => i.id === id);

  // 限定アイテムを買えるか: そのシーズン(その年の12/1〜翌1/31)の間だけ
  function canBuy(item) {
    if (!item.year) return true;
    return Xmas.isActive() && Xmas.seasonYear() === item.year;
  }

  // 適用済みの状態を覚えておき、買っていない項目で remove() が走って表示を壊さないようにする
  function syncPerk(item) {
    if (item.toy) return;
    const want = XmasStore.isOn(item.id);
    if (want && !item._applied) { item.apply(); item._applied = true; }
    else if (!want && item._applied) { item.remove(); item._applied = false; }
  }
  function syncAll() { ALL_ITEMS.forEach(syncPerk); refreshLogo(); }

  // ---- 共通 ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function makeModal(id, label, bodyHtml) {
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "rp-modal cs-modal";
    modal.innerHTML = `
      <div class="rp-backdrop" data-close></div>
      <div class="rp-dialog cs-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}">
        <button class="rp-close" data-close aria-label="閉じる">×</button>
        ${bodyHtml}
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("open");
    if (!document.querySelector(".rp-modal.open")) document.body.style.overflow = "";
  }
  function openModal(modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // ---- ショップ ----
  function itemButton(item) {
    if (!XmasStore.has(item.id)) {
      const ok = XmasStore.get() >= item.price && canBuy(item);
      return `<button type="button" class="cs-btn buy" data-act="buy" data-id="${item.id}" ${ok ? "" : "disabled"}>買う ${item.price}🎁</button>`;
    }
    if (item.toy) return `<button type="button" class="cs-btn use" data-act="use" data-id="${item.id}">降らせる</button>`;
    const on = XmasStore.isOn(item.id);
    return `<button type="button" class="cs-btn ${on ? "on" : "off"}" data-act="toggle" data-id="${item.id}">${on ? "ON ✓" : "OFF"}</button>`;
  }
  function itemRow(item) {
    const tag = item.year ? `<span class="xm-year">${item.year}年限定</span>` : "";
    return `
      <li class="cs-item${XmasStore.has(item.id) ? " owned" : ""}">
        <span class="cs-emoji">${item.emoji}</span>
        <div class="cs-info"><b>${escapeHtml(item.name)}${tag}</b><small>${escapeHtml(item.desc)}</small></div>
        ${itemButton(item)}
      </li>`;
  }
  function renderShop() {
    const modal = document.getElementById("xmShop");
    if (!modal) return;
    modal.querySelector(".cs-balance").innerHTML = `持っているプレゼント: <b>${XmasStore.get()}</b> 🎁`;
    // 先に「その年の限定」(目玉。そのシーズン中は全部見せる。過ぎたら、持っているものだけのコレクション)、そのあとにふつうのアイテム
    let html = "";
    YEARS.forEach((y) => {
      const items = YEAR_ITEMS[y].filter((i) => canBuy(i) || XmasStore.has(i.id));
      if (!items.length) return;
      html += `<li class="xm-sep">🌟 ${y}年のクリスマス限定${canBuy(items[0]) ? "(いまだけ)" : "(コレクション)"}</li>` + items.map(itemRow).join("");
    });
    html += `<li class="xm-sep">🎁 ふつうのアイテム(毎年買える)</li>` + BASE_ITEMS.map(itemRow).join("");
    modal.querySelector(".cs-list").innerHTML = html;
  }
  function openShop() {
    let modal = document.getElementById("xmShop");
    if (!modal) {
      modal = makeModal("xmShop", "クリスマスショップ", `
        <p class="rp-caption">🎁 クリスマスショップ</p>
        <p class="cs-balance"></p>
        <ul class="cs-list"></ul>
        <p class="cs-note">プレゼントは、クリスマス期間(12/1〜1/31)に出てくるサンタや、アドベントカレンダーからもらえます。買ったものは、期間外もずっと使えます。毎年、その年だけの限定アイテムが増えます。</p>`);
      modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close")) { closeModal("xmShop"); return; }
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const item = byId(btn.dataset.id);
        if (!item) return;
        const act = btn.dataset.act;
        if (act === "buy") {
          if (canBuy(item) && XmasStore.spend(item.price)) {
            XmasStore.own(item.id);
            syncPerk(item);
            refreshLogo();
            if (typeof XmasFx !== "undefined") XmasFx.sfx("buy");
            toast(`${item.emoji} 「${item.name}」を手に入れた！`);
          }
        } else if (act === "toggle") {
          XmasStore.setOn(item.id, !XmasStore.isOn(item.id));
          syncPerk(item);
          refreshLogo();
        } else if (act === "use") {
          Xmas.giftRain();
        }
      });
    }
    renderShop();
    openModal(modal);
  }

  // ---- アドベントカレンダー ----
  // 窓ごとのひとこと(1〜24日)
  const ADVENT_MSGS = [
    "12月のはじまり！ 今日から1日1つ、窓が開くよ。",
    "今日はサンタを探してみよう。画面の中を、ときどき通るよ。",
    "クリスマスツリーのてっぺんの星は、夜空を照らす星を表すといわれているよ。",
    "雪の結晶は、どれも六角形が基本なんだって。",
    "寒い日は、あったかい飲み物でひと休みしよう。",
    "♪ジングルベル、ジングルベル…頭の中で流れてきたら成功！",
    "プレゼントの箱は、リボンの色で気分が変わるよね。",
    "今日の「ひとこと」: ゲームも1日1回、いい気分転換になるよ。",
    "雪だるまの目は、石ころ？ ボタン？ それともドット？",
    "クリスマスカードを書くなら、そろそろ準備の時期かも。",
    "窓の向こうが白くなってきたら、冬本番だね。",
    "折り返し！ 今日は特別に、プレゼントが多めに入っているよ。",
    "ケーキは、ショートケーキ派？ チョコ派？ 本人にしか分からない大問題。",
    "もこもこの手ぶくろがほしくなる季節だね。",
    "今日のBGMは、静かなピアノのクリスマスソングはどう？",
    "イルミネーションは、近づくより少し離れたほうがきれいに見えるよ。",
    "トナカイの鼻が赤い理由は、昔話にあるよ。調べてみよう。",
    "サンタへの手紙、まだなら今日がチャンス。",
    "お風呂でぽかぽか。ゆず湯もいいね。",
    "もうすぐクリスマス。部屋のそうじも、プレゼントのうち？",
    "靴下は、大きいほうがたくさん入る…かもしれない。",
    "一年でいちばん夜が長い時期。夜ふかしはほどほどにね。",
    "クリスマスイブまであと少し！ そわそわしてきたかな？",
    "イブの窓だよ。いちばん大きなプレゼントを入れておいた！",
  ];
  const ADVENT_GIFTS = (day) => (day === 24 ? 10 : day === 12 ? 5 : 3);
  const ALL_BONUS = 15;
  let adventNote = "";

  function renderAdvent() {
    const modal = document.getElementById("xmAdvent");
    if (!modal) return;
    const year = Xmas.seasonYear();
    const opened = XmasStore.opened(year);
    const unlocked = Xmas.adventUnlockedDay();
    let doors = "";
    for (let d = 1; d <= 24; d++) {
      const done = opened.includes(d);
      const ready = !done && d <= unlocked;
      const cls = done ? "done" : ready ? "ready" : "locked";
      const label = done ? "🎁" : ready ? "✨" : "🔒";
      doors += `<button type="button" class="xm-door ${cls}" data-day="${d}" ${ready ? "" : (done ? "" : "disabled")} aria-label="${d}日の窓${done ? "(開けた)" : ready ? "(開けられる)" : "(まだ)"}"><b>${d}</b><span>${label}</span></button>`;
    }
    modal.querySelector(".xm-doors").innerHTML = doors;
    modal.querySelector(".xm-advent-year").textContent = `${year}年のアドベントカレンダー`;
    modal.querySelector(".xm-advent-count").innerHTML = `開けた窓: <b>${opened.length}</b> / 24` + (opened.length >= 24 ? " 🎉 コンプリート！" : ` (全部開けると +${ALL_BONUS}🎁)`);
    modal.querySelector(".xm-advent-note").textContent = adventNote || (unlocked < 24 ? "今日までの窓が開けられるよ。毎日のぞきに来てね。" : "どの窓も開けられるよ。開け忘れた窓を開けよう。");
  }
  function openDoor(day) {
    const year = Xmas.seasonYear();
    if (day < 1 || day > 24 || day > Xmas.adventUnlockedDay()) return;
    if (XmasStore.opened(year).includes(day)) return;
    XmasStore.markOpened(year, day);
    if (typeof XmasFx !== "undefined") XmasFx.sfx("door");
    const gain = ADVENT_GIFTS(day);
    Xmas.giveGifts(gain, undefined, undefined, `🎁 ${day}日の窓を開けた！ +${gain}`);
    adventNote = `${day}日: ${ADVENT_MSGS[day - 1]} (+${gain}🎁)`;
    if (XmasStore.opened(year).length >= 24) {
      Xmas.giveGifts(ALL_BONUS);
      adventNote += `  🎉 全部の窓を開けた！ ボーナス +${ALL_BONUS}🎁`;
      Xmas.giftRain();
    }
    renderAdvent();
  }
  function openAdvent() {
    let modal = document.getElementById("xmAdvent");
    if (!modal) {
      modal = makeModal("xmAdvent", "アドベントカレンダー", `
        <p class="rp-caption">🎄 <span class="xm-advent-year"></span></p>
        <p class="cs-balance xm-advent-count"></p>
        <div class="xm-doors"></div>
        <p class="cs-note xm-advent-note"></p>`);
      modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close")) { closeModal("xmAdvent"); return; }
        const b = e.target.closest(".xm-door.ready");
        if (b) openDoor(parseInt(b.dataset.day, 10));
      });
    }
    adventNote = "";
    renderAdvent();
    openModal(modal);
  }

  // ---- ヘッダーのボタン: プレゼントを持っている/何か買った人にだけ出す ----
  function ensureHeaderButton() {
    const bar = document.querySelector(".header-controls");
    if (!bar) return;
    let btn = document.getElementById("xmasShopBtn");
    const show = XmasStore.get() > 0 || XmasStore.owned().length > 0;
    if (!btn && show) {
      btn = document.createElement("button");
      btn.id = "xmasShopBtn";
      btn.type = "button";
      btn.className = "icon-btn";
      btn.textContent = "🎁";
      btn.setAttribute("aria-label", "クリスマスショップ");
      btn.addEventListener("click", openShop);
      bar.insertBefore(btn, bar.firstChild);
    }
    if (btn) {
      btn.hidden = !show;
      btn.title = `クリスマスショップ(持っているプレゼント: ${XmasStore.get()})`;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    ["xmShop", "xmAdvent"].forEach((id) => {
      const m = document.getElementById(id);
      if (m && m.classList.contains("open")) closeModal(id);
    });
  });

  function init() {
    syncAll();
    ensureHeaderButton();
    XmasStore.onChange(() => {
      ensureHeaderButton();
      const shop = document.getElementById("xmShop");
      if (shop && shop.classList.contains("open")) renderShop();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { open: openShop, close: () => closeModal("xmShop"), openAdvent, items: ALL_ITEMS, yearItems: YEAR_ITEMS };
})();
