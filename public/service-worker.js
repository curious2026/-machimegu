// ═══════════════════════════════════════════════════════════════
// 街巡 Service Worker v46（Phase E：オフライン体験強化版）
// ═══════════════════════════════════════════════════════════════
// v45からの変更点：
// - バージョン番号 v45 → v46
// - precache に画像系を少し追加（起動高速化）
// - オフライン時の HTML フォールバック改善（簡易オフラインページ）
// - Firestore オフライン永続化と連動（クライアント側で対応済み）
// - 既存の Network First / Cache First 戦略は維持
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'machimegu-v46';
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;

// インストール時に同梱したい必須アセット（軽量なものだけ）
const PRECACHE_URLS = [
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// オフライン時のフォールバック HTML（精ENABLEUしいスタイル）
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>オフライン - 街巡</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif}
  body{background:linear-gradient(160deg,#0a1428 0%,#06101e 100%);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .ob{text-align:center;max-width:340px}
  .ob-icon{font-size:64px;margin-bottom:18px;opacity:0.7}
  h1{font-size:24px;font-weight:900;margin-bottom:12px;letter-spacing:1px}
  p{font-size:14px;color:#a8b8d0;line-height:1.7;margin-bottom:24px;font-weight:700}
  button{padding:14px 36px;background:linear-gradient(135deg,#ffe890,#fbd56a,#d4a020);color:#1a1408;border:none;border-radius:24px;font-weight:900;font-size:15px;cursor:pointer;letter-spacing:1.5px;box-shadow:0 4px 16px rgba(251,213,106,0.4)}
  button:active{transform:scale(0.96)}
  .ob-hint{font-size:11px;color:#7a96b6;margin-top:16px;letter-spacing:0.5px}
</style>
</head>
<body>
<div class="ob">
  <div class="ob-icon">📡</div>
  <h1>オフライン中</h1>
  <p>インターネット接続を確認してください。<br>接続が戻ったら自動で再読み込みします。</p>
  <button onclick="location.reload()">再試行</button>
  <div class="ob-hint">街巡 - まちめぐ -</div>
</div>
<script>
  window.addEventListener('online', () => { location.reload(); });
</script>
</body>
</html>`;

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
          return caches.match(req).then(cached => {
            if (cached) return cached;
            return caches.match('/').then(rootCached => {
              if (rootCached) return rootCached;
              // どこにもキャッシュない → オフラインフォールバックHTML
              return new Response(OFFLINE_FALLBACK_HTML, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          });
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
