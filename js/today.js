// ===== 「今日はなんの日」バナー =====
// data/holidays.js (国民の祝日・内閣府CSV由来)
// data/international-days.js (国連等の国際デー)
// data/anniversaries.js (雑学系の記念日・二十四節気など、雑学ネタ帳より抜粋)
// の3つを読み込んで、今日の日付に該当するものをまとめて表示する。

const TodayInfo = (() => {
  function pad2(n) { return String(n).padStart(2, "0"); }

  // ----- 祝日判定 -----
  // HOLIDAYS(data/holidays.js)にある年はそこから正確な名前を引く。
  // 表に無い年(HOLIDAYS_TABLE_RANGE.maxより先)は、固定日・ハッピーマンデー・
  // 春分/秋分の近似式による簡易計算にフォールバックする
  // (振替休日・国民の休日までは再現していないベストエフォート)。
  function nthMonday(year, month, n) {
    const d = new Date(year, month - 1, 1);
    let count = 0;
    while (d.getMonth() === month - 1) {
      if (d.getDay() === 1) {
        count++;
        if (count === n) return d.getDate();
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }
  function shunbunDay(year) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }
  function shuubunDay(year) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }
  function computeHolidayName(year, month, day) {
    if (month === 1 && day === 1) return "元日";
    if (month === 1 && day === nthMonday(year, 1, 2)) return "成人の日";
    if (month === 2 && day === 11) return "建国記念の日";
    if (month === 2 && day === 23) return "天皇誕生日";
    if (month === 3 && day === shunbunDay(year)) return "春分の日";
    if (month === 4 && day === 29) return "昭和の日";
    if (month === 5 && day === 3) return "憲法記念日";
    if (month === 5 && day === 4) return "みどりの日";
    if (month === 5 && day === 5) return "こどもの日";
    if (month === 7 && day === nthMonday(year, 7, 3)) return "海の日";
    if (month === 8 && day === 11) return "山の日";
    if (month === 9 && day === nthMonday(year, 9, 3)) return "敬老の日";
    if (month === 9 && day === shuubunDay(year)) return "秋分の日";
    if (month === 10 && day === nthMonday(year, 10, 2)) return "スポーツの日";
    if (month === 11 && day === 3) return "文化の日";
    if (month === 11 && day === 23) return "勤労感謝の日";
    return null;
  }

  function getHoliday(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const key = `${y}-${pad2(m)}-${pad2(d)}`;
    if (typeof HOLIDAYS !== "undefined" && HOLIDAYS[key]) return HOLIDAYS[key];
    if (typeof HOLIDAYS_TABLE_RANGE !== "undefined" && y > HOLIDAYS_TABLE_RANGE.max) {
      return computeHolidayName(y, m, d);
    }
    return null;
  }

  function getMonthDay(date) {
    return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function getInfo(date) {
    const md = getMonthDay(date);
    return {
      date,
      holiday: getHoliday(date),
      international: (typeof INTERNATIONAL_DAYS !== "undefined" && INTERNATIONAL_DAYS[md]) || [],
      anniversaries: (typeof ANNIVERSARIES !== "undefined" && ANNIVERSARIES[md]) || [],
    };
  }

  return { getInfo };
})();

// 最初に表示する雑学系記念日の件数。残りは「もっと詳しく」で展開する。
const TRIVIA_VISIBLE_COUNT = 3;

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("todayBanner");
  if (!el) return;

  const info = TodayInfo.getInfo(new Date());
  const m = info.date.getMonth() + 1;
  const d = info.date.getDate();
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][info.date.getDay()];

  const fixedChips = [];
  if (info.holiday) {
    fixedChips.push(`<span class="today-chip holiday">🎌 ${info.holiday}</span>`);
  }
  info.international.forEach((name) => {
    fixedChips.push(`<span class="today-chip intl">🌐 ${name}</span>`);
  });

  const visibleTrivia = info.anniversaries.slice(0, TRIVIA_VISIBLE_COUNT);
  const restTrivia = info.anniversaries.slice(TRIVIA_VISIBLE_COUNT);

  const triviaChip = (name) => `<span class="today-chip trivia">📌 ${name}</span>`;
  const visibleHtml = visibleTrivia.map(triviaChip).join("");
  const restHtml = restTrivia.map(triviaChip).join("");

  if (fixedChips.length === 0 && info.anniversaries.length === 0) {
    fixedChips.push(`<span class="today-chip trivia">今日は特に登録された記念日がありません</span>`);
  }

  const moreBtnHtml =
    restTrivia.length > 0
      ? `<button type="button" class="today-more-btn" id="todayMoreBtn">もっと詳しく(+${restTrivia.length}) ▼</button>`
      : "";

  el.innerHTML = `
    <span class="today-date">📅 今日は${m}月${d}日(${youbi})</span>
    <span class="today-chips">${fixedChips.join("")}${visibleHtml}<span class="today-chips-more" id="todayChipsMore" hidden>${restHtml}</span>${moreBtnHtml}</span>
  `;

  const moreBtn = document.getElementById("todayMoreBtn");
  const moreWrap = document.getElementById("todayChipsMore");
  if (moreBtn && moreWrap) {
    moreBtn.addEventListener("click", () => {
      const isHidden = moreWrap.hidden;
      moreWrap.hidden = !isHidden;
      moreBtn.textContent = isHidden ? "閉じる ▲" : `もっと詳しく(+${restTrivia.length}) ▼`;
    });
  }
});
