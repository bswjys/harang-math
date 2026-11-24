/* 공부하랑핑 service worker — 오프라인에서도 열려요 */
const CACHE = 'harang-math-v7';
const ASSETS = [
  './',
  'index.html',
  'styles.css?v=7',
  'app.js?v=7',
  'dict-data.js?v=7',
  'dict.js?v=7',
  'eng-data.js?v=7',
  'eng.js?v=7',
  'fonts/HarangSans.woff',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/icon-180.png'
];

/* 새 배포가 바로 보이도록 앱 껍데기(HTML/CSS/JS)는 네트워크 먼저, 실패하면 캐시 */
const SHELL = [/\/$/, /\/index\.html$/, /\/app\.js$/, /\/dict\.js$/, /\/dict-data\.js$/, /\/eng\.js$/, /\/eng-data\.js$/, /\/styles\.css$/];
function isShell(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    return SHELL.some((re) => re.test(u.pathname));
  } catch (e) { return false; }
}

/* 받아쓰기·영어 MP3는 설치할 때 미리 받지 않고, 처음 들을 때 저장해 두었다가 다음부터 바로 씀 */
function isDictAudio(url) {
  try {
    const u = new URL(url);
    return u.origin === self.location.origin && /\/audio\/(dict|eng)\/[^/]+\.mp3$/.test(u.pathname);
  } catch (e) { return false; }
}

async function cacheFullAudio(url) {
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (hit) return;
    const res = await fetch(url, { cache: 'no-store' });   // Range 없는 요청 → 200 전체 파일
    if (res && res.ok) await cache.put(url, res);
  } catch (e) { /* 저장 실패는 재생에 영향 없음 */ }
}

/* iOS Safari는 음성을 Range 요청으로 받아 가요 → 저장해 둔 파일은 206으로 잘라서 돌려줌 */
async function dictAudio(req) {
  const url = req.url;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(url);
  if (cached) {
    const range = req.headers.get('range');
    if (!range) return cached;
    return sliceAudio(cached, range);
  }
  const res = await fetch(req);
  if (res && res.ok) {
    /* 첫 재생은 네트워크로 바로 들려주고, 전체 파일은 뒤에서 한 번만 조용히 저장 */
    if (res.status === 200) {
      const copy = res.clone();
      cache.put(url, copy).catch(() => {});
    } else {
      cacheFullAudio(url);
    }
  }
  return res;
}

async function sliceAudio(res, range) {
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)/.exec(range || '');
  if (!m) return res;
  let start = m[1] === '' ? null : parseInt(m[1], 10);
  let end = m[2] === '' ? null : parseInt(m[2], 10);
  if (start === null && end === null) return res;
  if (start === null) { start = Math.max(0, size - end); end = size - 1; }
  else if (end === null || end >= size) end = size - 1;
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  const chunk = buf.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(chunk.byteLength),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
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

  /* 2) 받아쓰기 MP3: 캐시 우선, 없으면 받아서 저장 (동적 캐시 · 설치 목록에는 없음) */
  if (isDictAudio(req.url)) {
    event.respondWith(dictAudio(req));
    return;
  }

  /* 3) 나머지(폰트·아이콘 등): 캐시 우선 + 뒤에서 조용히 갱신 */
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
