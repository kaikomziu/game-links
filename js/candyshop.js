// ===== お菓子ショップ =====
// ハロウィンのおばけからもらったお菓子(candy.js)で買えるアイテム。
// お菓子が貯まるのはハロウィン期間だけだが、買ったものはハロウィン以外でもずっと使える。
// candy.js / halloween.js の後に読み込まれる前提。
const CandyShop = (() => {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const toast = (msg) => { if (typeof GameExtras !== "undefined") GameExtras.showToast(msg); };

  // ---- おばけのおとも: マウスカーソルをゆっくり追いかける ----
  let buddy = null;
  let buddyRaf = 0;
  function startBuddy() {
    if (buddy) return;
    buddy = document.createElement("div");
    buddy.className = "hw-buddy";
    buddy.textContent = "👻";
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

  // ---- コウモリの群れ: ときどき数匹が画面を横切る ----
  let batsTimer = 0;
  function flyBats() {
    if (document.hidden) return;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const b = document.createElement("span");
      b.className = "hw-bat" + (Math.random() < 0.5 ? " rtl" : "");
      b.textContent = "🦇";
      const dur = 5 + Math.random() * 3;
      b.style.setProperty("--dur", dur + "s");
      b.style.setProperty("--y", 10 + Math.random() * 70 + "vh");
      b.style.animationDelay = Math.random() * 1.2 + "s, 0s";
      document.body.appendChild(b);
      setTimeout(() => b.remove(), (dur + 1.5) * 1000);
    }
  }
  function startBats() {
    if (batsTimer || reduceMotion) return;
    setTimeout(flyBats, 4000);
    batsTimer = setInterval(flyBats, 40000);
  }
  function stopBats() {
    clearInterval(batsTimer);
    batsTimer = 0;
  }

  const root = document.documentElement;
  const ITEMS = [
    {
      id: "pumpkin-logo", emoji: "🎃", name: "かぼちゃロゴ", price: 5,
      desc: "ロゴの🎮がずっと🎃になる",
      apply() { const e = document.querySelector(".logo-emoji"); if (e) e.textContent = "🎃"; },
      remove() { const e = document.querySelector(".logo-emoji"); if (e) e.textContent = root.classList.contains("halloween") ? "🎃" : "🎮"; },
    },
    {
      id: "webs", emoji: "🕸️", name: "蜘蛛の巣カード", price: 8,
      desc: "ゲームカードの角に蜘蛛の巣が張る",
      apply() { root.classList.add("hw-webs"); },
      remove() { root.classList.remove("hw-webs"); },
    },
    {
      id: "rain-toy", emoji: "🍬", name: "お菓子の雨", price: 10,
      desc: "ボタンを押すと、いつでもお菓子とかぼちゃが降ってくる",
      toy: true,
    },
    {
      id: "buddy", emoji: "👻", name: "おばけのおとも", price: 12,
      desc: "小さなおばけがマウスカーソルを追いかけてくる",
      apply: startBuddy,
      remove: stopBuddy,
    },
    {
      id: "palette", emoji: "🔥", name: "ハロウィンカラー", price: 15,
      desc: "サイト全体がオレンジ×紫の夜の配色になる",
      apply() { root.classList.add("hw-palette"); },
      remove() { root.classList.remove("hw-palette"); },
    },
    {
      id: "bats", emoji: "🦇", name: "コウモリの群れ", price: 18,
      desc: "ときどきコウモリが数匹、画面を横切っていく",
      apply: startBats,
      remove: stopBats,
    },
    {
      id: "master", emoji: "👑", name: "ハロウィンマスター", price: 30,
      desc: "ヘッダーの小さな札が「HALLOWEEN MASTER」になる",
      apply() { const e = document.querySelector(".logo-sub"); if (e) { e.dataset.orig = e.dataset.orig || e.textContent; e.textContent = "HALLOWEEN MASTER"; } },
      remove() { const e = document.querySelector(".logo-sub"); if (e && e.dataset.orig) e.textContent = e.dataset.orig; },
    },
  ];
  const byId = (id) => ITEMS.find((i) => i.id === id);

  // 適用済みの状態を覚えておき、買っていない項目で remove() が走ってイベント側の表示を壊さないようにする
  function syncPerk(item) {
    if (item.toy) return;
    const want = Candy.isOn(item.id);
    if (want && !item._applied) { item.apply(); item._applied = true; }
    else if (!want && item._applied) { item.remove(); item._applied = false; }
  }
  function syncAll() { ITEMS.forEach(syncPerk); }

  // ---- ショップのウィンドウ ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function itemButton(item) {
    if (!Candy.has(item.id)) {
      const ok = Candy.get() >= item.price;
      return `<button type="button" class="cs-btn buy" data-act="buy" data-id="${item.id}" ${ok ? "" : "disabled"}>買う ${item.price}🍬</button>`;
    }
    if (item.toy) return `<button type="button" class="cs-btn use" data-act="use" data-id="${item.id}">降らせる</button>`;
    const on = Candy.isOn(item.id);
    return `<button type="button" class="cs-btn ${on ? "on" : "off"}" data-act="toggle" data-id="${item.id}">${on ? "ON ✓" : "OFF"}</button>`;
  }
  function render() {
    const modal = document.getElementById("csModal");
    if (!modal) return;
    modal.querySelector(".cs-balance").innerHTML = `持っているお菓子: <b>${Candy.get()}</b> 🍬`;
    modal.querySelector(".cs-list").innerHTML = ITEMS.map((item) => `
      <li class="cs-item${Candy.has(item.id) ? " owned" : ""}">
        <span class="cs-emoji">${item.emoji}</span>
        <div class="cs-info"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.desc)}</small></div>
        ${itemButton(item)}
      </li>`).join("");
  }

  function close() {
    const modal = document.getElementById("csModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  function open() {
    let modal = document.getElementById("csModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "csModal";
      modal.className = "rp-modal cs-modal";
      modal.innerHTML = `
        <div class="rp-backdrop" data-close></div>
        <div class="rp-dialog cs-dialog" role="dialog" aria-modal="true" aria-label="お菓子ショップ">
          <button class="rp-close" data-close aria-label="閉じる">×</button>
          <p class="rp-caption">🍬 お菓子ショップ</p>
          <p class="cs-balance"></p>
          <ul class="cs-list"></ul>
          <p class="cs-note">お菓子はハロウィンの期間に出てくるおばけからもらえます。買ったものは、ハロウィン以外でもずっと使えます。</p>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close")) { close(); return; }
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const item = byId(btn.dataset.id);
        if (!item) return;
        const act = btn.dataset.act;
        if (act === "buy") {
          if (Candy.spend(item.price)) {
            Candy.own(item.id);
            syncPerk(item);
            toast(`${item.emoji} 「${item.name}」を手に入れた！`);
          }
        } else if (act === "toggle") {
          Candy.setOn(item.id, !Candy.isOn(item.id));
          syncPerk(item);
        } else if (act === "use") {
          if (typeof Halloween !== "undefined") Halloween.pumpkinRain();
        }
      });
    }
    render();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // ---- ヘッダーのボタン: お菓子を持っている/何か買った人にだけ出す ----
  function ensureHeaderButton() {
    const bar = document.querySelector(".header-controls");
    if (!bar) return;
    let btn = document.getElementById("candyShopBtn");
    const show = Candy.get() > 0 || Candy.owned().length > 0;
    if (!btn && show) {
      btn = document.createElement("button");
      btn.id = "candyShopBtn";
      btn.type = "button";
      btn.className = "icon-btn";
      btn.textContent = "🍬";
      btn.setAttribute("aria-label", "お菓子ショップ");
      btn.addEventListener("click", open);
      bar.insertBefore(btn, bar.firstChild);
    }
    if (btn) {
      btn.hidden = !show;
      btn.title = `お菓子ショップ(持っているお菓子: ${Candy.get()})`;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("csModal");
    if (modal && modal.classList.contains("open")) close();
  });

  function init() {
    syncAll();
    ensureHeaderButton();
    Candy.onChange(() => {
      ensureHeaderButton();
      const modal = document.getElementById("csModal");
      if (modal && modal.classList.contains("open")) render();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { open, close, items: ITEMS };
})();
