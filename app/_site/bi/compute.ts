// Pure client-side aggregation for the Car Price BI dashboard.
// Loads the columnar export (public/bi_rows.json), filters row indices, and
// derives every panel's data so all charts + the Turkey map respond live to the
// filter bar. No backend; ~30k rows crunch in a few ms.

export const SEG = ['B', 'C', 'D', 'E', 'F', 'S']; // clean segments derived from series (see build-bi-rows.mjs)
export const FUEL = ['Benzin', 'Dizel', 'LPG', 'Hibrit'];
export const FUEL_COLORS: Record<string, string> = { Benzin: '#059669', Dizel: '#0d9aba', LPG: '#7c5cff', Hibrit: '#e08a1e' };
// 11 body parts, fixed order (matches scripts/build-bi-rows.mjs).
export const PARTS = ['kaput', 'tavan', 'bagaj', 'door_fl', 'door_fr', 'door_rl', 'door_rr', 'fender_fl', 'fender_fr', 'fender_rl', 'fender_rr'];
export const CURRENT_YEAR = 2026;
export const MATRIX_YEARS = [2021, 2022, 2023, 2024];
export const BUCKETS = [
    { lo: 0, hi: 2014, label: '≤2014' },
    { lo: 2015, hi: 2016, label: '15–16' },
    { lo: 2017, hi: 2018, label: '17–18' },
    { lo: 2019, hi: 2020, label: '19–20' },
    { lo: 2021, hi: 2022, label: '21–22' },
    { lo: 2023, hi: 9999, label: '23+' },
];

export interface Rows {
    meta: {
        n_raw: number; n_unique: number; base_date: string; brands: string[]; fuels: string[]; segments: string[];
        parts: string[]; snapshots: { date: string; n: number }[]; tramer_avg: number; tramer_n: number; note: string;
    };
    dict: { series: { b: number; name: string }[]; city: string[]; district: string[]; model: string[]; body: string[] };
    cols: {
        p: number[]; y: number[]; km: number[]; f: number[]; s: number[]; b: number[]; se: number[];
        ci: number[]; di: number[]; md: number[]; bt: number[]; ld: number[]; hd: number[]; dmg: number[];
    };
}

export interface Filters {
    brand: number; series: number; fuel: number; seg: number; damage: number; // -1 = any
    yearMin: number | null; yearMax: number | null;
    priceMin: number | null; priceMax: number | null; // TRY
    kmMin: number | null; kmMax: number | null;        // km
}

export const EMPTY_FILTERS: Filters = {
    brand: -1, series: -1, fuel: -1, seg: -1, damage: -1,
    yearMin: null, yearMax: null, priceMin: null, priceMax: null, kmMin: null, kmMax: null,
};

// ---- small stats helpers ----
export const dpart = (dmg: number, i: number) => (dmg >> (2 * i)) & 3;
const sortNum = (a: number[]) => a.slice().sort((x, y) => x - y);
export const median = (arr: number[]) => {
    if (!arr.length) return 0;
    const s = sortNum(arr); const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const quantileSorted = (s: number[], q: number) => {
    if (!s.length) return 0;
    const pos = (s.length - 1) * q, base = Math.floor(pos), rest = pos - base;
    return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
};
const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// ---- filtering ----
export function filterRows(raw: Rows, f: Filters): number[] {
    const c = raw.cols, n = c.p.length, out: number[] = [];
    for (let i = 0; i < n; i++) {
        if (f.brand >= 0 && c.b[i] !== f.brand) continue;
        if (f.series >= 0 && c.se[i] !== f.series) continue;
        if (f.fuel >= 0 && c.f[i] !== f.fuel) continue;
        if (f.seg >= 0 && c.s[i] !== f.seg) continue;
        if (f.damage === 0 && c.hd[i] !== 0) continue;
        if (f.damage === 1 && c.hd[i] !== 1) continue;
        const y = c.y[i];
        if (f.yearMin != null && (y < 0 || y < f.yearMin)) continue;
        if (f.yearMax != null && (y < 0 || y > f.yearMax)) continue;
        const p = c.p[i];
        if (f.priceMin != null && p < f.priceMin) continue;
        if (f.priceMax != null && p > f.priceMax) continue;
        const km = c.km[i];
        if (f.kmMin != null && (km < 0 || km < f.kmMin)) continue;
        if (f.kmMax != null && (km < 0 || km > f.kmMax)) continue;
        out.push(i);
    }
    return out;
}

export interface Agg {
    n: number;
    kpi: {
        avgPrice: number; medianPrice: number; avgAge: number; medianKm: number;
        cleanPct: number; damagedN: number;
        priceSpark: number[]; kmSpark: number[]; sparkYears: number[];
    };
    segmentPrice: { seg: string; avg: number; median: number; n: number }[];
    matrix: { buckets: string[]; rows: { series: string; brand: string; cells: number[]; total: number }[]; colTotals: number[]; grandTotal: number };
    recent: { id: number; brand: string; model: string; year: number; km: number; fuel: string; city: string; damaged: boolean; price: number }[];
    dailyVolume: { days: string[]; counts: number[]; highlightIdx: number; thisWeek: number; lastWeek: number };
    fuelYear: { years: string[]; series: { name: string; color: string; data: number[] }[] };
    fuelDonut: { name: string; value: number; color: string }[];
    brandRange: { brand: string; min: number; q1: number; median: number; q3: number; max: number }[];
    priceByYear: { year: number; price: number }[];
    density: { xLabels: string[]; yLabels: string[]; data: [number, number, number][]; max: number };
    scatter: { brand: string; color: string; points: [number, number][] }[];
    provinces: { name: string; n: number; median: number }[];
    provMax: number;
    priceHist: { labels: string[]; counts: number[] };
    bodyBox: { body: string; min: number; q1: number; median: number; q3: number; max: number; n: number }[];
    damageImpact: { clean: number; damaged: number; cleanN: number; damagedN: number };
    damageBySeg: { seg: string; pct: number; n: number; damaged: number }[];
}

const BRANDS = ['BMW', 'Audi'];
const dayToISO = (base: string, off: number) => {
    const d = new Date(Date.parse(base) + off * 86400000);
    return d.toISOString().slice(0, 10);
};

export function computeAgg(raw: Rows, idx: number[]): Agg {
    const c = raw.cols;
    const n = idx.length;

    // KPIs
    const prices: number[] = [], kms: number[] = [];
    let ageSum = 0, ageN = 0, damagedN = 0;
    for (const i of idx) {
        prices.push(c.p[i]);
        if (c.km[i] >= 0) kms.push(c.km[i]);
        if (c.y[i] > 0) { ageSum += CURRENT_YEAR - c.y[i]; ageN++; }
        if (c.hd[i] === 1) damagedN++;
    }
    const avgPrice = Math.round(mean(prices));
    const medianPrice = Math.round(median(prices));
    const medianKm = Math.round(median(kms));
    const avgAge = ageN ? +(ageSum / ageN).toFixed(1) : 0;
    const cleanPct = n ? +(100 * (n - damagedN) / n).toFixed(1) : 0;

    // price/km by year (spark + line)
    const byYearP = new Map<number, number[]>(), byYearKm = new Map<number, number[]>();
    for (const i of idx) {
        const y = c.y[i]; if (y <= 0) continue;
        (byYearP.get(y) || byYearP.set(y, []).get(y)!).push(c.p[i]);
        if (c.km[i] >= 0) (byYearKm.get(y) || byYearKm.set(y, []).get(y)!).push(c.km[i]);
    }
    const priceByYear = [...byYearP.entries()].map(([year, arr]) => ({ year, price: Math.round(mean(arr)), n: arr.length }))
        .filter((r) => r.n >= 3).sort((a, b) => a.year - b.year);
    const sparkYears = priceByYear.map((r) => r.year);
    const priceSpark = priceByYear.map((r) => r.price);
    const kmSpark = sparkYears.map((y) => Math.round(median(byYearKm.get(y) || [])));

    // segment prices
    const segArr: number[][] = SEG.map(() => []);
    for (const i of idx) { const s = c.s[i]; if (s >= 0) segArr[s].push(c.p[i]); }
    const segmentPrice = SEG.map((seg, si) => ({ seg, avg: Math.round(mean(segArr[si])), median: Math.round(median(segArr[si])), n: segArr[si].length }))
        .filter((r) => r.n > 0);

    // matrix: top-7 series × year buckets
    const seCount = new Map<number, number>();
    for (const i of idx) seCount.set(c.se[i], (seCount.get(c.se[i]) || 0) + 1);
    const topSe = [...seCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map((e) => e[0]);
    const seRowIdx = new Map(topSe.map((se, r) => [se, r]));
    const cells = topSe.map(() => BUCKETS.map(() => 0));
    const bucketIdx = (y: number) => { for (let bi = 0; bi < BUCKETS.length; bi++) if (y >= BUCKETS[bi].lo && y <= BUCKETS[bi].hi) return bi; return -1; };
    for (const i of idx) {
        const r = seRowIdx.get(c.se[i]); if (r === undefined) continue;
        const bi = bucketIdx(c.y[i]); if (bi >= 0) cells[r][bi]++;
    }
    const matrixRows = topSe.map((se, r) => {
        const s = raw.dict.series[se];
        return { series: s.name, brand: BRANDS[s.b], cells: cells[r], total: cells[r].reduce((a, b) => a + b, 0) };
    });
    const colTotals = BUCKETS.map((_, bi) => matrixRows.reduce((a, row) => a + row.cells[bi], 0));

    // recent (idx already date-desc)
    const recent = idx.slice(0, 14).map((i, k) => ({
        id: k + 1, brand: BRANDS[c.b[i]], model: raw.dict.model[c.md[i]] || '—',
        year: c.y[i], km: c.km[i], fuel: raw.meta.fuels[c.f[i]] || '—',
        city: c.ci[i] >= 0 ? raw.dict.city[c.ci[i]] : '—', damaged: c.hd[i] === 1, price: c.p[i],
    }));

    // daily volume — last 15 days of the global window
    let maxLd = 0; for (let i = 0; i < c.ld.length; i++) if (c.ld[i] > maxLd) maxLd = c.ld[i];
    const winStart = maxLd - 14;
    const dayCounts = new Array(15).fill(0);
    for (const i of idx) { const off = c.ld[i]; if (off >= winStart && off <= maxLd) dayCounts[off - winStart]++; }
    const highlightIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const dailyVolume = {
        days: Array.from({ length: 15 }, (_, k) => dayToISO(raw.meta.base_date, winStart + k)),
        counts: dayCounts, highlightIdx,
        thisWeek: dayCounts.slice(-7).reduce((a, b) => a + b, 0),
        lastWeek: dayCounts.slice(-14, -7).reduce((a, b) => a + b, 0),
    };

    // fuel × year (clustered)
    const fuelYearGrid = FUEL.map(() => MATRIX_YEARS.map(() => 0));
    const yPos = new Map(MATRIX_YEARS.map((y, k) => [y, k]));
    for (const i of idx) { const f = c.f[i], yp = yPos.get(c.y[i]); if (f >= 0 && yp !== undefined) fuelYearGrid[f][yp]++; }
    const fuelYear = {
        years: MATRIX_YEARS.map(String),
        series: FUEL.map((name, fi) => ({ name, color: FUEL_COLORS[name], data: fuelYearGrid[fi] })),
    };

    // fuel donut
    const fuelCount = FUEL.map(() => 0);
    for (const i of idx) { const f = c.f[i]; if (f >= 0) fuelCount[f]++; }
    const fuelDonut = FUEL.map((name, fi) => ({ name, value: fuelCount[fi], color: FUEL_COLORS[name] })).filter((d) => d.value > 0);

    // brand range (box)
    const brandPrices: number[][] = BRANDS.map(() => []);
    for (const i of idx) brandPrices[c.b[i]].push(c.p[i]);
    const brandRange = BRANDS.map((brand, bi) => {
        const s = sortNum(brandPrices[bi]);
        if (!s.length) return null;
        return { brand, min: s[0], q1: quantileSorted(s, 0.25), median: quantileSorted(s, 0.5), q3: quantileSorted(s, 0.75), max: s[s.length - 1] };
    }).filter(Boolean) as Agg['brandRange'];

    // density km × price
    const kmBin = 25000, kmMax = 500000, pBin = 500000, pMax = 6000000;
    const nx = kmMax / kmBin, ny = pMax / pBin;
    const grid = new Map<string, number>(); let dmax = 0;
    for (const i of idx) {
        const kmv = c.km[i], pv = c.p[i];
        if (kmv < 0 || kmv >= kmMax || pv < 0 || pv >= pMax) continue;
        const xi = Math.floor(kmv / kmBin), yi = Math.floor(pv / pBin), key = `${xi},${yi}`;
        const v = (grid.get(key) || 0) + 1; grid.set(key, v); if (v > dmax) dmax = v;
    }
    const density = {
        xLabels: Array.from({ length: nx }, (_, i) => `${(i * kmBin) / 1000}k`),
        yLabels: Array.from({ length: ny }, (_, i) => `${i * (pBin / 1e6)}M`),
        data: [...grid.entries()].map(([key, v]) => { const [xi, yi] = key.split(',').map(Number); return [xi, yi, v] as [number, number, number]; }),
        max: dmax,
    };

    // scatter (sampled per brand, cap ~1400 total)
    const cap = 1400, step = Math.max(1, Math.ceil(n / cap));
    const scPts: [number, number][][] = BRANDS.map(() => []);
    for (let k = 0; k < idx.length; k += step) { const i = idx[k]; if (c.km[i] >= 0) scPts[c.b[i]].push([c.km[i], c.p[i]]); }
    const PAL = ['#059669', '#7c5cff'];
    const scatter = BRANDS.map((brand, bi) => ({ brand, color: PAL[bi], points: scPts[bi] })).filter((s) => s.points.length);

    // provinces
    const provArr = new Map<number, number[]>();
    for (const i of idx) { const ci = c.ci[i]; if (ci < 0) continue; (provArr.get(ci) || provArr.set(ci, []).get(ci)!).push(c.p[i]); }
    const provinces = [...provArr.entries()].map(([ci, arr]) => ({ name: raw.dict.city[ci], n: arr.length, median: Math.round(median(arr)) }))
        .sort((a, b) => b.n - a.n);
    const provMax = provinces.length ? provinces[0].n : 0;

    // price histogram (₺M buckets, last bucket is overflow)
    const PH_BIN = 500000, PH_MAX = 6000000, PH_N = PH_MAX / PH_BIN;
    const phBins = new Array(PH_N).fill(0); let phOver = 0;
    for (const i of idx) { const bi = Math.floor(c.p[i] / PH_BIN); if (bi >= PH_N) phOver++; else if (bi >= 0) phBins[bi]++; }
    const priceHist = {
        labels: [...phBins.map((_, k) => `${(k * PH_BIN / 1e6).toFixed(1)}`), `${PH_MAX / 1e6}+`],
        counts: [...phBins, phOver],
    };

    // price by body type (box) — only bodies with a meaningful count
    const bodyArr = new Map<number, number[]>();
    for (const i of idx) { const bt = c.bt[i]; if (bt < 0) continue; (bodyArr.get(bt) || bodyArr.set(bt, []).get(bt)!).push(c.p[i]); }
    const bodyBox = [...bodyArr.entries()].filter(([, arr]) => arr.length >= 20).map(([bt, arr]) => {
        const s = sortNum(arr);
        return { body: raw.dict.body[bt], min: s[0], q1: quantileSorted(s, 0.25), median: quantileSorted(s, 0.5), q3: quantileSorted(s, 0.75), max: s[s.length - 1], n: arr.length };
    }).sort((a, b) => a.median - b.median);

    // heavy-damage price impact (clean vs heavy-damaged average)
    const cleanP: number[] = [], dmgP: number[] = [];
    for (const i of idx) (c.hd[i] === 1 ? dmgP : cleanP).push(c.p[i]);
    const damageImpact = { clean: Math.round(mean(cleanP)), damaged: Math.round(mean(dmgP)), cleanN: cleanP.length, damagedN: dmgP.length };

    // heavy-damage rate by (clean) segment
    const segTot = SEG.map(() => 0), segDmgC = SEG.map(() => 0);
    for (const i of idx) { const s = c.s[i]; if (s < 0) continue; segTot[s]++; if (c.hd[i] === 1) segDmgC[s]++; }
    const damageBySeg = SEG.map((seg, si) => ({ seg, pct: segTot[si] ? +(100 * segDmgC[si] / segTot[si]).toFixed(1) : 0, n: segTot[si], damaged: segDmgC[si] })).filter((x) => x.n > 0);

    return {
        n, kpi: { avgPrice, medianPrice, avgAge, medianKm, cleanPct, damagedN, priceSpark, kmSpark, sparkYears },
        segmentPrice, matrix: { buckets: BUCKETS.map((b) => b.label), rows: matrixRows, colTotals, grandTotal: colTotals.reduce((a, b) => a + b, 0) },
        recent, dailyVolume, fuelYear, fuelDonut, brandRange, priceByYear: priceByYear.map((r) => ({ year: r.year, price: r.price })), density, scatter, provinces, provMax,
        priceHist, bodyBox, damageImpact, damageBySeg,
    };
}

// districts for the selected province (city index) — filter-responsive drilldown
export function computeDistricts(raw: Rows, idx: number[], ci: number): { name: string; n: number; median: number }[] {
    if (ci < 0) return [];
    const c = raw.cols;
    const distArr = new Map<number, number[]>();
    for (const i of idx) { if (c.ci[i] !== ci || c.di[i] < 0) continue; (distArr.get(c.di[i]) || distArr.set(c.di[i], []).get(c.di[i])!).push(c.p[i]); }
    return [...distArr.entries()].map(([di, arr]) => ({ name: raw.dict.district[di], n: arr.length, median: Math.round(median(arr)) }))
        .sort((a, b) => b.n - a.n).slice(0, 15);
}

// damage grid — per-part count for the selected type (-1 = any damage, else code 1/2/3)
export function computeDamage(raw: Rows, idx: number[], type: number): { parts: number[]; max: number; typeTotals: number[] } {
    const c = raw.cols;
    const parts = PARTS.map(() => 0);
    const typeTotals = [0, 0, 0, 0]; // orijinal(unused)/lokal/boyalı/değişen part-instances
    for (const i of idx) {
        const dmg = c.dmg[i]; if (dmg === 0) continue;
        for (let pi = 0; pi < PARTS.length; pi++) {
            const code = dpart(dmg, pi);
            if (code > 0) typeTotals[code]++;
            if (type === -1 ? code > 0 : code === type) parts[pi]++;
        }
    }
    return { parts, max: Math.max(1, ...parts), typeTotals };
}
