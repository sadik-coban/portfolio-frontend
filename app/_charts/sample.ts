// Deterministic, outlier-preserving downsamplers for the 30K point clouds
// (SCATTER_RENDERING.md). Lifted out of FinalReportLab so the generated-report
// preview can draw the same charts from the same sample — no RNG, so both pages
// show identical clouds.

// ---- 30K-scatter downsamplers (SCATTER_RENDERING.md) ----
// Deterministic, outlier-PRESERVING downsample for a [x,y] point cloud: force-keep
// the worst-|dev| points (the extreme cases the reader must see) + axis extremes,
// then stratified-fill the body by x-bin so the sample mirrors the real
// distribution. No RNG → reproducible. Returns { body, outliers } so the extremes
// can be drawn as an always-on overlay in both render modes.
export function sampleRepresentative(pts: number[][], devOf: (p: number[]) => number, target = 1200, nOut = 80) {
    if (pts.length <= target) return { body: pts, outliers: [] as number[][] };
    const forced = new Set<number>(
        pts.map((p, i) => [devOf(p), i] as [number, number]).sort((a, b) => b[0] - a[0]).slice(0, nOut).map((w) => w[1]),
    );
    let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
    pts.forEach((p, i) => { if (p[0] < pts[xmin][0]) xmin = i; if (p[0] > pts[xmax][0]) xmax = i; if (p[1] < pts[ymin][1]) ymin = i; if (p[1] > pts[ymax][1]) ymax = i; });
    [xmin, xmax, ymin, ymax].forEach((i) => forced.add(i));
    const rest = pts.map((_, i) => i).filter((i) => !forced.has(i));
    let lo = Infinity, hi = -Infinity;
    for (const i of rest) { const x = pts[i][0]; if (x < lo) lo = x; if (x > hi) hi = x; }
    const span = hi - lo || 1, BINS = 50;
    const buckets: number[][] = Array.from({ length: BINS }, () => []);
    rest.forEach((i) => buckets[Math.min(BINS - 1, Math.floor((pts[i][0] - lo) / span * BINS))].push(i));
    const keep = new Set<number>();
    buckets.forEach((b) => { if (!b.length) return; const per = Math.max(1, Math.round(target * b.length / rest.length)); const step = b.length / per; for (let k = 0; k < per; k++) keep.add(b[Math.floor(k * step)]); });
    return { body: [...keep].map((i) => pts[i]), outliers: [...forced].map((i) => pts[i]) };
}

// deterministic stratified-by-cluster sample for the colored PCA scatter (keeps
// each cluster's share so the separation reads true).
export function sampleByCluster(pts: number[][], target = 2500) {
    if (pts.length <= target) return pts;
    const byC: Record<string, number[]> = {};
    pts.forEach((p, i) => { (byC[p[2]] ||= []).push(i); });
    const keep: number[] = [];
    for (const c of Object.keys(byC)) { const b = byC[c]; const per = Math.max(1, Math.round(target * b.length / pts.length)); const step = b.length / per; for (let k = 0; k < per; k++) keep.push(b[Math.floor(k * step)]); }
    return keep.map((i) => pts[i]);
}
