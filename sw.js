/* 공부하랑핑 service worker — 오프라인에서도 열려요 */
const CACHE = 'harang-math-v4';
const ASSETS = [
  './',
  'index.html',
  'styles.css?v=4',
  'app.js?v=4',
  'dict-data.js?v=4',
  'dict.js?v=4',
  'fonts/HarangSans.woff',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/icon-180.png'
];

/* 새 배포가 바로 보이도록 앱 껍데기(HTML/CSS/JS)는 네트워크 먼저, 실패하면 캐시 */
const SHELL = [/\/$/, /\/index\.html$/, /\/app\.js$/, /\/dict\.js$/, /\/dict-data\.js$/, /\/styles\.css$/];
function isShell(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    return SHELL.some((re) => re.test(u.pathname));
  } catch (e) { return false; }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  /* 1) 앱 껍데기: 네트워크 우선 (실패하면 캐시) */
  if (isShell(req.url)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match('index.html')))
    );
    return;
  }

  /* 2) 나머지(폰트·아이콘 등): 캐시 우선 + 뒤에서 조용히 갱신 */
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then((res) => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
