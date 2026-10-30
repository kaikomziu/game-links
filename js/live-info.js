// ===== 地震・気温のライブ情報 =====
// 外部APIが失敗しても、サイト本体の表示や操作は止めない。
(function () {
  const QUAKES_URL = "https://api.p2pquake.net/v2/history?codes=551&limit=1";
  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=35.7148&longitude=139.9341&current=temperature_2m,apparent_temperature,weather_code&timezone=Asia%2FTokyo";
  const REFRESH_MS = 5 * 60 * 1000;
  const WEATHER_LABELS = {
    0: "快晴", 1: "晴れ", 2: "一部くもり", 3: "くもり", 45: "霧", 48: "霧",
    51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨", 56: "弱い凍雨", 57: "凍雨",
    61: "弱い雨", 63: "雨", 65: "強い雨", 66: "弱い凍雨", 67: "強い凍雨",
    71: "弱い雪", 73: "雪", 75: "強い雪", 77: "雪あられ", 80: "弱いにわか雨",
    81: "にわか雨", 82: "強いにわか雨", 85: "弱いにわか雪", 86: "強いにわか雪",
    95: "雷雨", 96: "雷雨・ひょう", 99: "強い雷雨・ひょう",
  };

  const root = document.getElementById("liveInfo");
  if (!root) return;
  const quakeEl = root.querySelector("[data-live=quake]");
  const weatherEl = root.querySelector("[data-live=weather]");
  const updatedEl = root.querySelector("[data-live=updated]");
  const refreshBtn = root.querySelector("[data-live-refresh]");
  let busy = false;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function dateText(value) {
    const m = String(value || "").match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{1,2}):(\d{2})/);
    return m ? `${m[2]}/${m[3]} ${m[4]}:${m[5]}` : "時刻不明";
  }
  function scaleText(scale) {
    const labels = { 10: "1", 20: "2", 30: "3", 40: "4", 45: "5弱", 50: "5強", 55: "6弱", 60: "6強", 70: "7" };
    return labels[scale] || "不明";
  }
  function setLoading() {
    quakeEl.textContent = "読み込み中…";
    weatherEl.textContent = "読み込み中…";
    refreshBtn.disabled = true;
  }
  function setError(el, label) {
    el.innerHTML = `<span class="live-error">${esc(label)}を取得できませんでした</span>`;
  }

  async function getJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function renderQuake(data) {
    const quake = Array.isArray(data) ? data.find((item) => item && item.code === 551) : null;
    const e = quake && quake.earthquake;
    const h = e && e.hypocenter;
    if (!e || !h) throw new Error("地震情報の形式が不正");
    const magnitude = Number.isFinite(h.magnitude) ? `M${h.magnitude.toFixed(1)}` : "M--";
    const depth = Number.isFinite(h.depth) ? `深さ${h.depth}km` : "深さ不明";
    quakeEl.innerHTML = `<strong>震度${esc(scaleText(e.maxScale))}</strong> ${esc(h.name || "震源地不明")} <span>${esc(magnitude)}・${esc(depth)}</span><small>発表 ${esc(dateText(quake.issue?.time || quake.time || e.time))}</small>`;
  }

  function renderWeather(data) {
    const c = data && data.current;
    if (!c || !Number.isFinite(c.temperature_2m)) throw new Error("気温情報の形式が不正");
    const temp = Number(c.temperature_2m).toFixed(1);
    const apparent = Number.isFinite(c.apparent_temperature) ? `体感 ${Number(c.apparent_temperature).toFixed(1)}℃` : "";
    const label = WEATHER_LABELS[c.weather_code] || "天気情報あり";
    weatherEl.innerHTML = `<strong>${esc(temp)}℃</strong> ${esc(label)} <span>${esc(apparent)}</span><small>市川市付近・現在</small>`;
  }

  async function refresh() {
    if (busy) return;
    busy = true;
    setLoading();
    try {
      const results = await Promise.allSettled([getJson(QUAKES_URL), getJson(WEATHER_URL)]);
      if (results[0].status === "fulfilled") {
        try { renderQuake(results[0].value); } catch (e) { setError(quakeEl, "地震情報"); }
      } else setError(quakeEl, "地震情報");
      if (results[1].status === "fulfilled") {
        try { renderWeather(results[1].value); } catch (e) { setError(weatherEl, "気温"); }
      } else setError(weatherEl, "気温");
      updatedEl.textContent = `最終更新 ${new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    } finally {
      busy = false;
      refreshBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener("click", refresh);
  refresh();
  setInterval(refresh, REFRESH_MS);
})();
