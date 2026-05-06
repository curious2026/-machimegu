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
    con.exec('INSTALL httpfs; LOAD httpfs; SET s3_region=\'us-west-2\';', err=>{
      con.close();
      if(err) reject(err); else resolve();
    });
  });
}

const S3 = "s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/*";

// カテゴリ→4軸マッピング
const FOOD_CATS = new Set(['eat_and_drink','restaurant','cafe','bar','fast_food','coffee','bakery','food_and_drink','izakaya','ramen','sushi','food']);
const COMM_CATS = new Set(['retail','shopping','clothing','department_store','electronics','bookstore','hotel','lodging','entertainment','cinema','museum','amusement','art','theater']);
const LIFE_CATS = new Set(['convenience_store','supermarket','grocery','beauty_salon','laundry','hair_salon','nail_salon','bank','atm','post_office','drugstore','pharmacy']);
const MEDI_CATS = new Set(['health_and_medicine','hospital','clinic','dentist','doctors','nursing_home']);

function logScore(count, maxCount, maxPt){
  if(count<=0) return 0;
  return Math.min(maxPt, Math.round(Math.log10(count+1)/Math.log10(maxCount+1)*maxPt));
}

function queryOverture(lat, lng, radius){
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

      let food=0, commercial=0, life=0, medical=0;
      (rows||[]).forEach(row=>{
        const c = row.cat||'';
        const n = parseInt(row.cnt)||0;
        if(FOOD_CATS.has(c))       food       += n;
        else if(COMM_CATS.has(c))  commercial += n;
        else if(LIFE_CATS.has(c))  life       += n;
        else if(MEDI_CATS.has(c))  medical    += n;
      });

      const foodPt       = logScore(food,       5000, 350);
      const commercialPt = logScore(commercial,  3000, 350);
      const lifePt       = logScore(life,        2000, 200);
      const medicalPt    = logScore(medical,      500, 100);
      const score        = Math.min(1000, foodPt + commercialPt + lifePt + medicalPt);

      resolve({ score, food: foodPt, commercial: commercialPt, life: lifePt, medical: medicalPt });
    });
  });
}

// ── APIエンドポイント ──
app.get('/api/score', async (req, res)=>{
  try{
    // lat/lng 形式と ll=lat,lng 形式の両方に対応
    let lat, lng, radius;
    if(req.query.ll){
      [lat, lng] = req.query.ll.split(',').map(Number);
    } else {
      lat = parseFloat(req.query.lat);
      lng = parseFloat(req.query.lng);
    }
    radius = parseInt(req.query.radius)||800;

    const key = `${lat},${lng}_${radius}`;

    // サーバーキャッシュヒット
    if(cache[key]){
      console.log('キャッシュHIT:', key);
      return res.json({...cache[key], cached:true});
    }

    console.log('Overture取得中:', key);
    const result = await queryOverture(lat, lng, radius);
    cache[key] = result;
    saveCache(cache);
    console.log('取得完了:', key, 'score:', result.score);
    res.json({...result, cached:false});
  }catch(e){
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/test', async (req, res)=>{
  try{
    const result = await queryOverture(35.6896, 139.7006, 800);
    res.json({ ok:true, source:'Overture Maps 2026-04-15', ...result });
  }catch(e){
    res.json({ ok:false, error:e.message });
  }
});

app.get('/api/health', (req, res)=>res.json({ status:'ok', cache: Object.keys(cache).length }));

// ── 起動 ──
const PORT = process.env.PORT || 3001;
initDB().then(()=>{
  console.log('DuckDB初期化完了');
  app.listen(PORT, ()=>console.log('サーバー起動：port ' + PORT));
}).catch(e=>{
  console.error('DuckDB初期化失敗:', e);
  process.exit(1);
});
