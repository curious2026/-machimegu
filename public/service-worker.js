// ═══════════════════════════════════════════════════════════════
// 街巡 Service Worker v48（Network First のタイムアウト追加：レビュー🟡-7）
// ═══════════════════════════════════════════════════════════════
// v47からの変更点：
// - バージョン番号 v47 → v48
// - ★HTML経路の Network First に 3秒タイムアウト追加（🟡-7対応）
//   旧: fetch(req).then(...).catch(/* キャッシュにフォールバック */)
//        → fetchが「失敗」しなくても応答10秒以上だと真っ白な画面で待たされる
//   新: 3秒で諦めてキャッシュに切り替える Promise.race 方式
//   電車内・地下・電波が極端に弱い場所での白画面待ち時間を緩和。
//   オフラインフォールバックHTMLの利用機会も増える＝UXがより安定。
// - 既存戦略 Network First(HTML) / Cache First(静的+地図タイル) は完全維持
// - タイルキャッシュ（CACHE_TILES）は v47 と互換、再ダウンロード不要
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'machimegu-v48';
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;
const CACHE_TILES = 'machimegu-tiles';   // タイル専用（SW更新をまたいで再利用）
const TILE_CACHE_LIMIT = 300;            // タイル保持上限（約数MB）
const HTML_NETWORK_TIMEOUT_MS = 3000;    // ★v48: HTML Network First のタイムアウト

// 地図タイル判定（OpenStreetMap）
function isMapTile(url) {
  return url.hostname === 'tile.openstreetmap.org';
}

// ★v48 🟡-7: タイムアウト付き fetch（Network First の白画面対策）
//   通常の fetch は応答が遅延した場合（10秒以上）にずっと待ち続け、
//   `catch` も発火しないため、ユーザーには真っ白な画面が長時間表示される。
//   Promise.race で「先に決まった方」を採用：fetch成功 or タイムアウト reject。
//   タイムアウト時は catch 経由でキャッシュフォールバックに流れる。
function fetchWithTimeout(req, ms) {
  return Promise.race([
    fetch(req),
    new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout ' + ms + 'ms')), ms))
  ]);
}

// オフライン時の未キャッシュタイル用プレースホルダ（256x256・地図背景になじむ濃紺）
const OFFLINE_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#1a2433"/><text x="128" y="128" fill="#3a4a60" font-size="13" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">オフライン</text></svg>`;

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
          k !== CACHE_VERSION && k !== CACHE_RUNTIME && k !== CACHE_TILES
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
  
  // ★v47: 地図タイル（別オリジン）だけは例外的にSWで処理
  //   Cache First + 上限付きキャッシュ + オフライン時プレースホルダ
  if (req.method === 'GET' && isMapTile(url)) {
    event.respondWith(handleTile(req));
    return;
  }
  
  // 同一オリジン以外（Firebase, CDN, 地図タイル以外）はSWを介在させない
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
      // ★v48 🟡-7: 3秒で諦めてキャッシュにフォールバック（電波弱い環境での白画面対策）
      fetchWithTimeout(req, HTML_NETWORK_TIMEOUT_MS)
        .then(res => {
          // 成功時はランタイムキャッシュに保存（オフライン保険）
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_RUNTIME).then(cache => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => {
          // ネットワーク失敗 or 3秒タイムアウト → ランタイムキャッシュから返す
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

// ─── ★v47: 地図タイル処理（Cache First + 上限 + オフラインプレースホルダ）───
async function handleTile(req) {
  const cache = await caches.open(CACHE_TILES);
  const cached = await cache.match(req);
  if (cached) return cached;  // 見たことのあるタイル → 即返す（オフラインでもOK）
  
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      cache.put(req, res.clone());  // 新規タイルを保存
      trimTileCache();              // 上限超過分を掃除（待たない）
    }
    return res;
  } catch(e) {
    // オフライン & 未キャッシュ → プレースホルダを即返す（グレー固まり防止）
    return new Response(OFFLINE_TILE_SVG, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
    });
  }
}

// タイルキャッシュ上限管理（FIFO：put順の古いものから削除）
async function trimTileCache() {
  try {
    const cache = await caches.open(CACHE_TILES);
    const keys = await cache.keys();
    if (keys.length > TILE_CACHE_LIMIT) {
      const excess = keys.length - TILE_CACHE_LIMIT;
      for (let i = 0; i < excess; i++) {
        await cache.delete(keys[i]);  // 配列先頭＝最古から削除
      }
    }
  } catch(e) { /* 掃除失敗は無視（次回リトライ） */ }
}

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
