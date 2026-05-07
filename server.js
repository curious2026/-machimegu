const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const duckdb  = require('duckdb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── サーバーサイドキャッシュ ──
const CACHE_FILE = path.join(__dirname, 'cache.json');
function loadCache(){
  try{ if(fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE,'utf8')); }catch(e){}
  return {};
}
function saveCache(c){
  try{ fs.writeFileSync(CACHE_FILE, JSON.stringify(c), 'utf8'); }catch(e){}
}
let cache = loadCache();
console.log('キャッシュ読込:', Object.keys(cache).length + '件');

// ── DuckDB ──
const db = new duckdb.Database(':memory:');
function initDB(){
  return new Promise((resolve, reject)=>{
    const con = db.connect();
    con.exec("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';", err=>{
      con.close();
      if(err) reject(err); else resolve();
    });
  });
}

const S3 = "s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/*";

// ── カテゴリ→4軸マッピング ──
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

// ── 半径別 globalMax（独立管理） ──
// 各半径で「最も施設が多い駅」を基準に相対評価する
// 初期値は実測ベースの推定値（起動後に動的更新される）
let globalMaxByRadius = {
  '500':  {'飲食':1200, '商業':280, '生活':380, '医療':140},
  '800':  {'飲食':2459, '商業':500, '生活':600, '医療':200},
  '1200': {'飲音':3500, '商業':720, '生活':850, '医療':280},
};
// ※ typo修正
globalMaxByRadius['1200']['飲食'] = globalMaxByRadius['1200']['飲音'] || 3500;
delete globalMaxByRadius['1200']['飲音'];

function getGlobalMax(radius){
  const r = String(radius);
  if(!globalMaxByRadius[r]){
    // 未知の半径はデフォルト
    globalMaxByRadius[r] = {'飲食':2000,'商業':450,'生活':500,'医療':180};
  }
  return globalMaxByRadius[r];
}

// ── 対数スケールスコア計算 ──
function logScore(count, maxCount, maxPts){
  if(count <= 0) return 0;
  if(maxCount <= 0) return 0;
  const ratio = Math.log(1 + count) / Math.log(1 + maxCount);
  return Math.min(maxPts, Math.round(ratio * maxPts));
}

function calcScore(counts, radius){
  const gMax = getGlobalMax(radius);
  const details = {};
  let total = 0;
  AXES.forEach(axis=>{
    const pts = logScore(counts[axis], gMax[axis], MAX_PTS[axis]);
    details[axis] = { count: counts[axis], pts, max: MAX_PTS[axis] };
    total += pts;
  });
  return { score: Math.min(1000, total), details };
}

// globalMax更新時に同じ半径のキャッシュスコアをすべて再計算
function rebuildScoresForRadius(radius){
  const r = String(radius);
  const prefix = `raw_`;
  Object.keys(cache).forEach(k=>{
    if(!k.startsWith(prefix)) return;
    // キーの形式: raw_{ll}_{radius}
    const suffix = `_${r}`;
    if(!k.endsWith(suffix)) return;
    const scoreKey = k.replace('raw_', 'score_');
    const counts = cache[k];
    cache[scoreKey] = calcScore(counts, r);
  });
  saveCache(cache);
  console.log(`半径${r}m 全スコア再計算完了 globalMax:`, getGlobalMax(r));
}

// ── 生カウント取得 ──
function getRawCounts(lat, lng, radius){
  return new Promise((resolve, reject)=>{
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
    con.all(sql, (err, rows)=>{
      con.close();
      if(err) return reject(err);
      const counts = {'飲食':0, '商業':0, '生活':0, '医療':0};
      (rows||[]).forEach(row=>{
        const axis = AXIS_MAP[row.cat||''];
        if(axis) counts[axis] += (parseInt(row.cnt)||0);
      });
      resolve(counts);
    });
  });
}

// ── API: スコア取得 ──
app.get('/api/score', async(req, res)=>{
  try{
    let lat, lng, llStr;
    if(req.query.ll){
      llStr = req.query.ll;
      [lat, lng] = llStr.split(',').map(Number);
    } else {
      lat = parseFloat(req.query.lat);
      lng = parseFloat(req.query.lng);
      llStr = `${lat},${lng}`;
    }
    const r = parseInt(req.query.radius)||800;
    const rStr = String(r);

    const rawKey   = `raw_${llStr}_${r}`;
    const scoreKey = `score_${llStr}_${r}`;

    // キャッシュヒット
    if(cache[scoreKey]){
      console.log('キャッシュHIT:', llStr, r+'m');
      return res.json({...cache[scoreKey], cached:true});
    }

    console.log('取得中:', llStr, r+'m');
    const counts = await getRawCounts(lat, lng, r);

    // 半径別globalMax更新チェック
    const gMax = getGlobalMax(r);
    let maxUpdated = false;
    AXES.forEach(axis=>{
      if(counts[axis] > gMax[axis]){
        gMax[axis] = counts[axis];
        maxUpdated = true;
      }
    });

    cache[rawKey] = counts;

    if(maxUpdated){
      console.log(`半径${r}m globalMax更新:`, gMax);
      rebuildScoresForRadius(r);
    } else {
      cache[scoreKey] = calcScore(counts, r);
      saveCache(cache);
    }

    res.json({...cache[scoreKey], cached:false});
  }catch(e){
    console.error(e.message);
    res.status(500).json({error: e.message, score:0, details:{}});
  }
});

app.get('/api/test', async(req, res)=>{
  try{
    const r = parseInt(req.query.radius)||800;
    const counts = await getRawCounts(35.6896, 139.7006, r);
    const result  = calcScore(counts, r);
    res.json({ ok:true, source:'Overture Maps 2026-04-15', radius:r, globalMax:getGlobalMax(r), ...result, counts });
  }catch(e){
    res.json({ ok:false, error:e.message });
  }
});

app.get('/api/health', (req, res)=>res.json({
  status:'ok',
  cache: Object.keys(cache).length,
  globalMaxByRadius
}));

// ── 起動 ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>console.log('サーバー起動：port ' + PORT));
initDB().then(()=>{
  console.log('DuckDB初期化完了');
}).catch(e=>{
  console.error('DuckDB初期化失敗:', e);
});
