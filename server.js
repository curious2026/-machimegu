// ═══════════════════════════════════════════════════════════════
// 街巡 server.js v16（2026-09-23 JST：トップをアプリ紹介ページに・駅検索）
// ═══════════════════════════════════════════════════════════════
// v15 → v16 の変更点（2026-09-23 スレ44）：
//   ★「/」＝アプリの公式紹介ページ（できること・駅検索・TOP12・都道府県・使い方・ストア）
//     旧TWA版は /index.html としてそのまま残す（express.static の index:false）
//   ★/search?q=駅名（1駅ならその駅ページへ、同名や部分一致は一覧）／/search?pref=県（街力順）
//   ★/privacy.html・/terms.html など public の中身は今までどおり
// ───────────────────────────────────────────────────────────────
// v14 → v15 の変更点（2026-09-22 スレ44）：
//   ★全8,993駅の「この駅はどんな街？」ページ： /station/東京都/東陽町
//     街力の内訳（店の実数つき）・順位（全国/県/路線/利用者/古さ）・名所・
//     近くの駅との比較（最大8）・同名駅・地図・この駅で進むバッジ・ストアへの入口
//   ★/sitemap.xml（全駅のURL）
//   ★station_yomi.json（ふりがな・8,916駅）をリポジトリに同梱すると読みが出る
//   ★ここで何が起きても /api/* には影響しない（try/catch で閉じる）
// ───────────────────────────────────────────────────────────────
// v13 → v14 の変更点（2026-09-22 スレ44）：
//   ★駅コメント（station_text.json）をサーバから配れるようにした。
//     ・リポジトリの一番上に station_text.json を置くと、起動時に読み込む
//     ・GET /api/station-text …… そのファイルをそのまま返す（gzip で約1/3）
//     ・/api/version に textVersion（ファイルの version 欄）を足す
//   ★アプリ（1.9.1 以降）は textVersion が手元より新しいときだけ取りに来る。
//     ＝コメントの直しは、GitHub に station_text.json を上げるだけで審査なしで届く。
//   ★ファイルが無い・壊れている → 何も配らない（アプリは同梱のまま）。
//     古いアプリ（1.9.0 以前）は textVersion を読まないので影響なし。
// ───────────────────────────────────────────────────────────────
// v12 → v13 の変更点（2026-09-22 スレ44）：
//   ★latestVersion / latestNote を、App Store から自動で取るようにした。
//     1時間に1回、Apple の公開窓口（iTunes Lookup）に今のストアの版を聞く。
//       https://itunes.apple.com/lookup?id=6804345019&country=jp
//     ・latestVersion ← ストアの版（例 1.10.0）
//     ・latestNote    ← ストアの「新機能」（リリースノート）の最初の一文
//     ★ともきはストアで公開するだけ。Railway は触らない。
//     ★Android はストアの版を別に取れないので、App Store の版を両OSに使う。
//       （ともき談：同時に出すと Android の方が必ず先に公開される＝問題なし）
//   ★手入力が優先：Railway の LATEST_VERSION が入っていれば、そちらを使う。
//     LATEST_NOTE が入っていれば、お知らせの文もそちらを使う。
//   ★非常口：Railway に STORE_CHECK=off を入れると自動確認を止める。
//   ★ストアの窓口が失敗しても、前回うまく取れた値を使い続ける（空にしない）。
// ───────────────────────────────────────────────────────────────
// v11 → v12 の変更点（2026-09-20 スレ44）：
//   ★1行目の版数が v10 のまま止まっていた（中身は v11 の恒久対策入り）。
//     今回から v12 と書く。
//   ★/api/version に次の4項目を足した。★値は Railway の環境変数から読む。
//     GitHub を触らずに、Railway の画面で値を書き換えるだけで切り替えられる。
//       LATEST_VERSION    → latestVersion   ストアで公開中の最新版（例 1.9.0）
//                           ★ストアに新版が並んでから入れる
//       LATEST_NOTE       → latestNote      更新のお知らせの1行（任意）
//       TILE_URL          → tileUrl         地図タイルの差し替え先（普段は空）
//       TILE_ATTRIBUTION  → tileAttribution 差し替え先の出典（普段は空）
//     ★環境変数が空・未設定なら、その項目は応答に入れない
//       （＝アプリは既定のまま：お知らせなし／OpenStreetMap）。
//     ★アプリ側の対応は 1.8.0 以上。1.7.1 以下は4項目を読まない。
// ═══════════════════════════════════════════════════════════════
// v9 → v10 の変更点（2026-06-05 総合レビュー対応）：
//   🔴-1: /api/test を本番から削除（レート制限・認証なしでDuckDB→S3クエリ発生
//         する穴。コスト爆発リスク）
//   🟡-1: helmet によるセキュリティヘッダー（HSTS / X-Content-Type-Options /
//         X-Frame-Options / Referrer-Policy）を導入。CSPは現状unsafe-inline
//         必要のため無効化（将来Step 3で詰める）
//   🟡-4: /api/score の動的計算経路に座標範囲チェック追加（日本国内範囲外を
//         400で弾く。攻撃座標でのS3クエリを抑制）
//   🟡-5: express.json() に limit:'10kb' 設定（POSTのbody肥大化攻撃を抑制）
//   🟡-6: /api/version にレート制限（generalLimiter）追加
//   🟡-8: STATIONS_BY_ID Map化（/api/score キャッシュ参照を O(N²)→O(N) に）
//   🟡-9,10: uncaughtException / rebuild失敗を Discord webhook で通知
//         （DISCORD_WEBHOOK_URL 環境変数。未設定でも安全に動作）
//
// 既存機能（v9から維持）：
//   - 起動時に旧キャッシュ即読込（stale-while-revalidate）
//   - バックグラウンドで全駅×3半径をプリ計算
//   - エンドポイント /api/all-scores（一括取得）、/api/score（個別後方互換）
//   - HTTPキャッシュヘッダで30日キャッシュ → 5分に短縮済（v9）
//   - 四半期更新判定（前回計算から90日以上で再計算）
//   - 管理用 /api/admin/rebuild、/api/status、/api/admin/diff
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const compression = require('compression');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');  // ★Step 1-②: APIレート制限
const helmet  = require('helmet');                // ★v10: セキュリティヘッダー（🟡-1）
const path    = require('path');
const fs      = require('fs');
const duckdb  = require('duckdb');
const jose    = require('jose');

// ═══════════════════════════════════════════════════════════════
// Firebase ID Token 軽量検証（管理者ダッシュボード認証用）
// jose で Google の公開鍵を取得して JWT 検証
// ═══════════════════════════════════════════════════════════════
// ★Step 1-④: ADMIN_UIDSを環境変数化（GitHubソース露出リスク回避）
//   旧: ハードコード → リポジトリ公開時にUIDが世界に露出
//   新: Railway環境変数 ADMIN_UIDS から読込（カンマ区切りで複数可）
//   フォールバック: 環境変数未設定時のみ既存UIDで動作（移行期間中の事故防止）
const ADMIN_UIDS = (process.env.ADMIN_UIDS || 'JpHzl9PQf1MNHwXovfvDhKHU57z1')
  .split(',').map(s => s.trim()).filter(Boolean);
const FIREBASE_PROJECT_ID = 'machi-megu-project';

// Google のJWKエンドポイント（Firebaseが使う公開鍵）
const FIREBASE_JWKS = jose.createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
  {
    timeoutDuration: 5000,
    cacheMaxAge: 60 * 60 * 1000  // 1時間キャッシュ
  }
);

async function verifyFirebaseIdToken(token) {
  // Firebase ID TokenはJWT形式、joseで検証
  // ★Step 1-③: clockToleranceを24時間→5分に短縮（業界標準）
  //   旧: 24時間 → トークン漏洩時に最大24時間悪用可能 = セキュリティリスク大
  //   新: 5分 → 漏洩時の悪用ウィンドウを288分の1に短縮
  //   ※クライアント側（admin.html）で50分ごとに getIdToken(true) で自動更新する設計と組み合わせ
  const { payload } = await jose.jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
    clockTolerance: '5 minutes'
  });
  // payload.sub または payload.user_id が UID
  return {
    uid: payload.sub || payload.user_id,
    email: payload.email || '',
    emailVerified: payload.email_verified || false,
    name: payload.name || ''
  };
}

// 認証ミドルウェア
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({error: 'No token'});
  }
  try {
    const decoded = await verifyFirebaseIdToken(token);
    if (!ADMIN_UIDS.includes(decoded.uid)) {
      console.warn(`[admin] 不正アクセス試行: uid=${decoded.uid}`);
      return res.status(403).json({error: '管理者権限がありません'});
    }
    req.adminUid = decoded.uid;
    req.adminEmail = decoded.email;
    next();
  } catch(e) {
    console.warn('[admin] トークン検証失敗:', e.message);
    return res.status(401).json({error: 'Invalid token: ' + e.message});
  }
}

console.log('[起動] 管理者認証: jose方式 (軽量版)');
console.log('[起動] Admin UIDs:', ADMIN_UIDS);

const app = express();

// ═══════════════════════════════════════════════════════════════
// ★2026-07-05: Railwayはプロキシ経由でリクエストが届くため、1段だけ信用する
// これがないとexpress-rate-limitがX-Forwarded-Forヘッダを不正とみなし
// ERR_ERL_UNEXPECTED_X_FORWARDED_FORでリクエストが落ちる
// （値を1にするのは重要：trueにすると偽装IPでレート制限を回避されうる）
// ═══════════════════════════════════════════════════════════════
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════════
// gzip圧縮（すべてのレスポンスを自動圧縮）
// HTMLサイズを約70%削減（1MB→300KB）
// ═══════════════════════════════════════════════════════════════
app.use(compression({
  level: 6,           // 圧縮レベル（1=速度優先, 9=サイズ優先, 6=デフォルト・バランス型）
  threshold: 1024,    // 1KB未満は圧縮しない（オーバーヘッド回避）
}));

// ★v10 🟡-1: セキュリティヘッダー（helmet）
//   HSTS: HTTPS強制（1年）。Cloudflareでも有効化済だが、Origin側でも明示。
//   X-Content-Type-Options: nosniff（MIME sniffing攻撃防止）
//   X-Frame-Options: SAMEORIGIN（clickjacking防止）
//   Referrer-Policy: strict-origin-when-cross-origin（リファラ漏洩抑制）
//   CSP: 現状インラインscript/styleが大量にあるため無効化。将来Step 3で詰める。
//        index.html側で meta CSP を入れる場合も同様に nonce 等の対応が要る。
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,  // Firebase/Google CDN との互換性
  crossOriginOpenerPolicy: false,    // signInWithPopup の Google ログインウィンドウ互換
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ★Step 1-①: CORS制限（本番ドメインと開発用localhostのみ許可）
//   旧: app.use(cors()) → 誰でもAPIを叩ける = DDoS/コスト爆発リスク
//   新: 明示的なoriginリストで制限
app.use(cors({
  origin: [
    'https://machimegu.com',
    'https://www.machimegu.com',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true
}));

// ★Step 1-②: APIレート制限（DDoS・コスト爆発対策）
//   一般API: 1分100回まで（通常利用では十分余裕、攻撃時はブロック）
//   一括取得: 1分30回まで（重い処理なので厳しめ）
//   管理API: 1分5回まで（rebuild等の重要操作）
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'リクエストが多すぎます。少し待ってからもう一度お試しください。' }
});
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'リクエストが多すぎます。少し待ってからもう一度お試しください。' }
});
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '管理APIのレート制限に達しました' }
});
// 適用：一般APIは100/分、重いAPIは30/分、管理APIは5/分
app.use('/api/score', generalLimiter);
app.use('/api/all-scores', heavyLimiter);
app.use('/api/admin', adminLimiter);
// ★v10 🟡-6: /api/version はクライアントが定期ポーリングする想定。
//   no-storeでCDNキャッシュ効かないため、Origin側で攻撃を弾く必要あり。
app.use('/api/version', generalLimiter);
// ★v14：駅コメントの配信（1.5MB。重いAPIと同じ制限）
app.use('/api/station-text', heavyLimiter);
// ★v10 🟡-5: body size limit（POSTエンドポイントはbody不要 or 極小JSONのみ）
app.use(express.json({ limit: '10kb' }));

// 静的ファイルにキャッシュヘッダ
// ★v16：「/」はアプリの紹介ページ（下の app.get('/')）。旧TWA版は /index.html で残す
app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  maxAge: '7d',  // 静的アセットは7日キャッシュ
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');  // HTMLは常に最新
    }
    // ★Step 2前哨: service-worker.jsは絶対にキャッシュしない（Service Worker鉄則）
    //   ブラウザがSWを7日キャッシュすると、サーバ側でSW更新しても反映されず、
    //   「新しいデータがあります→更新中…のまま」のループバグが発生する。
    if (filePath.endsWith('service-worker.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ═══ 設定 ═══
const RADII = [500, 800, 1200];
const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;  // 四半期 = 90日
// ★ Railway Hobbyプラン（8GB RAM）対応：並列度3で1時間で完走
// メモリ不足によるOOM killのリスクなし
// （Trialプラン時代はCONCURRENCY=1にしていたが、Hobbyで余裕あり）
const CONCURRENCY = 3;  // 同時計算数

// ═══ ファイルパス ═══
// CACHE_DIR 環境変数があればそちらに保存（Railway Volume mount用）
// なければ __dirname に保存（ローカル開発用）
const CACHE_DIR = process.env.CACHE_DIR || __dirname;

// CACHE_DIR が存在しなければ作成（初回マウント時用）
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log('CACHE_DIR を作成:', CACHE_DIR);
  } else {
    console.log('CACHE_DIR 使用:', CACHE_DIR);
  }
} catch(e) {
  console.error('CACHE_DIR 作成失敗:', e.message, '→ __dirname にフォールバック');
}

const STATIONS_FILE = path.join(__dirname, 'stations.json');  // 読取専用、デプロイ時に同梱
const SCORES_CACHE_FILE = path.join(CACHE_DIR, 'scores_cache.json');
const SCORES_CACHE_TMP = path.join(CACHE_DIR, 'scores_cache.tmp.json');
const SCORES_CACHE_PREV_FILE = path.join(CACHE_DIR, 'scores_cache_previous.json');  // 前期版（差分用）

// ═══ 駅マスタ読込 ═══
let STATIONS = [];
// ★v10 🟡-8: id → station の O(1) 引きMap。/api/score のキャッシュ参照を O(N²) → O(N) に。
const STATIONS_BY_ID = new Map();
try {
  STATIONS = JSON.parse(fs.readFileSync(STATIONS_FILE, 'utf8'));
  STATIONS.forEach(s => STATIONS_BY_ID.set(s.id, s));
  console.log(`駅マスタ読込: ${STATIONS.length}駅 (Map化: ${STATIONS_BY_ID.size}件)`);
} catch(e) {
  console.error('stations.json読込失敗:', e.message);
  console.error('→ stations.jsonをルート直下に配置してください');
}

// ═══ メインキャッシュ ═══
// scoresCache 構造:
// {
//   version: '2026-Q2',
//   builtAt: 1715000000000,
//   stations: {
//     '新宿_東京都': {
//       r500:  { score: 850, details: {...}, rank: 'S' },
//       r800:  { score: 920, details: {...}, rank: 'S' },
//       r1200: { score: 970, details: {...}, rank: 'S' }
//     },
//     ...
//   }
// }
let scoresCache = { version: '', builtAt: 0, stations: {} };

// GitHubルートに同梱する seed キャッシュ（dev環境フォールバック用）
// 本番の scores_cache.json を /api/admin/download-cache でDLし、
// scores_cache_seed.json としてリポジトリ直下に配置すると、
// CACHE_DIR にキャッシュが無い環境（dev の /tmp/cache 等）でも
// Overture を再計算せずにこの seed から街力を表示できる。
const SCORES_SEED_FILE = path.join(__dirname, 'scores_cache_seed.json');

function loadScoresCache() {
  // ① まず CACHE_DIR の正規キャッシュを読む（本番ボリューム /data 等）
  try {
    if (fs.existsSync(SCORES_CACHE_FILE)) {
      scoresCache = JSON.parse(fs.readFileSync(SCORES_CACHE_FILE, 'utf8'));
      const cnt = Object.keys(scoresCache.stations || {}).length;
      console.log(`スコアキャッシュ読込: v${scoresCache.version}, ${cnt}駅, builtAt=${new Date(scoresCache.builtAt).toLocaleString('ja-JP')}`);
      if (cnt > 0) return;  // 正規キャッシュが有効なら seed は不要
    }
  } catch(e) {
    console.warn('スコアキャッシュ読込失敗:', e.message);
    scoresCache = { version: '', builtAt: 0, stations: {} };
  }

  // ② 正規キャッシュが無い/空の場合のみ、GitHub同梱の seed を読む（dev用フォールバック）
  // ★v11 恒久対策①: seed は ALLOW_SEED_CACHE=1 の環境（dev）でのみ使用。
  //   本番で正規キャッシュの読込が一時的に失敗した場合に、古い seed が
  //   正規キャッシュを乗っ取り「駅数不足の新データ」として配信される事故
  //   （2026-07-06 のスコア0事故の最有力ルート）を根本遮断する。
  //   本番はキャッシュ無し→自動フル再計算に任せる（配信ガード②が旧表示を守る）。
  if (process.env.ALLOW_SEED_CACHE !== '1') {
    console.log('[seed] ALLOW_SEED_CACHE≠1（本番想定）→ seed フォールバックはスキップ');
    return;
  }
  try {
    if (fs.existsSync(SCORES_SEED_FILE)) {
      const seed = JSON.parse(fs.readFileSync(SCORES_SEED_FILE, 'utf8'));
      const seedCnt = Object.keys(seed.stations || {}).length;
      if (seedCnt > 0) {
        scoresCache = seed;
        console.log(`[seed] 正規キャッシュ無し → 同梱 seed を使用: v${seed.version}, ${seedCnt}駅`);
        // seed を CACHE_DIR にも保存して以降は正規キャッシュ扱いにする（次回起動を高速化）
        try {
          saveScoresCache(seed);
          console.log('[seed] CACHE_DIR に seed を複製保存しました');
        } catch(_) {}
      }
    }
  } catch(e) {
    console.warn('[seed] seed 読込失敗:', e.message);
  }
}

// ★v11 恒久対策②: キャッシュ完全性チェック
//   「駅マスタの95%以上をカバーし、builtAt が入っている」ものだけを完全とみなす。
//   不完全なキャッシュは (a)正規ファイルに保存しない (b)クライアントに新データとして配信しない。
//   これにより、ビルド途中クラッシュ・ファイル破損・古いseed等、
//   どのルートで不完全データが生まれても本番配信には到達できない。
const CACHE_COMPLETE_RATIO = 0.95;
function isCacheComplete(cache) {
  if (!cache || !cache.builtAt || cache.builtAt <= 0) return false;
  const cnt = Object.keys(cache.stations || {}).length;
  if (STATIONS.length === 0) return cnt > 0;  // マスタ未読込時は駅数のみで判定
  return cnt >= Math.floor(STATIONS.length * CACHE_COMPLETE_RATIO);
}

function saveScoresCache(data) {
  // ★v11 恒久対策②-a: 保存ガード。不完全なデータは正規キャッシュに書き込まない。
  //   （.partial は別ファイルなので従来どおり途中保存できる）
  if (!isCacheComplete(data)) {
    const cnt = Object.keys((data && data.stations) || {}).length;
    console.error(`[saveScoresCache] 保存拒否: 不完全キャッシュ（${cnt}/${STATIONS.length}駅, builtAt=${data && data.builtAt}）`);
    notifyOps('saveScoresCache 保存拒否（不完全キャッシュ）', `${cnt}/${STATIONS.length}駅`);
    try {
      fs.writeFileSync(SCORES_CACHE_FILE + '.rejected.json', JSON.stringify(data));
    } catch(_) {}
    return false;
  }
  // atomic write: tmpに書いてrename
  try {
    fs.writeFileSync(SCORES_CACHE_TMP, JSON.stringify(data));
    fs.renameSync(SCORES_CACHE_TMP, SCORES_CACHE_FILE);
    return true;
  } catch(e) {
    console.error('スコアキャッシュ保存失敗:', e.message);
    return false;
  }
}

// ═══ DuckDB ═══
const db = new duckdb.Database(':memory:');
function initDB() {
  return new Promise((resolve, reject) => {
    const con = db.connect();
    con.exec("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';", err => {
      con.close();
      if (err) reject(err); else resolve();
    });
  });
}

// ★v11 恒久対策④: Overture リリースの自動追従
//   Overture は公開データを最大60日（月次2リリース分）しか保持せず、
//   古いリリースは S3 から自動削除される（2026-07-06 の全クエリ空振り事故の原因）。
//   対策: 公式 STAC カタログ（常に最新リリースを指す）から起動時と rebuild 直前に
//   最新リリース名を取得し、S3 パスを動的に組み立てる。
//   取得失敗時は DEFAULT_OVERTURE_RELEASE にフォールバック（オフラインでも起動可能）。
const DEFAULT_OVERTURE_RELEASE = '2026-06-17.0';  // フォールバック用（手動更新は原則不要になった）
let OVERTURE_RELEASE = DEFAULT_OVERTURE_RELEASE;
function s3PlacesPath() {
  return `s3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=places/type=place/*`;
}

async function resolveLatestOvertureRelease() {
  try {
    const res = await fetch('https://stac.overturemaps.org/catalog.json', { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cat = await res.json();
    // カタログの latest フィールド（例: "2026-06-17.0" または "2026-06-17.0/"）
    let latest = cat && (cat.latest || (cat.properties && cat.properties.latest));
    if (typeof latest === 'string' && /^\d{4}-\d{2}-\d{2}\.\d+\/?$/.test(latest.trim())) {
      latest = latest.trim().replace(/\/$/, '');
      if (latest !== OVERTURE_RELEASE) {
        console.log(`[overture] リリース更新検出: ${OVERTURE_RELEASE} → ${latest}`);
        OVERTURE_RELEASE = latest;
      } else {
        console.log(`[overture] 最新リリース確認: ${OVERTURE_RELEASE}（変更なし）`);
      }
      return true;
    }
    console.warn('[overture] STACカタログの形式が想定外、フォールバック値を使用:', String(latest).slice(0, 50));
    return false;
  } catch(e) {
    console.warn('[overture] STACカタログ取得失敗、フォールバック値を使用:', e.message);
    return false;
  }
}

// ═══ カテゴリマッピング v2（basic_category ベース）═══
// Overture の basic_category（255語）を4軸へ割り当て。
// 旧版は categories.primary の47語を見ており、japanese_restaurant 等を
// 取りこぼして全国のPOIの71〜81%が未集計だった。
const AXIS_MAP = {
  // ── 飲食 ──
  alcoholic_beverage_venue:'飲食', bar:'飲食', cafe:'飲食', casual_eatery:'飲食',
  coffee_shop:'飲食', fast_food_restaurant:'飲食', food_court:'飲食', food_service:'飲食',
  food_truck_stand:'飲食', lounge:'飲食', non_alcoholic_beverage_venue:'飲食', restaurant:'飲食',
  smoothie_juice_bar:'飲食',
  // ── 商業 ──
  amusement_park:'商業', animal_and_pet_store:'商業', aquarium:'商業', arcade:'商業',
  art_gallery:'商業', arts_crafts_and_hobby_store:'商業', bed_and_breakfast:'商業', books_music_and_video_store:'商業',
  brewery:'商業', casino:'商業', comedy_club:'商業', cultural_center:'商業',
  dance_club:'商業', department_store:'商業', discount_store:'商業', distillery:'商業',
  electronics_store:'商業', event_venue:'商業', farmers_market:'商業', fashion_and_apparel_store:'商業',
  flowers_and_gifts_store:'商業', gaming_venue:'商業', hardware_home_and_garden_store:'商業', hotel:'商業',
  inn:'商業', lodging:'商業', market:'商業', movie_theater:'商業',
  museum:'商業', music_venue:'商業', musical_instrument_and_pro_audio_store:'商業', office_supply_store:'商業',
  performing_arts_venue:'商業', personal_care_and_beauty_store:'商業', planetarium:'商業', resort:'商業',
  science_attraction:'商業', second_hand_store:'商業', shopping_mall:'商業', specialty_store:'商業',
  sporting_goods_store:'商業', stadium_arena:'商業', superstore:'商業', theatre_venue:'商業',
  toys_and_games_store:'商業', warehouse_club_store:'商業', winery:'商業', zoo:'商業',
  // ── 生活 ──
  atm:'生活', bank_or_credit_union:'生活', convenience_store:'生活', food_and_beverage_store:'生活',
  gas_station:'生活', laundry_service:'生活', personal_or_beauty_service:'生活', pharmacy_and_drug_store:'生活',
  shipping_or_delivery_service:'生活',
  // ── 医療 ──
  behavioral_or_mental_health_clinic:'医療', complementary_and_alternative_medicine:'医療', dental_clinic:'医療', diagnostics_imaging_or_lab_service:'医療',
  emergency_department:'医療', emergency_or_urgent_care_facility:'医療', hospital:'医療', medical_service:'医療',
  outpatient_care_facility:'医療', pediatric_clinic:'医療', physical_medicine_and_rehabilitation:'医療', primary_care_or_general_clinic:'医療',
  reproductive_perinatal_and_womens_care:'医療', senior_living_facility:'医療', specialized_health_care:'医療', specialized_medical_facility:'医療',
  specialty_hospital:'医療', surgery:'医療', urgent_care_center:'医療', vision_or_eye_care_clinic:'医療',
  walk_in_clinic:'医療',
};
const AXES    = ['飲食','商業','生活','医療'];
const MAX_PTS = {'飲食':350, '商業':350, '生活':150, '医療':100};
const BONUS_MAX_PTS = 50;
const BONUS_RADIUS_M = 800;

// ═══ ★マッピング指紋（新旧の集計が混ざる事故を構造的に防ぐ）═══
//   .partial から再開する仕組みは便利だが、AXIS_MAP を変更した直後に
//   古い .partial が残っていると「旧マッピングで数えた駅」と
//   「新マッピングで数えた駅」が1つのキャッシュに同居してしまう。
//   AXIS_MAP の内容から指紋を作り、.partial に埋め込む。
//   指紋が一致しない .partial は再開に使わず破棄する。
//   （人間が削除を忘れても事故が起きない構造にする）
const AXIS_MAP_SIGNATURE = (() => {
  const src = Object.keys(AXIS_MAP).sort().map(k => k + '=' + AXIS_MAP[k]).join('|');
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return 'bc-' + Object.keys(AXIS_MAP).length + '-' + h.toString(36);
})();
console.log('[overture] AXIS_MAP署名:', AXIS_MAP_SIGNATURE, `(${Object.keys(AXIS_MAP).length}語 / basic_category)`);

// ═══ ボーナス対象施設マスター（手動キュレーション、332件）═══
// 配点：大学(本部)15、サテライト5、大学病院15、大規模病院8、
//      大規模公園10/中規模5、著名寺社10/地域有力5、ミュージアム5-8、ランドマーク5-10
// 商業施設は除外（既存4軸でカウント済み）
// 別ファイル bonus_facilities_data.js から読み込み
const { BONUS_FACILITIES, CAT_LABEL } = require('./bonus_facilities_data.js');

// ═══ globalMax（プリ計算で動的決定） ═══
// 各半径ごとに、全駅で最大の生カウントをmax基準とする
let globalMaxByRadius = {
  '500':  {'飲食':1200, '商業':280, '生活':380, '医療':140},
  '800':  {'飲食':2459, '商業':500, '生活':600, '医療':200},
  '1200': {'飲食':3500, '商業':720, '生活':850, '医療':280}
};

// ═══ 距離計算（Haversine、ボーナス用） ═══
function distM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad1 = lat1 * Math.PI / 180;
  const rad2 = lat2 * Math.PI / 180;
  const dlat = (lat2 - lat1) * Math.PI / 180;
  const dlng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dlat/2) ** 2 + Math.cos(rad1) * Math.cos(rad2) * Math.sin(dlng/2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══ ボーナス計算（駅座標 → ボーナス点 + 内訳） ═══
// 戻り値: { pts: number(0-100), capped: bool, items: [{cat, name, pts, dist}] }
function calcBonus(stLat, stLng) {
  const items = [];
  let raw = 0;
  for (const [cat, list] of Object.entries(BONUS_FACILITIES)) {
    for (const f of list) {
      const d = distM(stLat, stLng, f.lat, f.lng);
      if (d <= BONUS_RADIUS_M) {
        items.push({ cat, name: f.name, pts: f.pts, dist: Math.round(d) });
        raw += f.pts;
      }
    }
  }
  // 点数降順、同点は距離昇順
  items.sort((a, b) => (b.pts - a.pts) || (a.dist - b.dist));
  const capped = raw > BONUS_MAX_PTS;
  return {
    pts: Math.min(BONUS_MAX_PTS, raw),
    raw: raw,
    capped: capped,
    items: items
  };
}

// ランク判定
function calcRank(score) {
  if (score >= 800) return 'S';
  if (score >= 600) return 'A';
  if (score >= 400) return 'B';
  if (score >= 200) return 'C';
  return 'D';
}

// 対数スケールスコア
function logScore(count, maxCount, maxPts) {
  if (count <= 0 || maxCount <= 0) return 0;
  const ratio = Math.log(1 + count) / Math.log(1 + maxCount);
  return Math.min(maxPts, Math.round(ratio * maxPts));
}

// 街力スコア計算（4軸＋ボーナス＝1000点満点）
// bonusObj は { pts, items, raw, capped } 形式（calcBonus()の戻り値）
function calcScore(counts, radius, bonusObj) {
  const gMax = globalMaxByRadius[String(radius)] || globalMaxByRadius['800'];
  const details = {};
  let total = 0;
  AXES.forEach(axis => {
    const pts = logScore(counts[axis], gMax[axis], MAX_PTS[axis]);
    details[axis] = { count: counts[axis], pts, max: MAX_PTS[axis] };
    total += pts;
  });
  // ボーナス軸を追加
  const bonusPts = (bonusObj && typeof bonusObj.pts === 'number') ? bonusObj.pts : 0;
  details['ボーナス'] = {
    count: (bonusObj && bonusObj.items) ? bonusObj.items.length : 0,
    pts: bonusPts,
    max: BONUS_MAX_PTS,
    raw: (bonusObj && bonusObj.raw) || 0,
    capped: !!(bonusObj && bonusObj.capped),
    items: (bonusObj && bonusObj.items) || []
  };
  total += bonusPts;
  const score = Math.min(1000, total);
  return { score, details, rank: calcRank(score) };
}

// ═══ 生カウント取得（DuckDBクエリ） ═══
function getRawCounts(lat, lng, radius) {
  return new Promise((resolve, reject) => {
    const con = db.connect();
    const deg    = radius / 111000;
    const degLng = deg / Math.cos(lat * Math.PI / 180);
    const sql = `
      SELECT basic_category AS cat, COUNT(*) AS cnt
      FROM read_parquet('${s3PlacesPath()}', hive_partitioning=false)
      WHERE bbox.xmin >= ${lng - degLng}
        AND bbox.xmax <= ${lng + degLng}
        AND bbox.ymin >= ${lat - deg}
        AND bbox.ymax <= ${lat + deg}
        AND basic_category IS NOT NULL
      GROUP BY basic_category
    `;
    con.all(sql, (err, rows) => {
      con.close();
      if (err) return reject(err);
      const counts = {'飲食':0, '商業':0, '生活':0, '医療':0};
      (rows||[]).forEach(row => {
        const axis = AXIS_MAP[row.cat||''];
        if (axis) counts[axis] += (parseInt(row.cnt)||0);
      });
      resolve(counts);
    });
  });
}

// ═══ プリ計算進捗管理 ═══
let buildState = {
  running: false,
  mode: null,  // 'full' | 'incremental'
  startedAt: 0,
  total: 0,
  done: 0,
  errors: 0,
  currentStation: '',
  // 構築中の一時データ
  tempData: null
};

function getBuildStatus() {
  return {
    running: buildState.running,
    mode: buildState.mode,
    startedAt: buildState.startedAt,
    total: buildState.total,
    done: buildState.done,
    errors: buildState.errors,
    currentStation: buildState.currentStation,
    progress: buildState.total > 0 ? (buildState.done / buildState.total * 100).toFixed(1) + '%' : '0%',
    cacheVersion: scoresCache.version,
    cacheStations: Object.keys(scoresCache.stations || {}).length,
    cacheBuiltAt: scoresCache.builtAt,
    cacheBuiltAtStr: scoresCache.builtAt ? new Date(scoresCache.builtAt).toLocaleString('ja-JP') : '未構築'
  };
}

// ═══ プリ計算メインループ ═══

// ━━━ ヘルパー1: 駅リストの生counts取得（並列） ━━━
async function computeRawCountsForStations(stations, intoData) {
  const queue = [];
  for (const st of stations) {
    for (const r of RADII) {
      queue.push({ st, r });
    }
  }
  buildState.total = queue.length;
  buildState.done = 0;
  
  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      const { st, r } = job;
      const sid = st.id || `${st.name}_${st.pref}`;
      buildState.currentStation = `${st.name}_${st.pref} (r=${r})`;
      
      // ★★ 既に計算済みならスキップ（再起動からの再開対応）
      if (intoData[sid] && intoData[sid][`r${r}_raw`]) {
        buildState.done++;
        continue;
      }
      
      try {
        const counts = await getRawCounts(st.lat, st.lng, r);
        if (!intoData[sid]) intoData[sid] = {};
        intoData[sid][`r${r}_raw`] = counts;
        // 座標と名前情報を保存（ボーナス計算用）
        intoData[sid].lat = st.lat;
        intoData[sid].lng = st.lng;
        intoData[sid].name = st.name;
        intoData[sid].pref = st.pref;
      } catch(e) {
        buildState.errors++;
        console.warn(`[rebuild] エラー ${sid} r=${r}:`, e.message);
      }
      buildState.done++;
      if (buildState.done % 100 === 0) {
        const pct = (buildState.done / buildState.total * 100).toFixed(1);
        const elapsed = ((Date.now() - buildState.startedAt) / 1000).toFixed(0);
        console.log(`[rebuild] ${buildState.done}/${buildState.total} (${pct}%) 経過${elapsed}秒`);
      }
      
      // ★★ 200駅ごとに進捗をディスクに保存（再起動時の復旧用）
      // 全部終わってからの保存だと再起動で全消失するため、こまめに保存
      if (buildState.done % 200 === 0) {
        try {
          const partialData = {
            version: getCurrentQuarterVersion(),
            builtAt: 0,  // 0 = まだ完成してない印
            partial: true,
            axisSig: AXIS_MAP_SIGNATURE,   // ★どのマッピングで数えたかを刻む
            stations: intoData
          };
          fs.writeFileSync(SCORES_CACHE_FILE + '.partial', JSON.stringify(partialData));
          console.log(`[rebuild] 途中保存: ${buildState.done}/${buildState.total}`);
        } catch(e) {
          console.warn('[rebuild] 途中保存失敗:', e.message);
        }
      }
    }
  }
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);
}

// ━━━ ヘルパー2: 全駅の生countsから globalMax を再計算 ━━━
function recalcGlobalMax(stationsData) {
  for (const r of RADII) {
    const newMax = {'飲食':0, '商業':0, '生活':0, '医療':0};
    Object.values(stationsData).forEach(stData => {
      const counts = stData[`r${r}_raw`];
      if (!counts) return;
      AXES.forEach(axis => {
        if (counts[axis] > newMax[axis]) newMax[axis] = counts[axis];
      });
    });
    // 既存駅で生countsを持ってないやつがあると max が低めに出るので、最低でも前のmaxは維持
    AXES.forEach(axis => {
      const prev = (globalMaxByRadius[String(r)] || {})[axis] || 0;
      if (prev > newMax[axis]) newMax[axis] = prev;
    });
    globalMaxByRadius[String(r)] = newMax;
    console.log(`[rebuild] r=${r} globalMax:`, newMax);
  }
}

// ━━━ ヘルパー3: 駅データのスコア再計算（生countsから、DuckDB不要） ━━━
function recomputeScoresForStations(stationsData, targetIds = null) {
  Object.entries(stationsData).forEach(([sid, stData]) => {
    if (targetIds && !targetIds.has(sid)) return;
    // ボーナスは座標から計算（保存済みなら再利用）
    let bonusObj = stData.bonus;
    if (!bonusObj && stData.lat && stData.lng) {
      bonusObj = calcBonus(stData.lat, stData.lng);
      stData.bonus = bonusObj;
    }
    for (const r of RADII) {
      const counts = stData[`r${r}_raw`];
      if (counts) {
        stData[`r${r}`] = calcScore(counts, r, bonusObj);
      }
    }
  });
}

// ━━━ メインエントリポイント：フル / 差分 両対応 ━━━
async function rebuildScores({ mode = 'full', stations = null } = {}) {
  if (buildState.running) {
    console.log('[rebuild] 既に実行中、スキップ');
    return;
  }
  if (STATIONS.length === 0) {
    console.error('[rebuild] 駅マスタが空、中止');
    return;
  }
  
  buildState.running = true;
  buildState.mode = mode;
  buildState.startedAt = Date.now();
  buildState.errors = 0;
  
  try {
    // ★v11 恒久対策④+⑤: リリース自動解決 → プリフライトチェック
    //   ①STACカタログから最新リリース名を取得（削除済みリリースを掴み続ける事故を防止）
    //   ②本計算前に東京駅で1クエリだけ試し、S3が読めなければ即中止＋Discord通知。
    //     （2026-07-06 事故では5175回全て空振りして25分かけて0駅で「完走」した。
    //      これを1クエリ・数秒で検知して止める）
    await resolveLatestOvertureRelease();
    try {
      await getRawCounts(35.681236, 139.767125, 500);  // 東京駅
      console.log(`[rebuild] プリフライトOK: ${OVERTURE_RELEASE}`);
    } catch(e) {
      console.error(`[rebuild] プリフライト失敗 → ビルド中止: ${e.message}`);
      notifyOps('rebuild中止（Overture S3疎通失敗）',
        `release=${OVERTURE_RELEASE}\n${e.message}\nSTACカタログ確認: https://stac.overturemaps.org/catalog.json`);
      return;  // finallyでrunning解除される。既存キャッシュは無傷のまま
    }
    
    if (mode === 'full') {
      // ─── フル再計算 ─────────────────────────────
      console.log(`[rebuild] FULL モード開始: ${STATIONS.length}駅 × ${RADII.length}半径`);
      
      const newData = {
        version: getCurrentQuarterVersion(),
        builtAt: 0,
        stations: {}
      };
      
      // ★★ .partial ファイルから再開（前回rebuildが途中で止まった場合）
      try {
        const partialFile = SCORES_CACHE_FILE + '.partial';
        if (fs.existsSync(partialFile)) {
          const partial = JSON.parse(fs.readFileSync(partialFile, 'utf8'));
          // ★指紋が違う = 別のマッピングで数えたデータ → 混ぜずに破棄する
          if (partial.axisSig && partial.axisSig !== AXIS_MAP_SIGNATURE) {
            console.warn(`[rebuild] ★.partialのマッピング署名が不一致（${partial.axisSig} ≠ ${AXIS_MAP_SIGNATURE}）→ 破棄してフル再計算`);
            try { fs.unlinkSync(partialFile); } catch(_) {}
          } else if (!partial.axisSig) {
            console.warn('[rebuild] ★.partialに署名が無い（旧形式）→ 破棄してフル再計算');
            try { fs.unlinkSync(partialFile); } catch(_) {}
          } else if (partial.stations && Object.keys(partial.stations).length > 0) {
            newData.stations = partial.stations;
            const resumedCount = Object.keys(partial.stations).length;
            console.log(`[rebuild] 前回の途中保存から再開: ${resumedCount}駅分すでに計算済み`);
          }
        }
      } catch(e) {
        console.warn('[rebuild] .partial読込失敗、フル再計算開始:', e.message);
      }
      
      // Phase 1: 全駅の生counts取得（既に取得済みのデータはスキップされる）
      await computeRawCountsForStations(STATIONS, newData.stations);
      
      // Phase 2: globalMax 確定
      console.log('[rebuild] Phase 2: globalMax確定');
      // フル時は前のmaxに引きずられないようリセット
      globalMaxByRadius = {'500':{'飲食':0,'商業':0,'生活':0,'医療':0},'800':{'飲食':0,'商業':0,'生活':0,'医療':0},'1200':{'飲食':0,'商業':0,'生活':0,'医療':0}};
      recalcGlobalMax(newData.stations);
      
      // Phase 3: 全駅スコア計算
      console.log('[rebuild] Phase 3: 全駅スコア計算');
      recomputeScoresForStations(newData.stations);
      
      // Phase 4: atomic swap
      newData.builtAt = Date.now();
      newData.axisSig = AXIS_MAP_SIGNATURE;   // ★どのマッピングで作ったキャッシュかを刻む
      
      // 前期版保存
      if (scoresCache.builtAt > 0 && Object.keys(scoresCache.stations || {}).length > 0) {
        try {
          fs.writeFileSync(SCORES_CACHE_PREV_FILE, JSON.stringify(scoresCache));
          console.log(`[rebuild] 前期版を保存: v${scoresCache.version}`);
        } catch(e) {
          console.warn('[rebuild] 前期版保存失敗:', e.message);
        }
      }
      
      scoresCache = newData;
      saveScoresCache(scoresCache);
      
      // ★★ 完了したので .partial を削除
      try {
        const partialFile = SCORES_CACHE_FILE + '.partial';
        if (fs.existsSync(partialFile)) {
          fs.unlinkSync(partialFile);
          console.log('[rebuild] .partialファイル削除完了');
        }
      } catch(e) { console.warn('[rebuild] .partial削除失敗:', e.message); }
      
    } else if (mode === 'incremental') {
      // ─── 差分計算（新規駅のみ）─────────────────
      const newStations = stations || [];
      if (newStations.length === 0) {
        console.log('[rebuild] incremental: 対象駅なし、スキップ');
        return;
      }
      console.log(`[rebuild] INCREMENTAL モード開始: ${newStations.length}駅追加`);
      
      // 既存scoresCacheを起点にマージしていく（生countsも保持されてる前提）
      const mergedData = {
        version: scoresCache.version || getCurrentQuarterVersion(),
        builtAt: scoresCache.builtAt,
        stations: JSON.parse(JSON.stringify(scoresCache.stations || {}))
      };
      
      // Phase 1: 新規駅の生counts取得
      await computeRawCountsForStations(newStations, mergedData.stations);
      
      // Phase 2: globalMax 更新判定
      const oldMaxJson = JSON.stringify(globalMaxByRadius);
      recalcGlobalMax(mergedData.stations);
      const newMaxJson = JSON.stringify(globalMaxByRadius);
      const maxChanged = oldMaxJson !== newMaxJson;
      
      if (maxChanged) {
        // 既存駅の中で生countsを持ってるやつは再計算可能
        // 持ってないやつ（旧データ）はスコアそのまま（次のフルで補正される）
        console.log('[rebuild] globalMax 更新検出 → 生counts持ちの既存駅も再計算');
        let recomputedCount = 0, skippedCount = 0;
        Object.entries(mergedData.stations).forEach(([sid, stData]) => {
          let hasRaw = false;
          for (const r of RADII) {
            if (stData[`r${r}_raw`]) hasRaw = true;
          }
          if (hasRaw) {
            // ボーナス（座標から計算、保存済みなら再利用）
            let bonusObj = stData.bonus;
            if (!bonusObj && stData.lat && stData.lng) {
              bonusObj = calcBonus(stData.lat, stData.lng);
              stData.bonus = bonusObj;
            }
            for (const r of RADII) {
              if (stData[`r${r}_raw`]) {
                stData[`r${r}`] = calcScore(stData[`r${r}_raw`], r, bonusObj);
              }
            }
            recomputedCount++;
          } else {
            skippedCount++;
          }
        });
        console.log(`[rebuild] スコア再計算: ${recomputedCount}駅, スキップ(生counts無): ${skippedCount}駅`);
      } else {
        // globalMax 不変 → 新規駅のみスコア計算
        console.log('[rebuild] globalMax 維持 → 新規駅のみスコア計算');
        const newIds = new Set(newStations.map(st => st.id || `${st.name}_${st.pref}`));
        recomputeScoresForStations(mergedData.stations, newIds);
      }
      
      mergedData.builtAt = Date.now();
      mergedData.version = getCurrentQuarterVersion();
      mergedData.axisSig = AXIS_MAP_SIGNATURE;
      
      // atomic swap
      scoresCache = mergedData;
      saveScoresCache(scoresCache);
      
      // ★v11: incremental 完了時も古い .partial を掃除
      //   （残っていると次回 full が古い途中データから再開してしまう）
      try {
        const partialFile = SCORES_CACHE_FILE + '.partial';
        if (fs.existsSync(partialFile)) {
          fs.unlinkSync(partialFile);
          console.log('[rebuild] .partialファイル削除完了(incremental)');
        }
      } catch(e) { console.warn('[rebuild] .partial削除失敗:', e.message); }
    }
    
    const elapsed = ((Date.now() - buildState.startedAt) / 1000).toFixed(0);
    console.log(`[rebuild] 完了: mode=${mode}, ${elapsed}秒, ${Object.keys(scoresCache.stations).length}駅, errors=${buildState.errors}`);
  } catch(e) {
    console.error('[rebuild] エラー:', e);
  } finally {
    buildState.running = false;
    buildState.tempData = null;
    buildState.mode = null;
  }
}

// 後方互換のラッパー（旧コードからの呼び出し用）
async function rebuildAllScores() {
  return rebuildScores({ mode: 'full' });
}

// 現在の四半期バージョン文字列
function getCurrentQuarterVersion() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

// 再計算モード判定（none / incremental / full）
function checkRebuildMode() {
  const cacheStations = scoresCache.stations || {};
  const cacheIds = new Set(Object.keys(cacheStations));
  
  // 空キャッシュ → フル
  if (cacheIds.size === 0) {
    return { mode: 'full', reason: 'empty cache' };
  }
  
  // ★カテゴリマッピングが変わっている → 必ずフル
  //   差分にすると「旧マッピングで数えた駅」と「新マッピングで数えた駅」が
  //   1つのキャッシュに同居し、globalMax も駅間の比較も壊れる。
  if (scoresCache.axisSig !== AXIS_MAP_SIGNATURE) {
    return { mode: 'full', reason: `カテゴリマッピング変更検知（${scoresCache.axisSig || '署名なし'} → ${AXIS_MAP_SIGNATURE}）` };
  }
  
  // 四半期超過 → フル
  if (Date.now() - (scoresCache.builtAt || 0) > QUARTER_MS) {
    return { mode: 'full', reason: 'quarter expired' };
  }
  
  // 新規駅検出
  const newStations = STATIONS.filter(st => {
    const sid = st.id || `${st.name}_${st.pref}`;
    return !cacheIds.has(sid);
  });
  
  // ★v11 恒久対策③: 駅マスタ再編（県移動・駅名改称・削除）の検知。
  //   「キャッシュにあるがマスタに無いID（孤児）」と「新規ID」が同時に存在する場合、
  //   それは駅追加ではなくキーの付け替え（例: 京成小岩_千葉県→_東京都）。
  //   incremental だと旧キーが残ったまま新キーだけ追加され、globalMax・駅数の整合が崩れるため、
  //   フル再計算に切り替えて一から作り直す。
  if (newStations.length > 0) {
    const masterIds = new Set(STATIONS.map(st => st.id || `${st.name}_${st.pref}`));
    const orphanCount = [...cacheIds].filter(id => !masterIds.has(id)).length;
    if (orphanCount > 0) {
      return { mode: 'full', reason: `駅マスタ再編検知（新規${newStations.length}駅・孤児${orphanCount}駅）` };
    }
    return { mode: 'incremental', stations: newStations, reason: `${newStations.length}駅追加検出` };
  }
  
  return { mode: 'none', reason: 'up-to-date' };
}

// 旧API（後方互換）
function needsRebuild() {
  const r = checkRebuildMode();
  return r.mode !== 'none';
}

// ═══════════════════════════════════════════════════════════════
// API エンドポイント
// ═══════════════════════════════════════════════════════════════

// 一括取得API（メイン）
app.get('/api/all-scores', (req, res) => {
  const radius = parseInt(req.query.radius) || 800;
  const rKey = `r${radius}`;
  
  const cacheStations = scoresCache.stations || {};
  const stationCount = Object.keys(cacheStations).length;
  
  // ─── 空 or 不完全キャッシュ → 503 でクライアントにフォールバック誘導 ───
  // ★v11 恒久対策②-c: 不完全キャッシュ（駅マスタの95%未満）も 503 に含める。
  //   フロントは 503 を受けると localStorage の旧データで継続表示する実装があるため、
  //   ユーザーには「古いが正しいスコア」が見え続ける（0の羅列にはならない）。
  if (stationCount === 0 || !isCacheComplete(scoresCache)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({
      error: 'building',
      message: 'スコアキャッシュを構築中です',
      buildState: {
        running: buildState.running,
        mode: buildState.mode,
        progress: buildState.total > 0 ? (buildState.done / buildState.total * 100).toFixed(1) + '%' : '0%',
        done: buildState.done,
        total: buildState.total
      }
    });
    return;
  }
  
  // ─── Cache-Control：計算中は no-store、安定時は5分 ───
  if (buildState.running) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300');  // 5分（旧30日→大幅短縮）
  }
  
  const result = {
    version: scoresCache.version,
    builtAt: scoresCache.builtAt,
    radius,
    building: buildState.running,
    stations: {}
  };
  
  // 該当半径のスコアがある駅だけ返す（生countsは送らない）
  Object.entries(cacheStations).forEach(([sid, data]) => {
    if (data[rKey]) {
      result.stations[sid] = data[rKey];
    }
  });
  
  console.log(`[/api/all-scores] r=${radius} ${Object.keys(result.stations).length}駅返却 ${buildState.running ? '(計算中)' : ''}`);
  res.json(result);
});

// 個別駅取得（後方互換）
app.get('/api/score', async (req, res) => {
  try {
    let lat, lng, llStr;
    if (req.query.ll) {
      llStr = req.query.ll;
      [lat, lng] = llStr.split(',').map(Number);
    } else {
      lat = parseFloat(req.query.lat);
      lng = parseFloat(req.query.lng);
      llStr = `${lat},${lng}`;
    }
    const r = parseInt(req.query.radius) || 800;
    const rKey = `r${r}`;
    
    // ★v10 🟡-4: 座標範囲チェック（日本国内のみ受付）
    //   NaN/Infinity/関東外座標でのキャッシュミス→S3クエリを抑制。
    //   範囲: 緯度20〜46（沖縄〜北海道）、経度122〜154（与那国〜南鳥島）。
    //   攻撃座標を投げてキャッシュミスを誘発する手口を弾く。
    if (!isFinite(lat) || !isFinite(lng) || lat < 20 || lat > 46 || lng < 122 || lng > 154) {
      return res.status(400).json({ error: 'invalid coordinates', score: 0, details: {} });
    }
    
    // ★v10 🟡-8: キャッシュ参照は Map で O(1) 引き。
    //   旧: scoresCache.stations 全件ループ × STATIONS.find = O(N²)（1737駅で約300万比較）
    //   新: scoresCache.stations 全件ループ × STATIONS_BY_ID.get = O(N)
    let foundData = null;
    for (const [sid, data] of Object.entries(scoresCache.stations || {})) {
      const st = STATIONS_BY_ID.get(sid);
      if (st && Math.abs(st.lat - lat) < 0.0001 && Math.abs(st.lng - lng) < 0.0001) {
        foundData = data[rKey];
        break;
      }
    }
    
    if (foundData) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json({ ...foundData, cached: true, source: 'precomputed' });
    }
    
    // プリ計算にない（新規駅など）→ 動的計算
    console.log(`[/api/score] cache miss: ${llStr} r=${r}`);
    const counts = await getRawCounts(lat, lng, r);
    const bonusObj = calcBonus(lat, lng);
    const result = calcScore(counts, r, bonusObj);
    res.json({ ...result, cached: false });
    
  } catch(e) {
    console.error('[/api/score] error:', e.message);
    res.status(500).json({ error: e.message, score: 0, details: {} });
  }
});

// 状態取得（認証なし版：プリ計算進捗の確認用、誰でも見れる）
app.get('/api/status', (req, res) => {
  res.json({
    ...getBuildStatus(),
    quarterVersion: getCurrentQuarterVersion(),
    axisSignature: AXIS_MAP_SIGNATURE,
    cacheAxisSignature: scoresCache.axisSig || null,
    needsRebuild: needsRebuild(),
    stationsLoaded: STATIONS.length,
    radii: RADII,
    globalMax: globalMaxByRadius
  });
});

// ─── バージョン確認（フロントの自動更新用・超軽量） ───
// フロント側が起動時/定期的にこれを叩き、builtAt が進んでいたら
// 自動でキャッシュをクリアして最新データに更新する。
// rebuild 完了で scoresCache.builtAt が Date.now() に更新される度に、
// 全ユーザーが次回アクセス時に自動で最新化される。
app.get('/api/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // ★v11 恒久対策②-b: 配信ガード。キャッシュが不完全な間は builtAt を 0 で返す。
  //   フロントの checkAndUpdate は serverBuiltAt が falsy なら何もしない実装のため、
  //   「新しいデータを取得しました」→不完全データへの切替、が構造的に起きなくなる。
  //   （ユーザーは手元の localStorage キャッシュで旧スコア表示を継続できる）
  const complete = isCacheComplete(scoresCache);
  res.json({
    builtAt: complete ? (scoresCache.builtAt || 0) : 0,
    version: scoresCache.version || 'unknown',
    building: buildState.running,
    cacheComplete: complete,
    serverTime: Date.now(),
    // ★v12：アプリ向けの4項目（環境変数が空なら入れない）
    ...appConfigFromEnv()
  });
});

// ★v12：アプリ向けの設定を Railway の環境変数から作る
//   空・未設定の項目は返さない。値の前後の空白は落とす。
function appConfigFromEnv() {
  const pick = (name) => (process.env[name] || '').trim();
  const out = {};
  // ★v13：手入力（Railway）が優先。無ければ App Store から自動で取った値。
  const manualVersion = pick('LATEST_VERSION');
  const latestVersion = manualVersion || storeInfo.version;
  const latestNote = pick('LATEST_NOTE') || (manualVersion ? '' : storeInfo.note);
  const tileUrl = pick('TILE_URL');
  const tileAttribution = pick('TILE_ATTRIBUTION');
  if (latestVersion) out.latestVersion = latestVersion;
  if (latestNote) out.latestNote = latestNote;
  if (tileUrl) out.tileUrl = tileUrl;
  if (tileAttribution) out.tileAttribution = tileAttribution;
  // ★v14：駅コメントの版（配れるときだけ）
  if (stationText.version) out.textVersion = stationText.version;
  return out;
}

// ★v14：駅コメント（station_text.json）を読み込んでおく
//   ★検査を通ったものだけ配る。通らなければ何も配らない（アプリは同梱のまま）。
const STATION_TEXT_FILE = path.join(__dirname, 'station_text.json');
const stationText = { raw: '', version: '', count: 0 };
function loadStationText() {
  try {
    if (!fs.existsSync(STATION_TEXT_FILE)) {
      console.log('[v14] station_text.json なし（コメントは配らない）');
      return;
    }
    const raw = fs.readFileSync(STATION_TEXT_FILE, 'utf8');
    const d = JSON.parse(raw);
    const info = d && d.info;
    const count = info && typeof info === 'object' ? Object.keys(info).length : 0;
    const version = typeof d.version === 'string' ? d.version.trim() : '';
    if (d.schema !== 1) throw new Error('schema が 1 ではない');
    if (!version) throw new Error('version が空');
    if (count < 8000) throw new Error('駅が少なすぎる: ' + count);
    stationText.raw = raw;
    stationText.version = version;
    stationText.count = count;
    console.log(`[v14] 駅コメントを配信: version=${version}／${count}駅／${Math.round(Buffer.byteLength(raw) / 1024)}KB`);
  } catch (e) {
    console.warn('[v14] station_text.json を配れない（アプリは同梱のまま）:', e.message);
  }
}
loadStationText();

app.get('/api/station-text', (req, res) => {
  if (!stationText.raw) return res.status(404).json({ error: 'no station text' });
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(stationText.raw);
});

// ═══════════════════════════════════════════════════════════════
// ★v15：駅ページ（SEO）  /station/:pref/:name  と  /sitemap.xml
//   ・全8,993駅の「この駅はどんな街？」を、アクセスが来たときに組み立てる
//   ・★作ったページは1日（点数の再計算があれば即）捨てる
//   ・★ここで何が起きても /api/* には影響しない（try/catch で閉じる）
// ═══════════════════════════════════════════════════════════════
const STATION_YOMI = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'station_yomi.json'), 'utf8')); }
  catch (e) { console.warn('[v15] station_yomi.json なし（ふりがな無しで出す）'); return {}; }
})();
const SITE = 'https://machimegu.com';
const APP_STORE_URL = 'https://apps.apple.com/jp/app/id6804345019';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.machimegu.app';
const RANK_COLOR = { S: '#E8455A', A: '#F28C28', B: '#D9B21F', C: '#3CB371', D: '#5B8DEF' };
const AXIS_COLOR = { '飲食': '#F0506E', '商業': '#8B6CF0', '生活': '#3B9BF0', '医療': '#F08A30', 'ボーナス': '#D4A020' };
const AXIS_UNIT = { '飲食': '店', '商業': '店', '生活': '件', '医療': '件' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function stationUrl(st) { return `${SITE}/station/${encodeURIComponent(st.pref)}/${encodeURIComponent(st.name)}`; }
function scoreOf(id) {
  const c = scoresCache.stations && scoresCache.stations[id];
  return c && c.r500 ? c.r500 : null;
}
function textOf(id) {
  if (!stationText.raw) return null;
  if (!stationText._parsed) { try { stationText._parsed = JSON.parse(stationText.raw).info || {}; } catch (_) { stationText._parsed = {}; } }
  return stationText._parsed[id] || null;
}
function ridersNum(s) {
  if (!s) return 0;
  const m = String(s).match(/([\d.]+)\s*(万)?/);
  if (!m) return 0;
  return parseFloat(m[1]) * (m[2] ? 10000 : 1);
}
function yearNum(s) { const m = String(s || '').match(/(\d{4})/); return m ? +m[1] : 0; }
function distM(a, b, c, d) {
  const R = 6371000, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180;
  const dl = (c - a) * Math.PI / 180, dg = (d - b) * Math.PI / 180;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── 順位表（点数の再計算ごとに作り直す）──────────────
let _rankIdx = { builtAt: -1 };
function rankIndex() {
  if (_rankIdx.builtAt === scoresCache.builtAt && stationText._parsedAt === stationText.version) return _rankIdx;
  const all = [], byPref = {}, byLine = {}, riders = [], oldByPref = {}, areaCount = {};
  for (const st of STATIONS) {
    const sc = scoreOf(st.id); const s = sc ? sc.score : 0;
    all.push([st.id, s]);
    (byPref[st.pref] = byPref[st.pref] || []).push([st.id, s]);
    for (const l of st.lines || []) (byLine[l] = byLine[l] || []).push([st.id, s]);
    const t = textOf(st.id);
    riders.push([st.id, ridersNum(t && t.riders)]);
    const y = yearNum(t && t.opened);
    if (y) (oldByPref[st.pref] = oldByPref[st.pref] || []).push([st.id, y]);
    if (t && t.location) { const ak = `${t.location}_${st.pref}`; areaCount[ak] = (areaCount[ak] || 0) + 1; }
  }
  const toRank = (arr, asc) => {
    arr.sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]);
    const m = new Map(); arr.forEach(([id], i) => m.set(id, i + 1)); return { m, n: arr.length };
  };
  const idx = { builtAt: scoresCache.builtAt, all: toRank(all), pref: {}, line: {}, riders: toRank(riders), old: {}, areaCount };
  for (const p in byPref) idx.pref[p] = toRank(byPref[p]);
  for (const l in byLine) idx.line[l] = toRank(byLine[l]);
  for (const p in oldByPref) idx.old[p] = toRank(oldByPref[p], true);
  stationText._parsedAt = stationText.version;
  _rankIdx = idx; return idx;
}

// ── 近くの駅（同じ路線で近い2つ×路線 ＋ 距離で近い順、最大8）──
function nearbyOf(st) {
  const cand = [];
  for (const o of STATIONS) {
    if (o.id === st.id) continue;
    if (Math.abs(o.lat - st.lat) > 0.1 || Math.abs(o.lng - st.lng) > 0.12) continue;
    cand.push([o, distM(st.lat, st.lng, o.lat, o.lng)]);
  }
  cand.sort((a, b) => a[1] - b[1]);
  const out = [], seen = new Set();
  for (const l of st.lines || []) {
    let k = 0;
    for (const [o, d] of cand) {
      if (k >= 2) break;
      if ((o.lines || []).includes(l) && !seen.has(o.id)) { out.push([o, d, l]); seen.add(o.id); k++; }
    }
  }
  for (const [o, d] of cand) {
    if (out.length >= 8) break;
    if (!seen.has(o.id)) { out.push([o, d, null]); seen.add(o.id); }
  }
  return out.slice(0, 8).sort((a, b) => a[1] - b[1]);
}

const _pageCache = new Map();
const PAGE_TTL = 24 * 60 * 60 * 1000;

function renderStationPage(st, ua) {
  const sc = scoreOf(st.id);
  const t = textOf(st.id) || {};
  const yomi = STATION_YOMI[st.id] || '';
  const score = sc ? sc.score : 0;
  const rank = sc ? sc.rank : 'D';
  const rc = RANK_COLOR[rank] || '#888';
  const d = (sc && sc.details) || {};
  const idx = rankIndex();
  const feats = Array.isArray(t.features) ? t.features : [];
  const first = feats[0] || '';
  const rest = feats.slice(1);
  const lines = st.lines || [];
  const year = yearNum(t.opened);
  const age = year ? (2026 - year) : 0;

  const bars = ['飲食', '商業', '生活', '医療', 'ボーナス'].map((ax) => {
    const v = d[ax] || {}; const max = v.max || (ax === 'ボーナス' ? 50 : 100);
    const pts = v.pts || 0; const w = Math.max(2, Math.round(pts / max * 100));
    const cnt = (ax !== 'ボーナス' && v.count != null) ? `<span class="cnt">${v.count}${AXIS_UNIT[ax]}</span>` : '';
    return `<div class="bar"><div class="bl">${ax}</div><div class="bt"><div class="bf" style="width:${w}%;background:${AXIS_COLOR[ax]}"></div></div><div class="bv">${pts}<small>/${max}</small>${cnt}</div></div>`;
  }).join('');

  const bonusItems = ((d['ボーナス'] || {}).items || []).slice(0, 12);
  const bonusHtml = bonusItems.length ? `<section><h2>近くの名所・施設</h2><ul class="bonus">${bonusItems.map((b) => `<li>${esc(b.name)}<span>駅から${b.dist}m</span></li>`).join('')}</ul></section>` : '';

  const rAll = idx.all.m.get(st.id), rPref = idx.pref[st.pref] && idx.pref[st.pref].m.get(st.id);
  const lineRanks = lines.map((l) => idx.line[l] ? `<li>${esc(l)}<b>${idx.line[l].n}駅中 ${idx.line[l].m.get(st.id)}位</b></li>` : '').join('');
  const rRid = ridersNum(t.riders) ? idx.riders.m.get(st.id) : null;
  const rOld = year && idx.old[st.pref] ? idx.old[st.pref].m.get(st.id) : null;

  const same = STATIONS.filter((o) => o.name === st.name && o.id !== st.id);
  const sameHtml = same.length ? `<section><h2>全国の同じ名前の駅</h2><ul class="same">${same.map((o) => `<li><a href="${stationUrl(o)}">${esc(o.name)}（${esc(o.pref)}）</a></li>`).join('')}</ul></section>` : '';

  const near = nearbyOf(st);
  const nearHtml = near.map(([o, dm, l]) => {
    const s2 = scoreOf(o.id) || { score: 0, rank: 'D', details: {} };
    let win = '';
    for (const ax of ['飲食', '商業', '生活', '医療']) {
      const a = ((d[ax] || {}).pts || 0), b = (((s2.details || {})[ax] || {}).pts || 0);
      if (b > a * 1.15 && b - a >= 10) { win = `${ax}が多い`; break; }
    }
    return `<tr><td><a href="${stationUrl(o)}">${esc(o.name)}</a>${l ? `<small>${esc(l)}</small>` : ''}</td><td>${(dm / 1000).toFixed(1)}km</td><td><span class="rk" style="background:${RANK_COLOR[s2.rank] || '#888'}">${esc(s2.rank)}</span> ${s2.score}</td><td>${win}</td></tr>`;
  }).join('');

  // ★アプリのバッジ判定（badge_engine.dart）と同じ基準：
  //   路線制覇／エリア制覇（駅が5つ以上ある市区町村）／都道府県制覇／ランク制覇
  const areaN = t.location ? (idx.areaCount[`${t.location}_${st.pref}`] || 0) : 0;
  const badgeRows = [
    ...lines.map((l) => [`${esc(l)}の路線制覇`, idx.line[l] ? `全${idx.line[l].n}駅` : '']),
    ...(areaN >= 5 ? [[`${esc(t.location)}のエリア制覇`, `全${areaN}駅`]] : []),
    [`${esc(st.pref)}の制覇`, idx.pref[st.pref] ? `全${idx.pref[st.pref].n}駅` : ''],
    [`${esc(rank)}ランクの制覇`, ''],
  ];
  const badges = badgeRows.map(([a, b]) => `<li>${a}${b ? `<b>${b}</b>` : ''}</li>`).join('');
  const isIOS = /iPhone|iPad|iPod/i.test(ua || ''), isAnd = /Android/i.test(ua || '');
  // ★ストアの公式バッジ（Apple／Google 配布の画像）。「無料で入手」だけの自作ボタンは怪しく見える
  const APPLE_BADGE = 'https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/ja-jp';
  const GOOGLE_BADGE = 'https://play.google.com/intl/ja/badges/static/images/badges/ja_badge_web_generic.png';
  const aB = (h) => `<a class="badge" href="${APP_STORE_URL}"><img src="${APPLE_BADGE}" alt="App Storeからダウンロード" style="height:${h}px"></a>`;
  const gB = (h) => `<a class="badge" href="${PLAY_URL}"><img src="${GOOGLE_BADGE}" alt="Google Play で手に入れよう" style="height:${Math.round(h * 1.45)}px;margin:${-Math.round(h * 0.22)}px 0"></a>`;
  const storeBtns = isIOS ? aB(48) : isAnd ? gB(48) : aB(44) + gB(44);
  const topBtns = isIOS ? aB(34) : isAnd ? gB(34) : aB(30) + gB(30);

  const title = `${st.name}駅（${st.pref}）はどんな街？ 街力${score}点・${rank}ランク｜街巡-まちめぐ-`;
  const desc = `${st.name}駅${yomi ? `（${yomi}）` : ''}の街力は${score}点・${rank}ランク。${first}${first ? '。' : ''}飲食${(d['飲食'] || {}).count || 0}店・全国${rAll}位。近くの駅との比較や名所も。`;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${st.lng - 0.012},${st.lat - 0.008},${st.lng + 0.012},${st.lat + 0.008}&layer=mapnik&marker=${st.lat},${st.lng}`;
  const ld = { '@context': 'https://schema.org', '@type': 'TrainStation', name: `${st.name}駅`, address: { '@type': 'PostalAddress', addressRegion: st.pref, addressLocality: t.location || '' }, geo: { '@type': 'GeoCoordinates', latitude: st.lat, longitude: st.lng } };

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${stationUrl(st)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${stationUrl(st)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
:root{--bg:#0E1626;--sf:#16233A;--sh:#1B2C46;--ln:#2A3B57;--tx:#fff;--sub:#9AB4D0;--act:#FF9D4D}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif;line-height:1.6}
main{max-width:720px;margin:0 auto;padding:16px}a{color:#7EC8F0}
header{display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(135deg,#1B2C46,#16233A);border:1px solid var(--ln);border-radius:14px;padding:10px 14px}
header .brand{text-decoration:none;color:var(--tx)}header .brand b{display:block;font-size:20px;font-weight:900;letter-spacing:.02em}header .brand span{display:block;font-size:11px;color:var(--sub)}
header .tb{flex:none;display:flex;align-items:center;gap:6px}.badge{display:inline-flex;align-items:center;margin:4px;vertical-align:middle}.badge img{display:block}
h2 .me{float:right;font-size:13px;color:var(--tx);font-weight:800}
.cta h3{margin:0 0 4px;font-size:20px}.cta .pitch{color:var(--sub);font-size:13px;margin:0 0 12px}.cta .pts{text-align:left;margin:0 auto 12px;max-width:420px}.cta .pts li{border:0;padding:3px 0;font-size:14px}.cta .pts li:before{content:"✓ ";color:var(--act);font-weight:900}
.hero{background:var(--sf);border:2px solid ${rc};border-radius:18px;padding:18px;margin:12px 0}
.yomi{color:var(--sub);font-size:13px;letter-spacing:.1em}h1{margin:0;font-size:30px;line-height:1.2}
.pref{color:var(--sub);font-size:13px}.score{display:flex;align-items:baseline;gap:10px;margin-top:8px}
.score b{font-size:48px;color:${rc};line-height:1}.rank{font-size:20px;font-weight:900;color:#fff;background:${rc};border-radius:8px;padding:2px 10px}
.lead{margin-top:12px;font-size:18px;font-weight:800}
section{background:var(--sf);border-radius:14px;padding:14px 16px;margin:12px 0}h2{font-size:16px;margin:0 0 10px;color:var(--sub)}
.bar{display:grid;grid-template-columns:64px 1fr 110px;align-items:center;gap:8px;margin:6px 0;font-size:14px}
.bt{background:var(--sh);border-radius:6px;height:12px;overflow:hidden}.bf{height:100%}
.bv{text-align:right;font-weight:800}.bv small{color:var(--sub);font-weight:400}.cnt{display:block;color:var(--sub);font-size:11px;font-weight:400}
ul{margin:0;padding-left:0;list-style:none}li{padding:6px 0;border-bottom:1px solid var(--ln)}li:last-child{border:0}
.feats li:before{content:"★ ";color:#D4A020}.bonus li span,.rks li b{float:right;color:var(--sub);font-weight:400}.rks li b{color:#fff;font-weight:800}
.info{display:grid;grid-template-columns:1fr 1fr;gap:8px}.info div{background:var(--sh);border-radius:10px;padding:8px 10px}.info small{display:block;color:var(--sub);font-size:11px}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 4px;border-bottom:1px solid var(--ln);vertical-align:top}td small{display:block;color:var(--sub);font-size:11px}
.rk{display:inline-block;min-width:22px;text-align:center;border-radius:6px;font-weight:900;color:#fff;font-size:12px}
.map{width:100%;height:240px;border:0;border-radius:12px}
.cta{text-align:center;background:linear-gradient(135deg,#2A3B57,#16233A);border:2px solid var(--act)}
.cta p{margin:0 0 10px;font-weight:800}.st{display:inline-block;margin:4px;padding:12px 18px;border-radius:12px;background:var(--act);color:#fff;font-weight:900;text-decoration:none}
footer{color:var(--sub);font-size:12px;text-align:center;padding:20px}
</style></head><body><main>
<header><a class="brand" href="${SITE}/"><b>街巡-まちめぐ-</b><span>駅に5分立ち止まるとカードがもらえる街歩きアプリ</span></a><span class="tb">${topBtns}</span></header>
<div class="hero">
${yomi ? `<div class="yomi">${esc(yomi)}</div>` : ''}<h1>${esc(st.name)}駅はどんな街？</h1>
<div class="pref">${esc(st.pref)}${t.location ? `・${esc(t.location)}` : ''}</div>
<div class="score"><b>${score}</b><span>点</span><span class="rank">${esc(rank)}</span></div>
${first ? `<div class="lead">${esc(first)}</div>` : ''}
</div>
<section><h2>街力の内訳（駅から500m）</h2>${bars}</section>
${rest.length ? `<section><h2>この街のこと</h2><ul class="feats">${rest.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>` : ''}
<section><h2>順位</h2><ul class="rks">
<li>全国<b>${idx.all.n.toLocaleString()}駅中 ${rAll ? rAll.toLocaleString() : '-'}位</b></li>
<li>${esc(st.pref)}<b>${idx.pref[st.pref] ? idx.pref[st.pref].n : '-'}駅中 ${rPref || '-'}位</b></li>
${lineRanks}
${rRid ? `<li>利用者数<b>全国 ${rRid.toLocaleString()}位</b></li>` : ''}
${rOld ? `<li>${esc(st.pref)}で古い駅<b>${rOld}番目</b></li>` : ''}
</ul></section>
<section><h2>基本情報</h2><div class="info">
<div><small>開業</small>${esc(t.opened || '-')}${age >= 100 ? '（開業100年以上）' : age ? `（${age}年）` : ''}</div>
<div><small>1日の利用者</small>${esc(t.riders || '-')}</div>
<div><small>路線</small>${lines.map(esc).join('、') || '-'}</div>
<div><small>所在地</small>${esc(st.pref)}${esc(t.location || '')}</div>
</div></section>
${bonusHtml}
<section><h2>近くの駅と比べる<span class="me">${esc(st.name)} ${score}点 <span class="rk" style="background:${rc}">${esc(rank)}</span></span></h2><table>${nearHtml}</table></section>
${sameHtml}
<section><h2>この駅で進むバッジ</h2><ul class="rks">${badges}</ul></section>
<section><h2>地図</h2><iframe class="map" loading="lazy" src="${osm}" title="${esc(st.name)}駅の地図"></iframe></section>
<section class="cta" id="app"><h3>街巡-まちめぐ-（無料）</h3>
<p class="pitch">全国8,993駅のチェックイン型・街歩きアプリ</p>
<ul class="pts"><li>${esc(st.name)}駅から500m以内で5分立ち止まると、この駅のカードが1枚</li><li>季節と時間帯でカードの色が変わる。同じ駅でも別の1枚に</li><li>路線やランクを制覇してバッジを集める</li></ul>
${storeBtns}</section>
<footer>街力は OpenStreetMap／Overture Maps のデータから計算しています（${esc(scoresCache.version || '')}）。<br>© 街巡-まちめぐ-</footer>
</main></body></html>`;
}

app.use('/station', generalLimiter);
app.get('/station/:pref/:name', (req, res) => {
  try {
    const id = `${req.params.name}_${req.params.pref}`;
    const st = STATIONS_BY_ID.get(id);
    if (!st) return res.status(404).send('<!doctype html><meta charset="utf-8"><p>駅が見つかりませんでした。<a href="/">街巡-まちめぐ-</a></p>');
    const ua = req.get('user-agent') || '';
    const dev = /iPhone|iPad|iPod/i.test(ua) ? 'i' : /Android/i.test(ua) ? 'a' : 'p';
    const key = `${id}|${dev}`;
    const hit = _pageCache.get(key);
    if (hit && hit.builtAt === scoresCache.builtAt && hit.tv === stationText.version && Date.now() - hit.t < PAGE_TTL) {
      res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
      return res.send(hit.html);
    }
    const html = renderStationPage(st, ua);
    if (_pageCache.size > 3000) _pageCache.clear();
    _pageCache.set(key, { html, t: Date.now(), builtAt: scoresCache.builtAt, tv: stationText.version });
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
    res.send(html);
  } catch (e) {
    console.error('[v15] 駅ページ失敗:', e.message);
    res.status(500).send('<!doctype html><meta charset="utf-8"><p>ただいま表示できません。</p>');
  }
});

let _sitemap = { t: 0, xml: '' };
app.get('/sitemap.xml', (req, res) => {
  try {
    if (!_sitemap.xml || Date.now() - _sitemap.t > PAGE_TTL) {
      const urls = `<url><loc>${SITE}/</loc></url>` + PREFS.map((p) => `<url><loc>${SITE}/search?pref=${encodeURIComponent(p)}</loc></url>`).join('')
        + STATIONS.map((st) => `<url><loc>${stationUrl(st)}</loc></url>`).join('');
      _sitemap = { t: Date.now(), xml: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` };
    }
    res.set('Content-Type', 'application/xml; charset=utf-8'); res.send(_sitemap.xml);
  } catch (e) { res.status(500).end(); }
});


// ═══════════════════════════════════════════════════════════════
// ★v16：トップ（/）＝アプリの公式紹介ページ ／ /search?q=駅名
// ═══════════════════════════════════════════════════════════════
const PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

function pageShell(title, desc, body, canonical) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<link rel="icon" type="image/png" href="/logo192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${SITE}/logo512.png"><meta property="og:type" content="website">
<style>
:root{--bg:#0E1626;--sf:#16233A;--sh:#1B2C46;--ln:#2A3B57;--tx:#fff;--sub:#9AB4D0;--act:#FF9D4D}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif;line-height:1.7}
main{max-width:760px;margin:0 auto;padding:16px}a{color:#7EC8F0}
section{background:var(--sf);border-radius:16px;padding:18px;margin:14px 0}h2{font-size:18px;margin:0 0 12px}
.badge{display:inline-flex;align-items:center;margin:4px;vertical-align:middle}.badge img{display:block}
.hero{text-align:center;padding:28px 18px;background:linear-gradient(160deg,#1B2C46,#16233A 60%,#2A1F2E)}
.hero img.logo{width:96px;height:96px;border-radius:22px;box-shadow:0 8px 30px rgba(0,0,0,.4)}
.hero h1{margin:12px 0 4px;font-size:32px;letter-spacing:.02em}.hero .tag{font-size:17px;font-weight:800;margin:0 0 6px}.hero .sub{color:var(--sub);font-size:14px;margin:0 0 14px}
.feat{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:620px){.feat{grid-template-columns:1fr 1fr 1fr}}
.feat div{background:var(--sh);border-radius:12px;padding:14px}.feat b{display:block;font-size:16px;margin-bottom:4px}.feat span{color:var(--sub);font-size:14px}
ol{padding-left:20px;margin:0}ol li{margin:4px 0}
form{display:flex;gap:8px}input[type=search]{flex:1;font-size:16px;padding:12px;border-radius:10px;border:1px solid var(--ln);background:var(--sh);color:#fff}
button{font-size:16px;font-weight:800;padding:12px 16px;border:0;border-radius:10px;background:var(--act);color:#fff}
.chips a{display:inline-block;margin:4px;padding:6px 10px;border-radius:999px;background:var(--sh);color:#fff;text-decoration:none;font-size:14px}
.rk{display:inline-block;min-width:22px;text-align:center;border-radius:6px;font-weight:900;color:#fff;font-size:12px;margin-right:6px}
ul.list{list-style:none;padding:0;margin:0}ul.list li{padding:8px 0;border-bottom:1px solid var(--ln)}ul.list li:last-child{border:0}ul.list small{color:var(--sub);margin-left:6px}
footer{color:var(--sub);font-size:12px;text-align:center;padding:24px}footer a{color:var(--sub);margin:0 8px}
</style></head><body><main>${body}
<footer><a href="/privacy.html">プライバシーポリシー</a><a href="/terms.html">利用規約</a><br>© 街巡-まちめぐ-</footer>
</main></body></html>`;
}

function storeBadges(ua, h) {
  const APPLE_BADGE = 'https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/ja-jp';
  const GOOGLE_BADGE = 'https://play.google.com/intl/ja/badges/static/images/badges/ja_badge_web_generic.png';
  const a = `<a class="badge" href="${APP_STORE_URL}"><img src="${APPLE_BADGE}" alt="App Storeからダウンロード" style="height:${h}px"></a>`;
  const g = `<a class="badge" href="${PLAY_URL}"><img src="${GOOGLE_BADGE}" alt="Google Play で手に入れよう" style="height:${Math.round(h * 1.45)}px;margin:${-Math.round(h * 0.22)}px 0"></a>`;
  return /iPhone|iPad|iPod/i.test(ua) ? a : /Android/i.test(ua) ? g : a + g;
}

let _topCache = { key: '', html: '' };
app.get('/', (req, res) => {
  try {
    const ua = req.get('user-agent') || '';
    const dev = /iPhone|iPad|iPod/i.test(ua) ? 'i' : /Android/i.test(ua) ? 'a' : 'p';
    const key = `${dev}|${scoresCache.builtAt}`;
    if (_topCache.key !== key) {
      const top = STATIONS.map((st) => [st, scoreOf(st.id)]).filter(([, s]) => s)
        .sort((a, b) => b[1].score - a[1].score).slice(0, 12);
      const topHtml = top.map(([st, s]) => `<li><span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}・${s.score}点</small></li>`).join('');
      const picks = ['東陽町_東京都', '吉祥寺_東京都', '鎌倉_神奈川県', '梅田_大阪府', '京都_京都府', '博多_福岡県', '札幌_北海道', '名古屋_愛知県']
        .map((id) => STATIONS_BY_ID.get(id)).filter(Boolean)
        .map((st) => `<a href="${stationUrl(st)}">${esc(st.name)}</a>`).join('');
      const body = `
<section class="hero"><img class="logo" src="/logo512.png" alt="街巡-まちめぐ- のアイコン">
<h1>街巡-まちめぐ-</h1>
<p class="tag">駅で5分、カードを集める散歩。</p>
<p class="sub">全国8,993駅のスタンプラリー。駅から500m以内で5分立ち止まると、その街のカードが1枚もらえる街歩きアプリ（無料）</p>
${storeBadges(ua, 48)}</section>
<section><h2>できること</h2><div class="feat">
<div><b>🎴 街のカードを集める</b><span>駅に5分いるだけでカードが1枚。季節・時間帯・天気で色が変わり、同じ駅でも別の1枚になります。</span></div>
<div><b>📊 街力がわかる</b><span>飲食・商業・生活・医療のお店や施設を数えて、全駅を1,000点満点で採点。S〜Dの5ランクで比べられます。</span></div>
<div><b>🏅 路線や街を制覇</b><span>路線・市区町村・都道府県・ランクごとに制覇バッジ。カードの裏には歩いた街の写真も貼れます。</span></div>
</div></section>
<section><h2>駅を調べる</h2>
<form action="/search" method="get"><input type="search" name="q" placeholder="駅名（例：東陽町）" aria-label="駅名"><button type="submit">調べる</button></form>
<p class="chips" style="margin:10px 0 0">${picks}</p></section>
<section><h2>街力の高い駅 TOP12</h2><ul class="list">${topHtml}</ul></section>
<section><h2>都道府県から探す</h2><p class="chips">${PREFS.map((p) => `<a href="/search?pref=${encodeURIComponent(p)}">${p}</a>`).join('')}</p></section>
<section><h2>使い方</h2><ol><li>アプリを開くと、地図に近くの駅が並びます</li><li>行きたい駅をタップしてチェックイン開始</li><li>駅の近くを5分歩く（画面は消していてOK）</li><li>その街のカードが手に入ります</li></ol>
<p style="color:var(--sub);font-size:13px;margin:10px 0 0">1日に記録できるのは3駅まで。急がず、ひとつの街をゆっくり歩いてほしいからです。</p></section>
<section style="text-align:center"><h2>さあ、街にでよう。</h2>${storeBadges(ua, 48)}</section>`;
      _topCache = { key, html: pageShell('街巡-まちめぐ- 駅で5分、カードを集める散歩｜全国8,993駅のスタンプラリー',
        '全国8,993駅の駅から500m以内で5分立ち止まると、その街のカードが1枚。街力（1,000点満点）で駅を比べて、路線や街を制覇する街歩きアプリ。無料。', body, `${SITE}/`) };
    }
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=600');
    res.send(_topCache.html);
  } catch (e) {
    console.error('[v16] トップ失敗:', e.message);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// 駅名の検索／県の一覧（同名駅が複数なら一覧、1駅ならその駅のページへ）
app.get('/search', generalLimiter, (req, res) => {
  try {
    const q = String(req.query.q || '').trim().replace(/駅$/, '').slice(0, 30);
    const pref = String(req.query.pref || '').trim();
    let hits = [];
    let title = '';
    if (pref && PREFS.includes(pref)) {
      hits = STATIONS.filter((st) => st.pref === pref).map((st) => [st, scoreOf(st.id)])
        .sort((a, b) => ((b[1] && b[1].score) || 0) - ((a[1] && a[1].score) || 0));
      title = `${pref}の駅（街力順）`;
    } else if (q) {
      const exact = STATIONS.filter((st) => st.name === q);
      if (exact.length === 1) return res.redirect(302, stationUrl(exact[0]));
      hits = (exact.length ? exact : STATIONS.filter((st) => st.name.includes(q) || (STATION_YOMI[st.id] || '').startsWith(q)))
        .slice(0, 100).map((st) => [st, scoreOf(st.id)]);
      title = `「${q}」の検索結果`;
    }
    const list = hits.map(([st, s]) => `<li>${s ? `<span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span>` : ''}<a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}${s ? `・${s.score}点` : ''}</small></li>`).join('');
    const body = `<p><a href="/">← 街巡-まちめぐ- トップ</a></p><section><h2>${esc(title || '駅を調べる')}</h2>
<form action="/search" method="get"><input type="search" name="q" value="${esc(q)}" placeholder="駅名（例：東陽町）" aria-label="駅名"><button type="submit">調べる</button></form>
${list ? `<ul class="list" style="margin-top:12px">${list}</ul>` : (q ? '<p>見つかりませんでした。</p>' : '')}</section>`;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(pageShell(`${title || '駅を調べる'}｜街巡-まちめぐ-`, `${title}。全国8,993駅の街力を調べられます。`, body, pref ? `${SITE}/search?pref=${encodeURIComponent(pref)}` : null));
  } catch (e) {
    console.error('[v16] 検索失敗:', e.message);
    res.status(500).send('ただいま表示できません');
  }
});

// ★v13：App Store の今の版を覚えておく箱（取れるまでは空＝お知らせは出ない）
const storeInfo = { version: '', note: '', checkedAt: 0 };
const APP_STORE_LOOKUP = 'https://itunes.apple.com/lookup?id=6804345019&country=jp';

// リリースノートから、お知らせ用の一文を作る
//   1行目の先頭の「・」を取り、最初の「。」までを使う。長ければ60字で切る。
function noteFromReleaseNotes(text) {
  if (typeof text !== 'string') return '';
  const first = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) || '';
  let line = first.replace(/^[・\-\*●■◆]\s*/, '');
  const i = line.indexOf('。');
  if (i >= 0) line = line.slice(0, i + 1);
  if (line.length > 60) line = line.slice(0, 59) + '…';
  return line;
}

async function refreshStoreVersion() {
  if ((process.env.STORE_CHECK || '').trim().toLowerCase() === 'off') return;
  try {
    const res = await fetch(APP_STORE_LOOKUP, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const r = data && Array.isArray(data.results) ? data.results[0] : null;
    const v = r && typeof r.version === 'string' ? r.version.trim() : '';
    // ★形が正しい版だけ受け取る（例 1.9.0）。おかしな値で上書きしない。
    if (!/^\d+\.\d+(\.\d+)?$/.test(v)) throw new Error('版の形が不正: ' + v);
    const note = noteFromReleaseNotes(r.releaseNotes);
    if (v !== storeInfo.version) {
      console.log(`[v13] App Store の版: ${storeInfo.version || '(未取得)'} → ${v}／お知らせ「${note}」`);
    }
    storeInfo.version = v;
    storeInfo.note = note;
    storeInfo.checkedAt = Date.now();
  } catch (e) {
    // ★失敗しても前回の値を使い続ける
    console.warn('[v13] App Store の版の確認に失敗（前回の値を使う）:', e.message);
  }
}

// 起動10秒後に1回、以後1時間ごと
setTimeout(() => { refreshStoreVersion(); }, 10 * 1000).unref();
setInterval(() => { refreshStoreVersion(); }, 60 * 60 * 1000).unref();

// ★v12：起動時に、壊れた TILE_URL を見つけたらログに出す。
//   （アプリ側でも https と {z}{x}{y} を確かめて、壊れた値は捨てる）
{
  const t = (process.env.TILE_URL || '').trim();
  if (t && !(t.startsWith('https://') && t.includes('{z}') && t.includes('{x}') && t.includes('{y}'))) {
    console.warn('[v12] TILE_URL の形が正しくない（https と {z}{x}{y} が必要）。アプリは既定の地図を使う:', t);
  }
  console.log('[v12] /api/version のアプリ向け設定:', JSON.stringify(appConfigFromEnv()));
}

// ═══════════════════════════════════════════════════════════════
// 管理者専用エンドポイント（Firebase認証必須）
// ═══════════════════════════════════════════════════════════════

// 管理者ダッシュボード本体（HTML配信）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 管理者プロフィール確認
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ uid: req.adminUid, email: req.adminEmail });
});

// 手動再計算トリガー（クエリ ?mode=full|incremental|auto、デフォルトauto）
app.post('/api/admin/rebuild', requireAdmin, (req, res) => {
  if (buildState.running) {
    return res.status(409).json({ error: '既に実行中', status: getBuildStatus() });
  }
  // ★★ 重要修正：手動rebuildは常にフルモードで実行 ★★
  // 旧仕様: autoモード時、checkRebuildMode が「up-to-date」判定するとスキップされていた
  //        （四半期内＆キャッシュ存在＆新規駅なしで「再計算不要」とみなされる）
  // 新仕様: 管理者が明示的にボタンを押した場合は必ず全駅再計算する
  //        スコア計算ロジック変更後（配点変更、ボーナス追加等）でも確実にキャッシュ更新できる
  const requestedMode = req.query.mode || 'full';  // デフォルトをfullに変更
  
  if (requestedMode === 'incremental') {
    // 明示的にincremental指定された場合のみ差分計算
    const check = checkRebuildMode();
    if (check.mode === 'incremental') {
      rebuildScores({ mode: 'incremental', stations: check.stations })
        .catch(e => {
          console.error('rebuild failed:', e);
          notifyOps('rebuild failed (incremental, admin)', e && e.stack ? e.stack : String(e));
        });
      return res.json({ ok: true, message: `差分計算開始（${check.stations.length}駅）`, status: getBuildStatus() });
    } else {
      console.log('[admin] incremental要求だが差分なし → フルモードで実行');
    }
  }
  
  // デフォルト：強制フルモード
  console.log('[admin] 手動rebuild受信: 強制フルモード実行（autoスキップ廃止）');
  rebuildScores({ mode: 'full' }).catch(e => {
    console.error('rebuild failed:', e);
    notifyOps('rebuild failed (full, admin)', e && e.stack ? e.stack : String(e));
  });
  return res.json({ ok: true, message: '強制フル再計算開始（全駅再計算）', status: getBuildStatus() });
});

// ★巻き戻し（前期版キャッシュを現行へ復帰）
//   スコア計算の方針を変える大改修では、7時間かけた結果が期待と違う場合に
//   戻す手段が要る。rebuild完了時に保存される前期版を現行へ戻す。
//   ・実行中は拒否（書き換え競合の防止）
//   ・戻す前に現在のキャッシュを .rollback_backup として退避（二重の保険）
app.post('/api/admin/rollback', requireAdmin, (req, res) => {
  if (buildState.running) {
    return res.status(409).json({ error: 'rebuild実行中は巻き戻せない', status: getBuildStatus() });
  }
  try {
    if (!fs.existsSync(SCORES_CACHE_PREV_FILE)) {
      return res.status(404).json({ error: '前期版キャッシュが存在しない' });
    }
    const prev = JSON.parse(fs.readFileSync(SCORES_CACHE_PREV_FILE, 'utf8'));
    const prevCount = Object.keys(prev.stations || {}).length;
    if (prevCount === 0) {
      return res.status(400).json({ error: '前期版キャッシュが空' });
    }
    // 現行を退避（巻き戻しの巻き戻し用）
    try {
      fs.writeFileSync(SCORES_CACHE_FILE + '.rollback_backup', JSON.stringify(scoresCache));
    } catch(e) {
      console.warn('[rollback] 現行の退避に失敗:', e.message);
    }
    scoresCache = prev;
    fs.writeFileSync(SCORES_CACHE_FILE, JSON.stringify(prev));
    console.log(`[rollback] 前期版へ巻き戻した: ${prevCount}駅 / builtAt=${new Date(prev.builtAt||0).toLocaleString('ja-JP')} / axisSig=${prev.axisSig||'なし'}`);
    return res.json({
      ok: true,
      message: `前期版へ巻き戻した（${prevCount}駅）`,
      builtAt: prev.builtAt,
      builtAtStr: prev.builtAt ? new Date(prev.builtAt).toLocaleString('ja-JP') : '不明',
      axisSig: prev.axisSig || null
    });
  } catch(e) {
    console.error('[rollback] 失敗:', e);
    return res.status(500).json({ error: e.message });
  }
});

// 差分レポート（前期版 vs 今期版）
app.get('/api/admin/diff', requireAdmin, (req, res) => {
  const radius = parseInt(req.query.radius) || 800;
  const rKey = `r${radius}`;
  
  // 前期版を読込
  let previousCache = null;
  try {
    if (fs.existsSync(SCORES_CACHE_PREV_FILE)) {
      previousCache = JSON.parse(fs.readFileSync(SCORES_CACHE_PREV_FILE, 'utf8'));
    }
  } catch(e) {
    console.warn('[diff] 前期版読込失敗:', e.message);
  }
  
  if (!previousCache || !previousCache.stations) {
    return res.json({
      ok: true,
      hasDiff: false,
      message: '前期版データがありません（次回更新後から差分が見れます）',
      currentVersion: scoresCache.version,
      currentBuiltAt: scoresCache.builtAt,
      stations: { rankUp: [], rankDown: [], scoreUp: [], scoreDown: [] }
    });
  }
  
  // 駅マスタで駅名を引けるように
  const stationsMap = {};
  STATIONS.forEach(s => { stationsMap[s.id] = s; });
  
  const rankUp = [];
  const rankDown = [];
  const scoreUp = [];
  const scoreDown = [];
  const rankOrder = { S:0, A:1, B:2, C:3, D:4 };
  
  Object.keys(scoresCache.stations || {}).forEach(sid => {
    const cur = scoresCache.stations[sid][rKey];
    const prev = previousCache.stations[sid] && previousCache.stations[sid][rKey];
    if (!cur || !prev) return;
    
    const stMeta = stationsMap[sid] || { name: sid.split('_')[0], pref: sid.split('_')[1] };
    const scoreDiff = cur.score - prev.score;
    const item = {
      stationId: sid,
      name: stMeta.name,
      pref: stMeta.pref,
      lines: stMeta.lines || [],
      oldScore: prev.score,
      newScore: cur.score,
      oldRank: prev.rank,
      newRank: cur.rank,
      scoreDiff
    };
    
    if (cur.rank !== prev.rank) {
      const oldOrder = rankOrder[prev.rank] !== undefined ? rankOrder[prev.rank] : 5;
      const newOrder = rankOrder[cur.rank] !== undefined ? rankOrder[cur.rank] : 5;
      if (newOrder < oldOrder) rankUp.push(item);
      else rankDown.push(item);
    }
    if (scoreDiff >= 5) scoreUp.push(item);
    else if (scoreDiff <= -5) scoreDown.push(item);
  });
  
  // ソート
  rankUp.sort((a,b) => b.scoreDiff - a.scoreDiff);
  rankDown.sort((a,b) => a.scoreDiff - b.scoreDiff);
  scoreUp.sort((a,b) => b.scoreDiff - a.scoreDiff);
  scoreDown.sort((a,b) => a.scoreDiff - b.scoreDiff);
  
  res.json({
    ok: true,
    hasDiff: true,
    currentVersion: scoresCache.version,
    previousVersion: previousCache.version,
    currentBuiltAt: scoresCache.builtAt,
    previousBuiltAt: previousCache.builtAt,
    radius,
    counts: {
      rankUp: rankUp.length,
      rankDown: rankDown.length,
      scoreUp: scoreUp.length,
      scoreDown: scoreDown.length
    },
    stations: {
      rankUp: rankUp.slice(0, 50),     // 最大50件まで
      rankDown: rankDown.slice(0, 30),
      scoreUp: scoreUp.slice(0, 30),
      scoreDown: scoreDown.slice(0, 30)
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// ★dev環境seed用: 計算済みスコアキャッシュのダウンロード（管理者専用）
//   目的: 本番の scores_cache.json を取得し、GitHubに seed として配置することで
//         dev環境（CACHE_DIR空）でも Overture を再計算せず街力を表示できるようにする。
//   認証: requireAdmin（Firebase ID Token + ADMIN_UIDS チェック）
//   挙動: 現在メモリ上にある scoresCache をそのまま JSON で返す（添付ダウンロード）
//         ファイル本体ではなくメモリ内容を返すので、ボリュームのパスに依存しない。
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/download-cache', requireAdmin, (req, res) => {
  try {
    const cnt = Object.keys(scoresCache.stations || {}).length;
    if (cnt === 0) {
      return res.status(404).json({ error: 'キャッシュが空です（計算済みデータがありません）' });
    }
    const body = JSON.stringify(scoresCache);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="scores_cache.json"');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(body);
  } catch (e) {
    console.error('[/api/admin/download-cache] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// 旧 /api/rebuild（後方互換、認証なしのまま）→ 削除して認証必須に統一
// app.post('/api/rebuild') は requireAdmin に移行

// ★v10 🔴-1: /api/test を本番から削除（2026-06-05 総合レビュー対応）
//   旧コード:
//     app.get('/api/test', async (req, res) => {
//       const counts = await getRawCounts(35.6896, 139.7006, r);  // ←S3クエリ走る
//       const bonusObj = calcBonus(35.6896, 139.7006);
//       const result = calcScore(counts, r, bonusObj);
//       res.json({ ok: true, ... });
//     });
//   問題:
//     - /api/score, /api/admin, /api/all-scores のレート制限グループ外
//     - 認証ミドルウェアもなし（誰でも叩ける）
//     - 内部で getRawCounts → DuckDBがS3 Parquetへクエリ発行
//     - 攻撃者が叩き続けるとS3 GET費用とメモリ占有が爆発
//   開発時のスモークテストは npm test 等のローカルスクリプトに切り出す。

// ヘルスチェック
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  version: scoresCache.version,
  stations: Object.keys(scoresCache.stations || {}).length,
  builtAt: scoresCache.builtAt,
  building: buildState.running
}));

// ═══════════════════════════════════════════════════════════════
// 起動
// ═══════════════════════════════════════════════════════════════

// ★v10 🟡-9,10: 異常時の運用通知（Discord webhook）
//   DISCORD_WEBHOOK_URL 環境変数を Railway に設定すると有効。
//   未設定でも安全に動作（catch内でURL確認）。
//   発火条件:
//     - uncaughtException / unhandledRejection
//     - rebuildScores の失敗（catch経由でこの関数を呼ぶ）
//   送信に失敗しても運用継続（通知失敗で本体が止まる事故を防ぐ）。
//   レート: 同一メッセージの連投を5分間1回に抑える（ノイズ防止）。
const _notifyLastSent = new Map();
function notifyOps(title, detail) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const key = String(title).slice(0, 80);
  const now = Date.now();
  const last = _notifyLastSent.get(key) || 0;
  if (now - last < 5 * 60 * 1000) return;  // 5分間に同一titleは1回まで
  _notifyLastSent.set(key, now);
  const msg = `🚨 **${title}**\n\`\`\`\n${String(detail || '').slice(0, 1500)}\n\`\`\``;
  // fire-and-forget（待たない）
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg })
    }).catch(() => {});
  } catch(_) {}
}

// ★Step 1-⑤: 未捕捉例外ハンドラ（プロセスクラッシュ防止）
//   Node.jsで未捕捉例外/Promise rejectionが出るとプロセスが落ち、Railwayが再起動する間サービス断。
//   ログだけ出して継続するように。
//   v10 🟡-9: Discord webhook で通知も飛ばす（DISCORD_WEBHOOK_URL設定時のみ）
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
  notifyOps('uncaughtException', err && err.stack ? err.stack : String(err));
  // プロセスは継続させる（Railway再起動による断を防ぐ）
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason);
  notifyOps('unhandledRejection', String(reason && reason.stack ? reason.stack : reason));
  // 同上、継続
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[起動] port ${PORT}`));

// 1. 旧キャッシュ即読込（stale-while-revalidate の "stale" 部分）
loadScoresCache();

// 2. DuckDB初期化 → 必要なら再計算
initDB().then(() => {
  console.log('[起動] DuckDB初期化完了');

  // ★dev環境用: DISABLE_AUTO_REBUILD=1 のとき起動時の自動再計算を完全スキップ。
  //   dev は seed キャッシュ（GitHub同梱）で街力表示するだけが目的で、
  //   Overture へのフル再計算は不要かつ失敗する（リリース日付固定のため）。
  //   本番には設定しない＝従来通り四半期/新規駅で自動再計算する。
  //   dev で意図的に再計算したいときは admin の「手動で再計算開始」を使えば可能。
  if (process.env.DISABLE_AUTO_REBUILD === '1') {
    const cnt = Object.keys(scoresCache.stations || {}).length;
    console.log(`[起動] DISABLE_AUTO_REBUILD=1 → 自動再計算スキップ（seed/既存キャッシュ ${cnt}駅で稼働）`);
    return;
  }

  const rebuildCheck = checkRebuildMode();
  console.log(`[起動] rebuild判定:`, rebuildCheck.mode, '/', rebuildCheck.reason);
  
  if (rebuildCheck.mode === 'full') {
    console.log('[起動] フル再計算が必要、30秒後にバックグラウンドで開始');
    setTimeout(() => {
      rebuildScores({ mode: 'full' }).catch(e => {
        console.error('[起動] rebuild failed:', e);
        notifyOps('rebuild failed (full, startup)', e && e.stack ? e.stack : String(e));
      });
    }, 30000);
  } else if (rebuildCheck.mode === 'incremental') {
    console.log(`[起動] 差分計算が必要（${rebuildCheck.stations.length}駅追加）、10秒後にバックグラウンドで開始`);
    setTimeout(() => {
      rebuildScores({ mode: 'incremental', stations: rebuildCheck.stations })
        .catch(e => {
          console.error('[起動] rebuild failed:', e);
          notifyOps('rebuild failed (incremental, startup)', e && e.stack ? e.stack : String(e));
        });
    }, 10000);
  } else {
    const ageDays = Math.floor((Date.now() - scoresCache.builtAt) / (24*60*60*1000));
    console.log(`[起動] キャッシュ有効（${ageDays}日前構築）、再計算スキップ`);
  }
}).catch(e => {
  console.error('[起動] DuckDB初期化失敗:', e);
});
