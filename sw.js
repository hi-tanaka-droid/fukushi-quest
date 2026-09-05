/* Offline assets are versioned together and isolated to this app's scope. */
const PREFIX = 'fq3d:' + self.registration.scope + ':';
const CACHE = PREFIX + '4.1.0-r6';
const ASSETS = ['index.html','style.css','adventure.css','content.js','adventure.js','engine.js','app.js','adventure-ui.js','world.js','world-play.js','vendor/three.module.min.js','vendor/three.core.min.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
const urls = new Set(ASSETS.map(path => new URL(path,self.registration.scope).href));
self.addEventListener('install',event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(new URL(path,self.registration.scope),{cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate',event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch',event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  url.search = ''; url.hash = '';
  if(url.href === self.registration.scope) url.pathname += 'index.html';
  if(!urls.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.href);
    if(cached) return cached;
    try { return await fetch(event.request); }
    catch { return new Response('Offline asset unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}); }
  }));
});
