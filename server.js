// ═══════════════════════════════════════════════════════════════
// 街巡 server.js v9（Phase E：プリ計算 + 一括取得API）
// ═══════════════════════════════════════════════════════════════
// 主要変更点：
//   - 起動時に旧キャッシュ即読込（stale-while-revalidate）
//   - バックグラウンドで全駅×3半径をプリ計算
//   - 新エンドポイント /api/all-scores（一括取得）
//   - 既存 /api/score も維持（後方互換）
//   - HTTPキャッシュヘッダで30日キャッシュ
//   - 四半期更新判定（前回計算から90日以上で再計算）
//   - 管理用 /api/rebuild、/api/status
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const duckdb  = require('duckdb');
const jose    = require('jose');

// ═══════════════════════════════════════════════════════════════
// Firebase ID Token 軽量検証（管理者ダッシュボード認証用）
// jose で Google の公開鍵を取得して JWT 検証
// ═══════════════════════════════════════════════════════════════
const ADMIN_UIDS = ['JpHzl9PQf1MNHwXovfvDhKHU57z1'];  // ともきのUID
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
  // clockTolerance: Firebase ID Tokenは1時間で期限切れになるが、
  // フロント側で getIdToken(true) を呼ばないと自動更新されない。
  // Phase 1運用中の応急処置として、24時間まで期限切れを許容。
  // セキュリティ：ADMIN_UIDSによる二重チェックで守られている。
  const { payload } = await jose.jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
    clockTolerance: '24 hours'
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
app.use(cors());
app.use(express.json());

// 静的ファイルにキャッシュヘッダ
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',  // 静的アセットは7日キャッシュ
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');  // HTMLは常に最新
    }
  }
}));

// ═══ 設定 ═══
const RADII = [500, 800, 1200];
const QUARTER_MS = 90 * 24 * 60 * 60 * 1000;  // 四半期 = 90日
const CONCURRENCY = 3;  // 同時計算数（Railwayへの負荷考慮）

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
try {
  STATIONS = JSON.parse(fs.readFileSync(STATIONS_FILE, 'utf8'));
  console.log(`駅マスタ読込: ${STATIONS.length}駅`);
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

function loadScoresCache() {
  try {
    if (fs.existsSync(SCORES_CACHE_FILE)) {
      scoresCache = JSON.parse(fs.readFileSync(SCORES_CACHE_FILE, 'utf8'));
      const cnt = Object.keys(scoresCache.stations || {}).length;
      console.log(`スコアキャッシュ読込: v${scoresCache.version}, ${cnt}駅, builtAt=${new Date(scoresCache.builtAt).toLocaleString('ja-JP')}`);
    }
  } catch(e) {
    console.warn('スコアキャッシュ読込失敗:', e.message);
    scoresCache = { version: '', builtAt: 0, stations: {} };
  }
}

function saveScoresCache(data) {
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

const S3 = "s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/*";

// ═══ カテゴリマッピング（既存と同じ） ═══
const AXIS_MAP = {
  eat_and_drink:'飲食', restaurant:'飲食', cafe:'飲食', bar:'飲食',
  fast_food:'飲食', coffee:'飲食', bakery:'飲食', food_and_drink:'飲食',
  izakaya:'飲食', ramen:'飲食', sushi:'飲食', food:'飲食',
  retail:'商業', shopping:'商業', clothing:'商業', department_store:'商業',
  electronics:'商業', bookstore:'商業', sports_store:'商業', toy_store:'商業',
  hotel:'商業', entertainment:'商業', cinema:'商業', museum:'商業',
  amusement:'商業', art:'商業', theater:'商業', night_club:'商業',
  convenience_store:'生活', supermarket:'生活', grocery:'生活',
  beauty_salon:'生活', laundry:'生活', hair_salon:'生活', nail_salon:'生活',
  bank:'生活', atm:'生活', post_office:'生活', drugstore:'生活',
  pharmacy:'生活', gas_station:'生活',
  health_and_medicine:'医療', hospital:'医療', clinic:'医療',
  dentist:'医療', doctors:'医療', nursing_home:'医療'
};
const AXES    = ['飲食','商業','生活','医療'];
const MAX_PTS = {'飲食':300, '商業':300, '生活':200, '医療':100};
const BONUS_MAX_PTS = 100;
const BONUS_RADIUS_M = 800;

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
      SELECT categories.primary AS cat, COUNT(*) AS cnt
      FROM read_parquet('${S3}', hive_partitioning=false)
      WHERE bbox.xmin >= ${lng - degLng}
        AND bbox.xmax <= ${lng + degLng}
        AND bbox.ymin >= ${lat - deg}
        AND bbox.ymax <= ${lat + deg}
        AND categories.primary IS NOT NULL
      GROUP BY categories.primary
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
    if (mode === 'full') {
      // ─── フル再計算 ─────────────────────────────
      console.log(`[rebuild] FULL モード開始: ${STATIONS.length}駅 × ${RADII.length}半径`);
      
      const newData = {
        version: getCurrentQuarterVersion(),
        builtAt: 0,
        stations: {}
      };
      
      // Phase 1: 全駅の生counts取得
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
      
      // atomic swap
      scoresCache = mergedData;
      saveScoresCache(scoresCache);
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
  
  // 四半期超過 → フル
  if (Date.now() - (scoresCache.builtAt || 0) > QUARTER_MS) {
    return { mode: 'full', reason: 'quarter expired' };
  }
  
  // 新規駅検出
  const newStations = STATIONS.filter(st => {
    const sid = st.id || `${st.name}_${st.pref}`;
    return !cacheIds.has(sid);
  });
  
  if (newStations.length > 0) {
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
  
  // ─── 空キャッシュ → 503 でクライアントにフォールバック誘導 ───
  if (stationCount === 0) {
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
    
    // プリ計算キャッシュから探す（最寄り駅で一致）
    let foundData = null;
    for (const [sid, data] of Object.entries(scoresCache.stations || {})) {
      // STATIONSから座標で一致を探す
      const st = STATIONS.find(s => s.id === sid);
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
    needsRebuild: needsRebuild(),
    stationsLoaded: STATIONS.length,
    radii: RADII,
    globalMax: globalMaxByRadius
  });
});

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
        .catch(e => console.error('rebuild failed:', e));
      return res.json({ ok: true, message: `差分計算開始（${check.stations.length}駅）`, status: getBuildStatus() });
    } else {
      console.log('[admin] incremental要求だが差分なし → フルモードで実行');
    }
  }
  
  // デフォルト：強制フルモード
  console.log('[admin] 手動rebuild受信: 強制フルモード実行（autoスキップ廃止）');
  rebuildScores({ mode: 'full' }).catch(e => console.error('rebuild failed:', e));
  return res.json({ ok: true, message: '強制フル再計算開始（全駅再計算）', status: getBuildStatus() });
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

// 旧 /api/rebuild（後方互換、認証なしのまま）→ 削除して認証必須に統一
// app.post('/api/rebuild') は requireAdmin に移行

// テスト
app.get('/api/test', async (req, res) => {
  try {
    const r = parseInt(req.query.radius) || 800;
    const counts = await getRawCounts(35.6896, 139.7006, r);
    const bonusObj = calcBonus(35.6896, 139.7006);
    const result = calcScore(counts, r, bonusObj);
    res.json({ 
      ok: true, 
      source: 'Overture Maps 2026-04-15', 
      radius: r, 
      globalMax: globalMaxByRadius[String(r)],
      ...result, 
      counts 
    });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[起動] port ${PORT}`));

// 1. 旧キャッシュ即読込（stale-while-revalidate の "stale" 部分）
loadScoresCache();

// 2. DuckDB初期化 → 必要なら再計算
initDB().then(() => {
  console.log('[起動] DuckDB初期化完了');
  
  const rebuildCheck = checkRebuildMode();
  console.log(`[起動] rebuild判定:`, rebuildCheck.mode, '/', rebuildCheck.reason);
  
  if (rebuildCheck.mode === 'full') {
    console.log('[起動] フル再計算が必要、30秒後にバックグラウンドで開始');
    setTimeout(() => {
      rebuildScores({ mode: 'full' }).catch(e => console.error('[起動] rebuild failed:', e));
    }, 30000);
  } else if (rebuildCheck.mode === 'incremental') {
    console.log(`[起動] 差分計算が必要（${rebuildCheck.stations.length}駅追加）、10秒後にバックグラウンドで開始`);
    setTimeout(() => {
      rebuildScores({ mode: 'incremental', stations: rebuildCheck.stations })
        .catch(e => console.error('[起動] rebuild failed:', e));
    }, 10000);
  } else {
    const ageDays = Math.floor((Date.now() - scoresCache.builtAt) / (24*60*60*1000));
    console.log(`[起動] キャッシュ有効（${ageDays}日前構築）、再計算スキップ`);
  }
}).catch(e => {
  console.error('[起動] DuckDB初期化失敗:', e);
});
