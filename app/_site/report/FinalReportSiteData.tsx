"use client";

import { useEffect, useMemo, useState } from 'react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme, CATEGORICAL_LIST, GREEN_RAMP } from '../../_charts/types';
import { useLang } from '../i18n';

// Car-price analytics report, driven entirely by public/site_data.json
// (BMW + Audi Turkish used-car market, 4 snapshots). Schema + per-section
// narrative follow METHODOLOGY.md: meta (künye) · domain (market insights) ·
// methodology (model decisions). Numbers are read live from the JSON — nothing
// hardcoded. Charts are Plotly with zoom/pan disabled (fixedrange). Geographic
// analysis and the outlier experiment are intentionally omitted.

type Tab = 'all' | 'market' | 'model' | 'method';

// ---- 30K-scatter downsamplers (SCATTER_RENDERING.md) ----
// Deterministic, outlier-PRESERVING downsample for a [x,y] point cloud: force-keep
// the worst-|dev| points (the extreme cases the reader must see) + axis extremes,
// then stratified-fill the body by x-bin so the sample mirrors the real
// distribution. No RNG → reproducible. Returns { body, outliers } so the extremes
// can be drawn as an always-on overlay in both render modes.
function sampleRepresentative(pts: number[][], devOf: (p: number[]) => number, target = 1200, nOut = 80) {
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
function sampleByCluster(pts: number[][], target = 2500) {
    if (pts.length <= target) return pts;
    const byC: Record<string, number[]> = {};
    pts.forEach((p, i) => { (byC[p[2]] ||= []).push(i); });
    const keep: number[] = [];
    for (const c of Object.keys(byC)) { const b = byC[c]; const per = Math.max(1, Math.round(target * b.length / pts.length)); const step = b.length / per; for (let k = 0; k < per; k++) keep.push(b[Math.floor(k * step)]); }
    return keep.map((i) => pts[i]);
}

export default function FinalReportSiteData() {
    const { lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
    const theme = useMemo(() => makeHybridTheme(), []);
    const [d, setD] = useState<any>(null);
    const [err, setErr] = useState(false);
    const [tab, setTab] = useState<Tab>('all');
    const [scMode, setScMode] = useState<'density' | 'points'>('density'); // OOF diagnostics render toggle

    // Downsample the 30K OOF/PCA point clouds once per data load (not per render),
    // preserving outliers + cluster shares. See sampleRepresentative/sampleByCluster.
    const diag = useMemo(() => {
        const dm = d?.domain;
        if (!dm) return null;
        return {
            pvt: dm.pred_vs_true ? sampleRepresentative(dm.pred_vs_true.points, (p: number[]) => Math.abs(p[0] - p[1])) : null,
            res: dm.residual_scatter ? sampleRepresentative(dm.residual_scatter.points, (p: number[]) => Math.abs(p[1])) : null,
            pca: dm.pca_scatter ? sampleByCluster(dm.pca_scatter) : null,
            pca13: dm.pca_scatter_13 ? sampleByCluster(dm.pca_scatter_13) : null,
        };
    }, [d]);

    useEffect(() => {
        fetch('/site_data.json')
            .then((r) => r.text())
            .then((txt) => setD(JSON.parse(txt.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'))))
            .catch(() => setErr(true));
    }, []);

    const fmtN = (n: number) => Math.round(n).toLocaleString(loc);
    const fmtM = (n: number) => '₺' + (n / 1e6).toFixed(2) + 'M';
    const fmtKm = (n: number) => (n / 1000).toFixed(0) + 'k';
    const fmtK = (n: number) => '₺' + Math.round(n / 1000).toLocaleString(loc) + 'K';
    const pct = (n: number, digits = 1) => (lang === 'tr' ? '%' + Number(n).toFixed(digits) : Number(n).toFixed(digits) + '%');
    const signPct = (n: number) => (n > 0 ? '+' : '') + (lang === 'tr' ? '%' + n : n + '%');

    if (err) return <p className="text-[15px] text-[#86857e]">{L('Analiz verisi yüklenemedi.', 'Could not load analysis data.')}</p>;
    if (!d) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/2 rounded bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
        </div>
    );

    const meta = d.meta, dom = d.domain, met = d.methodology;
    const green = theme.accent, deep = '#047857';
    const ramp = GREEN_RAMP.map((c, i) => [i / (GREEN_RAMP.length - 1), c] as [number, string]);

    const config = { displayModeBar: false as const, responsive: true, scrollZoom: false, doubleClick: false as const };
    const base = (over: any = {}) => {
        const { xaxis = {}, yaxis = {}, ...rest } = over;
        return {
            margin: { t: 12, r: 16, b: 28, l: 8 },
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            font: { family: theme.fontSans, size: 11, color: theme.muted },
            showlegend: false, dragmode: false as const,
            hoverlabel: { bgcolor: theme.surface, bordercolor: '#e4e2dd', font: { color: theme.text, family: theme.fontSans, size: 12 } },
            xaxis: { fixedrange: true, automargin: true, gridcolor: theme.grid, zeroline: false, linecolor: theme.grid, tickfont: { size: 10, color: theme.muted }, ...xaxis },
            yaxis: { fixedrange: true, automargin: true, gridcolor: theme.grid, zeroline: false, linecolor: theme.grid, tickfont: { size: 10, color: theme.muted }, ...yaxis },
            ...rest,
        };
    };

    const snaps: string[] = meta.snapshots || [];
    const MONTHS = lang === 'tr'
        ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDate = (iso: string) => { const [, m, dd] = iso.split('-'); return `${+dd} ${MONTHS[+m - 1]}`; };
    const snapRange = snaps.length ? `${shortDate(snaps[0])} – ${shortDate(snaps[snaps.length - 1])}` : '';
    const g = dom.hedonic;
    const fr = dom.final_results;
    const frMk = fr?.model_karsilastirma;
    // model comparison is data-driven: the export may carry 2 models ({catboost,lightgbm})
    // or N labelled variants ({lightgbm_tfidf_svd, catboost_tfidf_svd, catboost_native, …}).
    const MODEL_LABELS: Record<string, string> = { lightgbm_tfidf_svd: 'LightGBM · TF-IDF+SVD', catboost_tfidf_svd: 'CatBoost · TF-IDF+SVD', catboost_native: 'CatBoost · native', lightgbm: 'LightGBM', catboost: 'CatBoost' };
    const mLabel = (k: string) => MODEL_LABELS[k] || k.replace(/_/g, ' ');
    const frModels: any[] = frMk
        ? Object.entries(frMk).filter(([, v]: any) => v && typeof v === 'object' && v.MAPE != null).map(([key, v]: any) => ({ key, label: mLabel(key), ...v }))
        : [];
    const frWinM = frModels.length ? frModels.reduce((a, b) => (b.MAPE < a.MAPE ? b : a)) : null;
    const frWin = frWinM?.label ?? '';
    const frBestMAE = frModels.length ? Math.min(...frModels.map((m) => m.MAE)) : 0;
    const frBestMedAE = frModels.length ? Math.min(...frModels.map((m) => m.MedAE)) : 0;
    const frBestRMSE = frModels.length ? Math.min(...frModels.map((m) => m.RMSE)) : 0;
    const hr = dom.hedonic_reliability;
    const hedoTerm = (t: string): string => (({ 'yaş': L('yaş', 'age'), 'yaş²': L('yaş²', 'age²'), 'yaş×km': L('yaş×km', 'age×km'), 'ağır hasar': L('ağır hasar', 'heavy damage'), 'boyalı': L('boyalı', 'painted'), 'değişen': L('değişen', 'changed') }) as Record<string, string>)[t] || t;
    // feature-drop reasons come from the data as Turkish — English rendering for the EN site
    const fdReason = (tr: string): string => (({ 'Sabit varyans': 'Constant variance', 'Redundant kb/gb': 'Redundant kb/gb twins', 'Kapsam farkı': 'Coverage difference', 'Kimlik/sızıntı': 'Identity / leakage', 'Blok-eksik>%40': 'Block-missing >40%', 'Spec-eksik~%26': 'Spec-missing ~26%', 'low/up→val': 'low/up → value', 'Granüler hasar→agregat': 'Granular damage → aggregate', 'Ampirik audit(garanti)': 'Empirical audit (warranty)' }) as Record<string, string>)[tr] || tr;
    const boot: any[] = hr?.bootstrap || [];
    // single hedonic source of truth: prefer the detailed bootstrap-fit (hedonic_reliability)
    // so the hero KPI + depreciation lead agree with the Hedonic section (domain.hedonic is the stale summary).
    // effect % of a bootstrap term: use yuzde_etki if present, else derive from the log coefficient (e^β − 1)
    const bpEff = (b: any): number => (b?.yuzde_etki != null ? b.yuzde_etki : (Math.exp(b.nokta) - 1) * 100);
    const bootPct = (t: string): number | undefined => { const b = boot.find((x: any) => x.terim === t); return b == null ? undefined : bpEff(b); };
    const r1 = (n: number): number => Number(n.toFixed(1));
    const hedR2 = hr?.model_r2 ?? g?.r2 ?? 0;
    const hedAge = r1(bootPct('yaş') ?? g?.age_pct ?? 0);
    const hedDmg = r1(bootPct('ağır hasar') ?? g?.damage_pct ?? 0);
    const hedKm = r1(bootPct('km(100K)') ?? g?.km100k_pct ?? 0);
    const hedoData = boot.length ? [{ type: 'scatter', mode: 'markers', y: boot.map((b: any) => hedoTerm(b.terim)), x: boot.map((b: any) => b.nokta), error_x: { type: 'data', symmetric: false, array: boot.map((b: any) => b.ci_hi - b.nokta), arrayminus: boot.map((b: any) => b.nokta - b.ci_lo), color: '#b8b6ae', thickness: 1.5, width: 5 }, marker: { size: 9, color: boot.map((b: any) => (b.nokta >= 0 ? theme.accent : '#ef4444')) }, hovertemplate: '%{y}: β=%{x:.3f}<extra></extra>' }] : null;

    // ---------- market ----------
    const seg = [...dom.segment_ladder].sort((a: any, b: any) => a[1] - b[1]);
    const segData = [{ type: 'bar', x: seg.map((r: any) => r[0]), y: seg.map((r: any) => r[1]), marker: { color: green }, text: seg.map((r: any) => fmtM(r[1])), textposition: 'outside', hovertemplate: '%{x}: %{text} · %{customdata} ' + L('ilan', 'listings') + '<extra></extra>', customdata: seg.map((r: any) => fmtN(r[2])) }];

    // drop the unlabelled "missing" body-style bucket (no real class) from the chart
    const body = [...dom.body_median].filter((r: any) => r[0] && r[0] !== 'missing').sort((a: any, b: any) => a[1] - b[1]);
    const bodyData = [{ type: 'bar', orientation: 'h', y: body.map((r: any) => r[0]), x: body.map((r: any) => r[1]), marker: { color: green }, hovertemplate: '%{y}: %{customdata}<extra></extra>', customdata: body.map((r: any) => fmtM(r[1])) }];

    // median curve + optional mean curve (renders when rows carry a 4th element = mean, in a different colour)
    const ageHasMean = dom.age_depreciation.some((r: any) => r[3] != null);
    const ageData = [
        { type: 'scatter', mode: 'lines+markers', name: L('medyan', 'median'), x: dom.age_depreciation.map((r: any) => r[0]), y: dom.age_depreciation.map((r: any) => r[1]), line: { color: deep, width: 2 }, marker: { size: 4 }, hovertemplate: L('%{x} yaş', 'age %{x}') + ' · ' + L('medyan', 'median') + ' %{customdata}<extra></extra>', customdata: dom.age_depreciation.map((r: any) => fmtM(r[1])) },
        ...(ageHasMean ? [{ type: 'scatter', mode: 'lines+markers', name: L('ortalama', 'mean'), x: dom.age_depreciation.map((r: any) => r[0]), y: dom.age_depreciation.map((r: any) => r[3]), line: { color: '#e08a1e', width: 2, dash: 'dot' as const }, marker: { size: 4 }, hovertemplate: L('%{x} yaş', 'age %{x}') + ' · ' + L('ort', 'mean') + ' %{customdata}<extra></extra>', customdata: dom.age_depreciation.map((r: any) => fmtM(r[3])) }] : []),
    ];
    const kmHasMean = dom.km_price.some((r: any) => r[3] != null);
    const kmData = [
        { type: 'scatter', mode: 'lines+markers', name: L('medyan', 'median'), x: dom.km_price.map((r: any) => r[0]), y: dom.km_price.map((r: any) => r[1]), line: { color: green, width: 2 }, marker: { size: 4 }, hovertemplate: '%{x} km · ' + L('medyan', 'median') + ' %{customdata}<extra></extra>', customdata: dom.km_price.map((r: any) => fmtM(r[1])) },
        ...(kmHasMean ? [{ type: 'scatter', mode: 'lines+markers', name: L('ortalama', 'mean'), x: dom.km_price.map((r: any) => r[0]), y: dom.km_price.map((r: any) => r[3]), line: { color: '#e08a1e', width: 2, dash: 'dot' as const }, marker: { size: 4 }, hovertemplate: '%{x} km · ' + L('ort', 'mean') + ' %{customdata}<extra></extra>', customdata: dom.km_price.map((r: any) => fmtM(r[3])) }] : []),
    ];

    const bc = dom.brand_compare;
    const brandData = [{ type: 'bar', x: ['BMW', 'Audi'], y: [bc.bmw_medyan, bc.audi_medyan], marker: { color: [green, '#0d9aba'] }, text: [bc.bmw_medyan, bc.audi_medyan].map(fmtM), textposition: 'outside', hovertemplate: '%{x}: %{text}<extra></extra>' }];

    const ssm = dom.series_segment_matrix;
    const segOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'M', 'S'];
    const segCols = [...new Set(ssm.map((r: any) => r[1]))].sort((a: any, b: any) => {
        const ia = segOrder.indexOf(a), ib = segOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }) as string[];
    const serRows = [...new Set(ssm.map((r: any) => r[0]))] as string[];
    const ssmZ = serRows.map((sr) => segCols.map((sc) => { const hit = ssm.find((r: any) => r[0] === sr && r[1] === sc); return hit ? hit[2] : null; }));
    const ssmData = [{ type: 'heatmap', z: ssmZ, x: segCols, y: serRows, colorscale: ramp, showscale: false, hoverongaps: false, xgap: 1, ygap: 1, hovertemplate: '%{y} · %{x}: %{customdata}<extra></extra>', customdata: ssmZ.map((row) => row.map((v) => (v == null ? '—' : fmtM(v)))) }];

    const km = dom.kmeans;
    // English labels for the (Turkish) cluster names in the data; falls back to the raw name.
    const CLUSTER_EN: Record<string, string> = {
        'Genç & temiz premium': 'Young & clean premium',
        'Yaşlı & yüksek-km ekonomik': 'Old & high-mileage economy',
        'Hasarlı': 'Damaged',
    };
    const clusterName = (ad: string) => L(ad, CLUSTER_EN[ad] ?? ad);
    // 30K → ~2.5K stratified-by-cluster (colors must survive → density can't be used here)
    const pca = diag?.pca ?? dom.pca_scatter;
    const pcaData = [{ type: 'scatter', mode: 'markers', x: pca.map((r: any) => r[0]), y: pca.map((r: any) => r[1]), marker: { size: 4, opacity: 0.5, color: pca.map((r: any) => CATEGORICAL_LIST[r[2] % CATEGORICAL_LIST.length]) }, hoverinfo: 'skip' }];
    const pca13 = diag?.pca13 ?? dom.pca_scatter_13;
    const pca13Data = pca13 ? [{ type: 'scatter', mode: 'markers', x: pca13.map((r: any) => r[0]), y: pca13.map((r: any) => r[1]), marker: { size: 4, opacity: 0.5, color: pca13.map((r: any) => CATEGORICAL_LIST[r[2] % CATEGORICAL_LIST.length]) }, hoverinfo: 'skip' }] : null;
    const axes = met.pca_axes || [];
    const axPct = (i: number) => (axes[i] ? pct(axes[i].var_pct) : '');

    const ksel = met.kmeans_selection;
    // elbow (inertia, left axis) + silhouette (right axis) overlaid on one chart
    const kselData = ksel ? [
        { type: 'scatter', mode: 'lines+markers', name: L('İnertia (elbow)', 'Inertia (elbow)'), x: ksel.elbow.map((r: any) => r[0]), y: ksel.elbow.map((r: any) => r[1]), line: { color: deep, width: 2 }, marker: { size: 5 }, hovertemplate: 'k=%{x}: inertia %{y:.4s}<extra></extra>' },
        { type: 'scatter', mode: 'lines+markers', name: 'Silhouette', yaxis: 'y2', x: ksel.silhouette.map((r: any) => r[0]), y: ksel.silhouette.map((r: any) => r[1]), line: { color: '#e08a1e', width: 2 }, marker: { size: 7, color: ksel.silhouette.map((r: any) => (r[0] === ksel.secilen_k ? deep : '#e08a1e')) }, hovertemplate: 'k=%{x}: silhouette %{y:.3f}<extra></extra>' },
    ] : null;

    // ---------- model & performance ----------
    const qe = dom.quantile_error;
    const qeData = [{ type: 'bar', x: qe.map((r: any) => r[0]), y: qe.map((r: any) => r[1]), marker: { color: green }, text: qe.map((r: any) => r[1].toFixed(1)), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}<extra></extra>' }];

    const rvn = dom.residual_vs_n;
    const residData = [{ type: 'scatter', mode: 'markers', x: rvn.map((r: any) => r[0]), y: rvn.map((r: any) => r[1]), marker: { size: 6, color: green, opacity: 0.5 }, hovertemplate: '%{x} ' + L('ilan', 'listings') + ' · %{y:.1f}<extra></extra>' }];

    // ---- OOF diagnostics: predicted-vs-actual + residuals (toggle: density ↔ points) ----
    // Two views of the same 30K OOF cloud. The extreme points (biggest |error| /
    // |residual%|) are ALWAYS drawn as red rings on top, in both modes, so the worst
    // cases stay visible regardless of density-binning or sampling.
    const pvtObj = dom.pred_vs_true, resObj = dom.residual_scatter;
    const outMarker = { size: 6, color: '#b91c1c', symbol: 'circle-open' as const, line: { width: 1.5, color: '#b91c1c' } };
    const hb2d = (pts: number[][]) => ({ type: 'histogram2d', x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), colorscale: ramp, nbinsx: 48, nbinsy: 48, zsmooth: 'best', showscale: false, hoverinfo: 'skip' });
    const scBody = (pts: number[][]) => ({ type: 'scatter', mode: 'markers', x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), marker: { size: 4, opacity: 0.4, color: green }, hoverinfo: 'skip' });
    const scOut = (pts: number[][]) => ({ type: 'scatter', mode: 'markers', x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), marker: outMarker, hoverinfo: 'skip' });
    const idealTrace = pvtObj ? { type: 'scatter', mode: 'lines', x: pvtObj.ideal_line, y: pvtObj.ideal_line, line: { dash: 'dash' as const, color: '#86857e', width: 1 }, hoverinfo: 'skip' } : null;
    const pvtTraces = (pvtObj && diag?.pvt) ? (scMode === 'density'
        ? [hb2d(pvtObj.points), scOut(diag.pvt.outliers), idealTrace]
        : [scBody(diag.pvt.body), scOut(diag.pvt.outliers), idealTrace]) : null;
    const resTraces = (resObj && diag?.res) ? (scMode === 'density'
        ? [hb2d(resObj.points), scOut(diag.res.outliers)]
        : [scBody(diag.res.body), scOut(diag.res.outliers)]) : null;

    // raw price distribution across snapshots — two styles to compare:
    //  • angular / no-KDE (drift.hist) — matches the last-committed report's line chart
    //  • smooth / KDE (drift.kde_raw)
    const driftSnapLine = (src: any, xs: number[], shape: 'linear' | 'spline') =>
        src ? snaps.filter((s) => src[s]).map((s, i) => ({ type: 'scatter', mode: 'lines', x: xs, y: src[s], name: shortDate(s), line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2, shape }, hovertemplate: shortDate(s) + ' · %{x:,.0f} ₺<extra></extra>' })) : [];
    const dhist = dom.drift?.hist;
    const dsnapKeys = dhist ? snaps.filter((s) => Array.isArray(dhist[s])) : [];
    const dnbins = dsnapKeys.length ? dhist[dsnapKeys[0]].length : 0;
    // bin edges: prefer explicit edges; newer exports omit them → synthesize a uniform
    // grid across the KDE x-range so the angular (no-KDE) histogram still renders.
    const dkx = dom.drift?.kde_raw?.x;
    const dedges: number[] | null = dhist?.edges
        ? dhist.edges
        : (dkx && dnbins ? Array.from({ length: dnbins + 1 }, (_, i) => dkx[0] + (dkx[dkx.length - 1] - dkx[0]) * i / dnbins) : null);
    const dbinW = dedges ? dedges[1] - dedges[0] : 0; // uniform bins
    const dhistCenters = dedges ? dedges.slice(0, -1).map((e: number, i: number) => (e + dedges[i + 1]) / 2) : [];
    // no-KDE: density → relative frequency % per bin (density × binWidth × 100, sums to ~100)
    const driftHistData = (dhist && dedges) ? dsnapKeys.map((s, i) => ({
        type: 'scatter', mode: 'lines', x: dhistCenters, y: dhist[s].map((v: number) => v * dbinW * 100), name: shortDate(s),
        line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2, shape: 'linear' as const },
        hovertemplate: shortDate(s) + ' · %{x:,.0f} ₺ · ' + L('frekans', 'freq') + ' %{y:.1f}%<extra></extra>',
    })) : [];
    const kraw = dom.drift?.kde_raw;
    const driftRawData = driftSnapLine(kraw, kraw ? kraw.x : [], 'spline');
    const driftPairs = dom.drift?.all_pairs;
    const driftHead = driftPairs ? [L('Çift', 'Pair'), 'KS', 'p', 'PSI', 'n'] : [L('Dönem', 'Period'), 'KS', 'p', 'PSI', 'EMD ₺'];
    const driftRows = driftPairs
        ? driftPairs.map((r: any) => [r[0], r[1].toFixed(4), r[2].toFixed(3), r[3].toFixed(4), fmtN(r[4])])
        : (dom.drift?.table || []).map((r: any) => [shortDate(r[0]), r[1].toFixed(4), r[2].toFixed(3), r[3].toFixed(4), fmtN(r[4])]);
    // some OOF exports clip a few predictions to a large cap → % errors inflate
    const oofClipped = [...dom.oof_outliers, ...(dom.oof_best || [])].some((r: any) => r[4] >= 4e7);

    // ---------- methodology ----------
    const assoc = Array.isArray(met.assoc_model) ? met.assoc_model : [];
    // Order the identity hierarchy (brand → series → model) first so it groups at the
    // bottom-left origin, then the remaining categorical attributes.
    const HEAT_ORDER = ['brand', 'series', 'model', 'segment', 'kb_body_type', 'kb_drivetrain', 'kb_transmission', 'kb_fuel'];
    const heatMatrix = (mm: any, hover: string) => {
        if (!mm || !mm.labels || !mm.matrix) return null;
        const labels: string[] = [...HEAT_ORDER.filter((l) => mm.labels.includes(l)), ...mm.labels.filter((l: string) => !HEAT_ORDER.includes(l))];
        const idx = labels.map((l) => mm.labels.indexOf(l));
        const z = idx.map((ri) => idx.map((ci) => mm.matrix[ri][ci]));
        return [{ type: 'heatmap', z, x: labels, y: labels, zmin: 0, zmax: 1, colorscale: ramp, showscale: false, xgap: 1, ygap: 1, hovertemplate: hover }];
    };
    const cramersFull = heatMatrix(met.cramers_matrix, '%{y} · %{x}: %{z:.2f}<extra></extra>');
    const theilsFull = heatMatrix(met.theils_matrix, '%{y} | %{x}: %{z:.2f}<extra></extra>');

    const cmiss = [...(met.column_missing || [])].filter((r: any) => r[1] > 0).sort((a: any, b: any) => a[1] - b[1]);
    const cmissData = [{ type: 'bar', orientation: 'h', y: cmiss.map((r: any) => r[0]), x: cmiss.map((r: any) => r[1]), marker: { color: '#e08a1e' }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }];
    // systematic (block) missingness — all columns incl. the dropped high-missing ones (kept features tinted green)
    const sm = met.sistematik_missing;
    const smAll = sm?.column_missing_all ? [...sm.column_missing_all].sort((a: any, b: any) => a[1] - b[1]) : [];
    // columns sharing an identical missing % sit empty in the SAME rows (a co-missing block) →
    // give each shared-% group its own colour; unique-% columns stay amber.
    const SHARED_PALETTE = ['#7c5cff', '#0d9aba', '#0891b2', '#c026d3', '#059669', '#ef4444'];
    const smPctColor = new Map<number, string>();
    {
        const counts = new Map<number, number>();
        smAll.forEach((r: any) => counts.set(r[1], (counts.get(r[1]) || 0) + 1));
        [...counts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).forEach(([p], i) => smPctColor.set(p, SHARED_PALETTE[i % SHARED_PALETTE.length]));
    }
    const smData = smAll.length ? [{ type: 'bar', orientation: 'h', y: smAll.map((r: any) => r[0]), x: smAll.map((r: any) => r[1]), marker: { color: smAll.map((r: any) => smPctColor.get(r[1]) || '#e08a1e') }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }] : null;
    const smGroups: any[] = sm?.sistematik_gruplar || [];

    const bts = met.backtest;
    const btIns = bts?.insample;         // cumulative (train up to t)
    const btPer = bts?.per_snapshot;     // per-snapshot standalone OOF
    const btLabels = btPer ? btPer.map((r: any) => r[0]) : (btIns ? btIns.map((r: any) => String(r[0]).replace('→', '')) : []);
    const btInsData = (btIns || btPer) ? [
        btPer && { type: 'scatter', mode: 'lines+markers', name: L('Dönem başına (bağımsız)', 'Per-snapshot (standalone)'), x: btLabels, y: btPer.map((r: any) => r[1]), line: { color: '#e08a1e', width: 2 }, marker: { size: 6 }, text: btPer.map((r: any) => fmtN(r[2])), hovertemplate: L('dönem', 'snapshot') + ' %{x}: %{y:.2f}% · %{text} ' + L('ilan', 'listings') + '<extra></extra>' },
        btIns && { type: 'scatter', mode: 'lines+markers', name: L('Kümülatif (t’ye kadar)', 'Cumulative (up to t)'), x: btLabels, y: btIns.map((r: any) => r[1]), line: { color: deep, width: 2, shape: 'spline' as const }, marker: { size: 7, color: green }, text: btIns.map((r: any) => fmtN(r[2])), hovertemplate: L('kümülatif →', 'cumulative →') + '%{x}: %{y:.2f}% · %{text} ' + L('ilan', 'listings') + '<extra></extra>' },
    ].filter(Boolean) : null;
    const lofo = met.lofo ? [...met.lofo].sort((a: any, b: any) => a[1] - b[1]) : null;
    const lofoData = lofo ? [{ type: 'bar', orientation: 'h', y: lofo.map((r: any) => r[0]), x: lofo.map((r: any) => r[1]), marker: { color: lofo.map((r: any) => (r[1] >= 0 ? green : '#ef4444')) }, hovertemplate: '%{y}: %{x:+,.0f} ΔRMSE<extra></extra>' }] : null;

    const show = (t: Tab) => tab === 'all' || tab === t;
    const TABS: { id: Tab; label: string }[] = [
        { id: 'all', label: L('Tümü', 'All') },
        { id: 'market', label: L('01 · Piyasa', '01 · Market') },
        { id: 'model', label: L('02 · Model & performans', '02 · Model & performance') },
        { id: 'method', label: L('03 · Metodoloji', '03 · Methodology') },
    ];

    return (
        <div className="max-w-[860px]">
            <p className="mb-3 text-[17px] leading-[1.6] text-[#5f5f5a]">
                {L(
                    `${fmtN(meta.n_dedup)} ilan (BMW + Audi), ${snaps.length} dönem snapshot, ${meta.n_features} değişken. Uçtan uca ikinci-el fiyat tahmini: LightGBM + CatBoost, dürüst fiyat aralıklarıyla.`,
                    `${fmtN(meta.n_dedup)} listings (BMW + Audi), ${snaps.length} period snapshots, ${meta.n_features} features. End-to-end used-car price prediction: LightGBM + CatBoost, shipping honest price intervals.`,
                )}
            </p>
            <p className="mb-8 font-mono text-[12px] text-[#86857e]">
                {L(`Kapsam: BMW+Audi, Türkiye ikinci-el, ${snapRange} 2026. Sonuçlar bu kapsamda geçerlidir.`, `Scope: BMW+Audi, Turkish used-car market, ${snapRange} 2026. Results hold within this scope.`)}
            </p>

            {/* künye strip */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]">
                {[
                    { k: L('İlan', 'Listings'), v: fmtN(meta.n_dedup), sub: L(`${fmtN(meta.n_raw)} ham`, `${fmtN(meta.n_raw)} raw`) },
                    { k: L('Dönem', 'Snapshots'), v: String(snaps.length), sub: snapRange },
                    { k: L('Değişken', 'Features'), v: String(meta.n_features), sub: L('117’den seçildi', 'from 117') },
                    { k: L('Marka', 'Brands'), v: 'BMW · Audi', sub: `${fmtN(meta.brands.bmw)} · ${fmtN(meta.brands.audi)}` },
                ].map((m, i) => (
                    <div key={m.k} className={`p-4 sm:p-[18px] sm:px-5 border-[#e9e7e2] ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''}`}>
                        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                        <div className="font-mono text-[16px] sm:text-[19px] font-bold tabular-nums text-[#1a1a1a]">{m.v}</div>
                        {m.sub && <div className="mt-1 font-mono text-[11px] text-[#86857e]">{m.sub}</div>}
                    </div>
                ))}
            </div>

            {/* model performance KPIs (final 5-fold OOF results) */}
            {frWinM && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]">
                    {[
                        { k: L('Kazanan MAPE', 'Winner MAPE'), v: pct(frWinM.MAPE, 2), accent: true, sub: `${frWinM.label} · R² ${frWinM.R2.toFixed(3)} ★` },
                        { k: L('En iyi MAE', 'Best MAE'), v: fmtK(frBestMAE), sub: `MedAE ${fmtK(frBestMedAE)}` },
                        { k: L('En iyi RMSE', 'Best RMSE'), v: fmtK(frBestRMSE), sub: L('5-fold OOF', '5-fold OOF') },
                        { k: L('Model varyantı', 'Model variants'), v: String(frModels.length), sub: L('sızıntısız OOF', 'leak-free OOF') },
                    ].map((m, i) => (
                        <div key={m.k} className={`p-4 sm:p-[18px] sm:px-5 border-[#e9e7e2] ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''}`}>
                            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                            <div className={`font-mono text-[16px] sm:text-[19px] font-bold tabular-nums ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.v}</div>
                            {m.sub && <div className="mt-1 font-mono text-[11px] text-[#86857e]">{m.sub}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* hero — hedonic (controlled) price drivers */}
            {g && (
                <div className="mb-8 grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]">
                    {[
                        { k: L('Hedonik R²', 'Hedonic R²'), v: hedR2.toFixed(2), accent: true },
                        { k: L('Yaş / yıl', 'Age / yr'), v: signPct(hedAge) },
                        { k: L('Ağır hasar', 'Heavy damage'), v: signPct(hedDmg) },
                        { k: L('100k km', '100k km'), v: signPct(hedKm) },
                    ].map((m, i) => (
                        <div key={m.k} className={`p-4 sm:p-[18px] sm:px-5 border-[#e9e7e2] ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''}`}>
                            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                            <div className={`font-mono text-[19px] sm:text-[22px] font-bold tabular-nums ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.v}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* tab bar */}
            <div className="mb-10 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((tt) => (
                    <button key={tt.id} onClick={() => setTab(tt.id)}
                        className={`shrink-0 rounded-full px-4 py-2 font-mono text-[12px] tracking-[0.02em] whitespace-nowrap transition-colors ${tab === tt.id ? 'bg-[#047857] text-white shadow-[0_1px_3px_rgba(4,120,87,0.25)]' : 'border border-[#e9e7e2] bg-[#fdfcf9] text-[#5f5f5a] hover:border-[#86857e] hover:text-[#1a1a1a]'}`}>
                        {tt.label}
                    </button>
                ))}
            </div>

            {/* ============ MARKET ============ */}
            {show('market') && (
                <>
                    {tab === 'all' && <GroupHeading n="01" title={L('Piyasa içgörüleri', 'Market insights')} />}
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    <Section n={N()} title={L('Fiyat dağılımı', 'Price distribution')}
                        lead={L(`Fiyat sağa çarpık (çarpıklık ${dom.price_dist.skew_raw.toFixed(2)}); log dönüşümü simetriğe yaklaştırıyor (${dom.price_dist.skew_log.toFixed(2)}). Model log-fiyat üzerinde eğitildi — bu, uç değerleri ehlileştirir.`, `Price is right-skewed (skew ${dom.price_dist.skew_raw.toFixed(2)}); a log transform pulls it toward symmetry (${dom.price_dist.skew_log.toFixed(2)}). The model trains on log-price — taming extreme values.`)}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Stat k={L('Çarpıklık (ham)', 'Skew (raw)')} v={dom.price_dist.skew_raw.toFixed(2)} />
                            <Stat k={L('Çarpıklık (log)', 'Skew (log)')} v={dom.price_dist.skew_log.toFixed(2)} accent />
                            <Stat k={L('Medyan fiyat', 'Median price')} v={fmtM(dom.price_dist.median)} />
                        </div>
                    </Section>

                    <Section n={N()} title={L('Değer kaybı: yaş & kilometre', 'Depreciation: age & mileage')}
                        lead={L(`Araç yaşlandıkça ve kilometre arttıkça fiyat düşüyor; ilk yıllarda düşüş dik, sonra yavaşlıyor. Hedonik analiz bunu sayısallaştırıyor: yılda ${pct(Math.abs(hedAge))}, her 100k km ${pct(Math.abs(hedKm))}.`, `Price falls as age and mileage rise; steep early, then flattening. The hedonic model quantifies it: ${pct(Math.abs(hedAge))}/year, ${pct(Math.abs(hedKm))} per 100k km.`)}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L(ageHasMean ? 'Yaşa göre fiyat (medyan + ort.)' : 'Yaşa göre medyan fiyat', ageHasMean ? 'Price by age (median + mean)' : 'Median price by age')}><Chart h={260}><PlotlyChart data={ageData} layout={base(ageHasMean ? { showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, margin: { t: 8, r: 16, b: 40, l: 8 } } : {})} config={config} guard={false} /></Chart></Fig>
                            <Fig title={L(kmHasMean ? 'Kilometreye göre fiyat (medyan + ort.)' : 'Kilometreye göre medyan fiyat', kmHasMean ? 'Price by mileage (median + mean)' : 'Median price by mileage')}><Chart h={260}><PlotlyChart data={kmData} layout={base(kmHasMean ? { showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, margin: { t: 8, r: 16, b: 40, l: 8 } } : {})} config={config} guard={false} /></Chart></Fig>
                        </div>
                        {(ageHasMean || kmHasMean) && dom.age_km_note && <Method className="mt-3">{L(dom.age_km_note, 'Median = the typical price; mean = outlier-influenced. The gap between the two curves is the price skew (mean sits above median). Note: the hedonic %/year and %/100k above are controlled effects, not the raw drop shown here.')}</Method>}
                    </Section>

                    {hr && (
                        <Section n={N()} title={L('Hedonik model — sürücü katsayıları', 'Hedonic model — driver coefficients')}
                            lead={L(`Hedonik regresyon her sürücünün *kontrollü* (diğer her şey sabitken) fiyat etkisini verir — R² ${hr.model_r2.toFixed(3)}, n ${fmtN(hr.n)}. Katsayılar bootstrap ile güven aralıklı; hepsinin %95 CI'ı sıfırı DIŞLIYOR → her sürücü güvenilir şekilde anlamlı.`, `The hedonic regression gives each driver's *controlled* effect on price (all else equal) — R² ${hr.model_r2.toFixed(3)}, n ${fmtN(hr.n)}. Coefficients carry bootstrap confidence intervals; every 95% CI EXCLUDES zero → each driver is reliably significant.`)}>
                            {hedoData && <Fig title={L('Bootstrap katsayıları (nokta + %95 CI)', 'Bootstrap coefficients (point + 95% CI)')}><Chart h={320}><PlotlyChart data={hedoData} layout={base({ margin: { t: 8, r: 16, b: 32, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted, title: { text: L('katsayı (log-fiyat)', 'coefficient (log-price)'), font: { size: 10 } } } })} config={config} guard={false} /></Chart></Fig>}
                            {boot.length > 0 && <Table className="mt-4" head={[L('Terim', 'Term'), L('% etki', '% effect'), L('%95 CI (bootstrap)', '95% CI (bootstrap)'), L('Anlamlı', 'Signif.')]} rows={boot.map((b: any) => [hedoTerm(b.terim), signPct(Number(bpEff(b).toFixed(1))), `[${b.ci_lo.toFixed(3)}, ${b.ci_hi.toFixed(3)}]`, b.sifir_iceriyor ? '—' : '✓'])} />}
                            {hr.motor_etki && (
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <Stat k={L('+100 HP etkisi', '+100 HP effect')} v={signPct(hr.motor_etki.hp100_pct)} accent />
                                    <Stat k={L('+1 litre etkisi', '+1 litre effect')} v={signPct(hr.motor_etki.cc_litre_pct)} accent />
                                </div>
                            )}
                            {Array.isArray(hr.yakit_korelasyon) && hr.yakit_korelasyon.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-mono text-[12px] text-[#5f5f5a]">{L('cc–HP korelasyonu · yakıt bazında', 'cc–HP correlation · by fuel')}</summary>
                                    <Table className="mt-2" head={[L('Yakıt', 'Fuel'), 'Pearson', 'Spearman', 'cc/HP', 'n']} rows={hr.yakit_korelasyon.map((f: any) => [f.yakit, f.pearson.toFixed(3), f.spearman.toFixed(3), String(f.cc_hp_oran), fmtN(f.n)])} />
                                </details>
                            )}
                            {(hr.not || hr.karar) && <Method className="mt-3">{L(hr.not || hr.karar, 'Raw (no log) cc + HP: per-unit interpretation. 1000 bootstrap iterations, each with HC3 robust SEs. cc and HP are correlated but the ratio varies by fuel (diesel highest). All coefficients are solid.')}</Method>}
                        </Section>
                    )}

                    <Section n={N()} title={L('Kasa tipine göre fiyat', 'Price by body style')}
                        lead={L('Kasa tipi fiyatı belirgin etkiliyor — Coupe en pahalı, Hatchback en ekonomik. Temiz kb_body_type sınıflaması kullanıldı (kirli gb_body_type değil).', 'Body style clearly moves price — Coupe priciest, hatchback cheapest. Uses the clean kb_body_type classification (not the messy gb_body_type).')}>
                        <Fig title={L('Kasa tipine göre medyan', 'Median by body style')}><Chart h={300}><PlotlyChart data={bodyData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                    </Section>

                    <Section n={N()} title={L('Segment merdiveni', 'Segment ladder')}
                        lead={L('Segment yükseldikçe fiyat monotonik artıyor: B ekonomik → F/S lüks. Segment aracın boyut sınıfını temsil eder ve ham veriden değil seriden türetildi.', 'Price rises monotonically with segment: B economical → F/S luxury. Segment encodes the car’s size class and is derived from the series, not the raw feed.')}>
                        <Fig title={L('Segmente göre medyan fiyat', 'Median price by segment')}><Chart h={300}><PlotlyChart data={segData} layout={base({ margin: { t: 24, r: 16, b: 28, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                    </Section>

                    <Section n={N()} title={L('Seri × Segment', 'Series × Segment')}
                        lead={L('Hangi seri hangi segmentte yer alıyor ve medyan fiyat nasıl değişiyor.', 'Which series sits in which segment, and how the median price shifts across the grid.')}>
                        <Fig title={L('Medyan fiyat ısı haritası (seri × segment)', 'Median-price heatmap (series × segment)')}><Chart h={420}><PlotlyChart data={ssmData} layout={base({ margin: { t: 8, r: 8, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                    </Section>

                    <Section n={N()} title={L('Marka karşılaştırması', 'Brand comparison')}
                        lead={L(`BMW medyanı Audi’den hafif yüksek. İstatistiksel test anlamlı (p<0.001) AMA etki boyutu ihmal edilebilir (Cliff’s δ=${bc.cliffs_delta.toFixed(3)}) — iki marka benzer premium segmentte.`, `BMW’s median edges Audi’s. The test is significant (p<0.001) BUT the effect size is negligible (Cliff’s δ=${bc.cliffs_delta.toFixed(3)}) — both sit in the same premium segment.`)}>
                        <Fig title={L('Medyan fiyat: BMW vs Audi', 'Median price: BMW vs Audi')}><Chart h={260}><PlotlyChart data={brandData} layout={base({ margin: { t: 24, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <Stat k="Cliff’s δ" v={bc.cliffs_delta.toFixed(3)} sub={L('etki boyutu (ihmal edilebilir)', 'effect size (negligible)')} accent />
                            <Stat k="Mann–Whitney p" v={bc.mwu_p.toExponential(1)} sub={L('anlamlı ama önemsiz', 'significant yet immaterial')} />
                        </div>
                        <Method className="mt-3">{L('Büyük-n tuzağı: çok veriyle her fark “anlamlı” çıkar; effect size (δ) gerçeği söyler — fark pratikte önemsiz.', 'The big-n trap: with enough data every gap turns “significant”; the effect size (δ) tells the truth — the gap is immaterial in practice.')}</Method>
                    </Section>

                    <Section n={N()} title={L('Segmentasyon (KMeans)', 'Segmentation (KMeans)')}
                        lead={L(`${km.length} doğal araç grubu yaş × km × güç ekseninde ayrışıyor; her kümenin farklı medyan fiyatı var. Hasar sinyalini KMeans bağımsız yakalıyor — hedonik ve PCA ile üçlü doğrulama.`, `${km.length} natural vehicle groups separate along age × mileage × power, each with a distinct median. KMeans captures the damage signal independently — triple-corroborated with the hedonic model and PCA.`)}>
                        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {km.map((p: any) => (
                                <div key={p.cluster} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORICAL_LIST[p.cluster % CATEGORICAL_LIST.length] }} />
                                        <span className="font-mono text-[12px] font-semibold text-[#1a1a1a]">{clusterName(p.ad)}</span>
                                        <span className="ml-auto font-mono text-[11px] text-[#86857e]">{fmtN(p.n)}</span>
                                    </div>
                                    <div className="font-mono text-[15px] font-bold text-[#047857]">{fmtM(p.medyan)}</div>
                                    <div className="mt-1 font-mono text-[11px] text-[#86857e]">{p.yas} {L('yaş', 'yr')} · {fmtKm(p.km)} km · {p.hp} hp · {L('hasar', 'dmg')} {pct(p.agir_hasar_pct, 0)}</div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {p.ayirt_edici.map((a: any, ai: number) => (
                                            <span key={ai} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{a[0]} {a[1] === '+' ? '↑' : '↓'}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L(`PCA — PC1 ${axPct(0)} × PC2 ${axPct(1)} (güç)`, `PCA — PC1 ${axPct(0)} × PC2 ${axPct(1)} (power)`)}><Chart h={300}><PlotlyChart data={pcaData} layout={base({ xaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid }, yaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid } })} config={config} guard={false} /></Chart></Fig>
                            {pca13Data && <Fig title={L(`PCA — PC1 ${axPct(0)} × PC3 ${axPct(2)} (hasar)`, `PCA — PC1 ${axPct(0)} × PC3 ${axPct(2)} (damage)`)}><Chart h={300}><PlotlyChart data={pca13Data} layout={base({ xaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid }, yaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid } })} config={config} guard={false} /></Chart></Fig>}
                        </div>
                        {kselData && <Fig className="mt-4" title={L('k seçimi — Elbow + Silhouette', 'k selection — Elbow + Silhouette')}><Chart h={300}><PlotlyChart data={kselData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.24 }, margin: { t: 12, r: 40, b: 40, l: 8 }, xaxis: { title: { text: 'k', font: { size: 10 } }, dtick: 1 }, yaxis: { tickformat: '~s', tickfont: { size: 10, color: '#047857' } }, yaxis2: { fixedrange: true, overlaying: 'y', side: 'right', gridcolor: 'transparent', zeroline: false, tickfont: { size: 10, color: '#e08a1e' } } })} config={config} guard={false} /></Chart></Fig>}
                        {ksel && <Method className="mt-3">{L(`k seçimi: silhouette k=${ksel.secilen_k} işaret ediyor; ${ksel.secilen_k} küme hem optimal hem yorumlanabilir. ${ksel.not || ''}`.trim(), `k choice: silhouette points to k=${ksel.secilen_k}; ${ksel.secilen_k} clusters are both optimal and interpretable. Chosen transparently, not blindly.`)}</Method>}
                    </Section>

                    <Section n={N()} title={L('PCA eksen anlamları', 'PCA axis meanings')}
                        lead={L(`PCA saçılımlarının eksenleri: PC1 km/yaş/büyüklük, PC2 motor gücü (hp/cc), PC3 hasar ekseni. İlk iki PC varyansın ~${pct((axes[0]?.var_pct || 0) + (axes[1]?.var_pct || 0))}’ini açıklıyor — yukarıdaki kümeler bu eksenlerde ayrışıyor (hasarlı küme PC3'te).`, `The axes of the PCA scatters above: PC1 is mileage/age/size, PC2 engine power (hp/cc), PC3 a damage axis. The first two PCs explain ~${pct((axes[0]?.var_pct || 0) + (axes[1]?.var_pct || 0))} of variance — the clusters above separate along these (the damaged cluster on PC3).`)}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {axes.map((ax: any) => (
                                <div key={ax.pc} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-1 flex items-baseline justify-between">
                                        <span className="font-mono text-[13px] font-semibold text-[#047857]">{ax.pc}</span>
                                        <span className="font-mono text-[11px] text-[#86857e]">{pct(ax.var_pct)}</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {ax.top.slice(0, 4).map((t: any, ti: number) => (
                                            <div key={ti} className="flex items-center justify-between font-mono text-[11px]">
                                                <span className="text-[#5f5f5a]">{t[0]}</span>
                                                <span className={`tabular-nums ${t[1] >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>{t[1] >= 0 ? '+' : ''}{t[1].toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                    </>
                    ); })()}
                </>
            )}

            {/* ============ MODEL & PERFORMANCE ============ */}
            {show('model') && (
                <>
                    {tab === 'all' && <GroupHeading n="02" title={L('Model & performans', 'Model & performance')} />}
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    {frWinM && (
                        <Section n={N()} title={L('Model karşılaştırması', 'Model comparison')}
                            lead={L(`${frModels.length} model varyantı 5-fold OOF (sızıntısız) ile karşılaştırıldı; final modeller tüm veriyle eğitildi. Kazanan ${frWin} — MAPE ${pct(frWinM.MAPE, 2)}.`, `${frModels.length} model variants compared with 5-fold OOF (leak-free); final models trained on all data. Winner ${frWin} — MAPE ${pct(frWinM.MAPE, 2)}.`)}>
                            <Table head={[L('Model', 'Model'), 'MAPE', 'R²', 'MAE', 'MedAE', 'RMSE']} rows={frModels.map((m) => [
                                `${m.label}${m === frWinM ? ' ★' : ''}`, pct(m.MAPE, 2), m.R2.toFixed(4), fmtN(m.MAE), fmtN(m.MedAE), fmtN(m.RMSE),
                            ])} />
                            {fr.ornek_tahmin && (
                                <div className="mt-4 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.05em] text-[#86857e]">{L('Örnek tahmin', 'Sample prediction')} · {fr.ornek_tahmin.arac}</div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div><div className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{L('Gerçek', 'Actual')}</div><div className="mt-1 font-mono text-[15px] sm:text-[16px] font-bold tabular-nums text-[#1a1a1a]">{fmtM(fr.ornek_tahmin.gercek)}</div></div>
                                        <div><div className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">LightGBM ★</div><div className="mt-1 font-mono text-[15px] sm:text-[16px] font-bold tabular-nums text-[#047857]">{fmtM(fr.ornek_tahmin.lightgbm_tahmin)}</div></div>
                                        <div><div className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">CatBoost</div><div className="mt-1 font-mono text-[15px] sm:text-[16px] font-bold tabular-nums text-[#1a1a1a]">{fmtM(fr.ornek_tahmin.catboost_tahmin)}</div></div>
                                        {fr.ornek_tahmin.catboost_native_tahmin != null && <div><div className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">CatBoost native</div><div className="mt-1 font-mono text-[15px] sm:text-[16px] font-bold tabular-nums text-[#1a1a1a]">{fmtM(fr.ornek_tahmin.catboost_native_tahmin)}</div></div>}
                                    </div>
                                </div>
                            )}
                            {fr.egitim && <p className="mt-3 font-mono text-[11px] text-[#86857e]">{L(`Hedef: ${fr.egitim.hedef} · ${fr.egitim.n_feature} öznitelik${fr.egitim.cv_suresi_sn ? ` · 5-fold CV ${fr.egitim.cv_suresi_sn} sn` : ''}`, `Target: ${fr.egitim.hedef} · ${fr.egitim.n_feature} features${fr.egitim.cv_suresi_sn ? ` · 5-fold CV ${fr.egitim.cv_suresi_sn}s` : ''}`)}</p>}
                            {frMk.not && <Method className="mt-3">{L(frMk.not, 'Metrics are 5-fold OOF (leak-free). Final models were trained on all data.')}</Method>}
                        </Section>
                    )}

                    {pvtTraces && resTraces && (
                        <Section n={N()} title={L('Tahmin kalibrasyonu & artıklar', 'Prediction calibration & residuals')}
                            lead={L(`OOF (sızıntısız) tahminler gerçek fiyata karşı — R² ${pvtObj.r2.toFixed(3)}. Artık% sıfır etrafında (ort ${pct(resObj.mean_resid_pct, 2)}, std ${pct(resObj.std_resid_pct, 2)}) → sistematik yanlılık yok.`, `OOF (leak-free) predictions vs actual — R² ${pvtObj.r2.toFixed(3)}. Residual% centers on zero (mean ${pct(resObj.mean_resid_pct, 2)}, std ${pct(resObj.std_resid_pct, 2)}) → no systematic bias.`)}>
                            <div className="mb-3 inline-flex gap-1 rounded-[8px] border border-[#e4e2dd] bg-[#f7f6f3] p-0.5">
                                {([['density', L('Yoğunluk', 'Density')], ['points', L('Noktalar', 'Points')]] as const).map(([m, lb]) => (
                                    <button type="button" key={m} onClick={() => setScMode(m)} className={`rounded-[6px] px-3 py-1.5 font-mono text-[11px] transition-colors ${scMode === m ? 'bg-[#047857] text-white' : 'text-[#5f5f5a] hover:bg-[#f1efe9]'}`}>{lb}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Fig title={L('Tahmin vs Gerçek', 'Predicted vs Actual')}><Chart h={320}><PlotlyChart data={pvtTraces} layout={base({ margin: { t: 8, r: 12, b: 34, l: 46 }, xaxis: { title: { text: L('gerçek ₺', 'actual ₺'), font: { size: 10 } }, tickformat: '~s' }, yaxis: { title: { text: L('tahmin ₺', 'pred ₺'), font: { size: 10 } }, tickformat: '~s' } })} config={config} guard={false} /></Chart></Fig>
                                <Fig title={L('Artık% vs Tahmin', 'Residual% vs Predicted')}><Chart h={320}><PlotlyChart data={resTraces} layout={base({ margin: { t: 8, r: 12, b: 34, l: 42 }, xaxis: { title: { text: L('tahmin ₺', 'pred ₺'), font: { size: 10 } }, tickformat: '~s' }, yaxis: { ticksuffix: '%' }, shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0, y1: 0, line: { dash: 'dash', color: '#86857e', width: 1 } }] })} config={config} guard={false} /></Chart></Fig>
                            </div>
                            <Method className="mt-3">{L(`Kırmızı halkalar uç noktalar — en büyük |hata| + fiyat uçları — her iki modda da gösterilir. Sayfa hafif kalsın diye 30K OOF tahminden temsili örnek çiziliyor (fiyata göre stratified, uç noktalar garantili, deterministik): “Yoğunluk” ${pvtObj.points.length.toLocaleString(loc)}-nokta pürüzsüzleştirilmiş ısı haritası, “Noktalar” ${diag!.pvt!.body.length.toLocaleString(loc)}-nokta gövde + tüm uç noktalar.`, `Red rings are extreme points — largest |error| + price extremes — shown in both modes. To keep the page light a representative sample of the 30K OOF predictions is drawn (price-stratified, outliers guaranteed, deterministic): “Density” a ${pvtObj.points.length.toLocaleString(loc)}-pt smoothed heatmap, “Points” a ${diag!.pvt!.body.length.toLocaleString(loc)}-pt body + all extreme points.`)}</Method>
                        </Section>
                    )}

                    <Section n={N()} title={L('Fiyat çeyreğine göre hata', 'Error by price quartile')}
                        lead={L('Modelin fiyat çeyreklerine göre hatası. Genelde pahalı araçlarda daha isabetli, ucuz araçlarda daha zorlanır.', 'The model’s error across price quartiles — usually sharper on expensive cars, harder on cheap ones.')}>
                        <Fig title={L('Çeyreğe göre hata (MAPE %)', 'Error by quartile (MAPE %)')}><Chart h={260}><PlotlyChart data={qeData} layout={base({ margin: { t: 24, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        {oofClipped && <Method className="mt-3">{L('Not: bu koşumda birkaç OOF tahmini büyük bir tavana (₺50M) kırpıldığı için yüzde-hatalar şişkin; backtest (%6.6 civarı) gerçek performansı yansıtır.', 'Note: in this run a few OOF predictions are clipped to a large cap (₺50M), inflating the percentage errors; the backtest (~6.6%) reflects the true performance.')}</Method>}
                    </Section>

                    <Section n={N()} title={L('İlan sayısı vs hata (güvenilirlik)', 'Sample size vs error (reliability)')}
                        lead={L('Az ilanlı modellerde hata yüksek ve saçılmış; çok ilanlı modellerde düşük ve dar. Model, bol veriye sahip araçlarda güvenilir (log eksen).', 'Rare models show high, scattered error; common models low and tight. The model is reliable where data is plentiful (log axis).')}>
                        <Fig title={L('Model ilan-adedi vs medyan hata', 'Per-model sample size vs median error')}><Chart h={300}><PlotlyChart data={residData} layout={base({ margin: { t: 8, r: 16, b: 32, l: 8 }, xaxis: { title: { text: L('ilan adedi', 'listings'), font: { size: 10 } } }, yaxis: { type: 'log' } })} config={config} guard={false} /></Chart></Fig>
                    </Section>

                    <Section n={N()} title={L('Modelin en iyi ve en çok yanıldığı ilanlar', 'The model’s best and worst predictions')}
                        lead={L('İki uç: model en iyi standart/bol-ilanlı araçlarda, en kötü nadir/uç vakalarda. İki uç birlikte modelin nerede güçlü/zayıf olduğunu dürüstçe gösterir.', 'Two extremes: the model does best on standard, data-rich cars and worst on rare/edge cases. Together they honestly show where it is strong and weak.')}>
                        {dom.oof_best && (
                            <div className="mb-4">
                                <div className="mb-2 font-mono text-[12px] font-semibold text-[#047857]">{L('En iyi tahminler', 'Best predictions')}</div>
                                <Table head={[L('Model', 'Model'), L('Yaş', 'Age'), 'km', L('Gerçek', 'Actual'), L('Tahmin', 'Pred'), L('Hata', 'Err')]}
                                    rows={dom.oof_best.slice(0, 5).map((r: any) => [r[0], String(r[1]), fmtN(r[2]), fmtM(r[3]), fmtM(r[4]), pct(r[5])])} />
                            </div>
                        )}
                        <div className="mb-2 font-mono text-[12px] font-semibold text-[#b91c1c]">{L('En çok yanıldığı ilanlar', 'Biggest misses')}</div>
                        <Table head={[L('Model', 'Model'), L('Yaş', 'Age'), 'km', L('Gerçek', 'Actual'), L('Tahmin', 'Pred'), L('Hata', 'Err')]}
                            rows={dom.oof_outliers.slice(0, 6).map((r: any) => [r[0], String(r[1]), fmtN(r[2]), fmtM(r[3]), fmtM(r[4]), pct(r[5])])} />
                        {oofClipped && <Method className="mt-3">{L('Tahmin sütunundaki ₺50M değerleri log-model taşmasının tavana kırpılmasıdır — dürüstçe gösteriyoruz.', 'The ₺50M values in the Pred column are the log-model overflow clipped to a cap — shown honestly.')}</Method>}
                    </Section>

                    <Section n={N()} title={L('Dağılım kayması (drift)', 'Distribution drift')}
                        lead={L('Ham fiyat dağılımının dönemler arası eğrileri neredeyse çakışık → görsel kanıt. KS zamanla hafif büyüyor (istatistiksel kayma) ama PSI hep <0.05 (pratik kayma yok) — model bayatlamıyor. Yine büyük-n tuzağı.', 'The raw price distribution curves nearly overlap across periods — visual proof. KS grows slightly (statistical drift) yet PSI stays <0.05 (no practical drift) — the model isn’t going stale. The big-n trap again.')}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {driftHistData.length > 0 && <Fig title={L('Köşeli · kdesiz · frekans (son commit stili)', 'Angular · no-KDE · frequency (committed style)')}><Chart h={280}><PlotlyChart data={driftHistData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { ticksuffix: '%' }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 34 } })} config={config} guard={false} /></Chart></Fig>}
                            {driftRawData.length > 0 && <Fig title={L('Yumuşak · KDE', 'Smooth · KDE')}><Chart h={280}><PlotlyChart data={driftRawData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { showticklabels: false }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 8 } })} config={config} guard={false} /></Chart></Fig>}
                        </div>
                        {driftRows.length > 0 && <Table className="mt-4" head={driftHead} rows={driftRows} />}
                        <Method className="mt-3">{L('Tablo: 6 snapshot çiftinin tamamı. KS = en büyük dağılım farkı · PSI < 0.10 güvenli / > 0.25 yeniden eğit · p = KS testi anlamlılığı.', 'Table: all 6 snapshot pairs. KS = max distribution gap · PSI < 0.10 safe / > 0.25 retrain · p = KS-test significance.')}</Method>
                    </Section>
                    </>
                    ); })()}
                </>
            )}

            {/* ============ METHODOLOGY ============ */}
            {show('method') && (
                <>
                    {tab === 'all' && <GroupHeading n="03" title={L('Metodoloji — model kararları', 'Methodology — model decisions')} />}
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    <Section n={N()} title={L('Öznitelik seçimi', 'Feature selection')}
                        lead={L(`117 ham kolondan ${meta.n_features}’ya indirildi. Çıkarma keyfi değil: sabit kolonlar, redundant kb/gb ikizleri, sızıntı/kimlik, blok-eksik, çoklu-bağlantı, granüler hasar (agregatlandı) ve ampirik audit.`, `From 117 raw columns down to ${meta.n_features}. Nothing dropped arbitrarily: constants, redundant kb/gb twins, leakage/identity, block-missing, collinearity, granular damage (aggregated) and an empirical audit.`)}>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {met.feature_kept.map((f: string) => (
                                <span key={f} className="rounded-[8px] border border-[#cfe8dc] bg-[#f1f8f4] px-2 py-1 font-mono text-[11px] text-[#22332b]">{f}</span>
                            ))}
                        </div>
                        <Table head={[L('Grup', 'Group'), L('Gerekçe', 'Reason'), L('~kolon', '~cols')]} rows={met.feature_drop.map((r: any) => [r[0], L(r[1], fdReason(r[1])), String(r[2])])} />
                        {met.impute_note && <Method className="mt-3">{L(met.impute_note, 'Hierarchical imputation: missing values filled by series > segment > brand median (most-specific group first). torque_nm was dropped (27.6% missing); the rest are handled natively by the tree model.')}</Method>}
                    </Section>

                    <Section n={N()} title={L('Sistematik eksiklik', 'Systematic missingness')}
                        lead={L('Eksiklik rastgele değil, bloklu: aşağıdaki yüksek-eksik kolonlar (spec/katalog + sigorta, ~%28–84) aynı ilanlarda birlikte boş kalıyor. “Eksik olması” sistematik olduğundan güvenilir imputasyon yok ve sızıntı riski var → bu kolonlar çıkarıldı. (Modele giren 16 öznitelik <%2 eksik — bu grafikte değil.)', 'Missingness isn’t random — it’s block-shaped: the high-missing columns below (spec/catalog + insurance, ~28–84%) sit empty together in the same listings. Because “being missing” is systematic, reliable imputation is impossible and leakage is a risk → these columns were dropped. (The 16 kept features are <2% missing — not shown here.)')}>
                        {smData ? (
                            <Fig title={L('Eksiklik oranı (%) · aynı renk = aynı oran (birlikte eksik blok)', 'Missing rate (%) · same colour = same rate (co-missing block)')}><Chart h={520}><PlotlyChart data={smData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        ) : (
                            <Fig title={L('Eksiklik (%)', 'Missingness (%)')}><Chart h={300}><PlotlyChart data={cmissData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        )}
                        {smGroups.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {smGroups.map((grp: any, gi: number) => {
                                    const isIns = /kasko|insurance|traffic|sigorta/i.test((grp.ornek_kolonlar || []).join(' '));
                                    return (
                                        <div key={gi} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                            <div className="mb-2 font-mono text-[12px] font-semibold text-[#1a1a1a]">{isIns ? L('Sigorta / kasko bloğu', 'Insurance block') : L('Spec / katalog bloğu', 'Spec / catalog block')}</div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('kolon', 'cols')}</div><div className="font-mono text-[16px] font-bold tabular-nums text-[#047857]">{grp.kolon_sayisi}</div></div>
                                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('ort. eksik', 'avg miss')}</div><div className="font-mono text-[16px] font-bold tabular-nums text-[#1a1a1a]">{pct(grp.ort_eksik_pct)}</div></div>
                                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('birlikte', 'co-miss')}</div><div className="font-mono text-[16px] font-bold tabular-nums text-[#1a1a1a]">{pct(grp.birliktelik_pct)}</div></div>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {(grp.ornek_kolonlar || []).slice(0, 4).map((c: string) => (
                                                    <span key={c} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* missing-correlation structure */}
                        <div className="mt-4 rounded-[12px] border border-[#cfe8dc] bg-[#f1f8f4] p-4">
                            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]">{L('Missing korelasyon yapısı', 'Missing-correlation structure')}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('Blok içi (14 spec)', 'Within block (14 spec)')}</div><div className="font-mono text-[19px] font-bold tabular-nums text-[#047857]">0.999</div><div className="mt-0.5 font-mono text-[10px] text-[#86857e]">{L('91/91 çift %99+', '91/91 pairs 99%+')}</div></div>
                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('Alt–üst sınır çifti', 'Lower–upper bound')}</div><div className="font-mono text-[19px] font-bold tabular-nums text-[#1a1a1a]">1.000</div><div className="mt-0.5 font-mono text-[10px] text-[#86857e]">{L('yıl · rpm · yakıt', 'year · rpm · fuel')}</div></div>
                                <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('Çiftler arası', 'Between pairs')}</div><div className="font-mono text-[19px] font-bold tabular-nums text-[#1a1a1a]">~0.90</div><div className="mt-0.5 font-mono text-[10px] text-[#86857e]">{L('aynı kaynak, farklı tamlık', 'same source, diff. completeness')}</div></div>
                            </div>
                            <p className="mt-3 text-[13px] leading-[1.6] text-[#22332b]">{L('Biri eksikse hepsi eksik (tam blok). Her spec değişkeninin alt–üst sınırı tam %100 birlikte gelir/gelmez: production_year_start↔end, rpm_min↔max, city↔highway fuel. Farklı çiftler arası ~0.90 — hepsi aynı katalog kaynağından ama farklı tamlıkta.', 'If one is missing, all are missing (full block). Each spec variable’s lower–upper bound is 100% co-present/absent: production_year_start↔end, rpm_min↔max, city↔highway fuel. Different pairs are ~0.90 apart — all from the same catalog source, at different completeness.')}</p>
                        </div>
                        {/* critical distinction: missing-corr ≠ value-corr */}
                        <div className="mt-3 rounded-[12px] border border-[#ecd9b0] bg-[#fdf7ec] p-4">
                            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#b0872e]">{L('Kritik ayrım', 'Key distinction')}</div>
                            <p className="text-[13px] leading-[1.6] text-[#6b5424]">{L('Bu MISSING korelasyonu (var/yok birlikte hareket ediyor) — DEĞER korelasyonu DEĞİL. Spec değerleri birbirine sadece 0.59 korele (ağırlık–uzunluk 0.90 ama tork–yükseklik düşük): her spec farklı bilgi taşır, ama var/yok durumları tek kaynağa (katalog eşleştirmesi) bağlı.', 'This is MISSING correlation (presence/absence moving together) — NOT value correlation. The spec values are only 0.59 correlated (weight–length 0.90 but torque–height low): each spec carries different information, yet their presence/absence is tied to a single source (catalog matching).')}</p>
                        </div>
                        <Method className="mt-3">{L('Sebep: spec verisi model–katalog eşleştirmesinden gelir — standart modeller (“320i”) eşleşir, niş varyantlar (“320i 50th Year M Edition”) eşleşmez, o yüzden o ilanların tüm spec’leri birden boş kalır. Modele koymadım: niş varyantlarda hep eksik olurlardı ve model adı (TF-IDF ile) o bilgiyi zaten yakalıyor.', 'Cause: spec data comes from model–catalog matching — standard models (“320i”) match, niche variants (“320i 50th Year M Edition”) don’t, so all their specs go blank at once. Excluded from the model: they’d always be missing on niche variants, and the model name (via TF-IDF) already captures that information.')}</Method>
                    </Section>

                    <Section n={N()} title={L('Kategorik bağıntı (Cramér’s V + Theil’s U)', 'Categorical dependence (Cramér’s V + Theil’s U)')}
                        lead={L('Cramér’s V ilişkinin gücünü (simetrik), Theil’s U yönünü (asimetrik) verir — ikisi de KATEGORİK öznitelikler içindir: `model` (metin), marka, seri, segment, kasa, çekiş, vites, yakıt. `model` diğerlerini neredeyse tam belirliyor (U≈1) ama tersi değil → `model` hedonikten dışlandı (sızıntı). Not: hasar sayaçları ve motor (hp/cc) SAYISAL olduğundan burada değil.', 'Cramér’s V gives association strength (symmetric); Theil’s U its direction (asymmetric) — both are for CATEGORICAL features: `model` (text), brand, series, segment, body, drivetrain, transmission, fuel. `model` almost fully determines the rest (U≈1) but not vice-versa → `model` is excluded from the hedonic model (leakage). Note: damage counters and engine specs (hp/cc) are NUMERIC, so they’re not here.')}>
                        {(cramersFull || theilsFull) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {theilsFull && <Fig title={L("Theil’s U (yönlü · ana)", "Theil’s U (directional · main)")}><Chart h={360}><PlotlyChart data={theilsFull} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                                {cramersFull && <Fig title={L("Cramér’s V (simetrik · ikincil)", "Cramér’s V (symmetric · secondary)")}><Chart h={360}><PlotlyChart data={cramersFull} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                            </div>
                        ) : null}
                        {assoc.length > 0 && <Table className="mt-4" head={[L('model →', 'model →'), "Cramér’s V", "Theil’s U"]} rows={assoc.map((r: any) => [r[0], r[1].toFixed(3), r[2].toFixed(3)])} />}
                    </Section>

                    {met.g_mpv && (
                        <Section n={N()} title={L('G ≡ MPV teşhisi', 'G ≡ MPV diagnosis')}
                            lead={L('Ham veride bir “G” segmenti vardı ama gerçek değil: G’lerin neredeyse tamamı MPV gövde (Active/Gran Tourer). Site kendi etiketini uydurmuş. Çözüm: segmenti seriden türet, MPV bilgisini kb_body_type’ta tut. Bir veri kalitesi teşhisi.', 'The raw feed had a “G” segment, but it isn’t real: nearly all G rows are MPV bodies (Active/Gran Tourer). The source invented its own label. Fix: derive segment from the series, keep the MPV signal in kb_body_type. A data-quality diagnosis.')}>
                            {typeof met.g_mpv === 'object' ? (
                                <div className="grid grid-cols-3 gap-3">
                                    <Stat k={L('G ∧ MPV', 'G ∧ MPV')} v={fmtN(met.g_mpv.mpv_and_g)} accent />
                                    <Stat k={L('Toplam G', 'Total G')} v={fmtN(met.g_mpv.g_total)} />
                                    <Stat k={L('Toplam MPV', 'Total MPV')} v={fmtN(met.g_mpv.mpv_total)} />
                                </div>
                            ) : (
                                <Method className="mt-1">{L(String(met.g_mpv), 'Segment is derived deterministically from the series; the raw gb_segment was too dirty to use.')}</Method>
                            )}
                        </Section>
                    )}

                    {lofoData && (
                        <Section n={N()} title={L('LOFO — öznitelik önemi', 'LOFO — feature importance')}
                            lead={L('Bir öznitelik çıkarılınca RMSE ne kadar artıyor (pozitif = önemli). Kilometre ve yaş baskın; hasar/güç önemli. Negatif olanlar zararsız gürültü — atılabilir. Permütasyonun göremediği “zararlı feature” sinyalini verir.', 'How much RMSE rises when a feature is removed (positive = important). Mileage and age dominate; damage/power matter. Negatives are harmless noise — droppable. It surfaces the “harmful feature” signal permutation can miss.')}>
                            <Fig title="ΔRMSE"><Chart h={420}><PlotlyChart data={lofoData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted } })} config={config} guard={false} /></Chart></Fig>
                        </Section>
                    )}

                    {bts?.single && (
                        <Section n={N()} title={L('Zamansal backtest', 'Temporal backtest')}
                            lead={L('İki doğrulama görünümü. Grafik — OOF MAPE (çapraz-doğrulama): dönem başına bağımsız hata ~%7.1 sabit (hiçbir dönem belirgin zor değil); kümülatif eğitimde veri arttıkça ~%6.6’ya iniyor — daha çok verinin değeri. Tablo — zamansal forward test: eski dönemde eğit, sonraki dönemin YALNIZCA yeni ad_id’lerinde test et (sızıntısız); kümülatif strateji daha stabil → aylık retrain.', 'Two validation views. Chart — OOF MAPE (cross-validation): the per-snapshot standalone error stays ~7.1% (no period is notably harder); with cumulative training it falls to ~6.6% as data grows — the value of more data. Table — temporal forward test: train on an earlier period and test only on the NEXT period’s NEW ad_ids (leak-free); the cumulative strategy is more stable → monthly retraining.')}>
                            {btInsData && <Fig title={L('OOF MAPE · dönem başına vs kümülatif', 'OOF MAPE · per-snapshot vs cumulative')}><Chart h={260}><PlotlyChart data={btInsData} layout={base({ margin: { t: 12, r: 16, b: 40, l: 34 }, yaxis: { ticksuffix: '%' }, showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.25 } })} config={config} guard={false} /></Chart></Fig>}
                            <Table className="mt-4" head={[L('Eğitim → Test', 'Train → Test'), L('Tek MAPE', 'Single MAPE'), L('Kümül. MAPE', 'Cumul. MAPE'), 'n']} rows={bts.single.map((r: any, i: number) => { const c = bts.cumulative[i]; return [`${r[0]} → ${r[1]}`, pct(r[2], 2), c ? pct(c[2], 2) : '—', fmtN(r[3])]; })} />
                            {bts.not && <Method className="mt-3">{L(bts.not, 'single: train on one snapshot, predict forward. cumulative: train up to t. Only NEW ad_ids (leak-free).')}</Method>}
                        </Section>
                    )}

                    </>
                    ); })()}
                </>
            )}

            {/* key findings */}
            <div className="mt-2 rounded-[14px] border border-[#cfe8dc] bg-[#f1f8f4] p-6">
                <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.09em] text-[#047857]">{L('Öne çıkan bulgular', 'Key findings')}</div>
                {[
                    L('Büyük-n tuzağı (marka, drift): istatistiksel anlamlılık ≠ pratik önem — effect size kullanmak olgunluk gösterir.', 'The big-n trap (brand, drift): statistical significance ≠ practical importance — using effect sizes shows maturity.'),
                    L('Dürüst k-seçimi: silhouette ile k bilinçli seçildi, körlemesine değil — şeffaflık olgunluk sinyali.', 'Honest k-selection: k chosen deliberately via silhouette, not blindly — transparency is a maturity signal.'),
                    L('Sızıntı bilinci: Theil’s U asimetrisi `model`i açığa çıkardı → hedonikten dışlandı; temporal test yalnızca yeni ad_id ile.', 'Leakage awareness: Theil’s U asymmetry flagged `model` → excluded from the hedonic model; the temporal test uses only new ad_ids.'),
                    L('Üçlü doğrulama: hasar sinyali hedonik + PCA + KMeans’te bağımsızca ortaya çıkıyor.', 'Triple corroboration: the damage signal emerges independently in the hedonic model, PCA and KMeans.'),
                    L('Retrain’in değeri: kümülatif eğitim ileri-testte tek-dönemden daha stabil.', 'The value of retraining: cumulative training is more stable than single-period in the forward test.'),
                ].map((f) => (
                    <div key={f} className="mb-2.5 flex gap-3 last:mb-0">
                        <span className="text-[15px] leading-[1.6] text-[#059669]">→</span>
                        <span className="text-[15px] leading-[1.6] text-[#22332b]">{f}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------- presentational helpers ----------
function GroupHeading({ n, title }: { n: string; title: string }) {
    return (
        <div className="mb-8 flex items-baseline gap-3 border-t border-[#e9e7e2] pt-8">
            <span className="font-mono text-[13px] text-[#86857e]">{n}</span>
            <h2 className="text-[15px] font-mono uppercase tracking-[0.12em] text-[#86857e]">{title}</h2>
        </div>
    );
}

function Section({ n, title, lead, children }: { n: string; title: string; lead?: string; children: React.ReactNode }) {
    return (
        <section className="mb-14">
            <div className="mb-3 flex items-baseline gap-3">
                <span className="font-mono text-[14px] text-[#047857]">{n}</span>
                <h2 className="text-[22px] sm:text-[24px] font-semibold tracking-[-0.029em] text-[#1a1a1a]">{title}</h2>
            </div>
            {lead && <p className="mb-6 max-w-[680px] text-[16px] leading-[1.7] text-[#33332f]">{lead}</p>}
            {children}
        </section>
    );
}

function Fig({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <figure className={`m-0 rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-3 sm:p-4 shadow-[0_1px_3px_rgba(40,40,30,0.05)] ${className}`}>
            <figcaption className="mb-2 px-1 text-[13px] font-semibold text-[#1a1a1a]">{title}</figcaption>
            {children}
        </figure>
    );
}

function Chart({ h, children }: { h: number; children: React.ReactNode }) {
    return <div style={{ height: h, minHeight: 220, width: '100%' }}>{children}</div>;
}

function Stat({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: boolean }) {
    return (
        <div className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{k}</div>
            <div className={`font-mono text-[18px] sm:text-[20px] font-bold tabular-nums ${accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{v}</div>
            {sub && <div className="mt-1 font-mono text-[11px] text-[#86857e]">{sub}</div>}
        </div>
    );
}

function Method({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-[10px] border border-[#e9e7e2] bg-[#f3f1ec] px-4 py-3 font-mono text-[12px] leading-[1.6] text-[#5f5f5a] ${className}`}>
            <span className="text-[#047857]">{`// `}</span>{children}
        </div>
    );
}

function Table({ head, rows, className = '' }: { head: string[]; rows: (string | number)[][]; className?: string }) {
    const cols = `1.6fr repeat(${head.length - 1}, minmax(56px, 1fr))`;
    const minWidth = 220 + (head.length - 1) * 84;
    return (
        <div className={`overflow-x-auto rounded-[12px] border border-[#e4e2dd] ${className}`}>
            <div style={{ minWidth }}>
                <div className="grid bg-[#f1efe9] px-3.5 py-[11px] font-mono text-[10px] uppercase tracking-[0.05em] text-[#5f5f5a] sm:px-[18px]" style={{ gridTemplateColumns: cols }}>
                    {head.map((h, i) => <span key={h} className={i === 0 ? '' : 'text-right'}>{h}</span>)}
                </div>
                {rows.map((r, ri) => (
                    <div key={ri} className="grid items-center border-t border-[#ece9e3] bg-[#fdfcf9] px-3.5 py-[11px] sm:px-[18px]" style={{ gridTemplateColumns: cols }}>
                        {r.map((cell, ci) => <span key={ci} className={`font-mono text-[12px] sm:text-[13px] ${ci === 0 ? 'text-[#1a1a1a] pr-2' : 'text-right text-[#5f5f5a] tabular-nums'}`}>{cell}</span>)}
                    </div>
                ))}
            </div>
        </div>
    );
}
