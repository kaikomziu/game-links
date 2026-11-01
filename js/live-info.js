// ===== 地震・気温のライブ情報 =====
// 外部APIが失敗しても、サイト本体の表示や操作は止めない。
(function () {
  const QUAKES_URL = "https://api.p2pquake.net/v2/history?codes=551&limit=1";
  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=35.7148&longitude=139.9341&current=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=Asia%2FTokyo";
  const NEWS_URL = "https://qiita.com/api/v2/items?per_page=5";
  const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=35.7148&longitude=139.9341&current=european_aqi,pm10,pm2_5,uv_index&timezone=Asia%2FTokyo";
  const FX_URL = "https://api.frankfurter.dev/v2/rates?base=JPY&quotes=USD,EUR,GBP";
  const SUN_URL = "https://api.sunrise-sunset.org/v2?lat=35.7148&lng=139.9341&tz=Asia%2FTokyo";
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
  const externalRoot = document.getElementById("externalInfo");
  const quakeEl = root.querySelector("[data-live=quake]");
  const weatherEl = root.querySelector("[data-live=weather]");
  const forecastEl = externalRoot?.querySelector("[data-live=forecast]");
  const newsEl = externalRoot?.querySelector("[data-live=news]");
  const exchangeEl = externalRoot?.querySelector("[data-live=exchange]");
  const airEl = externalRoot?.querySelector("[data-live=air]");
  const sunEl = externalRoot?.querySelector("[data-live=sun]");
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
    if (quakeEl) quakeEl.textContent = "読み込み中…";
    if (weatherEl) weatherEl.textContent = "読み込み中…";
    if (forecastEl) forecastEl.innerHTML = "<p class=\"external-loading\" role=\"status\">読み込み中…</p>";
    if (newsEl) newsEl.innerHTML = "<p class=\"external-loading\" role=\"status\">読み込み中…</p>";
    [exchangeEl, airEl, sunEl].forEach((el) => { if (el) el.innerHTML = "<p class=\"external-loading\" role=\"status\">読み込み中…</p>"; });
    if (refreshBtn) refreshBtn.disabled = true;
  }
  function errorText(error) {
    if (error?.name === "AbortError") return "応答がタイムアウトしました";
    if (error instanceof TypeError) return "通信できません（接続またはAPIの制限を確認してください）";
    const message = String(error?.message || "原因不明");
    if (/^HTTP 429/.test(message)) return "アクセスが集中しています。少し待って再試行してください";
    if (/^HTTP 5\d\d/.test(message)) return "情報元で一時的な障害が発生しています";
    if (/^HTTP 4\d\d/.test(message)) return `情報元からエラーが返されました（${message}）`;
    return message;
  }
  function setError(el, label, error) {
    if (!el) return;
    el.innerHTML = `<span class="live-error">${esc(label)}を取得できませんでした：${esc(errorText(error))}</span>`;
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

  function dayText(iso, index) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return index === 0 ? "今日" : `+${index}日`;
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const week = ["日", "月", "火", "水", "木", "金", "土"];
    return index === 0 ? "今日" : `${Number(m[2])}/${Number(m[3])}(${week[date.getDay()]})`;
  }

  function renderForecast(data) {
    const d = data && data.daily;
    if (!d || !Array.isArray(d.time) || !Array.isArray(d.temperature_2m_max)) throw new Error("週間予報の形式が不正");
    forecastEl.innerHTML = d.time.slice(0, 7).map((day, i) => {
      const code = d.weather_code?.[i];
      const rain = Number.isFinite(d.precipitation_probability_max?.[i]) ? `${Math.round(d.precipitation_probability_max[i])}%` : "--";
      const max = Number.isFinite(d.temperature_2m_max?.[i]) ? `${Number(d.temperature_2m_max[i]).toFixed(0)}℃` : "--";
      const min = Number.isFinite(d.temperature_2m_min?.[i]) ? `${Number(d.temperature_2m_min[i]).toFixed(0)}℃` : "--";
      return `<div class="forecast-day"><b>${esc(dayText(day, i))}</b><span class="forecast-icon">${esc(weatherIcon(code))}</span><span class="forecast-temp"><strong>${esc(max)}</strong> / ${esc(min)}</span><small>☂${esc(rain)}</small></div>`;
    }).join("");
  }

  function weatherIcon(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    return "🌧️";
  }

  function renderNews(items) {
    if (!Array.isArray(items) || !items.length) throw new Error("ニュースがありません");
    newsEl.innerHTML = items.slice(0, 5).map((item) => {
      const tags = (item.tags || []).slice(0, 2).map((tag) => `#${esc(tag.name)}`).join(" ");
      const user = item.user?.id ? ` by ${esc(item.user.id)}` : "";
      return `<a class="news-item" href="${esc(item.url)}" target="_blank" rel="noopener"><strong>${esc(item.title)}</strong><small>${esc(tags)}${user}</small></a>`;
    }).join("");
  }

  function renderExchange(items) {
    if (!Array.isArray(items) || !items.length) throw new Error("為替情報がありません");
    exchangeEl.innerHTML = items.map((item) => {
      const yen = Number(item.rate) * 1000;
      if (!Number.isFinite(yen)) return "";
      return `<div class="external-data-row"><b>1,000円</b><span>≈ ${esc(yen.toFixed(2))} ${esc(item.quote)}</span></div>`;
    }).join("") + `<small class="external-data-note">基準日: ${esc(items[0].date || "不明")}</small>`;
  }

  function aqiLabel(value) {
    if (!Number.isFinite(value)) return "不明";
    if (value <= 20) return "とても良い";
    if (value <= 40) return "良い";
    if (value <= 60) return "普通";
    if (value <= 80) return "やや悪い";
    if (value <= 100) return "悪い";
    return "とても悪い";
  }

  function renderAir(data) {
    const c = data && data.current;
    if (!c || !Number.isFinite(c.european_aqi)) throw new Error("大気質情報の形式が不正");
    airEl.innerHTML = `<div class="external-data-row"><b>欧州AQI</b><span>${esc(Math.round(c.european_aqi))} (${esc(aqiLabel(c.european_aqi))})</span></div><div class="external-data-row"><b>PM2.5</b><span>${esc(Number(c.pm2_5).toFixed(1))} μg/m³</span></div><div class="external-data-row"><b>UV指数</b><span>${esc(Number(c.uv_index).toFixed(1))}</span></div>`;
  }

  function timeText(value) {
    const match = String(value || "").match(/T(\d{2}:\d{2})/);
    return match ? match[1] : "--:--";
  }

  function renderSun(data) {
    if (!data || data.status !== "OK") throw new Error("太陽情報の形式が不正");
    sunEl.innerHTML = `<div class="external-data-row"><b>日の出</b><span>${esc(timeText(data.results?.sunrise))}</span></div><div class="external-data-row"><b>日の入り</b><span>${esc(timeText(data.results?.sunset))}</span></div><div class="external-data-row"><b>昼の長さ</b><span>${esc(Math.floor(Number(data.results?.day_length || 0) / 3600))}時間${esc(Math.floor((Number(data.results?.day_length || 0) % 3600) / 60))}分</span></div>`;
  }

  async function refresh() {
    if (busy) return;
    busy = true;
    setLoading();
    try {
      const results = await Promise.allSettled([getJson(QUAKES_URL), getJson(WEATHER_URL), getJson(NEWS_URL), getJson(AIR_URL), getJson(FX_URL), getJson(SUN_URL)]);
      const errors = [];
      if (results[0].status === "fulfilled") {
        try { renderQuake(results[0].value); } catch (e) { setError(quakeEl, "地震情報", e); errors.push("地震"); }
      } else { setError(quakeEl, "地震情報", results[0].reason); errors.push("地震"); }
      if (results[1].status === "fulfilled") {
        try { renderWeather(results[1].value); } catch (e) { setError(weatherEl, "気温", e); errors.push("気温"); }
        try { renderForecast(results[1].value); } catch (e) { setError(forecastEl, "週間予報", e); errors.push("週間予報"); }
      } else { setError(weatherEl, "気温", results[1].reason); setError(forecastEl, "週間予報", results[1].reason); errors.push("気温・週間予報"); }
      if (results[2].status === "fulfilled") {
        try { renderNews(results[2].value); } catch (e) { setError(newsEl, "ニュース", e); errors.push("ニュース"); }
      } else { setError(newsEl, "ニュース", results[2].reason); errors.push("ニュース"); }
      if (results[3].status === "fulfilled") {
        try { renderAir(results[3].value); } catch (e) { setError(airEl, "大気質", e); errors.push("大気質"); }
      } else { setError(airEl, "大気質", results[3].reason); errors.push("大気質"); }
      if (results[4].status === "fulfilled") {
        try { renderExchange(results[4].value); } catch (e) { setError(exchangeEl, "為替", e); errors.push("為替"); }
      } else { setError(exchangeEl, "為替", results[4].reason); errors.push("為替"); }
      if (results[5].status === "fulfilled") {
        try { renderSun(results[5].value); } catch (e) { setError(sunEl, "太陽情報", e); errors.push("太陽情報"); }
      } else { setError(sunEl, "太陽情報", results[5].reason); errors.push("太陽情報"); }
      const time = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      updatedEl.textContent = errors.length ? `${errors.join("・")}の取得に失敗（${time}）` : `最終更新 ${time}`;
    } finally {
      busy = false;
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  refreshBtn?.addEventListener("click", refresh);
  window.refreshExternalInfo = refresh;
  if (!externalRoot || !externalRoot.hidden) refresh();
  setInterval(() => {
    if (!externalRoot || !externalRoot.hidden) refresh();
  }, REFRESH_MS);
})();
