// ═══════════════════════════════════════════════════════════════
// 街巡 server.js v29（2026-09-24 JST：トップの並びを元に戻す）
// v28 → v29：トップの並びは v27 までの順（アプリの画面 → … → 使い方 → 駅を調べる → 街力の高い駅 → 都道府県）に戻した。
//   トップに来るのは「これ何のアプリ？」を知りたい人。回遊は駅ページ（8,993の入口）が担う（ともき判断）。
//   v28 の「ランキングをすべて見る →」ボタン・4つの太字・SNSのひとことは残す。
// （v28）トップを「調べる・比べる」から始める（並びは v29 で撤回）
// v27 → v28：
//   ・トップの並び：ヒーローの次に「駅を調べる」「街力の高い駅」「都道府県から探す」、
//     そのあとに「アプリの画面」以下（サイトの中を回ってもらうのを優先・ともき案）。
//   ・「街力の高い駅」の見出しの右に「ランキングをすべて見る →」を目立つボタンで。
//     下の4つ（飲食店が多い駅など）は太字。
//   ・X・インスタのボタンに、アプリと同じひとこと（最新情報をGET！／街の風景をシェア中）。
// （v27）HPの仕上げ
// v26 → v27：
//   ・駅名標の ← 前の駅／次の駅 → を、アプリ（2.0.0）と同じ「路線の並び順」に。
//     リポジトリ直下の station_neighbors.json を読む（無ければ従来どおり「近い2駅」）。
//   ・駅ページのスマホ下部に「◯◯駅のカードを、アプリで」の帯（×で閉じられる・
//     ページ下のアプリ紹介が見えている間は引っ込む）。
//   ・全ページに「↑ ページの先頭へ」「← 戻る」の丸いボタン（アプリと同じ使い勝手）。
//     「戻る」はサイト内から来たときだけ出す（検索から来た人を外へ戻さない）。
//   ・トップの「都道府県から探す」を地方ごとに畳む（押すと開く）。
//   ・トップの X・インスタのボタンが2回出ていたのを1回に（締めの箱の中だけ）。
// （v26）特集ページ・季節の入口
// v25 → v26：/feature/{momiji,onsen,sakura,umi,castle,shotengai}（駅コメントに書いてある駅だけ）。
//   トップに季節の特集（9〜11月は紅葉…）。フッター・サイトマップに追加。インスタのボタンの色を調整。
// （v25）
// v24 → v25：/pref/県（要約・TOP30・市区町村・路線）。県へのリンクとサイトマップを /pref/ に。
//   トップに「最新版のお知らせ」（App Store の版とリリースノートから自動）。X・インスタのボタンをブランドの色に。
// （v24）
// v23 → v24：トップと検索に「📍 今いる場所の近くの駅を見る」。/near で近い8駅（距離・街力・ひとこと）。
//   位置は約100mに丸めて送る・保存しない・noindex。
// （v23）
// v22 → v23：XとインスタのリンクをフッターとトップのCTAに＋公式アカウントの構造化データ（sameAs）。
//   トップに App Store のスクショ（自動で取得・横スクロール）。
//   Railway に GA4_MEASUREMENT_ID を入れると全ページでGA4が動き、ストア/SNSのボタンのクリックも記録。
// （v22）
// v21 → v22：駅名標の左右の駅名を大きく。トップに「今日の一駅」（毎日0時JSTに入れ替わる）と「よくある質問」。
//   構造化データ：アプリ（App Storeの★）・よくある質問・駅ページのパンくず。駅ページにパンくずを表示。
// （v21）昼の街並み…
// v20 → v21：昼の街並み（ホーム・駅名標・架線・電車・時計台・家）と夕方の街並み（誘いの枠）を生成。
//   使い方＝路線図、できること＝切符、順位＝駅ナンバリング風、区切り＝線路。Google Play のバッジを Apple と同じ高さに。
//   駅を調べるの候補を10都市に。
// v19 → v20：全ページを昼の空＋駅名標のデザインに（Zen Maru Gothic／明るい空色／ピンのオレンジ）。
//   トップ：駅名標の「街巡」→ 見出し → 見本の3駅 → できること → 使い方 → 駅を調べる → ランキング → 都道府県
//   駅ページ：駅名標（左右は同じ路線で近い駅）→ 街力 → 内訳 → …。「生活施設が多い駅」に改名。
// ───────────────────────────────────────────────────────────────
// （以下 v19 の説明）
// ═══════════════════════════════════════════════════════════════
// v18 → v19：/og/station/県/駅名.png（1200×630・駅名/ふりがな/街力/ランク/内訳/コメント）
//   駅ページに og:image と twitter:card=summary_large_image。
//   ★必要：package.json に "@resvg/resvg-js" ／ リポジトリ直下に MPLUSRounded1c-ExtraBold.ttf
//   ★どちらか無ければ画像を出さないだけで、ページとAPIは今までどおり動く
// ───────────────────────────────────────────────────────────────
// v17 → v18：/ranking と /ranking/{machiryoku,food,shop,life,medical,sights,riders,oldest}（全国TOP100）
//   トップから入口。サイトマップに追加。
// ───────────────────────────────────────────────────────────────
// v16 → v17：/line/路線名 ・ /area/県/市区町村（街力ランキング＋要約＋制覇バッジ）
//   駅ページの順位欄から路線・県・市区町村へリンク。県の一覧に市区町村のリンク。サイトマップに追加。
// ───────────────────────────────────────────────────────────────
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
// ★v27：駅名標の ← 前の駅／次の駅 →（アプリ 2.0.0 の station_neighbors.dart と同じ中身）
//   形：駅ID → { 路線名: '前の駅|次の駅' }。無ければ従来の「近い2駅」で出す。
//   ★データの出どころ：HeartRails Express（無料で使う条件＝クレジット表記。フッターに載せる）
const STATION_NEIGHBORS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'station_neighbors.json'), 'utf8')); }
  catch (e) { console.warn('[v27] station_neighbors.json なし（駅名標の左右は近い2駅で出す）'); return {}; }
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
function lineUrl(l) { return `${SITE}/line/${encodeURIComponent(l)}`; }
function areaUrl(pref, city) { return `${SITE}/area/${encodeURIComponent(pref)}/${encodeURIComponent(city)}`; }
function stationsOfArea(pref, city) { return STATIONS.filter((o) => o.pref === pref && (textOf(o.id) || {}).location === city); }
function areaRankOf(st, city) {
  const arr = stationsOfArea(st.pref, city).map((o) => [o.id, (scoreOf(o.id) || {}).score || 0]).sort((a, b) => b[1] - a[1]);
  const i = arr.findIndex(([id]) => id === st.id); return i < 0 ? 0 : i + 1;
}
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
// ★v27：駅名標の前後の駅を、駅の路線の並び（メジャー順）の先頭から探す
//   名前→駅の引き当ては、同じ路線に乗っている同名駅を優先し、無ければ一番近い同名駅。
let _byName = null;
function stationsNamed(name) {
  if (!_byName) {
    _byName = new Map();
    for (const o of STATIONS) { if (!_byName.has(o.name)) _byName.set(o.name, []); _byName.get(o.name).push(o); }
  }
  return _byName.get(name) || [];
}
function findNeighbor(name, line, st) {
  if (!name) return null;
  const c = stationsNamed(name).filter((o) => o.id !== st.id);
  if (!c.length) return null;
  const on = c.filter((o) => (o.lines || []).includes(line));
  const pool = on.length ? on : c;
  return pool.slice().sort((a, b) => distM(st.lat, st.lng, a.lat, a.lng) - distM(st.lat, st.lng, b.lat, b.lng))[0];
}
function signNeighbors(st) {
  const nb = STATION_NEIGHBORS[st.id];
  if (!nb) return null;
  for (const l of st.lines || []) {
    const v = nb[l];
    if (typeof v !== 'string' || !v.includes('|')) continue;
    const [p, n] = v.split('|');
    const prev = findNeighbor(p, l, st), next = findNeighbor(n, l, st);
    if (prev || next) return { line: l, prev, next };
  }
  return null;
}

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

// ═══ ★v20：サイト共通のデザイン（明るい昼の空・駅名標がモチーフ）═══
const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">`;
const SITE_CSS = `
:root{--sky:#EAF4FA;--paper:#FFFFFF;--ink:#1F2A44;--sub:#5B687B;--line:#D6E3EB;--pin:#F26B3A;--blue:#2F8CC6;--sun:#FFD66B;--leaf:#4FA877;--tile:#F4F9FC}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--sky);color:var(--ink);font-family:"Noto Sans JP",-apple-system,"Hiragino Sans",sans-serif;font-size:16px;line-height:1.8}
h1,h2,h3,.maru{font-family:"Zen Maru Gothic","Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif}
a{color:#1B6FA6}
main{max-width:760px;margin:0 auto;padding:0 18px 24px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;max-width:760px;margin:0 auto;padding:12px 18px}
.top .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);min-width:0}
.top .brand img{width:40px;height:40px;border-radius:10px;flex:none;box-shadow:0 2px 6px rgba(31,42,68,.15)}
.top .brand b{font-family:"Zen Maru Gothic",sans-serif;font-size:19px;font-weight:900;display:block;line-height:1.2;white-space:nowrap}
.top .brand span{font-size:11px;color:var(--sub);display:block;line-height:1.35}
.top .tb{flex:none;display:flex;align-items:center}
.badge{display:inline-flex;align-items:center;margin:4px;vertical-align:middle}.badge img{display:block}
.block{margin:34px 0}
h2{font-size:21px;font-weight:700;margin:0 0 12px;line-height:1.4}
.note{color:var(--sub);font-size:14px;margin:0 0 12px}
.list{list-style:none;margin:0;background:var(--paper);border-radius:16px;padding:4px 16px}
.list li{padding:12px 0;border-bottom:1px solid var(--line)}.list li:last-child{border:0}
.list small{color:var(--sub);margin-left:6px}
.rk{display:inline-block;min-width:24px;text-align:center;border-radius:6px;font-weight:900;color:#fff;font-size:12px;margin-right:6px;padding:1px 4px;line-height:1.6}
.rk[style*="#D9B21F"]{color:#3A2C00}
.chips{margin:0}.chips a{display:inline-block;margin:4px 6px 4px 0;padding:7px 14px;border-radius:999px;background:var(--paper);border:1px solid var(--line);color:var(--ink);text-decoration:none;font-size:14px;line-height:1.5}
form.find{display:flex;gap:8px}
form.find input{flex:1;min-width:0;font-size:16px;padding:14px 16px;border-radius:14px;border:2px solid var(--line);background:#fff;color:var(--ink)}
form.find input:focus{outline:none;border-color:var(--blue)}
form.find button{font-size:16px;font-weight:700;padding:0 22px;border:0;border-radius:14px;background:var(--pin);color:#fff;font-family:"Zen Maru Gothic",sans-serif;cursor:pointer}
a:focus-visible,button:focus-visible{outline:3px solid var(--blue);outline-offset:2px}
footer{color:var(--sub);font-size:12px;text-align:center;padding:34px 0 10px;line-height:1.9}footer a{color:var(--sub);margin:0 8px}
.sns{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}
.sns a{display:inline-flex;align-items:center;gap:8px;color:#fff;border-radius:999px;padding:9px 16px;font-size:14px;font-weight:700;text-decoration:none;margin:0;box-shadow:0 4px 12px rgba(31,42,68,.18)}
.sns a.x{background:#000}
.sns a.ig{background:linear-gradient(45deg,#F58529 0%,#DD2A7B 45%,#8134AF 78%,#515BD4 100%)}
.crumbs{font-size:13px;color:var(--sub);margin:4px 0 0}.crumbs a{color:var(--sub)}
/* 駅名標 */
.sign{background:#fff;border-radius:14px;box-shadow:0 2px 0 var(--line),0 12px 32px rgba(31,42,68,.10);overflow:hidden;text-align:center}
.sign .y{font-size:15px;letter-spacing:.35em;color:var(--sub);padding:18px 12px 0}
.sign .n{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:clamp(40px,11vw,74px);line-height:1.2;letter-spacing:.06em;padding:0 12px;word-break:keep-all;overflow-wrap:anywhere}
.sign .p{font-size:13px;color:var(--sub);padding:2px 12px 14px}
.sign .band{height:14px}
.sign .lr{display:flex;justify-content:space-between;gap:10px;padding:10px 16px 14px;font-size:17px;font-weight:700;text-align:left;line-height:1.4}
.sign .lr a{color:var(--ink);text-decoration:none}.sign .lr .r{text-align:right}.sign .lr small{display:block;color:var(--sub);font-size:12px;font-weight:400}
/* 空と街並み */
.skyhead{background:linear-gradient(180deg,#BFE2F5 0%,#DDF0FA 55%,var(--sky) 100%);position:relative}
.scene{display:block;width:100%;height:clamp(150px,19vw,230px)}
.track{display:block;width:100%;height:14px;margin:6px 0}
/* 路線図（使い方） */
.route{list-style:none;margin:0;padding:6px 0 6px 6px;position:relative}
.route:before{content:"";position:absolute;left:23px;top:30px;bottom:44px;width:6px;border-radius:3px;background:var(--blue)}
.route li{position:relative;padding:10px 0 10px 58px;min-height:52px}
.route li .st{position:absolute;left:4px;top:8px;width:44px;height:44px;border-radius:50%;background:#fff;border:5px solid var(--blue);display:grid;place-items:center;font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:17px;color:var(--ink)}
.route li.goal .st{border-color:var(--pin);background:var(--pin);color:#fff}
.route li b{display:block;font-family:"Zen Maru Gothic",sans-serif;font-size:18px;line-height:1.4}
.route li span{color:var(--sub);font-size:14px;line-height:1.6}
/* 切符（できること） */
.tickets{display:grid;gap:14px}
.ticket{display:grid;grid-template-columns:78px 1fr;background:#FFFDF7;border-radius:12px;position:relative;box-shadow:0 1px 0 #EADFCB,0 8px 22px rgba(120,90,40,.08);
  -webkit-mask:radial-gradient(circle 9px at 78px 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 9px at 78px 100%,#0000 98%,#000) bottom/100% 51% no-repeat;
  mask:radial-gradient(circle 9px at 78px 0,#0000 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 9px at 78px 100%,#0000 98%,#000) bottom/100% 51% no-repeat}
.ticket .stub{display:grid;place-items:center;font-size:30px;border-right:2px dashed #E6D6BC;border-radius:12px 0 0 12px}
.ticket .body{padding:14px 16px}
.ticket b{display:block;font-family:"Zen Maru Gothic",sans-serif;font-size:18px;line-height:1.4;margin-bottom:2px}
.ticket span{color:#4A566A;font-size:15px;line-height:1.7}
.ticket small{display:block;color:#B49468;font-size:11px;letter-spacing:.08em;margin-top:6px}
/* 駅ナンバリング風の順位 */
.no{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;border:3px solid var(--blue);font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:13px;margin-right:8px;background:#fff;vertical-align:middle;line-height:1}
.no.hi{border-color:var(--pin)}
@media (max-width:520px){.top .tb .badge:nth-child(2){display:none}}
.regions{display:grid;gap:12px}.regions div{background:#fff;border-radius:14px;padding:10px 12px}.regions b{display:block;font-family:"Zen Maru Gothic",sans-serif;font-size:14px;color:var(--sub);margin:0 0 2px}
.regions .chips a{background:var(--tile);border-color:transparent}
/* アプリの誘い */
.invite{background:linear-gradient(180deg,#FFF7EE 0%,#FFE1C7 55%,#FFC9A8 100%);border-radius:22px;padding:26px 20px 0;text-align:center;overflow:hidden}
.invite .scene{margin:14px -20px 0;width:calc(100% + 40px);height:clamp(120px,17vw,190px)}
.invite img.icon{width:72px;height:72px;border-radius:18px;box-shadow:0 4px 14px rgba(242,107,58,.25)}
.invite h2{margin:10px 0 4px;font-size:24px}.invite .pitch{margin:0 0 12px;color:var(--sub)}
.invite ul{list-style:none;padding:0;margin:0 auto 14px;max-width:440px;text-align:left}
.invite li{padding:6px 0 6px 30px;position:relative;font-size:15px}
.invite li:before{content:"";position:absolute;left:4px;top:13px;width:14px;height:14px;border-radius:50%;background:var(--pin);box-shadow:0 0 0 4px #FFF1E6}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
// ═══ ★v21：街の絵（生成は起動時に1回）═══════════════════════════
function _rnd(seed) { let x = seed; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
function _bld(r, x, base, w, h, fill, win, lit) {
  let s = `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${fill}"/>`;
  for (let yy = base - h + 8; yy < base - 10; yy += 12) {
    for (let xx = x + 6; xx < x + w - 8; xx += 11) {
      const on = r() < (lit ? 0.55 : 0.8);
      if (on) s += `<rect x="${xx}" y="${yy}" width="5" height="6" rx="1" fill="${lit && r() < 0.7 ? lit : win}"/>`;
    }
  }
  return s;
}
function makeScene({ w = 1200, h = 230, evening = false } = {}) {
  const r = _rnd(evening ? 97 : 42);
  const base = h - 34;             // 地面（線路の上）
  const C = evening
    ? { far: '#B58BA0', mid: '#7E6A8E', near: '#5E5173', win: '#8D7AA0', lit: '#FFE08A', mount: '#E9B7A7', tree: '#4E6B5E', roof: '#A0616E', wall: '#EAD6D8', plat: '#8C7C95', pole: '#5E5173', rail: '#4B4059' }
    : { far: '#CDE7F5', mid: '#A9D5EE', near: '#7FBEE3', win: '#E6F4FB', lit: null, mount: '#D7EAF4', tree: '#6FC39A', roof: '#F2A58A', wall: '#FFFFFF', plat: '#C3D2DC', pole: '#8FA7B8', rail: '#6B8396' };
  let s = `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`;
  // 太陽 or 月、雲、鳥
  if (evening) s += `<circle cx="930" cy="70" r="34" fill="#FFD27A" opacity=".95"/><circle cx="930" cy="70" r="54" fill="#FFD27A" opacity=".25"/>`;
  else s += `<circle cx="1010" cy="52" r="30" fill="#FFD66B"/><circle cx="1010" cy="52" r="46" fill="#FFD66B" opacity=".25"/>
<g fill="#fff" opacity=".92"><ellipse cx="180" cy="46" rx="48" ry="14"/><ellipse cx="214" cy="37" rx="30" ry="14"/><ellipse cx="760" cy="34" rx="42" ry="12"/><ellipse cx="792" cy="27" rx="24" ry="11"/><ellipse cx="520" cy="60" rx="30" ry="9"/></g>
<g fill="none" stroke="#5B7A93" stroke-width="2" stroke-linecap="round"><path d="M600 40 q6 -6 12 0 q6 -6 12 0"/><path d="M640 52 q5 -5 10 0 q5 -5 10 0"/></g>`;
  // 遠くの山
  s += `<path d="M0 ${base - 60} C 150 ${base - 120}, 260 ${base - 110}, 380 ${base - 70} S 620 ${base - 130}, 760 ${base - 80} S 1020 ${base - 120}, 1200 ${base - 70} L 1200 ${base} L 0 ${base} Z" fill="${C.mount}"/>`;
  // 遠いビル・中くらいのビル
  for (let x = 0; x < w; ) { const bw = 40 + Math.floor(r() * 50), bh = 60 + Math.floor(r() * 80); s += _bld(r, x, base, bw, bh, C.far, C.win, evening ? C.lit : null); x += bw + 6 + Math.floor(r() * 18); }
  // 時計台（どこかの駅前にありそうな塔）
  s += `<rect x="1110" y="${base - 150}" width="26" height="150" fill="${C.mid}"/><polygon points="1104,${base - 150} 1123,${base - 178} 1142,${base - 150}" fill="${C.roof}"/><circle cx="1123" cy="${base - 128}" r="8" fill="${C.wall}"/><path d="M1123 ${base - 128} v-5 M1123 ${base - 128} h4" stroke="${C.near}" stroke-width="1.5"/>`;
  for (let x = 20; x < w; ) { const bw = 36 + Math.floor(r() * 44), bh = 40 + Math.floor(r() * 60); s += _bld(r, x, base, bw, bh, C.mid, C.win, evening ? C.lit : null); x += bw + 30 + Math.floor(r() * 60); }
  // 家と木
  for (let x = 30; x < w; x += 170 + Math.floor(r() * 80)) {
    const hw = 34 + Math.floor(r() * 12);
    s += `<rect x="${x}" y="${base - 26}" width="${hw}" height="26" fill="${C.wall}"/><polygon points="${x - 4},${base - 26} ${x + hw / 2},${base - 44} ${x + hw + 4},${base - 26}" fill="${C.roof}"/><rect x="${x + hw / 2 - 5}" y="${base - 16}" width="10" height="16" fill="${C.near}" opacity=".6"/>`;
    s += `<circle cx="${x + hw + 18}" cy="${base - 14}" r="14" fill="${C.tree}"/><circle cx="${x + hw + 30}" cy="${base - 10}" r="10" fill="${C.tree}" opacity=".85"/>`;
  }
  // ホーム（屋根・柱・駅名標）
  s += `<rect x="90" y="${base - 12}" width="470" height="12" fill="${C.plat}"/>`;
  s += `<rect x="110" y="${base - 58}" width="430" height="8" rx="3" fill="${C.near}"/>`;
  for (let x = 130; x <= 520; x += 130) s += `<rect x="${x}" y="${base - 50}" width="5" height="38" fill="${C.pole}"/>`;
  s += `<g transform="translate(250 ${base - 44})"><rect width="64" height="24" rx="3" fill="#fff" stroke="${C.pole}"/><rect y="15" width="64" height="4" fill="#F26B3A"/><rect x="18" y="5" width="28" height="6" rx="2" fill="#1F2A44" opacity=".75"/><rect x="30" y="24" width="4" height="8" fill="${C.pole}"/></g>`;
  // 架線柱と架線
  for (let x = 40; x < w; x += 190) s += `<rect x="${x}" y="${base - 66}" width="4" height="66" fill="${C.pole}"/><rect x="${x - 10}" y="${base - 66}" width="24" height="3" fill="${C.pole}"/>`;
  s += `<path d="M0 ${base - 60} H${w}" stroke="${C.pole}" stroke-width="1.2"/>`;
  // 電車（2両）
  const tx = evening ? 640 : 600, ty = base - 36;
  const car = (x) => {
    let c = `<rect x="${x}" y="${ty}" width="200" height="32" rx="10" fill="#F26B3A"/><rect x="${x}" y="${ty + 22}" width="200" height="4" fill="#C9512A"/>`;
    for (let i = 0; i < 6; i++) c += `<rect x="${x + 12 + i * 31}" y="${ty + 7}" width="22" height="11" rx="3" fill="${evening ? '#FFE9A8' : '#fff'}"/>`;
    c += `<path d="M${x + 70} ${ty} l10 -12 h20 l10 12" fill="none" stroke="${C.pole}" stroke-width="2"/>`;
    for (const wx of [24, 46, 154, 176]) c += `<circle cx="${x + wx}" cy="${ty + 32}" r="4" fill="${C.rail}"/>`;
    return c;
  };
  s += car(tx) + car(tx + 206);
  // 線路（まくらぎ）
  s += `<rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${evening ? '#6E5F7E' : '#B6C7D3'}"/>`;
  for (let x = 0; x < w; x += 22) s += `<rect x="${x}" y="${base + 6}" width="12" height="6" fill="${evening ? '#58496A' : '#94A9B8'}"/>`;
  s += `<rect x="0" y="${base + 3}" width="${w}" height="3" fill="${C.rail}"/><rect x="0" y="${base + 13}" width="${w}" height="3" fill="${C.rail}"/>`;
  s += `</svg>`;
  return s;
}
const SKYLINE_SVG = makeScene();
const EVENING_SVG = makeScene({ evening: true, h: 200 });
// 区切りの線路
const TRACK_SVG = `<svg class="track" viewBox="0 0 1200 18" preserveAspectRatio="none" aria-hidden="true"><rect y="3" width="1200" height="2.5" fill="#9BB2C2"/><rect y="12.5" width="1200" height="2.5" fill="#9BB2C2"/>${Array.from({ length: 60 }, (_, i) => `<rect x="${i * 20 + 4}" y="1" width="8" height="16" rx="1" fill="#C9D8E2"/>`).join('')}</svg>`;


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
  const bonusHtml = bonusItems.length ? `<div class="block"><h2>近くの名所・施設</h2><div class="panel"><ul class="bonus">${bonusItems.map((b) => `<li>${esc(b.name)}<span>駅から${b.dist}m</span></li>`).join('')}</ul></div></div>` : '';

  const rAll = idx.all.m.get(st.id), rPref = idx.pref[st.pref] && idx.pref[st.pref].m.get(st.id);
  const lineRanks = lines.map((l) => idx.line[l] ? `<li><a href="${lineUrl(l)}">${esc(l)}</a><b>${idx.line[l].n}駅中 ${idx.line[l].m.get(st.id)}位</b></li>` : '').join('');
  const areaN0 = t.location ? (idx.areaCount[`${t.location}_${st.pref}`] || 0) : 0;
  const rRid = ridersNum(t.riders) ? idx.riders.m.get(st.id) : null;
  const rOld = year && idx.old[st.pref] ? idx.old[st.pref].m.get(st.id) : null;

  const same = STATIONS.filter((o) => o.name === st.name && o.id !== st.id);
  const sameHtml = same.length ? `<div class="block"><h2>全国の同じ名前の駅</h2><p class="chips">${same.map((o) => `<a href="${stationUrl(o)}">${esc(o.name)}（${esc(o.pref)}）</a>`).join('')}</p></div>` : '';

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
  const storeBtns = storeBadges(ua, 46);
  const topBtns = storeBadges(ua, 30);

  const title = `${st.name}駅（${st.pref}）はどんな街？ 街力${score}点・${rank}ランク｜街巡-まちめぐ-`;
  const desc = `${st.name}駅${yomi ? `（${yomi}）` : ''}の街力は${score}点・${rank}ランク。${first}${first ? '。' : ''}飲食${(d['飲食'] || {}).count || 0}店・全国${rAll}位。近くの駅との比較や名所も。`;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${st.lng - 0.012},${st.lat - 0.008},${st.lng + 0.012},${st.lat + 0.008}&layer=mapnik&marker=${st.lat},${st.lng}`;
  const ld = { '@context': 'https://schema.org', '@type': 'TrainStation', name: `${st.name}駅`, address: { '@type': 'PostalAddress', addressRegion: st.pref, addressLocality: t.location || '' }, geo: { '@type': 'GeoCoordinates', latitude: st.lat, longitude: st.lng } };

  // ★v27：駅名標の左右＝アプリと同じ「路線の並び順」の前後の駅。データが無い駅だけ従来の「近い2駅」
  const sn = signNeighbors(st);
  const sameLine = near.filter(([, , l]) => l);
  const lrLink = (o, right) => o ? `<a${right ? ' class="r"' : ''} href="${stationUrl(o)}">${right ? '' : '← '}${esc(o.name)}${right ? ' →' : ''}<small>${(distM(st.lat, st.lng, o.lat, o.lng) / 1000).toFixed(1)}km</small></a>` : '<span></span>';
  const lr = sn ? `<div class="lr">${lrLink(sn.prev, false)}${lrLink(sn.next, true)}</div>` : sameLine.length ? `<div class="lr">${sameLine[0] ? `<a href="${stationUrl(sameLine[0][0])}">← ${esc(sameLine[0][0].name)}<small>${(sameLine[0][1] / 1000).toFixed(1)}km</small></a>` : '<span></span>'}${sameLine[1] ? `<a class="r" href="${stationUrl(sameLine[1][0])}">${esc(sameLine[1][0].name)} →<small>${(sameLine[1][1] / 1000).toFixed(1)}km</small></a>` : '<span></span>'}</div>` : '';
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${stationUrl(st)}">
<link rel="icon" type="image/png" href="/logo192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${stationUrl(st)}">
${Resvg ? `<meta property="og:image" content="${ogUrl(st)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ogUrl(st)}">` : '<meta name="twitter:card" content="summary">'}
<meta property="og:site_name" content="街巡-まちめぐ-">
<script type="application/ld+json">${JSON.stringify(ld)}</script>${gaHead()}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: '街巡-まちめぐ-', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name: st.pref, item: prefUrl(st.pref) },
  ...(areaN0 >= 2 ? [{ '@type': 'ListItem', position: 3, name: t.location, item: areaUrl(st.pref, t.location) }] : []),
  { '@type': 'ListItem', position: areaN0 >= 2 ? 4 : 3, name: `${st.name}駅`, item: stationUrl(st) }] })}</script>
${FONT_LINKS}
<style>${SITE_CSS}
.panel{background:var(--paper);border-radius:18px;padding:16px 18px}
.score{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 10px}
.score .num{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:66px;line-height:1;color:${rc}}
.score .pt{font-weight:700}
.score .rank{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:22px;color:${rank === 'B' ? '#3A2C00' : '#fff'};background:${rc};border-radius:10px;padding:0 12px;align-self:center}
.score .of{color:var(--sub);font-size:13px;width:100%}
.leadq{font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:20px;line-height:1.6;margin:16px 0 0;padding:2px 0 2px 14px;border-left:5px solid var(--sun)}
h1.q{font-size:18px;font-weight:700;margin:0 0 10px;color:var(--sub)}
.bar{display:grid;grid-template-columns:70px 1fr 104px;align-items:center;gap:10px;margin:10px 0;font-size:15px}
.bt{background:#EAF1F5;border-radius:99px;height:12px;overflow:hidden}.bf{height:100%;border-radius:99px}
.bv{text-align:right;font-weight:700;line-height:1.3}.bv small{color:var(--sub);font-weight:400}.cnt{display:block;color:var(--sub);font-size:12px;font-weight:400}
.panel ul{list-style:none;margin:0;padding:0}.panel li{padding:10px 0;border-bottom:1px solid var(--line)}.panel li:last-child{border:0}
.feats li{padding-left:24px;position:relative}.feats li:before{content:"";position:absolute;left:2px;top:19px;width:12px;height:12px;border-radius:50%;background:var(--pin)}
.bonus li span,.rks li b{float:right;color:var(--sub);font-weight:400;margin-left:8px}.rks li b{color:var(--ink);font-weight:700}
.info{display:grid;grid-template-columns:1fr 1fr;gap:10px}.info div{background:var(--tile);border-radius:12px;padding:10px 12px;line-height:1.5}.info small{display:block;color:var(--sub);font-size:12px}
table{width:100%;border-collapse:collapse;font-size:15px}td{padding:10px 4px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border:0}td small{display:block;color:var(--sub);font-size:12px}
h2 .me{float:right;font-size:13px;font-weight:700;color:var(--ink);font-family:"Noto Sans JP",sans-serif;margin-top:4px}
.map{width:100%;height:260px;border:0;border-radius:14px;display:block}
${FLOAT_CSS}
</style></head><body>
<header class="skyhead"><div class="top"><a class="brand" href="${SITE}/"><img src="/logo192.png" alt=""><span><b>街巡-まちめぐ-</b><span>駅で5分、カードを集める散歩</span></span></a><span class="tb">${topBtns}</span></div>
<div style="max-width:760px;margin:0 auto;padding:10px 18px 0">
<div class="sign">${yomi ? `<div class="y">${esc(yomi)}</div>` : '<div class="y">&nbsp;</div>'}<div class="n">${esc(st.name)}</div><div class="p">${esc(st.pref)}${t.location ? `　${esc(t.location)}` : ''}</div><div class="band" style="background:${rc}"></div>${lr}</div>
</div>${SKYLINE_SVG}</header>
<main>
<p class="crumbs" style="margin-top:14px"><a href="/">街巡-まちめぐ-</a> › <a href="${prefUrl(st.pref)}">${esc(st.pref)}</a>${areaN0 >= 2 ? ` › <a href="${areaUrl(st.pref, t.location)}">${esc(t.location)}</a>` : ''} › ${esc(st.name)}駅</p>
<div class="block panel" style="margin-top:12px"><h1 class="q">${esc(st.name)}駅はどんな街？</h1>
<div class="score"><span class="num">${score}</span><span class="pt">点</span><span class="rank">${esc(rank)}</span><span class="of">街力（駅から500m以内のお店や施設から計算・1,000点満点）</span></div>
${first ? `<p class="leadq">${esc(first)}</p>` : ''}</div>
<div class="block"><h2>街力の内訳</h2><div class="panel">${bars}</div></div>
${rest.length ? `<div class="block"><h2>この街のこと</h2><div class="panel"><ul class="feats">${rest.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div></div>` : ''}
<div class="block"><h2>順位</h2><div class="panel"><ul class="rks">
<li>全国<b>${idx.all.n.toLocaleString()}駅中 ${rAll ? rAll.toLocaleString() : '-'}位</b></li>
<li><a href="${prefUrl(st.pref)}">${esc(st.pref)}</a><b>${idx.pref[st.pref] ? idx.pref[st.pref].n : '-'}駅中 ${rPref || '-'}位</b></li>
${areaN0 >= 2 ? `<li><a href="${areaUrl(st.pref, t.location)}">${esc(t.location)}</a><b>${areaN0}駅中 ${areaRankOf(st, t.location) || '-'}位</b></li>` : ''}
${lineRanks}
${rRid ? `<li>利用者数<b>全国 ${rRid.toLocaleString()}位</b></li>` : ''}
${rOld ? `<li>${esc(st.pref)}で古い駅<b>${rOld}番目</b></li>` : ''}
</ul></div></div>
<div class="block"><h2>基本情報</h2><div class="info">
<div><small>開業</small>${esc(t.opened || '-')}${age >= 100 ? '（開業100年以上）' : age ? `（${age}年）` : ''}</div>
<div><small>1日の利用者</small>${esc(t.riders || '-')}</div>
<div><small>路線</small>${lines.map(esc).join('、') || '-'}</div>
<div><small>所在地</small>${esc(st.pref)}${esc(t.location || '')}</div>
</div></div>
${bonusHtml}
<div class="block"><h2>近くの駅と比べる<span class="me">${esc(st.name)} ${score}点 <span class="rk" style="background:${rc}">${esc(rank)}</span></span></h2><div class="panel"><table>${nearHtml}</table></div></div>
${sameHtml}
<div class="block"><h2>この駅で進むバッジ</h2><div class="panel"><ul class="rks">${badges}</ul></div></div>
<div class="block"><h2>地図</h2><iframe class="map" loading="lazy" src="${osm}" title="${esc(st.name)}駅の地図"></iframe></div>
<div class="block invite" id="app"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2>
<p class="pitch">全国8,993駅のチェックイン型・街歩きアプリ（無料）</p>
<ul><li>${esc(st.name)}駅から500m以内で5分立ち止まると、この駅のカードが1枚</li><li>季節と時間帯でカードの色が変わる。同じ駅でも別の1枚に</li><li>路線や街を制覇して、バッジを集める</li></ul>
${storeBtns}${EVENING_SVG}</div>
<footer>${SNS_HTML}街力は OpenStreetMap／Overture Maps のデータから計算しています（${esc(scoresCache.version || '')}）。駅名標のとなりの駅は HeartRails Express のデータを加工して作成。<br><a href="/">トップ</a><a href="/ranking">ランキング</a><a href="/feature/${seasonKey()}">季節の特集</a><a href="/privacy.html">プライバシーポリシー</a><a href="/terms.html">利用規約</a><br>© 街巡-まちめぐ-</footer>
</main>${floatUi((isIOS || isAnd) ? `<div class="appbar" id="appbar" role="complementary" aria-label="アプリの案内"><div class="t"><b>${esc(st.name)}駅のカードを、アプリで</b><span>5分立ち止まると1枚・無料</span></div>${storeBadges(ua, 40)}<button type="button" class="x" aria-label="閉じる">×</button></div>` : '')}</body></html>`;
}


// ═══════════════════════════════════════════════════════════════
// ★v19：駅ページのシェア画像（OGP） /og/station/県/駅名.png（1200×630）
//   ・XやLINEに駅ページのURLを貼ったとき、この画像が大きく出る
//   ・描画は @resvg/resvg-js、字は M PLUS Rounded 1c ExtraBold（リポジトリ直下に置く）
//   ・★ライブラリかフォントが無ければ画像を出さないだけ（ページは今までどおり）
// ═══════════════════════════════════════════════════════════════
const OG_FONT = path.join(__dirname, 'MPLUSRounded1c-ExtraBold.ttf');
let Resvg = null;
try {
  if (fs.existsSync(OG_FONT)) { Resvg = require('@resvg/resvg-js').Resvg; console.log('[v19] シェア画像：有効'); }
  else console.warn('[v19] フォントが無いのでシェア画像は出さない');
} catch (e) { console.warn('[v19] @resvg/resvg-js が無いのでシェア画像は出さない:', e.message); }
const AX = [['飲食','#F0506E',350],['商業','#8B6CF0',350],['生活','#3B9BF0',150],['医療','#F08A30',100],['ボーナス','#D4A020',50]];
function ogSvg({ name, pref, yomi, score, rank, lead, details }) {
  const rc = RANK_COLOR[rank] || '#888';
  const nameSize = Math.max(34, Math.min(128, Math.floor(640 / (name.length + 0.5))));
  const bars = AX.map(([ax, col, max], i) => {
    const v = (details[ax] || {}).pts || 0; const w = Math.max(4, Math.round(v / max * 300));
    const y = 250 + i * 50;
    return `<text x="780" y="${y + 18}" font-size="24" fill="#9AB4D0">${ax}</text>
<rect x="890" y="${y}" width="250" height="20" rx="10" fill="#1B2C46"/><rect x="890" y="${y}" width="${Math.min(250, w * 250 / 300)}" height="20" rx="10" fill="${col}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B2C46"/><stop offset="1" stop-color="#0E1626"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<rect x="24" y="24" width="1152" height="582" rx="36" fill="none" stroke="${rc}" stroke-width="8"/>
<text x="80" y="110" font-size="30" fill="#9AB4D0" letter-spacing="4">${esc(yomi)}</text>
<text x="76" y="${110 + nameSize + 4}" font-size="${nameSize}" fill="#FFFFFF">${esc(name)}<tspan font-size="${Math.round(nameSize * 0.45)}" fill="#9AB4D0">駅</tspan></text>
<text x="80" y="${Math.max(150 + nameSize + 20, 250)}" font-size="28" fill="#9AB4D0">${esc(pref)}</text>
<text x="76" y="${380 + 60}" font-size="150" fill="${rc}">${score}</text>
<text x="${84 + String(score).length * 96}" y="440" font-size="34" fill="#FFFFFF">点</text>
<rect x="${134 + String(score).length * 96}" y="372" width="76" height="76" rx="16" fill="${rc}"/>
<text x="${172 + String(score).length * 96}" y="432" font-size="54" fill="#FFFFFF" text-anchor="middle">${esc(rank)}</text>
<text x="80" y="520" font-size="34" fill="#FFFFFF">${esc(lead)}</text>
<text x="780" y="220" font-size="26" fill="#FFFFFF">街力の内訳</text>
${bars}
<text x="80" y="580" font-size="30" fill="#FF9D4D">街巡-まちめぐ-</text>
<text x="310" y="580" font-size="24" fill="#9AB4D0">駅で5分、カードを集める散歩。全国8,993駅</text>
</svg>`;
}

function ogUrl(st) { return `${SITE}/og/station/${encodeURIComponent(st.pref)}/${encodeURIComponent(st.name)}.png`; }
const _ogCache = new Map();
app.get('/og/station/:pref/:file', generalLimiter, (req, res) => {
  try {
    if (!Resvg) return res.status(404).end();
    const name = String(req.params.file || '').replace(/\.png$/, '');
    const st = STATIONS_BY_ID.get(`${name}_${req.params.pref}`);
    if (!st) return res.status(404).end();
    const key = `${st.id}|${scoresCache.builtAt}|${stationText.version}`;
    let png = _ogCache.get(key);
    if (!png) {
      const sc = scoreOf(st.id) || { score: 0, rank: 'D', details: {} };
      const t = textOf(st.id) || {};
      const svg = ogSvg({ name: st.name, pref: `${st.pref}${t.location ? '・' + t.location : ''}`, yomi: STATION_YOMI[st.id] || '',
        score: sc.score, rank: sc.rank, lead: (Array.isArray(t.features) && t.features[0]) || '', details: sc.details || {} });
      png = new Resvg(svg, { font: { fontFiles: [OG_FONT], loadSystemFonts: false, defaultFontFamily: 'M PLUS Rounded 1c' }, fitTo: { mode: 'width', value: 1200 } }).render().asPng();
      if (_ogCache.size > 300) _ogCache.clear();
      _ogCache.set(key, png);
    }
    res.set('Content-Type', 'image/png'); res.set('Cache-Control', 'public, max-age=604800');
    res.send(png);
  } catch (e) { console.error('[v19] シェア画像失敗:', e.message); res.status(500).end(); }
});

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
      const urls = `<url><loc>${SITE}/</loc></url><url><loc>${SITE}/ranking</loc></url>` + Object.keys(FEATURES).map((k) => `<url><loc>${featureUrl(k)}</loc></url>`).join('') + Object.keys(RANKINGS).map((k) => `<url><loc>${rankingUrl(k)}</loc></url>`).join('') + PREFS.map((p) => `<url><loc>${prefUrl(p)}</loc></url>`).join('')
        + [...new Set(STATIONS.flatMap((st) => st.lines || []))].map((l) => `<url><loc>${lineUrl(l)}</loc></url>`).join('')
        + [...new Set(STATIONS.map((st) => { const c = (textOf(st.id) || {}).location; return c ? `${st.pref}	${c}` : ''; }).filter(Boolean))].map((k) => { const [p, c] = k.split('	'); return `<url><loc>${areaUrl(p, c)}</loc></url>`; }).join('')
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

function pageShell(title, desc, body, canonical, hero, ua, extraHead, opts) {
  // ★v27：opts.noFooterSns … 本文に X・インスタのボタンがあるページ（トップ）はフッターに出さない
  const o = opts || {};
  const top = `<div class="top"><a class="brand" href="${SITE}/"><img src="/logo192.png" alt=""><span><b>街巡-まちめぐ-</b><span>駅で5分、カードを集める散歩</span></span></a><span class="tb">${ua != null ? storeBadges(ua, 30) : ''}</span></div>`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<link rel="icon" type="image/png" href="/logo192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${SITE}/logo512.png"><meta property="og:type" content="website"><meta property="og:site_name" content="街巡-まちめぐ-">
${extraHead || ''}${gaHead()}
${FONT_LINKS}
<style>${SITE_CSS}
main>section{margin:30px 0}
.today h2 small{font-size:14px;color:var(--sub);font-weight:500;margin-left:10px}
.todaycard{display:grid;grid-template-columns:1fr;gap:0;text-decoration:none;color:var(--ink);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(31,42,68,.10)}
@media(min-width:640px){.todaycard{grid-template-columns:1fr 1fr}}
.todaycard .sign{box-shadow:none;border-radius:0}
.todaycard .tbody{padding:14px 18px 18px}
.todaycard .meta{display:flex;align-items:baseline;gap:6px}.todaycard .meta b{font-family:"Zen Maru Gothic",sans-serif;font-size:40px;font-weight:900;line-height:1}
.todaycard ul{list-style:none;padding:0;margin:8px 0 10px}.todaycard li{padding:4px 0 4px 20px;position:relative;font-size:15px;line-height:1.6}.todaycard li:before{content:"";position:absolute;left:2px;top:13px;width:10px;height:10px;border-radius:50%;background:var(--pin)}
.todaycard .go{display:inline-block;background:var(--pin);color:#fff;font-weight:700;border-radius:999px;padding:8px 18px;font-size:14px;font-family:"Zen Maru Gothic",sans-serif}
.faq details{background:#fff;border-radius:14px;margin:0 0 10px;padding:0 16px}
.more{display:inline-block;color:var(--pin);font-weight:700;font-family:"Zen Maru Gothic",sans-serif;text-decoration:none}
.news .ver{display:flex;align-items:baseline;gap:10px;margin:0 0 6px}.news .ver b{font-family:"Zen Maru Gothic",sans-serif;font-size:18px}.news .ver span{color:var(--sub);font-size:13px}
.news ul{list-style:none;margin:0;padding:0}.news li{padding:6px 0 6px 20px;position:relative;font-size:15px;line-height:1.7}.news li:before{content:"";position:absolute;left:2px;top:15px;width:10px;height:10px;border-radius:50%;background:var(--leaf)}
.nearbtn{width:100%;font-size:17px;font-weight:700;font-family:"Zen Maru Gothic",sans-serif;padding:14px 16px;border:2px solid var(--blue);border-radius:14px;background:#fff;color:var(--blue);cursor:pointer}
.nearbtn:disabled{opacity:.6}
.shots{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 14px;-webkit-overflow-scrolling:touch}
.shots img{flex:none;width:clamp(170px,46vw,230px);height:auto;border-radius:22px;scroll-snap-align:start;box-shadow:0 10px 26px rgba(31,42,68,.16);background:#fff}
.faq summary{cursor:pointer;list-style:none;padding:14px 26px 14px 0;font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:16px;position:relative}
.faq summary::-webkit-details-marker{display:none}
.faq summary:after{content:"+";position:absolute;right:0;top:10px;font-size:22px;color:var(--blue)}
.faq details[open] summary:after{content:"−"}
.faq p{margin:0;padding:0 0 14px;color:#3E4B60;font-size:15px}
.card{background:var(--paper);border-radius:18px;padding:16px 18px}
.hero-copy{text-align:center;max-width:620px;margin:0 auto;padding:22px 18px 6px}
.hero-copy h1{font-size:clamp(26px,6.4vw,38px);font-weight:900;line-height:1.35;margin:0 0 10px;letter-spacing:.02em}
.hero-copy p{margin:0 0 14px;color:#3E4B60}
.samples{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:640px){.samples{grid-template-columns:1fr 1fr 1fr}}
.samples a{text-decoration:none;color:var(--ink)}
.samples .sign .n{font-size:40px}.samples .sign .y{padding-top:12px;font-size:12px}
.samples .meta{display:flex;align-items:baseline;justify-content:center;gap:6px;padding:8px 10px 0}
.samples .meta b{font-family:"Zen Maru Gothic",sans-serif;font-size:30px;font-weight:900;line-height:1}
.samples .c{font-size:14px;padding:6px 14px 14px;line-height:1.6;color:#3E4B60}
.does{list-style:none;padding:0;margin:0}
.does li{display:grid;grid-template-columns:52px 1fr;gap:14px;align-items:start;padding:14px 0;border-bottom:1px dashed var(--line)}.does li:last-child{border:0}
.does .ic{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:24px}
.does b{display:block;font-family:"Zen Maru Gothic",sans-serif;font-size:18px;line-height:1.4;margin-bottom:2px}
.does span{color:#3E4B60;font-size:15px}
.steps{counter-reset:s;list-style:none;padding:0;margin:0}
.steps li{counter-increment:s;position:relative;padding:10px 0 10px 50px;font-size:16px}
.steps li:before{content:counter(s);position:absolute;left:0;top:8px;width:36px;height:36px;border-radius:50%;background:var(--blue);color:#fff;font-family:"Zen Maru Gothic",sans-serif;font-weight:900;display:grid;place-items:center}
.rankrow{display:flex;justify-content:space-between;gap:8px}
.regions details{background:#fff;border-radius:14px;padding:0 12px}
.regions summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;padding:12px 26px 12px 2px;font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:16px;position:relative}
.regions summary::-webkit-details-marker{display:none}
.regions summary small{color:var(--sub);font-weight:400;font-size:13px}
.regions summary:after{content:"+";position:absolute;right:4px;top:8px;font-size:22px;color:var(--blue)}
.regions details[open] summary:after{content:"−"}
.regions details .chips{margin:0 0 12px}
${FLOAT_CSS}
</style></head><body>
<header class="skyhead">${top}${hero || ''}${hero ? SKYLINE_SVG : ''}</header>
<main>${body}
<footer>${o.noFooterSns ? '' : SNS_HTML}<a href="/">トップ</a><a href="/ranking">ランキング</a><a href="/feature/${seasonKey()}">季節の特集</a><a href="/privacy.html">プライバシーポリシー</a><a href="/terms.html">利用規約</a><br>© 街巡-まちめぐ-</footer>
</main>${floatUi('')}</body></html>`;
}

// ★v27：全ページ共通の丸いボタン（↑ ページの先頭へ／← 戻る）と、駅ページのアプリの帯
//   ・「↑」は少しスクロールしてから出る。
//   ・「← 戻る」はサイト内のページから来たときだけ出す（検索や外から来た人を外へ戻さない）。
//   ・下の帯（駅ページ・スマホだけ）は ×で閉じると、そのタブを閉じるまで出ない。
//     ページ下のアプリ紹介（#app）が画面に見えている間は引っ込む（同じ案内を二重に出さない）。
//   ・帯が出ている間は、丸いボタンを帯の上に持ち上げる。
const FLOAT_CSS = `
.sns a .h{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25}
.sns a .h small{font-size:11px;font-weight:500;opacity:.92;letter-spacing:.02em}
.h2row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px}
.h2row h2{margin:0}
.h2row .more{flex:none;background:var(--pin);color:#fff;font-weight:700;font-size:14px;line-height:1;padding:10px 14px;border-radius:999px;text-decoration:none;box-shadow:0 4px 12px rgba(242,107,58,.3);white-space:nowrap}
.chips.strong a{font-weight:700}
.fab{position:fixed;z-index:40;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:48px;height:48px;border-radius:50%;border:0;background:#fff;color:var(--ink);box-shadow:0 6px 18px rgba(31,42,68,.22);display:grid;place-items:center;cursor:pointer;opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .2s,transform .2s,bottom .2s}
.fab.on{opacity:1;pointer-events:auto;transform:none}
.fab svg{width:22px;height:22px}
#fabTop{right:16px}
#fabBack{left:16px;width:auto;padding:0 16px 0 12px;border-radius:999px;gap:4px;grid-auto-flow:column;font:700 15px/1 "Zen Maru Gothic",sans-serif}
body.has-appbar .fab{bottom:calc(92px + env(safe-area-inset-bottom,0px))}
.appbar{position:fixed;z-index:39;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;background:#fff;box-shadow:0 -6px 20px rgba(31,42,68,.14);padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px)) 14px;transform:translateY(110%);transition:transform .25s}
body.has-appbar .appbar{transform:none}
.appbar .t{flex:1;min-width:0;line-height:1.35}
.appbar .t b{display:block;font-family:"Zen Maru Gothic",sans-serif;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.appbar .t span{font-size:12px;color:var(--sub)}
.appbar .badge{flex:none;margin:0}
.appbar .x{flex:none;border:0;background:none;color:var(--sub);font-size:22px;line-height:1;padding:6px;cursor:pointer}
body.appbar-room{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}
@media (prefers-reduced-motion:reduce){.fab,.appbar{transition:none}}
`;
function floatUi(appBarHtml) {
  return `${appBarHtml || ''}<button type="button" class="fab" id="fabBack" aria-label="前のページに戻る"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>戻る</button><button type="button" class="fab" id="fabTop" aria-label="ページの先頭へ"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg></button>
<script>(function(){
var t=document.getElementById('fabTop'),b=document.getElementById('fabBack'),bar=document.getElementById('appbar'),body=document.body;
var sameSite=false;try{sameSite=!!document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1}catch(e){}
if(sameSite)b.classList.add('on');
b.addEventListener('click',function(){history.back()});
t.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
function onScroll(){t.classList.toggle('on',window.scrollY>600)}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
if(bar){
 var closed=false;try{closed=sessionStorage.getItem('mm_appbar_closed')==='1'}catch(e){}
 if(!closed){
  body.classList.add('appbar-room');
  var show=function(v){body.classList.toggle('has-appbar',v)};show(true);
  bar.querySelector('.x').addEventListener('click',function(){show(false);body.classList.remove('appbar-room');try{sessionStorage.setItem('mm_appbar_closed','1')}catch(e){}bar.remove()});
  var inv=document.getElementById('app');
  if(inv&&'IntersectionObserver' in window){new IntersectionObserver(function(es){if(document.body.contains(bar))show(!es[0].isIntersecting)}).observe(inv)}
 }
}
})();</script>`;
}

function storeBadges(ua, h) {
  const APPLE_BADGE = 'https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/ja-jp';
  const GOOGLE_BADGE = 'https://play.google.com/intl/ja/badges/static/images/badges/ja_badge_web_generic.png';
  // ★v21：Google の画像は上下に透明の余白（250pxのうち上29・下29）がある。見えている高さを Apple とそろえる
  const gh = Math.round(h * 250 / 192), gm = Math.round(h * 29 / 192);
  const a = `<a class="badge" href="${APP_STORE_URL}"><img src="${APPLE_BADGE}" alt="App Storeからダウンロード" style="height:${h}px"></a>`;
  const g = `<a class="badge" href="${PLAY_URL}"><img src="${GOOGLE_BADGE}" alt="Google Play で手に入れよう" style="height:${gh}px;margin:${-gm}px 0"></a>`;
  return /iPhone|iPad|iPod/i.test(ua) ? a : /Android/i.test(ua) ? g : a + g;
}



// ★v23：SNS（アプリの設定にあるものと同じ）
const SNS_X = 'https://x.com/machimegux';
const SNS_IG = 'https://www.instagram.com/machimegu2026/';
const SNS_HTML = `<p class="sns"><a class="x" href="${SNS_X}" rel="me noopener" target="_blank" aria-label="X（旧Twitter）@machimegux"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z"/></svg><span class="h">@machimegux<small>最新情報をGET！</small></span></a><a class="ig" href="${SNS_IG}" rel="me noopener" target="_blank" aria-label="Instagram @machimegu2026"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.9 8c-.1-1.6-.4-3-1.6-4.2S17.6 2.2 16 2.1C14.3 2 9.7 2 8 2.1 6.4 2.2 5 2.5 3.8 3.7S2.2 6.4 2.1 8C2 9.7 2 14.3 2.1 16c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.7.1 6.3.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.7.1-6.3 0-8Zm-2.1 9.8a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.3 3.3 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7a3.3 3.3 0 0 1 1.8-1.8C7.9 4.1 11 4.2 12 4.2s4.4-.1 5.7.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7Z"/></svg><span class="h">@machimegu2026<small>街の風景をシェア中</small></span></a></p>`;
// ★v23：サイトのアクセス解析（Railway の GA4_MEASUREMENT_ID を入れたときだけ動く）
//   ストアのボタンを押したら store_click（ios / android）を送る
function gaHead() {
  const id = (process.env.GA4_MEASUREMENT_ID || '').trim();
  if (!/^G-[A-Z0-9]+$/.test(id)) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.href||'';
if(h.indexOf('apps.apple.com')>=0)gtag('event','store_click',{store:'ios'});else if(h.indexOf('play.google.com')>=0)gtag('event','store_click',{store:'android'});
else if(h.indexOf('x.com/machimegux')>=0||h.indexOf('instagram.com/machimegu2026')>=0)gtag('event','sns_click',{sns:h.indexOf('x.com')>=0?'x':'instagram'});});</script>`;
}


// ★v25：最新版のお知らせ（App Store の版とリリースノートから自動）
function newsBlock() {
  if (!storeInfo.version || !storeInfo.notes) return '';
  const d = storeInfo.releasedAt ? new Date(new Date(storeInfo.releasedAt).getTime() + 9 * 3600 * 1000) : null;
  const when = d && !isNaN(d) ? `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日` : '';
  const lines = storeInfo.notes.split(/\r?\n/).map((l) => l.trim().replace(/^[・\-\*●■◆]\s*/, '')).filter(Boolean).slice(0, 6);
  return `<section><h2>最新版のお知らせ</h2><div class="card news"><p class="ver"><b>バージョン ${esc(storeInfo.version)}</b>${when ? `<span>${when}</span>` : ''}</p><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div></section>`;
}

// ★v22：よくある質問（トップに表示＋構造化データ）
const FAQ = [
  ['無料で使えますか？', 'はい。チェックインやカード集め、街力の確認など、基本の機能はすべて無料です。広告の非表示などができるPro版（買い切り）もあります。'],
  ['どうやってカードがもらえますか？', '駅から500m以内で5分過ごすとチェックインが完了し、その駅のカードが1枚もらえます。画面を消してポケットに入れたままで大丈夫です。'],
  ['1日に何駅まで記録できますか？', '1日3駅までです。急いで回るのではなく、ひとつの街をゆっくり歩いてほしいからです。'],
  ['位置情報はどう使われますか？', 'チェックインの5分間だけ使い、終わると自動で止まります。位置情報を第三者に販売・提供することはありません。'],
  ['電池の減りは大丈夫ですか？', '位置情報を使うのはチェックイン中の5分間だけにして、電池の減りを小さく抑えています。'],
  ['街力とは何ですか？', '駅から500m以内にある飲食・お店・生活・医療の施設の数をもとに、全国8,993駅を1,000点満点で採点したものです。S・A・B・C・Dの5つのランクがあります。'],
];
// ★v22：今日の一駅（JSTの日付で毎日かわる。Sか Aで、ふりがなとコメントがある駅から）
let _pickPool = { builtAt: -1, list: [] };
function todayPick() {
  if (_pickPool.builtAt !== scoresCache.builtAt) {
    _pickPool = { builtAt: scoresCache.builtAt, list: STATIONS.filter((st) => { const s = scoreOf(st.id); const t = textOf(st.id) || {}; return s && (s.rank === 'S' || s.rank === 'A') && STATION_YOMI[st.id] && (t.features || []).length >= 2; }) };
  }
  const L = _pickPool.list; if (!L.length) return '';
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const st = L[h % L.length], s = scoreOf(st.id), t = textOf(st.id) || {}, c = RANK_COLOR[s.rank] || '#888';
  return `<section class="today"><h2>今日の一駅<small>${d.getUTCMonth() + 1}月${d.getUTCDate()}日</small></h2><a class="todaycard" href="${stationUrl(st)}">
<div class="sign"><div class="y">${esc(STATION_YOMI[st.id])}</div><div class="n">${esc(st.name)}</div><div class="p">${esc(st.pref)}${t.location ? '　' + esc(t.location) : ''}</div><div class="band" style="background:${c}"></div></div>
<div class="tbody"><div class="meta"><b style="color:${c}">${s.score}</b><span>点</span><span class="rk" style="background:${c}">${esc(s.rank)}</span></div><ul>${(t.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul><span class="go">この駅のページを見る</span></div></a></section>`;
}
function siteJsonLd() {
  const app = { '@context': 'https://schema.org', '@type': 'MobileApplication', name: '街巡-まちめぐ-', operatingSystem: 'iOS, Android', applicationCategory: 'TravelApplication',
    description: '全国8,993駅の駅から500m以内で5分立ち止まると、その街のカードが1枚もらえる街歩きアプリ。', url: `${SITE}/`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' }, installUrl: APP_STORE_URL };
  if (storeInfo.ratingCount >= 5) app.aggregateRating = { '@type': 'AggregateRating', ratingValue: storeInfo.rating.toFixed(1), ratingCount: storeInfo.ratingCount };
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: '街巡-まちめぐ-', url: `${SITE}/`, logo: `${SITE}/logo512.png`, sameAs: [SNS_X, SNS_IG, APP_STORE_URL, PLAY_URL] };
  return `<script type="application/ld+json">${JSON.stringify(app)}</script><script type="application/ld+json">${JSON.stringify(faq)}</script><script type="application/ld+json">${JSON.stringify(org)}</script>`;
}

let _topCache = { key: '', html: '' };
app.get('/', (req, res) => {
  try {
    const ua = req.get('user-agent') || '';
    const dev = /iPhone|iPad|iPod/i.test(ua) ? 'i' : /Android/i.test(ua) ? 'a' : 'p';
    const jd = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const key = `${dev}|${scoresCache.builtAt}|${jd}|${storeInfo.ratingCount}|${storeInfo.shots.length}|${storeInfo.version}|${seasonKey()}`;
    if (_topCache.key !== key) {
      const top = STATIONS.map((st) => [st, scoreOf(st.id)]).filter(([, s]) => s)
        .sort((a, b) => b[1].score - a[1].score).slice(0, 12);
      const topHtml = top.map(([st, s], i) => `<li><span class="no${i < 3 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}・${s.score}点</small></li>`).join('');
      const picks = ['札幌_北海道', '仙台_宮城県', '横浜_神奈川県', '金沢_石川県', '名古屋_愛知県', '京都_京都府', '梅田_大阪府', '三ノ宮_兵庫県', '広島_広島県', '博多_福岡県']
        .map((id) => STATIONS_BY_ID.get(id)).filter(Boolean)
        .map((st) => `<a href="${stationUrl(st)}">${esc(st.name)}</a>`).join('');
      const sample = (id) => {
        const st = STATIONS_BY_ID.get(id); if (!st) return '';
        const sc = scoreOf(st.id) || { score: 0, rank: 'D' }; const t = textOf(st.id) || {};
        const c = RANK_COLOR[sc.rank] || '#888';
        return `<a href="${stationUrl(st)}"><div class="sign"><div class="y">${esc(STATION_YOMI[st.id] || '')}</div><div class="n">${esc(st.name)}</div><div class="p">${esc(st.pref)}${t.location ? '　' + esc(t.location) : ''}</div><div class="band" style="background:${c}"></div>
<div class="meta"><b style="color:${c}">${sc.score}</b><span>点</span><span class="rk" style="background:${c}">${esc(sc.rank)}</span></div><div class="c">${esc((t.features || [])[0] || '')}</div></div></a>`;
      };
      const hero = `<div style="max-width:560px;margin:0 auto;padding:10px 18px 0"><div class="sign"><div class="y">まちめぐ</div><div class="n">街巡</div><div class="p">全国8,993駅</div><div class="band" style="background:var(--pin)"></div><div class="lr"><span>← いつもの駅</span><span class="r">知らない街 →</span></div></div></div>
<div class="hero-copy"><h1>駅で5分、<br>カードを集める散歩。</h1><p>駅から500m以内で5分立ち止まると、その街のカードが1枚。季節と時間で色が変わるカードを集めながら、まだ降りたことのない駅へ。</p>${storeBadges(ua, 46)}</div>`;
      const body = `
${storeInfo.shots.length ? `<section><h2>アプリの画面</h2><div class="shots" tabindex="0" aria-label="アプリの画面（横にスクロール）">${storeInfo.shots.map((u, i) => `<img src="${esc(u)}" alt="街巡-まちめぐ- のアプリ画面 ${i + 1}" loading="lazy" width="230" height="498">`).join('')}</div></section>` : ''}
${todayPick()}
${seasonBlock()}
<section><h2>こんな街が、1枚のカードに</h2><p class="note">全国8,993駅すべてに、街力の点数と、その街ならではのひとことがあります。</p>
<div class="samples">${sample('東陽町_東京都')}${sample('鎌倉_神奈川県')}${sample('吉祥寺_東京都')}</div></section>
${TRACK_SVG}
<section><h2>できること</h2><div class="tickets">
<div class="ticket"><div class="stub">🎴</div><div class="body"><b>街のカードを集める</b><span>駅の近くに5分いるだけ。季節・時間帯・天気でカードの色が変わり、同じ駅でも別の1枚になります。カードの裏には、その日に撮った写真も貼れます。</span><small>全国8,993駅 有効</small></div></div>
<div class="ticket"><div class="stub">📊</div><div class="body"><b>街の力を数字で見る</b><span>駅から500m以内の飲食・お店・暮らし・医療の施設を数えて、全駅を1,000点満点で採点。知らない駅も、降りる前に少しだけわかります。</span><small>S・A・B・C・D の5ランク</small></div></div>
<div class="ticket"><div class="stub">🏅</div><div class="body"><b>路線や街を制覇する</b><span>路線・市区町村・都道府県ごとに制覇バッジ。いつもの沿線から、少しずつ地図が埋まっていきます。</span><small>銅・銀・金の3段階</small></div></div>
</div></section>
<section><h2>使い方</h2><div class="card"><ol class="route">
<li><span class="st">1</span><b>アプリを開く</b><span>地図に、近くの駅が並びます</span></li>
<li><span class="st">2</span><b>行きたい駅をタップ</b><span>チェックインが始まります</span></li>
<li><span class="st">3</span><b>駅のまわりを5分歩く</b><span>画面は消していて大丈夫。ポケットのままで</span></li>
<li class="goal"><span class="st">★</span><b>その街のカードが手に入る</b><span>記録できるのは1日3駅まで。ひとつの街を、ゆっくり</span></li>
</ol></div></section>
${TRACK_SVG}
<section><h2>駅を調べる</h2>
${NEAR_BUTTON}
<form class="find" action="/search" method="get" style="margin-top:14px"><input type="search" name="q" placeholder="駅名（例：東陽町）" aria-label="駅名"><button type="submit">調べる</button></form>
<p class="chips" style="margin-top:12px">${picks}</p></section>
<section><div class="h2row"><h2>街力の高い駅</h2><a class="more" href="/ranking">ランキングをすべて見る →</a></div><ul class="list">${topHtml}</ul>
<p class="chips strong" style="margin-top:12px"><a href="/ranking/food">飲食店が多い駅</a><a href="/ranking/life">生活施設が多い駅</a><a href="/ranking/sights">名所が近い駅</a><a href="/ranking/oldest">開業が古い駅</a></p></section>
<section><h2>都道府県から探す</h2><div class="regions">${[['北海道・東北', 0, 7], ['関東', 7, 14], ['中部', 14, 23], ['近畿', 23, 30], ['中国', 30, 35], ['四国', 35, 39], ['九州・沖縄', 39, 47]].map(([name, a, b]) => `<details><summary>${name}<small>${b - a}都道府県</small></summary><p class="chips">${PREFS.slice(a, b).map((p) => `<a href="${prefUrl(p)}">${p}</a>`).join('')}</p></details>`).join('')}</div></section>
${newsBlock()}
<section><h2>よくある質問</h2><div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>さあ、街にでよう。</h2><p class="pitch">街巡-まちめぐ-（無料）</p>${storeBadges(ua, 46)}<p class="note" style="margin:12px 0 0">街で見つけた1枚は X とインスタでも</p>${SNS_HTML}${EVENING_SVG}</section>`;
      _topCache = { key, html: pageShell('街巡-まちめぐ- 駅で5分、カードを集める散歩｜全国8,993駅のスタンプラリー',
        '全国8,993駅の駅から500m以内で5分立ち止まると、その街のカードが1枚。街力（1,000点満点）で駅を比べて、路線や街を制覇する街歩きアプリ。無料。', body, `${SITE}/`, hero, ua, siteJsonLd(), { noFooterSns: true }) };
    }
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=600');
    res.send(_topCache.html);
  } catch (e) {
    console.error('[v16] トップ失敗:', e.message);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});


// ═══════════════════════════════════════════════════════════════
// ★v17：路線ページ /line/路線名 ・ 市区町村ページ /area/県/市区町村
//   駅ページ同士をつなぐハブ。「東西線 駅 一覧」「江東区 駅 ランキング」の検索の受け皿。
// ═══════════════════════════════════════════════════════════════
function listPage(req, res, { title, h1, lead, stations, canonical, crumbs, badge }) {
  const rows = stations.map((st) => [st, scoreOf(st.id) || { score: 0, rank: 'D', details: {} }])
    .sort((a, b) => b[1].score - a[1].score);
  const n = rows.length;
  const avg = n ? Math.round(rows.reduce((a, [, s]) => a + s.score, 0) / n) : 0;
  const cnt = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  rows.forEach(([, s]) => { cnt[s.rank] = (cnt[s.rank] || 0) + 1; });
  const food = rows.slice().sort((a, b) => (((b[1].details || {})['飲食'] || {}).count || 0) - (((a[1].details || {})['飲食'] || {}).count || 0))[0];
  const list = rows.map(([st, s], i) => {
    const t = textOf(st.id) || {};
    const f = Array.isArray(t.features) && t.features[0] ? `<br><small style="margin:0">${esc(t.features[0])}</small>` : '';
    return `<li><span class="no${i < 3 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}・${s.score}点</small>${f}</li>`;
  }).join('');
  const ua = req.get('user-agent') || '';
  const body = `<p class="crumbs">${crumbs}</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px;line-height:1.35">${esc(h1)}</h1><p class="note">${lead}</p>
<ul class="list"><li>駅の数<b style="float:right">${n}駅</b></li>
<li>街力の平均<b style="float:right">${avg}点</b></li>
<li>ランク別<b style="float:right">S ${cnt.S}／A ${cnt.A}／B ${cnt.B}／C ${cnt.C}／D ${cnt.D}</b></li>
${rows[0] ? `<li>いちばん街力が高い駅<b style="float:right">${esc(rows[0][0].name)}（${rows[0][1].score}点）</b></li>` : ''}
${food ? `<li>飲食店がいちばん多い駅<b style="float:right">${esc(food[0].name)}（${((food[1].details || {})['飲食'] || {}).count || 0}店）</b></li>` : ''}
</ul></section>
<section><h2>街力ランキング（全${n}駅）</h2><ul class="list">${list}</ul></section>
${badge ? `<section><h2>制覇バッジ</h2><div class="card">${badge}</div></section>` : ''}
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">駅から500m以内で5分立ち止まると、その街のカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
  res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
  res.send(pageShell(title, `${h1}。${lead.replace(/<[^>]+>/g, '')}`, body, canonical, '', ua));
}

app.get('/line/:line', generalLimiter, (req, res) => {
  try {
    const l = req.params.line;
    const sts = STATIONS.filter((st) => (st.lines || []).includes(l));
    if (!sts.length) return res.status(404).send(pageShell('路線が見つかりません｜街巡-まちめぐ-', '', '<p>路線が見つかりませんでした。<a href="/">トップへ</a></p>'));
    const prefs = [...new Set(sts.map((st) => st.pref))];
    listPage(req, res, {
      title: `${l}の駅 街力ランキング（全${sts.length}駅）｜街巡-まちめぐ-`,
      h1: `${l}の駅 街力ランキング`,
      lead: `${esc(l)}の全${sts.length}駅を、駅から500m以内のお店や施設から計算した「街力」（1,000点満点）で並べました。`,
      stations: sts, canonical: lineUrl(l),
      crumbs: `<a href="/">街巡-まちめぐ-</a> › ${prefs.map((p) => `<a href="${prefUrl(p)}">${esc(p)}</a>`).join('・')} › ${esc(l)}`,
      badge: `アプリで${esc(l)}の${sts.length}駅にチェックインすると「${esc(l)}の路線制覇」バッジ（3割で銅・6割で銀・全駅で金）。`,
    });
  } catch (e) { console.error('[v17] 路線ページ失敗:', e.message); res.status(500).send('ただいま表示できません'); }
});

app.get('/area/:pref/:city', generalLimiter, (req, res) => {
  try {
    const { pref, city } = req.params;
    const sts = stationsOfArea(pref, city);
    if (!sts.length) return res.status(404).send(pageShell('見つかりません｜街巡-まちめぐ-', '', '<p>見つかりませんでした。<a href="/">トップへ</a></p>'));
    listPage(req, res, {
      title: `${city}（${pref}）の駅 街力ランキング（全${sts.length}駅）｜街巡-まちめぐ-`,
      h1: `${city}の駅 街力ランキング`,
      lead: `${esc(pref)}${esc(city)}にある全${sts.length}駅を、駅から500m以内のお店や施設から計算した「街力」（1,000点満点）で並べました。`,
      stations: sts, canonical: areaUrl(pref, city),
      crumbs: `<a href="/">街巡-まちめぐ-</a> › <a href="${prefUrl(pref)}">${esc(pref)}</a> › ${esc(city)}`,
      badge: sts.length >= 5 ? `アプリで${esc(city)}の${sts.length}駅にチェックインすると「${esc(city)}のエリア制覇」バッジ（3割で銅・6割で銀・全駅で金）。` : '',
    });
  } catch (e) { console.error('[v17] 市区町村ページ失敗:', e.message); res.status(500).send('ただいま表示できません'); }
});


// ═══════════════════════════════════════════════════════════════
// ★v18：ランキングページ /ranking と /ranking/種類
//   「飲食店が多い駅」「古い駅」など、紹介されやすい切り口で全国TOP100
// ═══════════════════════════════════════════════════════════════
const RANKINGS = {
  machiryoku: { t: '街力が高い駅', d: '駅から500m以内のお店や施設から計算した街力（1,000点満点）', v: (st, s) => s.score, f: (v) => `${v}点` },
  food:       { t: '飲食店が多い駅', d: '駅から500m以内の飲食店の数', v: (st, s) => ((s.details || {})['飲食'] || {}).count || 0, f: (v) => `${v.toLocaleString()}店` },
  shop:       { t: 'お店（商業）が多い駅', d: '駅から500m以内の商業施設の数', v: (st, s) => ((s.details || {})['商業'] || {}).count || 0, f: (v) => `${v.toLocaleString()}店` },
  life:       { t: '生活施設が多い駅', d: '駅から500m以内のスーパー・銀行・公共施設など生活施設の数', v: (st, s) => ((s.details || {})['生活'] || {}).count || 0, f: (v) => `${v.toLocaleString()}件` },
  medical:    { t: '病院・クリニックが多い駅', d: '駅から500m以内の医療施設の数', v: (st, s) => ((s.details || {})['医療'] || {}).count || 0, f: (v) => `${v.toLocaleString()}件` },
  sights:     { t: '名所・名施設が近い駅', d: '駅から800m以内にある大学・大きな公園・名刹・美術館・ランドマーク', v: (st, s) => { const b = (s.details || {})['ボーナス'] || {}; return (b.raw || b.pts || 0) * 1000 + (b.count || 0); }, f: (v, st) => `${((((scoreOf(st.id) || {}).details || {})['ボーナス'] || {}).count || 0)}か所` },
  riders:     { t: '利用者が多い駅', d: '1日の利用者数', v: (st) => ridersNum((textOf(st.id) || {}).riders), f: (v, st) => esc((textOf(st.id) || {}).riders || '') },
  oldest:     { t: '開業が古い駅', d: '開業した年', v: (st) => { const y = yearNum((textOf(st.id) || {}).opened); return y ? -y : -99999; }, f: (v) => `${-v}年開業` },
};
const _rankCache = new Map();
function rankingRows(kind) {
  const c = _rankCache.get(kind);
  if (c && c.builtAt === scoresCache.builtAt && c.tv === stationText.version) return c.rows;
  const R = RANKINGS[kind];
  const rows = STATIONS.map((st) => [st, scoreOf(st.id)]).filter(([, s]) => s)
    .map(([st, s]) => [st, s, R.v(st, s)]).filter(([, , v]) => v > -99999 && v !== 0)
    .sort((a, b) => b[2] - a[2]).slice(0, 100);
  _rankCache.set(kind, { rows, builtAt: scoresCache.builtAt, tv: stationText.version });
  return rows;
}
function rankingUrl(kind) { return `${SITE}/ranking/${kind}`; }

app.get('/ranking', generalLimiter, (req, res) => {
  try {
    const ua = req.get('user-agent') || '';
    const body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › ランキング</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px">全国8,993駅 ランキング</h1><p class="note">駅のまわりのお店や施設、利用者数、開業年から、全国の駅を並べました。</p>
<ul class="list">${Object.entries(RANKINGS).map(([k, R]) => {
  const top = rankingRows(k).slice(0, 3).map(([st]) => esc(st.name)).join('、');
  return `<li><a href="${rankingUrl(k)}" style="font-family:'Zen Maru Gothic',sans-serif;font-weight:700;font-size:17px">${esc(R.t)} TOP100</a><br><small style="margin:0">${esc(R.d)}。1位〜3位は${top}</small></li>`;
}).join('')}</ul></section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">ランキングの駅にも、5分立ち止まればカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
    res.send(pageShell('全国8,993駅 ランキング（街力・飲食店・利用者数・開業年）｜街巡-まちめぐ-', '飲食店が多い駅、生活施設が多い駅、名所が近い駅、開業が古い駅など、全国8,993駅のランキング。', body, `${SITE}/ranking`, '', ua));
  } catch (e) { console.error('[v18] ランキング一覧失敗:', e.message); res.status(500).send('ただいま表示できません'); }
});

app.get('/ranking/:kind', generalLimiter, (req, res) => {
  try {
    const R = RANKINGS[req.params.kind];
    if (!R) return res.status(404).send(pageShell('見つかりません｜街巡-まちめぐ-', '', '<p>見つかりませんでした。<a href="/ranking">ランキング一覧へ</a></p>'));
    const ua = req.get('user-agent') || '';
    const rows = rankingRows(req.params.kind);
    const list = rows.map(([st, s, v], i) => {
      const t = textOf(st.id) || {};
      const f = Array.isArray(t.features) && t.features[0] ? `<br><small style="margin:0">${esc(t.features[0])}</small>` : '';
      return `<li><span class="no${i < 3 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}</small><b style="float:right">${R.f(v, st)}</b>${f}</li>`;
    }).join('');
    const others = Object.entries(RANKINGS).filter(([k]) => k !== req.params.kind).map(([k, r]) => `<a href="${rankingUrl(k)}">${esc(r.t)}</a>`).join('');
    const body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › <a href="/ranking">ランキング</a> › ${esc(R.t)}</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px">${esc(R.t)} 全国TOP100</h1><p class="note">${esc(R.d)}で、全国8,993駅を並べました。</p>
<ul class="list">${list}</ul></section>
<section><h2>ほかのランキング</h2><p class="chips">${others}</p></section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">ランキングの駅にも、5分立ち止まればカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
    const top3 = rows.slice(0, 3).map(([st]) => st.name).join('・');
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
    res.send(pageShell(`${R.t} 全国ランキングTOP100｜街巡-まちめぐ-`, `${R.d}で全国8,993駅を比べたランキング。1位〜3位は${top3}。`, body, rankingUrl(req.params.kind), '', ua));
  } catch (e) { console.error('[v18] ランキング失敗:', e.message); res.status(500).send('ただいま表示できません'); }
});


// ═══════════════════════════════════════════════════════════════
// ★v24：「今いる場所の近くの駅」 /near?lat=..&lng=..
//   ・スマホのブラウザで位置を1回だけ取って、近い駅を8つ並べる
//   ・★位置は小数3桁（約100m）に丸めてから送る。サーバは保存しない・ログにも出さない
//   ・検索エンジンには載せない（noindex）
// ═══════════════════════════════════════════════════════════════
const NEAR_BUTTON = `<div class="nearbox"><button type="button" id="nearbtn" class="nearbtn"><span aria-hidden="true">📍</span> 今いる場所の近くの駅を見る</button><p class="note" id="nearmsg" style="margin:8px 0 0">位置情報は近くの駅を探すためだけに使い、保存しません。</p></div>
<script>(function(){var b=document.getElementById('nearbtn'),m=document.getElementById('nearmsg');if(!b)return;
b.addEventListener('click',function(){if(!navigator.geolocation){m.textContent='この端末では位置情報が使えません。駅名で探してください。';return;}
b.disabled=true;m.textContent='現在地を確認しています…';
navigator.geolocation.getCurrentPosition(function(p){location.href='/near?lat='+p.coords.latitude.toFixed(3)+'&lng='+p.coords.longitude.toFixed(3);},
function(){b.disabled=false;m.textContent='位置情報を使えませんでした。ブラウザの設定で許可するか、駅名で探してください。';},{enableHighAccuracy:false,timeout:10000,maximumAge:300000});});})();</script>`;

app.get('/near', generalLimiter, (req, res) => {
  try {
    const lat = Number(req.query.lat), lng = Number(req.query.lng);
    const ua = req.get('user-agent') || '';
    let body;
    if (!isFinite(lat) || !isFinite(lng) || lat < 20 || lat > 46 || lng < 122 || lng > 154) {
      body = `<section style="margin-top:14px"><h1 style="font-size:24px">近くの駅</h1><p class="note">場所がわかりませんでした。駅名で探してください。</p>
<form class="find" action="/search" method="get"><input type="search" name="q" placeholder="駅名（例：東陽町）" aria-label="駅名"><button type="submit">調べる</button></form></section>`;
    } else {
      const list = STATIONS.filter((st) => Math.abs(st.lat - lat) < 0.2 && Math.abs(st.lng - lng) < 0.25)
        .map((st) => [st, distM(lat, lng, st.lat, st.lng)]).sort((a, b) => a[1] - b[1]).slice(0, 8);
      const rows = list.map(([st, d], i) => {
        const s = scoreOf(st.id) || { score: 0, rank: 'D' }; const t = textOf(st.id) || {};
        const c = RANK_COLOR[s.rank] || '#888';
        const dist = d < 1000 ? `${Math.round(d / 10) * 10}m` : `${(d / 1000).toFixed(1)}km`;
        const f = (t.features || [])[0] ? `<br><small style="margin:0">${esc(t.features[0])}</small>` : '';
        return `<li><span class="no${i === 0 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${c}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}・${s.score}点</small><b style="float:right">${dist}</b>${f}</li>`;
      }).join('');
      const first = list[0] && list[0][1] <= 500
        ? `<p class="note">${esc(list[0][0].name)}駅から${Math.round(list[0][1] / 10) * 10}m。アプリなら、あと5分ここにいれば${esc(list[0][0].name)}のカードが1枚もらえる距離です。</p>` : '';
      body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › 近くの駅</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px">今いる場所の近くの駅</h1>${first}
${rows ? `<ul class="list">${rows}</ul>` : '<p class="note">近くに駅が見つかりませんでした。</p>'}</section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">駅から500m以内で5分立ち止まると、その街のカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
    }
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex');
    res.send(pageShell('今いる場所の近くの駅｜街巡-まちめぐ-', '今いる場所の近くの駅と、その街力。', body, null, '', ua, '<meta name="robots" content="noindex">'));
  } catch (e) { console.error('[v24] 近くの駅 失敗'); res.status(500).send('ただいま表示できません'); }
});


// ═══════════════════════════════════════════════════════════════
// ★v25：都道府県ページ /pref/東京都
//   要約・街力TOP30・市区町村・路線・（全駅の一覧は /search?pref=）
// ═══════════════════════════════════════════════════════════════
function prefUrl(p) { return `${SITE}/pref/${encodeURIComponent(p)}`; }
app.get('/pref/:pref', generalLimiter, (req, res) => {
  try {
    const p = req.params.pref;
    if (!PREFS.includes(p)) return res.status(404).send(pageShell('見つかりません｜街巡-まちめぐ-', '', '<p>見つかりませんでした。<a href="/">トップへ</a></p>'));
    const ua = req.get('user-agent') || '';
    const rows = STATIONS.filter((st) => st.pref === p).map((st) => [st, scoreOf(st.id) || { score: 0, rank: 'D', details: {} }])
      .sort((a, b) => b[1].score - a[1].score);
    const n = rows.length;
    const avg = n ? Math.round(rows.reduce((a, [, s]) => a + s.score, 0) / n) : 0;
    const cnt = { S: 0, A: 0, B: 0, C: 0, D: 0 }; rows.forEach(([, s]) => { cnt[s.rank] = (cnt[s.rank] || 0) + 1; });
    const cities = {}; const lines = {};
    rows.forEach(([st]) => { const c = (textOf(st.id) || {}).location; if (c) cities[c] = (cities[c] || 0) + 1; (st.lines || []).forEach((l) => { lines[l] = (lines[l] || 0) + 1; }); });
    const oldest = rows.map(([st]) => [st, yearNum((textOf(st.id) || {}).opened)]).filter(([, y]) => y).sort((a, b) => a[1] - b[1])[0];
    const top = rows.slice(0, 30).map(([st, s], i) => {
      const t = textOf(st.id) || {}; const c = RANK_COLOR[s.rank] || '#888';
      const f = (t.features || [])[0] ? `<br><small style="margin:0">${esc(t.features[0])}</small>` : '';
      return `<li><span class="no${i < 3 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${c}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc((t.location || ''))}・${s.score}点</small>${f}</li>`;
    }).join('');
    const cityChips = Object.entries(cities).sort((a, b) => b[1] - a[1]).map(([c, k]) => `<a href="${areaUrl(p, c)}">${esc(c)}（${k}）</a>`).join('');
    const lineChips = Object.entries(lines).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([l, k]) => `<a href="${lineUrl(l)}">${esc(l)}</a>`).join('');
    const body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › ${esc(p)}</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px">${esc(p)}の駅 街力ランキング</h1>
<p class="note">${esc(p)}にある全${n}駅を、駅から500m以内のお店や施設から計算した「街力」（1,000点満点）で比べました。</p>
<ul class="list"><li>駅の数<b style="float:right">${n}駅</b></li><li>街力の平均<b style="float:right">${avg}点</b></li>
<li>ランク別<b style="float:right">S ${cnt.S}／A ${cnt.A}／B ${cnt.B}／C ${cnt.C}／D ${cnt.D}</b></li>
${rows[0] ? `<li>いちばん街力が高い駅<b style="float:right">${esc(rows[0][0].name)}（${rows[0][1].score}点）</b></li>` : ''}
${oldest ? `<li>いちばん古い駅<b style="float:right">${esc(oldest[0].name)}（${oldest[1]}年開業）</b></li>` : ''}
</ul></section>
<section><h2>街力TOP30</h2><ul class="list">${top}</ul><p class="chips" style="margin-top:12px"><a href="/search?pref=${encodeURIComponent(p)}">${esc(p)}の全${n}駅を見る</a></p></section>
<section><h2>市区町村から探す</h2><p class="chips">${cityChips}</p></section>
<section><h2>路線から探す</h2><p class="chips">${lineChips}</p></section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">${esc(p)}の${n}駅、どこでも5分立ち止まればカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
    res.send(pageShell(`${p}の駅 街力ランキング（全${n}駅）｜街巡-まちめぐ-`, `${p}の全${n}駅の街力ランキング。1位は${rows[0] ? rows[0][0].name : ''}。市区町村・路線からも探せます。`, body, prefUrl(p), '', ua));
  } catch (e) { console.error('[v25] 都道府県ページ失敗:', e.message); res.status(500).send('ただいま表示できません'); }
});


// ═══════════════════════════════════════════════════════════════
// ★v26：特集 /feature/種類（駅コメントに書いてある駅だけ＝裏の取れたものだけ）
//   季節でトップの入口を切り替える（9〜11月 紅葉／12〜2月 温泉／3〜5月 桜／6〜8月 海）
// ═══════════════════════════════════════════════════════════════
const FEATURES = {
  momiji:    { t: '紅葉が楽しめる駅', s: '秋', kw: ['紅葉', 'もみじ', 'イチョウ', '銀杏並木'], w: '紅葉・イチョウ', e: '🍁' },
  onsen:     { t: '温泉がある駅', s: '冬', kw: ['温泉', '湯けむり', '足湯', '共同浴場'], w: '温泉', e: '♨️' },
  sakura:    { t: '桜の名所がある駅', s: '春', kw: ['桜', 'さくら', '花見'], w: '桜', e: '🌸' },
  umi:       { t: '海が近い駅', s: '夏', kw: ['海水浴', 'ビーチ', '砂浜', '海岸'], w: '海', e: '🌊' },
  castle:    { t: 'お城が近い駅', s: '', kw: ['城跡', '城址', '天守', 'お城'], w: 'お城', e: '🏯' },
  shotengai: { t: '商店街が楽しい駅', s: '', kw: ['商店街', 'アーケード', '横丁'], w: '商店街・横丁', e: '🏮' },
};
const _featCache = new Map();
function featureRows(k) {
  const c = _featCache.get(k);
  if (c && c.tv === stationText.version && c.b === scoresCache.builtAt) return c.rows;
  const F = FEATURES[k];
  const rows = [];
  for (const st of STATIONS) {
    const t = textOf(st.id); if (!t || !Array.isArray(t.features)) continue;
    const hit = t.features.find((f) => F.kw.some((w) => f.includes(w)));
    if (hit) rows.push([st, scoreOf(st.id) || { score: 0, rank: 'D' }, hit]);
  }
  rows.sort((a, b) => b[1].score - a[1].score);
  _featCache.set(k, { rows, tv: stationText.version, b: scoresCache.builtAt });
  return rows;
}
function featureUrl(k) { return `${SITE}/feature/${k}`; }
function seasonKey() { const m = new Date(Date.now() + 9 * 3600 * 1000).getUTCMonth() + 1; return m >= 9 && m <= 11 ? 'momiji' : (m === 12 || m <= 2) ? 'onsen' : m <= 5 ? 'sakura' : 'umi'; }
function seasonBlock() {
  const k = seasonKey(), F = FEATURES[k], rows = featureRows(k);
  if (!rows.length) return '';
  const pick = rows.slice(0, 3).map(([st, , hit]) => `<li><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}</small><br><small style="margin:0">${esc(hit)}</small></li>`).join('');
  const others = Object.entries(FEATURES).filter(([kk]) => kk !== k).map(([kk, f]) => `<a href="${featureUrl(kk)}">${f.e} ${esc(f.t)}</a>`).join('');
  return `<section><h2>${F.e} ${F.s}の特集：${esc(F.t)}</h2><div class="card"><ul class="list" style="padding:0">${pick}</ul><p style="margin:8px 0 0"><a class="more" href="${featureUrl(k)}">${esc(F.t)}をすべて見る（${rows.length}駅）</a></p></div><p class="chips" style="margin-top:12px">${others}</p></section>`;
}
app.get('/feature/:k', generalLimiter, (req, res) => {
  try {
    const F = FEATURES[req.params.k];
    if (!F) return res.status(404).send(pageShell('見つかりません｜街巡-まちめぐ-', '', '<p>見つかりませんでした。<a href="/">トップへ</a></p>'));
    const ua = req.get('user-agent') || '';
    const rows = featureRows(req.params.k);
    const list = rows.slice(0, 150).map(([st, s, hit], i) => {
      const c = RANK_COLOR[s.rank] || '#888';
      return `<li><span class="no${i < 3 ? ' hi' : ''}">${i + 1}</span><span class="rk" style="background:${c}">${esc(s.rank)}</span><a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}・${s.score}点</small><br><small style="margin:0">${esc(hit)}</small></li>`;
    }).join('');
    const others = Object.entries(FEATURES).filter(([kk]) => kk !== req.params.k).map(([kk, f]) => `<a href="${featureUrl(kk)}">${f.e} ${esc(f.t)}</a>`).join('');
    const body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › 特集 › ${esc(F.t)}</p>
<section style="margin-top:14px"><h1 style="font-size:clamp(24px,5.6vw,32px);font-weight:900;margin:0 0 8px">${F.e} ${esc(F.t)}</h1>
<p class="note">全国8,993駅の紹介コメントに${esc(F.w)}の話が出てくる${rows.length}駅を、街力の高い順に並べました。</p>
<ul class="list">${list}</ul></section>
<section><h2>ほかの特集</h2><p class="chips">${others}</p></section>
<section class="invite"><img class="icon" src="/logo192.png" alt="街巡-まちめぐ- のアイコン"><h2>街巡-まちめぐ-</h2><p class="pitch">行ってみたい駅に、5分立ち止まればカードが1枚（無料）</p>${storeBadges(ua, 46)}${EVENING_SVG}</section>`;
    res.set('Content-Type', 'text/html; charset=utf-8'); res.set('Cache-Control', 'public, max-age=3600');
    res.send(pageShell(`${F.t}（全国${rows.length}駅）｜街巡-まちめぐ-`, `${F.t}を全国から${rows.length}駅。${rows.slice(0, 3).map(([st]) => st.name).join('・')}など。`, body, featureUrl(req.params.k), '', ua));
  } catch (e) { console.error('[v26] 特集失敗:', e.message); res.status(500).send('ただいま表示できません'); }
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
    let cityLinks = '';
    if (pref && PREFS.includes(pref)) {
      const cc = {}; hits.forEach(([st]) => { const c = (textOf(st.id) || {}).location; if (c) cc[c] = (cc[c] || 0) + 1; });
      cityLinks = `<p class="chips" style="margin:14px 0 0">${Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([c, k]) => `<a href="${areaUrl(pref, c)}">${esc(c)}（${k}）</a>`).join('')}</p>`;
    }
    const list = hits.map(([st, s]) => `<li>${s ? `<span class="rk" style="background:${RANK_COLOR[s.rank] || '#888'}">${esc(s.rank)}</span>` : ''}<a href="${stationUrl(st)}">${esc(st.name)}</a><small>${esc(st.pref)}${s ? `・${s.score}点` : ''}</small></li>`).join('');
    const body = `<p class="crumbs"><a href="/">街巡-まちめぐ-</a> › ${esc(title || '駅を調べる')}</p><section style="margin-top:14px"><h1 style="font-size:clamp(22px,5.4vw,30px);font-weight:900;margin:0 0 12px">${esc(title || '駅を調べる')}</h1>
${!q && !pref ? NEAR_BUTTON + '<div style="height:14px"></div>' : ''}<form class="find" action="/search" method="get"><input type="search" name="q" value="${esc(q)}" placeholder="駅名（例：東陽町）" aria-label="駅名"><button type="submit">調べる</button></form>
${cityLinks}${list ? `<ul class="list" style="margin-top:14px">${list}</ul>` : (q ? '<p class="note" style="margin-top:12px">その名前の駅は見つかりませんでした。ひらがなや、駅名の一部でも探せます。</p>' : '')}</section>`;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(pageShell(`${title || '駅を調べる'}｜街巡-まちめぐ-`, `${title}。全国8,993駅の街力を調べられます。`, body, pref ? prefUrl(pref) : null, '', req.get('user-agent') || ''));
  } catch (e) {
    console.error('[v16] 検索失敗:', e.message);
    res.status(500).send('ただいま表示できません');
  }
});

// ★v13：App Store の今の版を覚えておく箱（取れるまでは空＝お知らせは出ない）
const storeInfo = { version: '', note: '', checkedAt: 0, rating: 0, ratingCount: 0, shots: [], notes: '', releasedAt: '' };
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
    // ★v22：サイトの構造化データ（Googleの検索結果の★表示）に使う
    storeInfo.notes = typeof r.releaseNotes === 'string' ? r.releaseNotes.trim().slice(0, 600) : '';
    storeInfo.releasedAt = typeof r.currentVersionReleaseDate === 'string' ? r.currentVersionReleaseDate : '';
    storeInfo.rating = Number(r.averageUserRating) || 0;
    storeInfo.ratingCount = Number(r.userRatingCount) || 0;
    // ★v23：App Store のスクショ（サイトのトップに並べる。460px幅に取り直す）
    if (Array.isArray(r.screenshotUrls) && r.screenshotUrls.length) {
      storeInfo.shots = r.screenshotUrls.slice(0, 8).map((u) => String(u).replace(/\/[0-9x]+bb\.(jpg|png)$/, '/460x0w.jpg'));
    }
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
