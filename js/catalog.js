// ===== 管理者が追加するゲーム・ソフト・MOD =====
(function () {
  const TAGS = ["パズル", "アクション", "対戦", "クリッカー・放置", "ホラー・ノベル", "RNG・運試し", "音楽・リズム", "オンライン協力", "シミュレーション", "ツール", "その他"];
  let loaded = false;

  function api() { return typeof Articles !== "undefined" ? Articles.api : null; }
  function esc(value) { return api() ? api().esc(value) : String(value ?? ""); }
  function toast(message) { if (api()) api().toast(message); }

  function toGame(row) {
    return {
      id: row.id,
      added: String(row.added || "").slice(0, 10),
      kind: row.kind || "game",
      platform: row.platform || "",
      action: row.action || (row.kind === "game" ? "遊びに行く →" : "サイトを見る →"),
      title: row.title,
      emoji: row.emoji || (row.kind === "game" ? "🎮" : "🧰"),
      tags: Array.isArray(row.tags) && row.tags.length ? row.tags : ["その他"],
      desc: row.description,
      url: row.url,
      author: row.author || "Claude AI",
    };
  }

  async function load() {
    if (loaded || !api()) return;
    try {
      const rows = await api().getPublicGames();
      if (typeof window.refreshGameCatalog === "function") window.refreshGameCatalog(rows.map(toGame));
      loaded = true;
    } catch (e) {
      // 管理者追加欄は使えなくても、静的なゲーム一覧は通常どおり使える。
    }
  }

  function renderBar() {
    const bar = document.getElementById("catalogAdmin");
    if (!bar || !api()) return;
    const ad = api().getAdmin();
    const view = document.body.dataset.view;
    if (!ad || (view !== "games" && view !== "soft")) {
      bar.hidden = true;
      bar.innerHTML = "";
      return;
    }
    bar.hidden = false;
    bar.innerHTML = `<span class="ad-who">🔓 ログイン中: <b>${esc(ad.name)}</b></span><button type="button" class="ad-btn primary" data-catalog="new">➕ ${view === "soft" ? "ソフト・MOD" : "ゲーム"}を追加</button>`;
  }

  function openEditor() {
    const A = api();
    if (!A || !A.getAdmin()) return;
    const m = A.openModal("catalog-editor", `
      <div class="rp-dialog ar-dialog ad-dialog catalog-dialog" role="dialog" aria-modal="true" aria-label="作品を追加">
        <button class="rp-close" data-ar-close aria-label="閉じる">×</button>
        <p class="ar-kicker">➕ ゲーム・ソフト・MODを追加</p>
        <form class="ad-form catalog-form" autocomplete="off">
          <div class="catalog-two-col">
            <label class="ad-label">種類<select class="ad-input" name="kind"><option value="game">ゲーム</option><option value="app">ソフト</option><option value="mod">MOD</option></select></label>
            <label class="ad-label">絵文字<input class="ad-input" name="emoji" maxlength="8" value="🎮" placeholder="🎮"></label>
          </div>
          <label class="ad-label">名前<input class="ad-input" name="title" maxlength="100" required placeholder="作品名"></label>
          <label class="ad-label">URL<input class="ad-input" name="url" type="url" maxlength="500" required placeholder="https://…" inputmode="url"></label>
          <label class="ad-label">説明<textarea class="ad-input" name="desc" rows="4" maxlength="1200" required placeholder="どんな作品か、遊び方や対応機種など"></textarea></label>
          <div class="catalog-two-col">
            <label class="ad-label">対応機種・ゲーム名<input class="ad-input" name="platform" maxlength="80" placeholder="PC / スマホ / Windows など"></label>
            <label class="ad-label">ボタン文字<input class="ad-input" name="action" maxlength="80" value="遊びに行く →" placeholder="遊びに行く →"></label>
          </div>
          <label class="ad-label">ジャンル(1〜3個)<select class="ad-input catalog-tags" name="tags" multiple size="4">${TAGS.map((tag) => `<option value="${esc(tag)}"${tag === "その他" ? " selected" : ""}>${esc(tag)}</option>`).join("")}</select></label>
          <label class="ad-label">作者名<input class="ad-input" name="author" maxlength="80" value="${esc(A.getAdmin().name)}" placeholder="作者名"></label>
          <p class="ad-note">保存するとすぐに公開され、ゲームまたはソフト・MODの一覧に表示されます。URLはhttps://またはhttp://で始めてください。</p>
          <p class="ad-error" role="alert"></p>
          <div class="ad-row"><button type="button" class="ad-btn" data-ar-close>キャンセル</button><button type="submit" class="ad-btn primary">追加して公開</button></div>
        </form>
      </div>`);
    const form = m.querySelector("form");
    const err = m.querySelector(".ad-error");
    const kind = form.kind;
    kind.addEventListener("change", () => {
      form.emoji.value = kind.value === "game" ? "🎮" : kind.value === "mod" ? "🧩" : "🧰";
      form.action.value = kind.value === "game" ? "遊びに行く →" : "サイトを見る →";
    });
    m.addEventListener("click", (event) => { if (event.target.hasAttribute("data-ar-close")) A.closeModal(m); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      err.textContent = "";
      const tags = [...form.tags.selectedOptions].map((option) => option.value);
      if (tags.length < 1 || tags.length > 3) { err.textContent = "ジャンルは1〜3個選んでください。"; return; }
      const button = form.querySelector("button[type=submit]");
      button.disabled = true; button.textContent = "保存中…";
      const result = await A.callRpc("gl_game_add", {
        p_kind: form.kind.value, p_platform: form.platform.value, p_action: form.action.value,
        p_title: form.title.value, p_emoji: form.emoji.value, p_tags: tags,
        p_desc: form.desc.value, p_url: form.url.value, p_author: form.author.value,
      });
      button.disabled = false; button.textContent = "追加して公開";
      if (!result) return;
      if (!result.ok) {
        const messages = { auth: "管理者ログインが必要です。", kind: "種類が不正です。", title: "名前は1〜100文字で入力してください。", emoji: "絵文字は8文字以内です。", description: "説明は1〜1200文字で入力してください。", url: "URLはhttp://またはhttps://から始めてください。", text: "対応機種・ボタン文字・作者名が長すぎます。", tags: "ジャンルは固定ジャンルから1〜3個選んでください。", duplicate: "同じURLの作品はすでに登録されています。" };
        err.textContent = messages[result.reason] || "追加できませんでした。";
        return;
      }
      A.closeModal(m);
      toast(`「${result.title}」を追加しました`);
      loaded = false;
      await load();
      renderBar();
    });
  }

  function init() {
    const bar = document.getElementById("catalogAdmin");
    if (bar) bar.addEventListener("click", (event) => { if (event.target.closest('[data-catalog="new"]')) openEditor(); });
    document.addEventListener("gl-admin-change", () => { renderBar(); loaded = false; load(); });
    document.addEventListener("click", () => setTimeout(renderBar, 0));
    load();
    renderBar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
