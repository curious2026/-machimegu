require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { Database } = require('duckdb-async');

const app = express();
app.use(cors());
app.use(express.json());
// publicフォルダを静的ファイルとして配信
app.use(express.static(path.join(__dirname, 'public')));

let db;

async function initDB() {
  db = await Database.create(':memory:');
  await db.run('INSTALL httpfs; LOAD httpfs;');
  await db.run('DROP SECRET IF EXISTS iceberg_secret;');
  await db.run(`CREATE PERSISTENT SECRET iceberg_secret (TYPE ICEBERG, TOKEN '${process.env.FSQ_API_KEY}');`);
  await db.run(`ATTACH 'places' AS places (TYPE iceberg, SECRET iceberg_secret, ENDPOINT 'https://catalog.h3-hub.foursquare.com/iceberg');`);
  console.log('DB接続成功！');
}

function metersToDeg(m){ return m / 111320; }

async function calcScore(lat, lng, radiusM = 800){
  const conn = await db.connect();
  const r    = metersToDeg(radiusM);

  const rows = await conn.all(`
    SELECT
      CASE
        WHEN fsq_category_labels[1] LIKE '%Dining%' OR fsq_category_labels[1] LIKE '%Drinking%'
          THEN 'food'
        WHEN fsq_category_labels[1] LIKE '%Retail%'   OR fsq_category_labels[1] LIKE '%Shopping%'
          OR  fsq_category_labels[1] LIKE '%Entertain%' OR fsq_category_labels[1] LIKE '%Hotel%'
          OR  fsq_category_labels[1] LIKE '%Lodging%'
          THEN 'commercial'
        WHEN fsq_category_labels[1] LIKE '%Grocery%'  OR fsq_category_labels[1] LIKE '%Convenience%'
          OR  fsq_category_labels[1] LIKE '%Bank%'     OR fsq_category_labels[1] LIKE '%Post%'
          OR  fsq_category_labels[1] LIKE '%Beauty%'   OR fsq_category_labels[1] LIKE '%Salon%'
          OR  fsq_category_labels[1] LIKE '%Pharmacy%' OR fsq_category_labels[1] LIKE '%Drugstore%'
          THEN 'life'
        WHEN fsq_category_labels[1] LIKE '%Health%'   OR fsq_category_labels[1] LIKE '%Medical%'
          OR  fsq_category_labels[1] LIKE '%Hospital%' OR fsq_category_labels[1] LIKE '%Clinic%'
          OR  fsq_category_labels[1] LIKE '%Dentist%'
          THEN 'medical'
        ELSE 'other'
      END AS cat,
      COUNT(*) AS cnt
    FROM places.datasets.places_os
    WHERE country = 'JP'
      AND latitude  BETWEEN ${lat - r} AND ${lat + r}
      AND longitude BETWEEN ${lng - r} AND ${lng + r}
    GROUP BY cat
  `);
  await conn.close();

  let food=0, commercial=0, life=0, medical=0;
  rows.forEach(row => {
    if(row.cat==='food')       food       = Number(row.cnt);
    if(row.cat==='commercial') commercial = Number(row.cnt);
    if(row.cat==='life')       life       = Number(row.cnt);
    if(row.cat==='medical')    medical    = Number(row.cnt);
  });

  // 半径スケーリング（800m基準）
  const sc = (radiusM / 800) ** 2;
  const L  = (v, mx) => v <= 0 ? 0 : Math.min(1, Math.log10(v+1) / Math.log10(mx * sc + 1));

  // 各軸の点数（表示用・整数）
  const foodPt       = Math.round(L(food,       13000) * 350);
  const commercialPt = Math.round(L(commercial,  8000) * 350);
  const lifePt       = Math.round(L(life,        5000) * 200);
  const medicalPt    = Math.round(L(medical,      700) * 100);

  const score = Math.min(1000, foodPt + commercialPt + lifePt + medicalPt);

  return { score, food: foodPt, commercial: commercialPt, life: lifePt, medical: medicalPt, radius: radiusM };
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
initDB().then(() => {
  app.listen(PORT, () => console.log(`サーバー起動：port ${PORT}`));
}).catch(console.error);
