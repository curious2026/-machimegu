// ═══════════════════════════════════════════════════════════════
// 街巡 Service Worker v45（起動安定化版）
// ═══════════════════════════════════════════════════════════════
// 変更点：
// - キャッシュ名にバージョン番号を入れて、新版で旧キャッシュを自動削除
// - index.html は Network First（常に最新版を取りに行く）
// - 静的アセットは Cache First（高速起動）
// - エラー時のフォールバック処理
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'machimegu-v45';
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;

// インストール時に同梱したい必須アセット（軽量なものだけ）
const PRECACHE_URLS = [
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// ─── インストール ───
self.addEventListener('install', (event) => {
  console.log('[SW] install:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] precache一部失敗（継続）:', err);
      }))
      .then(() => self.skipWaiting())  // 新版を即座にアクティブ化
  );
});

// ─── アクティブ化（古いキャッシュを破棄） ───
self.addEventListener('activate', (event) => {
  console.log('[SW] activate:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => 
          k !== CACHE_VERSION && k !== CACHE_RUNTIME
        ).map(k => {
          console.log('[SW] 旧キャッシュ削除:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())  // 既存タブも即座に新SWで動かす
  );
});

// ─── フェッチ戦略 ───
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  
  // 同一オリジン以外（Firebase, CDN, 地図タイル）はSWを介在させない
  if (url.origin !== self.location.origin) return;
  
  // POST等はキャッシュしない
  if (req.method !== 'GET') return;
  
  // /api/ 以下（バックエンドAPI）はキャッシュしない
  if (url.pathname.startsWith('/api/')) return;
  
  // index.html (/, /index.html) は Network First
  // → 常に最新を取りに行き、失敗時のみキャッシュから返す
  const isHtmlNav = (req.mode === 'navigate') || 
                    url.pathname === '/' || 
                    url.pathname === '/index.html' ||
                    url.pathname.endsWith('.html');
  
  if (isHtmlNav) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // 成功時はランタイムキャッシュに保存（オフライン保険）
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_RUNTIME).then(cache => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => {
          // ネットワーク失敗 → ランタイムキャッシュから返す
          return caches.match(req).then(cached => 
            cached || caches.match('/') || new Response('Offline', { 
              status: 503,
              headers: {'Content-Type': 'text/plain'}
            })
          );
        })
    );
    return;
  }
  
  // 画像・CSS・JSなど静的アセット は Cache First
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_RUNTIME).then(cache => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached || new Response('', { status: 404 }));
    })
  );
});

// ─── メッセージ受信（強制キャッシュクリアなど） ───
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => {
      console.log('[SW] 全キャッシュクリア完了');
    });
  }
});
