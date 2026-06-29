// Pre-aggregates cars_feb.csv into a small JSON for the EDA page.
// Run: node scripts/build-eda.mjs
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const root = process.cwd();
const csvPath = path.join(root, 'cars_feb.csv');
const outPath = path.join(root, 'lib', 'eda-data.json');

const raw = fs.readFileSync(csvPath, 'utf8');
const { data: rows } = Papa.parse(raw, { header: true, dynamicTyping: false, skipEmptyLines: true });

const num = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// --- clean records ---
const recs = rows.map((r) => ({
    brand: r.brand,
    price: num(r.price),
    year: num(r.kb_year) ?? num(r.gb_year),
    mileage: num(r.kb_mileage) ?? num(r.gb_mileage),
    fuel: r.kb_fuel || r.gb_fuel,
    transmission: r.kb_transmission || r.gb_transmission,
    body: r.kb_body_type,
    segment: r.segment,
    power_hp: num(r.power_hp),
    engine_cc: num(r.engine_cc),
    torque_nm: num(r.torque_nm),
    heavy: String(r.is_heavy_damaged).toLowerCase() === 'true',
})).filter((r) => r.price && r.price > 0 && r.price < 20_000_000);

const M = 1_000_000;

// --- 1. price histogram (₺M) ---
const priceMaxM = 6;
const binW = 0.5;
const histBins = [];
for (let b = 0; b < priceMaxM; b += binW) histBins.push({ x0: b, x1: b + binW, count: 0 });
let histOver = 0;
for (const r of recs) {
    const pm = r.price / M;
    if (pm >= priceMaxM) { histOver++; continue; }
    const idx = Math.floor(pm / binW);
    if (histBins[idx]) histBins[idx].count++;
}
const priceHistogram = {
    labels: histBins.map((b) => `${b.x0}–${b.x1}`).concat([`${priceMaxM}+`]),
    counts: histBins.map((b) => b.count).concat([histOver]),
};

// --- 2. price by year (avg + count) ---
const yearMap = new Map();
for (const r of recs) {
    if (!r.year || r.year < 1990 || r.year > 2026) continue;
    const e = yearMap.get(r.year) || { sum: 0, n: 0 };
    e.sum += r.price; e.n++;
    yearMap.set(r.year, e);
}
const years = [...yearMap.keys()].sort((a, b) => a - b);
const priceByYear = {
    years,
    avg: years.map((y) => +(yearMap.get(y).sum / yearMap.get(y).n / M).toFixed(3)),
    count: years.map((y) => yearMap.get(y).n),
};

// --- 3. brand counts ---
const brandMap = new Map();
for (const r of recs) brandMap.set(r.brand, (brandMap.get(r.brand) || 0) + 1);
const brandSorted = [...brandMap.entries()].sort((a, b) => b[1] - a[1]);
const brandCounts = {
    brands: brandSorted.map(([b]) => titleCase(b)),
    counts: brandSorted.map(([, c]) => c),
};

// --- 4. mileage vs price scatter (sampled) ---
const sampleTarget = 2500;
const scatterSrc = recs.filter((r) => r.mileage != null && r.mileage >= 0 && r.mileage < 600000);
const step = Math.max(1, Math.floor(scatterSrc.length / sampleTarget));
const scatter = { km: [], price: [], brand: [] };
for (let i = 0; i < scatterSrc.length; i += step) {
    const r = scatterSrc[i];
    scatter.km.push(r.mileage);
    scatter.price.push(+(r.price / M).toFixed(3));
    scatter.brand.push(titleCase(r.brand));
}

// --- 5/6. categorical distributions ---
const distOf = (key) => {
    const m = new Map();
    for (const r of recs) { const v = r[key]; if (v) m.set(v, (m.get(v) || 0) + 1); }
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    return { labels: sorted.map(([k]) => k), values: sorted.map(([, v]) => v) };
};
const fuelDist = distOf('fuel');
const transmissionDist = distOf('transmission');
const segmentDist = distOf('segment');

// --- 7. price box stats by body type ---
const quantile = (arr, q) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return arr[base + 1] !== undefined ? arr[base] + rest * (arr[base + 1] - arr[base]) : arr[base];
};
const bodyMap = new Map();
for (const r of recs) { if (!r.body) continue; (bodyMap.get(r.body) || bodyMap.set(r.body, []).get(r.body)).push(r.price / M); }
const bodyBox = [...bodyMap.entries()]
    .filter(([, arr]) => arr.length >= 30)
    .map(([body, arr]) => {
        const s = arr.sort((a, b) => a - b);
        return {
            body,
            min: +quantile(s, 0.02).toFixed(2),
            q1: +quantile(s, 0.25).toFixed(2),
            median: +quantile(s, 0.5).toFixed(2),
            q3: +quantile(s, 0.75).toFixed(2),
            max: +quantile(s, 0.98).toFixed(2),
            n: s.length,
        };
    })
    .sort((a, b) => b.median - a.median);

// --- 8. correlation matrix ---
const corrFields = [
    ['year', 'Year'], ['mileage', 'Mileage'], ['power_hp', 'Power'],
    ['engine_cc', 'Engine'], ['torque_nm', 'Torque'], ['price', 'Price'],
];
const pearson = (xs, ys) => {
    const n = xs.length;
    if (n < 2) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num2 = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; num2 += a * b; dx += a * a; dy += b * b; }
    const d = Math.sqrt(dx * dy);
    return d === 0 ? 0 : num2 / d;
};
const corrMatrix = { labels: corrFields.map((f) => f[1]), z: [] };
for (const [fa] of corrFields) {
    const row = [];
    for (const [fb] of corrFields) {
        const pairs = recs.filter((r) => r[fa] != null && r[fb] != null);
        row.push(+pearson(pairs.map((r) => r[fa]), pairs.map((r) => r[fb])).toFixed(2));
    }
    corrMatrix.z.push(row);
}

// --- 9. damage impact ---
const dmg = { clean: { sum: 0, n: 0 }, heavy: { sum: 0, n: 0 } };
for (const r of recs) { const t = r.heavy ? dmg.heavy : dmg.clean; t.sum += r.price; t.n++; }
const damageImpact = {
    labels: ['No Heavy Damage', 'Heavy Damaged'],
    avg: [+(dmg.clean.sum / dmg.clean.n / M).toFixed(2), +(dmg.heavy.sum / dmg.heavy.n / M).toFixed(2)],
    count: [dmg.clean.n, dmg.heavy.n],
};

const out = {
    meta: { totalRows: recs.length, generatedAt: new Date().toISOString().slice(0, 10) },
    priceHistogram,
    priceByYear,
    brandCounts,
    scatter,
    fuelDist,
    transmissionDist,
    segmentDist,
    bodyBox,
    corrMatrix,
    damageImpact,
};

fs.writeFileSync(outPath, JSON.stringify(out));
const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`✓ EDA data written: ${outPath} (${kb} KB, ${recs.length} records, ${scatter.km.length} scatter pts)`);
