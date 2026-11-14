// ===== 注目のゲーム =====
(function () {
  const root = document.getElementById("featuredGame");
  if (!root || typeof Articles === "undefined") return;

  function api() { return Articles.api; }
  function esc(value) { return api().esc(value); }
  function allGames() { return typeof GAMES !== "undefined" ? GAMES : []; }

  function render(games) {
    if (!games.length) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }
    root.hidden = false;
    root.innerHTML = `
      <div class="featured-kicker">⭐ FEATURED GAMES</div>
      <div class="featured-list">
        ${games.map((game) => `
          <article class="featured-card">
            <div class="featured-emoji" aria-hidden="true">${esc(game.emoji || "🎮")}</div>
            <div class="featured-copy">
              <p class="featured-label">注目の作品</p>
              <h2>${esc(game.title)}</h2>
              <p class="featured-desc">${esc(game.desc || "")}</p>
              <div class="featured-meta"><span>${esc((game.tags || []).join(" / "))}</span><span>作者: ${esc(game.author || "Claude AI")}</span></div>
              <a class="featured-play" href="${esc(game.url)}" target="_blank" rel="noopener">▶ 今すぐ遊ぶ・見る</a>
            </div>
          </article>`).join("")}
      </div>`;
  }

  async function load() {
    try {
      const ids = await api().getFeaturedGame();
      const selected = Array.isArray(ids) ? ids : ids ? [ids] : [];
      root.dataset.gameIds = selected.join(",");
      render(selected.map((id) => allGames().find((item) => item.id === id)).filter(Boolean));
    } catch (e) {
      render([]);
    }
  }

  function openEditor() {
    const A = api();
    if (!A.getAdmin()) return;
    const games = allGames().filter((game) => game && game.url && game.title);
    let selectedIds = (root.dataset.gameIds || "").split(",").filter((id) => games.some((game) => game.id === id));
    const selectedSet = new Set(selectedIds);
    const m = A.openModal("featured-editor", `
      <div class="rp-dialog ar-dialog ad-dialog featured-dialog" role="dialog" aria-modal="true" aria-label="注目のゲームを設定">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">⭐ 注目のゲームを設定</p>
        <form class="ad-form">
          <p class="ad-note">最大20作品まで選択できます。下の「表示順」をドラッグして並べ替えてください。</p>
          <div class="featured-selected-wrap">
            <strong>表示順</strong>
            <div class="featured-selected" aria-live="polite"></div>
          </div>
          <div class="featured-options">
            ${games.map((game) => `<label class="featured-option"><input type="checkbox" name="game_id" value="${esc(game.id)}"${selectedSet.has(game.id) ? " checked" : ""}><span>${esc(game.emoji || "🎮")} ${esc(game.title)}</span></label>`).join("")}
          </div>
          <p class="ad-error" role="alert"></p>
          <div class="ad-row"><button type="button" class="ad-btn" data-ar-close>キャンセル</button><button type="submit" class="ad-btn primary">設定を保存</button></div>
        </form>
      </div>`);
    const form = m.querySelector("form");
    const selectedEl = m.querySelector(".featured-selected");
    const error = m.querySelector(".ad-error");

    function refreshSelected() {
      selectedEl.innerHTML = selectedIds.length
        ? selectedIds.map((id, index) => {
          const game = games.find((item) => item.id === id);
          return `<div class="featured-selected-item" draggable="true" data-id="${esc(id)}"><span class="featured-drag-handle" aria-hidden="true">☷</span><span>${esc(game?.emoji || "🎮")} ${esc(game?.title || id)}</span><small>${index + 1}</small><button type="button" class="featured-move" data-dir="-1" aria-label="1つ上へ"${index === 0 ? " disabled" : ""}>▲</button><button type="button" class="featured-move" data-dir="1" aria-label="1つ下へ"${index === selectedIds.length - 1 ? " disabled" : ""}>▼</button></div>`;
        }).join("")
        : '<span class="featured-selected-empty">選択されていません</span>';
      selectedEl.querySelectorAll(".featured-selected-item").forEach((item) => {
        item.addEventListener("dragstart", (event) => {
          item.classList.add("is-dragging");
          // Firefox は dataTransfer に何か入れないとドラッグが始まらない
          try { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.dataset.id); } catch (e) {}
        });
        // スマホなどドラッグできない端末のために、▲▼ボタンでも順番を変えられる
        item.querySelectorAll(".featured-move").forEach((btn) => btn.addEventListener("click", () => {
          const from = selectedIds.indexOf(item.dataset.id);
          const to = from + Number(btn.dataset.dir);
          if (from < 0 || to < 0 || to >= selectedIds.length) return;
          const [moved] = selectedIds.splice(from, 1);
          selectedIds.splice(to, 0, moved);
          refreshSelected();
        }));
        item.addEventListener("dragend", () => { item.classList.remove("is-dragging"); });
        item.addEventListener("dragover", (event) => event.preventDefault());
        item.addEventListener("drop", (event) => {
          event.preventDefault();
          const from = selectedIds.indexOf(item.parentElement.querySelector(".is-dragging")?.dataset.id || "");
          const to = selectedIds.indexOf(item.dataset.id);
          if (from < 0 || to < 0 || from === to) return;
          const [moved] = selectedIds.splice(from, 1);
          selectedIds.splice(to, 0, moved);
          refreshSelected();
        });
      });
    }

    form.querySelectorAll('input[name="game_id"]').forEach((input) => input.addEventListener("change", () => {
      if (input.checked && !selectedIds.includes(input.value)) selectedIds.push(input.value);
      if (!input.checked) selectedIds = selectedIds.filter((id) => id !== input.value);
      if (selectedIds.length > 20) {
        input.checked = false;
        selectedIds = selectedIds.filter((id) => id !== input.value);
        error.textContent = "選択できるのは20作品までです。";
      } else error.textContent = "";
      refreshSelected();
    }));
    refreshSelected();

    m.addEventListener("click", (event) => { if (event.target.hasAttribute("data-ar-close")) A.closeModal(m); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      button.textContent = "保存中…";
      const result = await A.callRpc("gl_featured_game_set", { p_game_ids: selectedIds });
      button.disabled = false;
      button.textContent = "設定を保存";
      if (!result || !result.ok) {
        error.textContent = result?.reason === "auth" ? "管理者ログインが必要です。" : "設定を保存できませんでした。";
        return;
      }
      root.dataset.gameIds = selectedIds.join(",");
      A.closeModal(m);
      render(selectedIds.map((id) => allGames().find((game) => game.id === id)).filter(Boolean));
      A.toast(selectedIds.length ? `${selectedIds.length}作品を注目作品に設定しました` : "注目作品を解除しました");
    });
  }

  window.refreshFeaturedGame = load;
  document.addEventListener("gl-featured-edit", openEditor);
  document.addEventListener("gl-catalog-ready", load);
  document.addEventListener("gl-admin-change", load);
  load();
})();
