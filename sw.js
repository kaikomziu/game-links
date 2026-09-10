// MY GAMES LINKS Service Worker
// 方針: ネットワーク優先 + キャッシュフォールバック。
// 更新の多いサイトなので、オンライン時は常に最新を取得し、
// オフライン時のみ最後に取得したキャッシュ(特にトップページ)を返す。
const CACHE = "game-links-v1";
const CORE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/votes.js",
  "./js/stats.js",
  "./js/extras.js",
  "./js/today.js",
  "./js/version.js",
  "./data/holidays.js",
  "./data/international-days.js",
  "./data/anniversaries.js",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 同一オリジンのみ扱う(SupabaseやCDNはそのまま素通し)
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
