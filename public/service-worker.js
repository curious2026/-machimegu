/**
 * 街巡-まちめぐ- Service Worker
 * 役割: ローカルキャッシュで2回目以降の起動を瞬時化
 */

const CACHE_VERSION = 'machimegu-v1';
const RUNTIME_CACHE = 'machimegu-runtime';

// 起動時にプリキャッシュするコアリソース
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js'
];

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache partial failure:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  const validCaches = [CACHE_VERSION, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => !validCaches.includes(key))
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Firebase認証関連はキャッシュしない
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebaseauth.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }

  if (url.pathname.startsWith('/api/score')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (url.hostname.includes('cyberjapandata.gsi.go.jp') ||
      url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (event.request.mode === 'navigate' ||
      (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}
