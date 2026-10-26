/* 福祉クエスト Service Worker — ネットワーク優先(画面は4秒待って届かなければ手元版)+オフラインフォールバック */
const CACHE = "fukushi-quest-v24";
/* github.io は同じオリジンに他のアプリ(fubi-check 等)が同居する。自分の世代(と旧3D版)のキャッシュだけ消す */
const MINE = k => k.startsWith("fukushi-quest-") || k.startsWith("fq3d:");
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const NAV_TIMEOUT = 4000;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))/* HTTPキャッシュ(max-age=600)の古い版を拾わない */
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => MINE(k) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    /* 画面(HTML)は ?openExternalBrowser=1 などのクエリ違いも index.html 1件に保存する */
    const net = fetch(req.url, { cache: "no-cache" }).then(res => {
      /* HTML だけを画面として保存する(sw.js などを直接開いたときに中身で上書きしない) */
      if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
      return res;
    });
    e.waitUntil(net.then(() => {}, () => {}));/* 手元版で先に開いても、届いた新版は次回のために保存する */
    const local = () => caches.match("./index.html").then(m => m || caches.match("./"));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fin = r => { if (!done && r) { done = true; clearTimeout(t); resolve(r); } };
      const t = setTimeout(() => local().then(fin), NAV_TIMEOUT);
      net.then(fin, () => local().then(m => fin(m || Response.error())));
    }));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || Response.error())));
});
