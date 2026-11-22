// wm3.ai service worker: what makes the site installable and quick to reopen.
// Pages: network first, so a deploy shows up on the next open; the last copy is the fallback when offline.
// Built assets (hashed names under /assets/), models, fonts and icons: cache first, since their URLs change when they do.
// The Ask API and anything cross-origin except Google Fonts go straight to the network.
const PAGES = 'wm3-pages-v1';
const STATIC = 'wm3-static-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(['/'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  const cacheable = fonts || /^\/(assets|models)\//.test(url.pathname) || /\.(png|jpg|jpeg|svg|webp|woff2?|glb)$/.test(url.pathname);
  if (!cacheable) return;
  e.respondWith(
    caches.open(STATIC).then((c) =>
      c.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok || res.type === 'opaque') c.put(req, res.clone());
            return res;
          }),
      ),
    ),
  );
});
