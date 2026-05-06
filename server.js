require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { Database } = require('duckdb-async');

const app = express();
app.use(cors());
app.use(express.json());

// ── 本番環境ではReactのビルドファイルを配信 ──
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

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
        WHEN fsq_category_labels[1] LIKE '%Dining%'   OR fsq_category_labels[1] LIKE '%Drinking%' THEN 'food'
        WHEN fsq_category_labels[1] LIKE '%Retail%'   OR fsq_category_labels[1] LIKE '%Grocery%'
          OR fsq_category_labels[1] LIKE '%Convenience%' OR fsq_category_labels[1] LIKE '%Bank%'
          OR fsq_category_labels[1] LIKE '%Post%'                                                  THEN 'life'
        WHEN fsq_category_labels[1] LIKE '%Business%' OR fsq_category_labels[1] LIKE '%Finance%'
          OR fsq_category_labels[1] LIKE '%Office%'                                                THEN 'biz'
        WHEN fsq_category_labels[1] LIKE '%Health%'   OR fsq_category_labels[1] LIKE '%Medical%'
          OR fsq_category_labels[1] LIKE '%Hospital%' OR fsq_category_labels[1] LIKE '%Pharmacy%'
          OR fsq_category_labels[1] LIKE '%Clinic%'                                                THEN 'med'
        ELSE 'other'
      END AS cat,
      COUNT(*) AS cnt
    FROM places.datasets.places_os
    WHERE country = 'JP'
      AND latitude  BETWEEN ${lat - r} AND ${lat + r}
      AND longitude BETWEEN ${lng - r} AND ${lng + r}
    GROUP BY cat
  `);

  const divR = await conn.all(`
    SELECT COUNT(DISTINCT fsq_category_labels[1]) AS d
    FROM places.datasets.places_os
    WHERE country = 'JP'
      AND fsq_category_labels[1] IS NOT NULL
      AND latitude  BETWEEN ${lat - r} AND ${lat + r}
      AND longitude BETWEEN ${lng - r} AND ${lng + r}
  `);
  await conn.close();

  let food=0, life=0, biz=0, med=0;
  rows.forEach(row=>{
    if(row.cat==='food') food=Number(row.cnt);
    if(row.cat==='life') life=Number(row.cnt);
    if(row.cat==='biz')  biz =Number(row.cnt);
    if(row.cat==='med')  med =Number(row.cnt);
  });
  const div   = divR[0] ? Number(divR[0].d) : 0;
  const total = food + life + biz + med;

  const sc = (radiusM / 800) ** 2;
  const L  = (v, mx) => v <= 0 ? 0 : Math.min(1, Math.log10(v+1) / Math.log10(mx * sc + 1));

  const score = Math.min(1000, Math.round(
    L(food,  13000) * 300 +
    L(life,   6000) * 200 +
    L(biz,    5000) * 150 +
    L(div,     150) * 100 +
    L(med,     700) * 100 +
    L(total, 26000) * 150
  ));

  return { score, food, life, biz, div, med, total, radius: radiusM };
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

// ── 本番環境ではすべてのルートをReactに渡す ──
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`サーバー起動：port ${PORT}`));
}).catch(console.error);
