// scripts/shrink-site-data.mjs
// ---------------------------------------------------------------------------
// Shrinks the heavy 30K-point scatter arrays in a full `site_data` export down to
// a stratified, OUTLIER-preserving sample (+ rounded floats) so the served
// public/site_data.json stays light. The full 7.56 MB export is dominated by
// four raw point arrays (pred_vs_true, residual_scatter, pca_scatter,
// pca_scatter_13); everything else is tiny and copied through untouched.
//
// The report (app/_site/report/FinalReportSiteData.tsx) renders BOTH modes from
// these reduced arrays: density = histogram2d + zsmooth over the sample, points =
// ~1.2K body + red-ring outliers. The true population count stays in each object's
// `n` (used for R²/stats); we add `sampled` = the rendered point count.
//
// Re-run after each new full drop (keep the full file out of git):
//   node scripts/shrink-site-data.mjs "site_data (9).json"
// ---------------------------------------------------------------------------
import fs from 'node:fs';

const SRC = process.argv[2] || 'site_data (9).json';
const OUT = 'public/site_data.json';
const SCATTER_N = 6000, PCA_N = 3000, N_OUT = 120;

const round = (v) => Math.round(v);
const round2 = (v) => Math.round(v * 100) / 100;

// outlier-preserving stratified sample — mirrors the report's sampleRepresentative:
// force-keep the worst-|dev| points + axis extremes, then stratified-fill the body
// by x-bin. Deterministic (no RNG). Guarantees the extreme cases survive into the
// shipped JSON so the client can still ring them in red.
function sampleRepresentative(pts, devOf, target, nOut) {
    if (pts.length <= target) return pts.slice();
    const forced = new Set(
        pts.map((p, i) => [devOf(p), i]).sort((a, b) => b[0] - a[0]).slice(0, nOut).map((w) => w[1]),
    );
    let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
    pts.forEach((p, i) => { if (p[0] < pts[xmin][0]) xmin = i; if (p[0] > pts[xmax][0]) xmax = i; if (p[1] < pts[ymin][1]) ymin = i; if (p[1] > pts[ymax][1]) ymax = i; });
    [xmin, xmax, ymin, ymax].forEach((i) => forced.add(i));
    const rest = pts.map((_, i) => i).filter((i) => !forced.has(i));
    let lo = Infinity, hi = -Infinity;
    for (const i of rest) { const x = pts[i][0]; if (x < lo) lo = x; if (x > hi) hi = x; }
    const span = hi - lo || 1, BINS = 60, bodyTarget = target - forced.size;
    const buckets = Array.from({ length: BINS }, () => []);
    rest.forEach((i) => buckets[Math.min(BINS - 1, Math.floor((pts[i][0] - lo) / span * BINS))].push(i));
    const keep = new Set(forced);
    buckets.forEach((b) => { if (!b.length) return; const per = Math.max(1, Math.round(bodyTarget * b.length / rest.length)); const step = b.length / per; for (let k = 0; k < per; k++) keep.add(b[Math.floor(k * step)]); });
    return [...keep].map((i) => pts[i]);
}

// deterministic stratified-by-cluster sample — keeps each cluster's share so the
// PCA separation (incl. the small "Hasarlı" cluster) reads true.
function sampleByCluster(pts, target) {
    if (pts.length <= target) return pts.slice();
    const byC = {};
    pts.forEach((p, i) => { (byC[p[2]] ||= []).push(i); });
    const keep = [];
    for (const c of Object.keys(byC)) { const b = byC[c]; const per = Math.max(1, Math.round(target * b.length / pts.length)); const step = b.length / per; for (let k = 0; k < per; k++) keep.push(b[Math.floor(k * step)]); }
    return keep.map((i) => pts[i]);
}

const raw = fs.readFileSync(SRC, 'utf8');
const srcBytes = raw.length;
const d = JSON.parse(raw.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'));
const dom = d.domain;
const before = {}, after = {};

function shrinkScatter(key, devOf, roundY) {
    const o = dom[key];
    if (!o || !Array.isArray(o.points)) return;
    before[key] = o.points.length;
    const s = sampleRepresentative(o.points, devOf, SCATTER_N, N_OUT);
    o.points = s.map((p) => [round(p[0]), roundY(p[1])]);
    o.sampled = o.points.length; // rendered count; o.n stays the true population
    if (Array.isArray(o.ideal_line)) o.ideal_line = o.ideal_line.map(round);
    after[key] = o.points.length;
}
shrinkScatter('pred_vs_true', (p) => Math.abs(p[0] - p[1]), round);       // [actual, pred] → both ₺
shrinkScatter('residual_scatter', (p) => Math.abs(p[1]), round2);          // [pred ₺, resid %]

for (const key of ['pca_scatter', 'pca_scatter_13']) {
    if (!Array.isArray(dom[key])) continue;
    before[key] = dom[key].length;
    dom[key] = sampleByCluster(dom[key], PCA_N).map((p) => [round2(p[0]), round2(p[1]), p[2]]);
    after[key] = dom[key].length;
}

const outStr = JSON.stringify(d);
fs.writeFileSync(OUT, outStr);
console.log(`${SRC}  ${(srcBytes / 1e6).toFixed(2)} MB  ->  ${OUT}  ${(outStr.length / 1e6).toFixed(2)} MB`);
for (const k of Object.keys(before)) console.log(`  ${k}: ${before[k].toLocaleString()} -> ${after[k].toLocaleString()} pts`);
