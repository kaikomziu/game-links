// ゲームセンター風ヒーロー(稼働台数・NEW台数の表示、INSERT COIN = 今日の1本)
(function () {
  const sub = document.getElementById("heroSub");
  if (sub && typeof GAMES !== "undefined") {
    const fresh = typeof isNewGame === "function" ? GAMES.filter(isNewGame).length : 0;
    sub.textContent = `NOW OPEN ─ 稼働中の筐体 ${GAMES.length}台` + (fresh ? ` / NEW ${fresh}台` : "");
  }
  const insert = document.getElementById("heroInsert");
  const dice = document.getElementById("randomPickBtn");
  if (insert && dice) insert.addEventListener("click", () => dice.click());
})();
