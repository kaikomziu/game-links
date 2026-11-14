// ===== 「すべて」タブ: ジャンルごとの棚(ゲーム・ソフト・MODが同じ棚に混ざる) =====
// 1つの画面で全作品を見渡せるようにする。ジャンル(最初のタグ)ごとに「棚」を作り、
// 各作品は説明つきの大きなカードで出す。種類(ゲーム/ソフト/MOD)は色の札で分かる。
// 棚ごとに最初の8本だけ出して、「あと◯本」で全部開く(検索・絞り込み中は最初から全部出す)。
// tiles.js の後・main.js の前に読み込む。render() から renderShelves() が呼ばれる。
// favorites / toggleFavorite / isNewGame / isSoftware / allTags / openDetail は呼ばれた時点で参照する。

const Shelves = (() => {
  const LIMIT = 8;
  const expanded = new Set(); // 「あと◯本」で開いた棚(ジャンル名)。ページを開き直すと閉じる

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 説明文の「(読み:〇〇)」はカードでは邪魔なので省く(詳細ウィンドウには全文が出る)
  const cleanDesc = (d) => String(d || "").replace(/[（(]読み[:：][^）)]*[）)]/g, "").replace(/\s+/g, " ").trim();

  function kindChip(g) {
    if (g.kind === "mod") return `<span class="sh-kind k-mod">🧩 MOD${g.platform ? "・" + esc(g.platform) : ""}</span>`;
    if (isSoftware(g)) return `<span class="sh-kind k-soft">💻 ソフト${g.platform ? "・" + esc(g.platform) : ""}</span>`;
    return `<span class="sh-kind k-game">🎮 ゲーム</span>`;
  }

  function buildCard(g) {
    const maint = !!g.maintenance;
    const isNew = isNewGame(g) && !maint;
    const soft = isSoftware(g);
    const isFav = favorites.has(g.id);
    const { act, icon } = playIcon(g);
    const label = soft ? act : "あそぶ";
    const dl = /ダウンロード/.test(act);

    const el = document.createElement("article");
    el.className = "game-card shelf-card" + (soft ? " is-soft" : "") + (isNew ? " is-new" : "") + (maint ? " is-maintenance" : "");
    el.dataset.id = g.id;
    el.dataset.genre = soft ? (g.kind === "mod" ? "MOD" : "ソフト") : (g.tags[0] || "");
    el.dataset.shelfGenre = g.tags[0] || "その他";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${g.title} の詳細を開く`);
    el.innerHTML = `
      <div class="sh-head">
        <div class="sh-emoji">${g.emoji}</div>
        <h3 class="sh-title">${esc(g.title)}</h3>
        <button class="fav-btn ${isFav ? "active" : ""}" type="button" aria-label="お気に入り切替">${isFav ? "★" : "☆"}</button>
      </div>
      <p class="sh-desc">${esc(cleanDesc(g.desc))}</p>
      <div class="sh-foot">
        ${isNew ? `<span class="sh-flag new">NEW</span>` : ""}${g.beta ? `<span class="sh-flag beta">β版</span>` : ""}${maint ? `<span class="sh-flag maint">🔧 メンテ中</span>` : ""}
        ${kindChip(g)}
        ${maint
          ? `<span class="sh-go maintenance-btn" aria-disabled="true">🔧 修正中</span>`
          : `<a class="sh-go play-btn${dl ? " dl" : soft ? " soft" : ""}" href="${esc(g.url)}" target="_blank" rel="noopener" aria-label="${esc(g.title)}を開く(${esc(act)})">${icon} ${esc(label)}</a>`}
      </div>`;

    el.querySelector(".fav-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleFavorite(g.id); });
    const go = el.querySelector("a.sh-go");
    if (go) go.addEventListener("click", (e) => { e.stopPropagation(); if (typeof GameStats !== "undefined") GameStats.recordPlay(g.id); });
    el.addEventListener("click", () => openDetail(g.id));
    el.addEventListener("keydown", (e) => {
      if (e.target !== el) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(g.id); }
    });
    return el;
  }

  // list: 絞り込み・並び替え済みの作品。root: 棚を入れる要素。showAll: 検索や絞り込み中は全部出す
  // 返り値: 画面に出す順に並べた作品(詳細ウィンドウの「前へ/次へ」用)
  function build(list, root, showAll) {
    root.textContent = "";
    const groups = new Map();
    list.forEach((g) => {
      const t = g.tags[0] || "その他";
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(g);
    });
    // 棚の順番は、ジャンルのボタン(1F, 2F…)と同じ
    const order = (typeof allTags !== "undefined" ? allTags : []).filter((t) => groups.has(t));
    groups.forEach((_, t) => { if (!order.includes(t)) order.push(t); });

    const flat = [];
    const frag = document.createDocumentFragment();
    order.forEach((tag) => {
      const items = groups.get(tag);
      const floor = (typeof allTags !== "undefined" ? allTags.indexOf(tag) : -1) + 1;
      const open = showAll || expanded.has(tag) || items.length <= LIMIT + 2; // 1〜2本あふれるだけなら、ボタンを出さずに全部見せる
      const shown = open ? items : items.slice(0, LIMIT);
      const sec = document.createElement("section");
      sec.className = "shelf";
      sec.dataset.genre = tag;
      sec.setAttribute("aria-label", `${tag}の棚`);
      const games = items.filter((g) => !isSoftware(g)).length;
      const softs = items.length - games;
      sec.innerHTML = `
        <h2 class="shelf-title">${floor ? `<span class="shelf-floor">${floor}F</span>` : ""}<span class="shelf-name">${esc(tag)}</span>
          <small>${items.length}本${softs ? `(ゲーム${games}・ソフト/MOD ${softs})` : ""}</small></h2>
        <div class="shelf-grid"></div>`;
      const gridEl = sec.querySelector(".shelf-grid");
      shown.forEach((g) => gridEl.appendChild(buildCard(g)));
      if (!open) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "shelf-more";
        more.textContent = `あと ${items.length - shown.length} 本を表示 ▾`;
        more.addEventListener("click", () => { expanded.add(tag); window.render(); });
        sec.appendChild(more);
      }
      frag.appendChild(sec);
      flat.push(...items);
    });
    root.appendChild(frag);
    return flat;
  }

  return { render: build };
})();
