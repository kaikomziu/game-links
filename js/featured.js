// ===== 注目のゲーム =====
(function () {
  const root = document.getElementById("featuredGame");
  if (!root || typeof Articles === "undefined") return;

  function api() { return Articles.api; }
  function esc(value) { return api().esc(value); }
  function allGames() { return typeof GAMES !== "undefined" ? GAMES : []; }

  function render(game) {
    if (!game) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }
    root.hidden = false;
    root.innerHTML = `
      <div class="featured-kicker">⭐ FEATURED GAME</div>
      <div class="featured-body">
        <div class="featured-emoji" aria-hidden="true">${esc(game.emoji || "🎮")}</div>
        <div class="featured-copy">
          <p class="featured-label">今週の注目作品</p>
          <h2>${esc(game.title)}</h2>
          <p class="featured-desc">${esc(game.desc || "")}</p>
          <div class="featured-meta"><span>${esc((game.tags || []).join(" / "))}</span><span>作者: ${esc(game.author || "Claude AI")}</span></div>
          <a class="featured-play" href="${esc(game.url)}" target="_blank" rel="noopener">▶ 今すぐ遊ぶ・見る</a>
        </div>
      </div>`;
  }

  async function load() {
    try {
      const id = await api().getFeaturedGame();
      root.dataset.gameId = id || "";
      const game = id ? allGames().find((item) => item.id === id) : null;
      render(game || null);
    } catch (e) {
      render(null);
    }
  }

  function openEditor() {
    const A = api();
    const admin = A.getAdmin();
    if (!admin) return;
    const games = allGames().filter((game) => game && game.url && game.title);
    const current = root.dataset.gameId || "";
    const m = A.openModal("featured-editor", `
      <div class="rp-dialog ar-dialog ad-dialog featured-dialog" role="dialog" aria-modal="true" aria-label="注目のゲームを設定">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">⭐ 注目のゲームを設定</p>
        <form class="ad-form">
          <label class="ad-label">表示する作品
            <select class="ad-input" name="game_id" required>
              <option value="">選択してください</option>
              ${games.map((game) => `<option value="${esc(game.id)}"${game.id === current ? " selected" : ""}>${esc(game.emoji || "🎮")} ${esc(game.title)}</option>`).join("")}
            </select>
          </label>
          <p class="ad-note">ゲーム・ソフト・MODから1作品を選び、一覧の上に大きく表示します。</p>
          <p class="ad-error" role="alert"></p>
          <div class="ad-row"><button type="button" class="ad-btn" data-ar-close>キャンセル</button><button type="submit" class="ad-btn primary">設定を保存</button></div>
        </form>
      </div>`);
    const form = m.querySelector("form");
    const error = m.querySelector(".ad-error");
    m.addEventListener("click", (event) => { if (event.target.hasAttribute("data-ar-close")) A.closeModal(m); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      error.textContent = "";
      button.disabled = true;
      button.textContent = "保存中…";
      const result = await A.callRpc("gl_featured_game_set", { p_game_id: form.game_id.value });
      button.disabled = false;
      button.textContent = "設定を保存";
      if (!result || !result.ok) {
        error.textContent = result?.reason === "auth" ? "管理者ログインが必要です。" : "設定を保存できませんでした。";
        return;
      }
      root.dataset.gameId = result.game_id;
      A.closeModal(m);
      render(allGames().find((game) => game.id === result.game_id));
      A.toast("注目のゲームを設定しました");
    });
  }

  window.refreshFeaturedGame = load;
  document.addEventListener("gl-featured-edit", openEditor);
  document.addEventListener("gl-catalog-ready", load);
  document.addEventListener("gl-admin-change", load);
  root.addEventListener("click", (event) => {
    if (event.target.closest(".featured-play")) return;
  });
  load();
})();
