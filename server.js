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
const STATIONS_FILE = path.join(__dirname, 'stations.json');
const SCORES_CACHE_FILE = path.join(__dirname, 'scores_cache.json');
const SCORES_CACHE_TMP = path.join(__dirname, 'scores_cache.tmp.json');

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
const MAX_PTS = {'飲食':350, '商業':350, '生活':200, '医療':100};

// ═══ globalMax（プリ計算で動的決定） ═══
// 各半径ごとに、全駅で最大の生カウントをmax基準とする
let globalMaxByRadius = {
  '500':  {'飲食':1200, '商業':280, '生活':380, '医療':140},
  '800':  {'飲食':2459, '商業':500, '生活':600, '医療':200},
  '1200': {'飲食':3500, '商業':720, '生活':850, '医療':280}
};

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

function calcScore(counts, radius) {
  const gMax = globalMaxByRadius[String(radius)] || globalMaxByRadius['800'];
  const details = {};
  let total = 0;
  AXES.forEach(axis => {
    const pts = logScore(counts[axis], gMax[axis], MAX_PTS[axis]);
    details[axis] = { count: counts[axis], pts, max: MAX_PTS[axis] };
    total += pts;
  });
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
async function rebuildAllScores() {
  if (buildState.running) {
    console.log('[rebuild] 既に実行中、スキップ');
    return;
  }
  if (STATIONS.length === 0) {
    console.error('[rebuild] 駅マスタが空、中止');
    return;
  }
  
  buildState.running = true;
  buildState.startedAt = Date.now();
  buildState.total = STATIONS.length * RADII.length;
  buildState.done = 0;
  buildState.errors = 0;
  buildState.tempData = { 
    version: getCurrentQuarterVersion(),
    builtAt: 0,
    stations: {}
  };
  
  console.log(`[rebuild] 開始: ${STATIONS.length}駅 × ${RADII.length}半径 = ${buildState.total}計算`);
  
  // Phase 1: 全駅×全半径の生カウント取得
  // 並列度CONCURRENCYで処理
  const queue = [];
  for (const st of STATIONS) {
    for (const r of RADII) {
      queue.push({ st, r });
    }
  }
  
  // 並列ワーカー
  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      const { st, r } = job;
      buildState.currentStation = `${st.name}_${st.pref} (r=${r})`;
      try {
        const counts = await getRawCounts(st.lat, st.lng, r);
        if (!buildState.tempData.stations[st.id]) {
          buildState.tempData.stations[st.id] = {};
        }
        // raw counts を一時保存（後でglobalMax確定後にスコア化）
        buildState.tempData.stations[st.id][`r${r}_raw`] = counts;
      } catch(e) {
        buildState.errors++;
        console.warn(`[rebuild] エラー ${st.name}_${st.pref} r=${r}:`, e.message);
      }
      buildState.done++;
      
      // 進捗ログ（100件ごと）
      if (buildState.done % 100 === 0) {
        const pct = (buildState.done / buildState.total * 100).toFixed(1);
        const elapsed = ((Date.now() - buildState.startedAt) / 1000).toFixed(0);
        console.log(`[rebuild] ${buildState.done}/${buildState.total} (${pct}%) 経過${elapsed}秒`);
      }
    }
  }
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  
  // Phase 2: 各半径ごとに globalMax を確定
  console.log('[rebuild] Phase 2: globalMax確定');
  for (const r of RADII) {
    const newMax = {'飲食':0, '商業':0, '生活':0, '医療':0};
    Object.values(buildState.tempData.stations).forEach(stData => {
      const counts = stData[`r${r}_raw`];
      if (!counts) return;
      AXES.forEach(axis => {
        if (counts[axis] > newMax[axis]) newMax[axis] = counts[axis];
      });
    });
    globalMaxByRadius[String(r)] = newMax;
    console.log(`[rebuild] r=${r} globalMax:`, newMax);
  }
  
  // Phase 3: 全駅×全半径のスコア計算
  console.log('[rebuild] Phase 3: スコア計算');
  Object.entries(buildState.tempData.stations).forEach(([sid, stData]) => {
    for (const r of RADII) {
      const counts = stData[`r${r}_raw`];
      if (counts) {
        stData[`r${r}`] = calcScore(counts, r);
        delete stData[`r${r}_raw`];  // raw は捨てる（容量削減）
      }
    }
  });
  
  // Phase 4: 完成データを atomic swap でスイッチ
  buildState.tempData.builtAt = Date.now();
  scoresCache = buildState.tempData;
  saveScoresCache(scoresCache);
  
  const elapsed = ((Date.now() - buildState.startedAt) / 1000).toFixed(0);
  console.log(`[rebuild] 完了: ${elapsed}秒, ${Object.keys(scoresCache.stations).length}駅, errors=${buildState.errors}`);
  
  buildState.running = false;
  buildState.tempData = null;
}

// 現在の四半期バージョン文字列
function getCurrentQuarterVersion() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

// 再計算が必要か判定
function needsRebuild() {
  if (Object.keys(scoresCache.stations || {}).length === 0) return true;
  if (Date.now() - (scoresCache.builtAt || 0) > QUARTER_MS) return true;
  // 駅マスタが増えてたら再計算
  if (Object.keys(scoresCache.stations || {}).length < STATIONS.length) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════
// API エンドポイント
// ═══════════════════════════════════════════════════════════════

// 一括取得API（メイン）
app.get('/api/all-scores', (req, res) => {
  const radius = parseInt(req.query.radius) || 800;
  const rKey = `r${radius}`;
  
  // 30日キャッシュ（ブラウザ＆CDN）
  res.setHeader('Cache-Control', 'public, max-age=2592000');
  
  const result = {
    version: scoresCache.version,
    builtAt: scoresCache.builtAt,
    radius,
    stations: {}
  };
  
  Object.entries(scoresCache.stations || {}).forEach(([sid, data]) => {
    if (data[rKey]) {
      result.stations[sid] = data[rKey];
    }
  });
  
  console.log(`[/api/all-scores] r=${radius} ${Object.keys(result.stations).length}駅返却`);
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
      res.setHeader('Cache-Control', 'public, max-age=2592000');
      return res.json({ ...foundData, cached: true, source: 'precomputed' });
    }
    
    // プリ計算にない（新規駅など）→ 動的計算
    console.log(`[/api/score] cache miss: ${llStr} r=${r}`);
    const counts = await getRawCounts(lat, lng, r);
    const result = calcScore(counts, r);
    res.json({ ...result, cached: false });
    
  } catch(e) {
    console.error('[/api/score] error:', e.message);
    res.status(500).json({ error: e.message, score: 0, details: {} });
  }
});

// 状態取得（管理者用、後で認証追加）
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

// 手動再計算トリガー（管理者用、後で認証追加）
app.post('/api/rebuild', (req, res) => {
  if (buildState.running) {
    return res.status(409).json({ error: '既に実行中', status: getBuildStatus() });
  }
  // 非同期で開始（即レスポンス）
  rebuildAllScores().catch(e => console.error('rebuild failed:', e));
  res.json({ ok: true, message: '再計算開始', status: getBuildStatus() });
});

// テスト
app.get('/api/test', async (req, res) => {
  try {
    const r = parseInt(req.query.radius) || 800;
    const counts = await getRawCounts(35.6896, 139.7006, r);
    const result = calcScore(counts, r);
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
  
  if (needsRebuild()) {
    console.log('[起動] 再計算が必要、バックグラウンドで開始');
    // 30秒待ってから開始（起動直後の負荷分散）
    setTimeout(() => {
      rebuildAllScores().catch(e => console.error('[起動] rebuild failed:', e));
    }, 30000);
  } else {
    const ageDays = Math.floor((Date.now() - scoresCache.builtAt) / (24*60*60*1000));
    console.log(`[起動] キャッシュ有効（${ageDays}日前構築）、再計算スキップ`);
  }
}).catch(e => {
  console.error('[起動] DuckDB初期化失敗:', e);
});
