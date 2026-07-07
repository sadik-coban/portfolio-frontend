// scripts/build-bi-rows.mjs
// ---------------------------------------------------------------------------
// Generates public/bi_rows.json — a COMPACT COLUMNAR row export of cars.duckdb
// that the BI dashboard (app/_site/bi/FinalBiDashboard.tsx) loads once and then
// filters + aggregates entirely client-side so every chart + the Turkey map
// respond live to the filter bar without a backend round-trip.
//
// Mirrors Downloads/dashboard_data_prep.py:
//   • TR filter: only gb_plate_origin = '(TR) Türkiye'  (drops foreign plates → 29,988)
//   • clean segment: derived deterministically from the series (SEGMENT_MAP),
//     because the raw gb_segment is dirty. Unmapped series → 'D'.
//   • year/mileage from gb_year / gb_mileage (the prep's canonical fields).
//
// Canonical row set: latest snapshot per ad_id. Columns are parallel arrays;
// categoricals are dictionary-indexed. Damage is packed: 11 body parts × 2 bits
// each (0 orijinal/1 lokal/2 boyalı/3 değişen) into one integer per row.
//
// Requires devDependency @duckdb/node-api. Run from repo root:
//   node scripts/build-bi-rows.mjs
// ---------------------------------------------------------------------------
import { DuckDBInstance } from '@duckdb/node-api';
import fs from 'node:fs';

const DB = 'cars.duckdb';
const OUT = 'public/bi_rows.json';

const inst = await DuckDBInstance.create(DB, { access_mode: 'READ_ONLY' });
const conn = await inst.connect();
const N = (v) => (typeof v === 'bigint' ? Number(v) : v);
const q = async (sql) => (await (await conn.run(sql)).getRowObjects()).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, N(v)])));

// 11 display parts, fixed order (must match the component's PARTS array).
const PARTS = ['kaput', 'tavan', 'bagaj', 'door_fl', 'door_fr', 'door_rl', 'door_rr', 'fender_fl', 'fender_fr', 'fender_rl', 'fender_rr'];
const partCode = () => PARTS.map((p) => `(CASE WHEN ${p}_degisen>0 THEN 3 WHEN ${p}_boyali>0 THEN 2 WHEN ${p}_lokal>0 THEN 1 ELSE 0 END)`);

// TR filter + dedup (latest snapshot per ad_id) + parsed city/district.
await conn.run(`
CREATE OR REPLACE TEMP VIEW cars AS
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY ad_id ORDER BY search_date DESC, scraped_at DESC) rn
  FROM car_listings
  WHERE price > 0 AND gb_plate_origin = '(TR) Türkiye'
)
SELECT *,
  trim(regexp_extract(location, ',\\s*([^,]+)$', 1)) AS city,
  trim(coalesce(nullif(regexp_extract(location, 'Mh\\.?\\s*([^,]+),', 1), ''),
                regexp_extract(location, '^([^,]+),', 1))) AS district
FROM ranked WHERE rn = 1;
`);

const FUEL = ['Benzin', 'Dizel', 'LPG', 'Hibrit'];
const fuelIdx = (f) => (f === 'Benzin' ? 0 : f === 'Dizel' ? 1 : f === 'LPG & Benzin' ? 2 : f === 'Hibrit' ? 3 : -1);

// clean segment derived from series (mirrors dashboard_data_prep.py SEGMENT_MAP).
const SEGMENT_MAP = {
  '1 Serisi': 'C', '2 Serisi': 'C', '3 Serisi': 'D', '4 Serisi': 'D', '5 Serisi': 'E',
  '6 Serisi': 'E', '7 Serisi': 'F', '8 Serisi': 'F',
  X1: 'C', X2: 'C', X3: 'D', X4: 'D', X5: 'E', X6: 'E', X7: 'F', Z4: 'S',
  A1: 'B', A3: 'C', A4: 'D', A5: 'D', A6: 'E', A7: 'E', A8: 'F',
  Q2: 'C', Q3: 'C', Q5: 'D', Q7: 'F', Q8: 'F', TT: 'S', R8: 'S',
};
const SEG = ['B', 'C', 'D', 'E', 'F', 'S'];
const segIdx = (series) => SEG.indexOf(SEGMENT_MAP[series] || 'D'); // unmapped → D

const brandIdx = (b) => (b === 'bmw' ? 0 : 1); // 0 BMW, 1 Audi

const dmgSelect = partCode().map((e, i) => `${e} AS d${i}`).join(', ');
const rows = await q(`
  SELECT brand, series, model, gb_year AS y, gb_mileage AS km, kb_fuel AS fuel, kb_body_type AS body,
         is_heavy_damaged AS hd, price AS p, city, district,
         listing_date::VARCHAR AS ld, ${dmgSelect}
  FROM cars
  ORDER BY listing_date DESC
`);

// dictionaries
const seriesDict = [], seriesMap = new Map();
const cityDict = [], cityMap = new Map();
const distDict = [], distMap = new Map();
const modelDict = [], modelMap = new Map();
const bodyDict = [], bodyMap = new Map();
const intern = (dict, map, key, make) => { if (map.has(key)) return map.get(key); const i = dict.length; dict.push(make()); map.set(key, i); return i; };

const dates = rows.map((r) => r.ld).filter(Boolean).sort();
const baseDate = dates[0];
const dayOffset = (iso) => Math.round((Date.parse(iso) - Date.parse(baseDate)) / 86400000);

const cols = { p: [], y: [], km: [], f: [], s: [], b: [], se: [], ci: [], di: [], md: [], bt: [], ld: [], hd: [], dmg: [] };
for (const r of rows) {
  const b = brandIdx(r.brand);
  const se = intern(seriesDict, seriesMap, `${b} ${r.series || ''}`, () => ({ b, name: r.series || '—' }));
  const ci = r.city ? intern(cityDict, cityMap, r.city, () => r.city) : -1;
  const di = r.district ? intern(distDict, distMap, `${ci} ${r.district}`, () => r.district) : -1;
  const md = intern(modelDict, modelMap, r.model || r.series || '—', () => r.model || r.series || '—');
  const bt = r.body ? intern(bodyDict, bodyMap, r.body, () => r.body) : -1;
  let dmg = 0;
  for (let i = 0; i < PARTS.length; i++) dmg |= (r[`d${i}`] & 3) << (2 * i);
  cols.p.push(r.p);
  cols.y.push(r.y ?? -1);
  cols.km.push(r.km ?? -1);
  cols.f.push(fuelIdx(r.fuel));
  cols.s.push(segIdx(r.series));
  cols.b.push(b);
  cols.se.push(se);
  cols.ci.push(ci);
  cols.di.push(di);
  cols.md.push(md);
  cols.bt.push(bt);
  cols.ld.push(r.ld ? dayOffset(r.ld) : -1);
  cols.hd.push(r.hd ? 1 : 0);
  cols.dmg.push(dmg);
}

const meta = (await q(`
  SELECT COUNT(*) n_unique,
         (SELECT COUNT(*) FROM car_listings) n_raw,
         ROUND(AVG(NULLIF(tramer_fee,0))) tramer_avg,
         SUM(CASE WHEN tramer_fee>0 THEN 1 ELSE 0 END) tramer_n
  FROM cars WHERE price > 0`))[0];
const snaps = await q(`SELECT search_date::VARCHAR d, COUNT(*) n FROM car_listings GROUP BY 1 ORDER BY 1`);

const out = {
  meta: {
    n_raw: meta.n_raw, n_unique: meta.n_unique, base_date: baseDate,
    brands: ['BMW', 'Audi'], fuels: FUEL, segments: SEG, parts: PARTS,
    snapshots: snaps.map((s) => ({ date: s.d, n: s.n })),
    tramer_avg: meta.tramer_avg, tramer_n: meta.tramer_n,
    note: 'TR-plated (gb_plate_origin) latest snapshot per ad_id. Segment derived from series (clean). Columnar; filter + aggregate client-side. Damage packed 11 parts × 2 bits.',
  },
  dict: { series: seriesDict, city: cityDict, district: distDict, model: modelDict, body: bodyDict },
  cols,
};

fs.writeFileSync(OUT, JSON.stringify(out));
const bytes = fs.statSync(OUT).size;
console.log('wrote', OUT, '·', (bytes / 1e6).toFixed(2), 'MB ·', cols.p.length, 'rows');
console.log('dicts: series', seriesDict.length, '· city', cityDict.length, '· district', distDict.length, '· model', modelDict.length, '· body', bodyDict.length);
console.log('body types:', bodyDict.join(', '));
// clean segment distribution
const segDist = {}; cols.s.forEach((s) => { const k = s < 0 ? '?' : SEG[s]; segDist[k] = (segDist[k] || 0) + 1; });
console.log('clean segment dist:', JSON.stringify(segDist));
console.log('base_date', baseDate, '· max ld', Math.max(...cols.ld), '· tramer avg', meta.tramer_avg);
