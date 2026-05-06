const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { Database } = require('duckdb-async');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const S3 = "s3://overturemaps-us-west-2/release/2026-04-15.0/theme=places/type=place/*";

// カテゴリ→4軸マッピング
const AXIS_MAP = {
  // 飲食
  eat_and_drink:'food', restaurant:'food', cafe:'food', bar:'food',
  fast_food:'food', coffee:'food', bakery:'food', food_and_drink:'food',
  izakaya:'food', ramen:'food', sushi:'food', food:'food',
  // 商業
  retail:'commercial', shopping:'commercial', clothing:'commercial',
  department_store:'commercial', electronics:'commercial', bookstore:'commercial',
  hotel:'commercial', entertainment:'commercial', cinema:'commercial',
  museum:'commercial', amusement:'commercial', art:'commercial', theater:'commercial',
  // 生活
  convenience_store:'life', supermarket:'life', grocery:'life',
  beauty_salon:'life', laundry:'life', hair_salon:'life',
  bank:'life', atm:'life', post_office:'life', drugstore:'life', pharmacy:'life',
  // 医療
  health_and_medicine:'medical', hospital:'medical', clinic:'medical',
  dentist:'medical', doctors:'medical',
};

let db;

async function initDB() {
  db = await Database.create(':memory:');
  await db.run('INSTALL httpfs; LOAD httpfs;');
  await db.run("SET s3_region='us-west-2';");
  console.log('DB初期化完了');
}

function metersToDeg(m){ return m / 111320; }

async function calcScore(lat, lng, radiusM = 800) {
  const r = metersToDeg(radiusM);
  const minLat = lat - r, maxLat = lat + r;
  const minLng = lng - r, maxLng = lng + r;

  const conn = await db.connect();
  const rows = await conn.all(`
    SELECT categories.primary AS cat, COUNT(*) AS cnt
    FROM read_parquet('${S3}', hive_partitioning=false)
    WHERE bbox.minx >= ${minLng}
      AND bbox.maxx <= ${maxLng}
      AND bbox.miny >= ${minLat}
      AND bbox.maxy <= ${maxLat}
      AND categories.primary IS NOT NULL
    GROUP BY categories.primary
  `);
  await conn.close();

  const totals = { food:0, commercial:0, life:0, medical:0 };
  rows.forEach(row => {
    const ax = AXIS_MAP[row.cat];
    if(ax) totals[ax] += Number(row.cnt);
  });

  const sc = (radiusM / 800) ** 2;
  const L  = (v, mx) => v <= 0 ? 0 : Math.min(1, Math.log10(v+1) / Math.log10(mx*sc+1));

  const foodPt       = Math.round(L(totals.food,       8000) * 350);
  const commercialPt = Math.round(L(totals.commercial, 5000) * 350);
  const lifePt       = Math.round(L(totals.life,       3000) * 200);
  const medicalPt    = Math.round(L(totals.medical,     500) * 100);
  const score        = Math.min(1000, foodPt + commercialPt + lifePt + medicalPt);

  return { score, food: foodPt, commercial: commercialPt, life: lifePt, medical: medicalPt };
}

app.get('/api/score', async (req, res) => {
  try {
    const { lat, lng, name, radius = 800 } = req.query;
    const result = await calcScore(parseFloat(lat), parseFloat(lng), parseInt(radius));
    res.json({ name, lat, lng, ...result });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`サーバー起動：port ${PORT}`));
initDB().catch(e => console.error('DB初期化エラー:', e));
