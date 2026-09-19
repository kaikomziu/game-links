// 更新履歴モーダル
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function buildList() {
    if (typeof CHANGELOG === "undefined") return "";
    return CHANGELOG.slice().reverse().map((entry) => `
      <div class="cl-entry">
        <div class="cl-entry-head">
          <span class="cl-version">v${escapeHtml(entry.version)}</span>
          <span class="cl-date">${escapeHtml(entry.date)}</span>
        </div>
        <ul class="cl-notes">${entry.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
      </div>`).join("");
  }

  function openModal() {
    let modal = document.getElementById("clModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "clModal";
      modal.className = "rp-modal cl-modal";
      modal.innerHTML = `
        <div class="rp-backdrop" data-close></div>
        <div class="rp-dialog cl-dialog" role="dialog" aria-modal="true" aria-label="更新履歴">
          <button class="rp-close" data-close aria-label="閉じる">×</button>
          <p class="rp-caption">📜 更新履歴</p>
          <div class="cl-list"></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-close")) closeModal();
      });
    }
    modal.querySelector(".cl-list").innerHTML = buildList();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = document.getElementById("clModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("clModal");
    if (modal && modal.classList.contains("open")) closeModal();
  });

  // ボタンがDOMContentLoaded時点で見つからないケースにも対応できるよう、
  // documentへのイベント委譲でクリックを拾う
  document.addEventListener("click", (e) => {
    if (e.target.closest("#changelogBtn")) openModal();
  });

  function setVersionTag() {
    const tag = document.getElementById("versionTag");
    if (tag && typeof CHANGELOG !== "undefined" && CHANGELOG.length) {
      tag.textContent = "(v" + CHANGELOG[CHANGELOG.length - 1].version + ")";
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setVersionTag);
  } else {
    setVersionTag();
  }
})();
