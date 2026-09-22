"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- site_data.json and text_data.json are
   emitted by the Python pipeline and carry no schema; every accessor here mirrors one that
   already reads them the same way in FinalReportLab/FinalTextAnalysis. Typing 30 domain keys
   by hand would invent a contract the generator never promised and would drift from it. */

import { useMemo } from 'react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme, CATEGORICAL_LIST, GREEN_RAMP } from '../../_charts/types';
import { sampleRepresentative, sampleByCluster } from '../../_charts/sample';
import * as LBL from '@/lib/labels';

// Native Plotly for the figures the analysis pipeline ships as PNGs.
//
// The pipeline draws its figures with matplotlib and writes them next to the markdown. The
// site already had those charts as interactive Plotly — the mapping is 1:1, slug for slug — so
// nothing new is invented here: the trace builders are the ones FinalReportLab already uses,
// keyed by the pipeline's figure slug so the markdown can ask for one by name.
//
// The data is public/report-data.json, the current pipeline run. That matters: the site's
// older public/site_data.json disagrees with the report text it would sit next to (MAPE 6.49
// vs 6.5, dealer MAE ₺192K vs ₺191K), and a chart that contradicts the paragraph above it is
// worse than no chart.

type Lang = 'tr' | 'en';
type Fig = { traces: unknown[]; layout: Record<string, unknown>; height: number };

export function buildReportFigures(d: any, lang: Lang): Record<string, Fig> {
    if (!d?.domain) return {};

    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
    const theme = makeHybridTheme();
    const green = theme.accent, deep = '#047857';
    const ramp = GREEN_RAMP.map((c, i) => [i / (GREEN_RAMP.length - 1), c] as [number, string]);

    const fmtN = (n: number) => Math.round(n).toLocaleString(loc);
    const fmtM = (n: number) => '₺' + (n / 1e6).toFixed(2) + 'M';

    const meta = d.meta, dom = d.domain, met = d.methodology ?? {};
    const CL: any = d.column_labels ?? {};
    const clab = (raw: string) => { const e = CL[raw]; return e && (e.tr || e.en) ? L(e.tr, e.en) : raw; };
    const TABNAME: any = { overview: L('Genel', 'Overview'), quickinfo: L('Hızlı', 'Quick') };
    const clabTab = (raw: string) => { const e = CL[raw]; if (!e) return raw; const bl = L(e.tr, e.en); return e.tab ? `${bl} (${TABNAME[e.tab] || e.tab})` : bl; };

    const snaps: string[] = meta?.snapshots || [];
    const MONTHS = lang === 'tr'
        ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDate = (iso: string) => { const [, m, dd] = iso.split('-'); return `${+dd} ${MONTHS[+m - 1]}`; };

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

    const out: Record<string, Fig> = {};
    const put = (slug: string, traces: any, layout: any, height: number) => {
        if (!traces || (Array.isArray(traces) && !traces.filter(Boolean).length)) return;
        out[slug] = { traces: Array.isArray(traces) ? traces.filter(Boolean) : [traces], layout, height };
    };

    // ---------- the headline: the dealer's reflex vs the model ----------
    // Same two numbers the generator draws (build_report.py derive(): model_compare.lightgbm and
    // model_yil_medyani.taban) — the report names LightGBM as "the model" even where CatBoost
    // edges it on MAPE, so the variant table's winner is not the right source here.
    const fmtK = (n: number) => '₺' + Math.round(n / 1e3).toLocaleString(loc) + 'K';
    const baseMae = dom.model_yil_medyani?.taban?.MAE, modelMae = dom.model_compare?.lightgbm?.MAE;
    put('00-base-vs-model', (baseMae != null && modelMae != null) ? [{
        type: 'bar', x: [L('model+yıl medyanı', 'model+year median'), 'model'], y: [baseMae, modelMae],
        marker: { color: ['#b8b6ae', green] }, text: [fmtK(baseMae), fmtK(modelMae)], textposition: 'outside', cliponaxis: false,
        hovertemplate: '%{x}: %{text}<extra></extra>',
    }] : null, base({ margin: { t: 24, r: 16, b: 28, l: 8 }, yaxis: { tickformat: '~s', title: { text: L('ortalama mutlak hata (₺)', 'mean absolute error (₺)'), font: { size: 10 } } } }), 260);

    // ---------- market shape ----------
    const body =[...(dom.body_median || [])].filter((r: any) => r[0] && r[0] !== 'missing').sort((a: any, b: any) => a[1] - b[1]);
    put('01-body-median',
        [{ type: 'bar', orientation: 'h', y: body.map((r: any) => r[0]), x: body.map((r: any) => r[1]), marker: { color: green }, hovertemplate: '%{y}: %{customdata}<extra></extra>', customdata: body.map((r: any) => fmtM(r[1])) }],
        base({ margin: { t: 8, r: 16, b: 24, l: 8 } }), 300);

    // No document asks for this slug right now: the generator dropped the cluster section
    // from the decision note on 2026-09-22 and took the figure with it. Kept because a figure
    // file returns with the next sync while a builder would have to be written again.
    const seg = [...(dom.segment_ladder || [])].sort((a: any, b: any) => a[1] - b[1]);
    put('02-segment-median',
        [{ type: 'bar', x: seg.map((r: any) => r[0]), y: seg.map((r: any) => r[1]), marker: { color: green }, text: seg.map((r: any) => fmtM(r[1])), textposition: 'outside', hovertemplate: '%{x}: %{text} · %{customdata} ' + L('ilan', 'listings') + '<extra></extra>', customdata: seg.map((r: any) => fmtN(r[2])) }],
        base({ margin: { t: 24, r: 16, b: 28, l: 8 } }), 300);

    // ---------- hedonic drivers ----------
    const hedoTerm = (t: string) => LBL.label(LBL.hedonicTerm, t, lang);
    // The bootstrap fit lives under hedonic_reliability, not hedonic — same source the
    // report page uses ("single hedonic source of truth: prefer the detailed bootstrap-fit").
    const boot = dom.hedonic_reliability?.bootstrap || [];
    put('03-bootstrap-ci', boot.length ? [{ type: 'scatter', mode: 'markers', y: boot.map((b: any) => hedoTerm(b.terim)), x: boot.map((b: any) => b.nokta), error_x: { type: 'data', symmetric: false, array: boot.map((b: any) => b.ci_hi - b.nokta), arrayminus: boot.map((b: any) => b.nokta - b.ci_lo), color: '#b8b6ae', thickness: 1.5, width: 5 }, marker: { size: 9, color: boot.map((b: any) => (b.nokta >= 0 ? theme.accent : '#ef4444')) }, hovertemplate: '%{y}: β=%{x:.3f}<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 32, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted, title: { text: L('katsayı (log-fiyat)', 'coefficient (log-price)'), font: { size: 10 } } } }), 320);

    // methodology.lofo holds 22 rows: 19 single-feature removals AND 3 group removals. Drawing all
    // of them on one axis double-counts — DAMAGE_COLS competes with its own 13 members — which is
    // exactly what the note under this figure says the chart must not do. So the same five
    // non-overlapping keys the generator picks (build_report.py, `flat_keys`), in its order, on its
    // ₺-thousand axis.
    const LOFO_FLAT = ['gb_mileage', 'vehicle_age', 'DAMAGE_COLS', 'MODEL_SERIES', 'ENGINE'];
    const lofoBy: Record<string, number> = Object.fromEntries((met.lofo || []).map((r: any) => [r[0], r[1]]));
    // reversed: Plotly draws the first horizontal bar at the bottom, the generator's first at the top
    const lofo = LOFO_FLAT.filter((k) => lofoBy[k] != null).reverse();
    put('04-lofo-flat', lofo.length ? [{ type: 'bar', orientation: 'h', y: lofo, x: lofo.map((k) => lofoBy[k] / 1000), marker: { color: lofo.map((k) => (lofoBy[k] >= 0 ? green : '#ef4444')) }, hovertemplate: '%{y}: %{x:+,.1f}<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 34, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted, title: { text: L('ΔRMSE (₺bin)', 'ΔRMSE (₺k)'), font: { size: 10 } } } }), 300);

    // ---------- depreciation curves (median, plus mean when the export carries it) ----------
    const curve = (rows: any[], xUnit: 'age' | 'km', colour: string) => {
        if (!rows?.length) return null;
        const hasMean = rows.some((r: any) => r[3] != null);
        const hov = xUnit === 'age' ? L('%{x} yaş', 'age %{x}') : '%{x} km';
        return [
            { type: 'scatter', mode: 'lines+markers', name: L('medyan', 'median'), x: rows.map((r: any) => r[0]), y: rows.map((r: any) => r[1]), line: { color: colour, width: 2 }, marker: { size: 4 }, hovertemplate: hov + ' · ' + L('medyan', 'median') + ' %{customdata}<extra></extra>', customdata: rows.map((r: any) => fmtM(r[1])) },
            ...(hasMean ? [{ type: 'scatter', mode: 'lines+markers', name: L('ortalama', 'mean'), x: rows.map((r: any) => r[0]), y: rows.map((r: any) => r[3]), line: { color: '#e08a1e', width: 2, dash: 'dot' as const }, marker: { size: 4 }, hovertemplate: hov + ' · ' + L('ort', 'mean') + ' %{customdata}<extra></extra>', customdata: rows.map((r: any) => fmtM(r[3])) }] : []),
        ];
    };
    const curveLayout = base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, margin: { t: 8, r: 16, b: 40, l: 8 } });
    put('05-age-price', curve(dom.age_depreciation, 'age', deep), curveLayout, 260);
    put('06-km-price', curve(dom.km_price, 'km', green), curveLayout, 260);

    const bc = dom.brand_compare;
    put('07-brand', bc ? [{ type: 'bar', x: ['BMW', 'Audi'], y: [bc.bmw_medyan, bc.audi_medyan], marker: { color: [green, '#0d9aba'] }, text: [bc.bmw_medyan, bc.audi_medyan].map(fmtM), textposition: 'outside', hovertemplate: '%{x}: %{text}<extra></extra>' }] : null,
        base({ margin: { t: 24, r: 16, b: 24, l: 8 } }), 260);

    // ---------- OOF diagnostics ----------
    // Density for the body, with the worst cases always drawn on top as red rings — the
    // extremes are the point of the chart and must survive any binning.
    const pvtObj = dom.pred_vs_true, resObj = dom.residual_scatter;
    const diagPvt = pvtObj ? sampleRepresentative(pvtObj.points, (p: number[]) => Math.abs(p[0] - p[1])) : null;
    const diagRes = resObj ? sampleRepresentative(resObj.points, (p: number[]) => Math.abs(p[1])) : null;
    const outMarker = { size: 6, color: '#b91c1c', symbol: 'circle-open' as const, line: { width: 1.5, color: '#b91c1c' } };
    const hb2d = (pts: number[][]) => ({ type: 'histogram2d', x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), colorscale: ramp, nbinsx: 48, nbinsy: 48, zsmooth: 'best', showscale: false, hoverinfo: 'skip' });
    const scOut = (pts: number[][]) => ({ type: 'scatter', mode: 'markers', x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), marker: outMarker, hoverinfo: 'skip' });

    put('08-pred-vs-true', (pvtObj && diagPvt) ? [hb2d(pvtObj.points), scOut(diagPvt.outliers), { type: 'scatter', mode: 'lines', x: pvtObj.ideal_line, y: pvtObj.ideal_line, line: { dash: 'dash' as const, color: '#86857e', width: 1 }, hoverinfo: 'skip' }] : null,
        base({ margin: { t: 8, r: 12, b: 34, l: 46 }, xaxis: { title: { text: L('gerçek ₺', 'actual ₺'), font: { size: 10 } }, tickformat: '~s' }, yaxis: { title: { text: L('tahmin ₺', 'pred ₺'), font: { size: 10 } }, tickformat: '~s' } }), 320);

    put('09-residual', (resObj && diagRes) ? [hb2d(resObj.points), scOut(diagRes.outliers)] : null,
        base({ margin: { t: 8, r: 12, b: 34, l: 42 }, xaxis: { title: { text: L('tahmin ₺', 'pred ₺'), font: { size: 10 } }, tickformat: '~s' }, yaxis: { ticksuffix: '%' }, shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0, y1: 0, line: { dash: 'dash', color: '#86857e', width: 1 } }] }), 320);

    // Every listing's OOF residual, binned before the scatter was sampled (shrink-site-data.mjs
    // writes residual_scatter.hist) — the bars are counts, so the 6K sample would understate each
    // one five-fold beside a table that counts all 29,988. Same bins, band and marker as the
    // generator's figure 26.
    const rh = dom.residual_scatter?.hist;
    const pctL = (v: number) => (lang === 'tr' ? (v < 0 ? '-%' + -v : '%' + v) : v + '%');
    put('26-error-hist', rh ? [{
        type: 'bar', x: rh.counts.map((_: number, i: number) => rh.lo + (i + 0.5) * rh.step), y: rh.counts, width: rh.step,
        marker: { color: green, line: { width: 0 } },
        customdata: rh.counts.map((_: number, i: number) => `${pctL(rh.lo + i * rh.step)} … ${pctL(rh.lo + (i + 1) * rh.step)}`),
        hovertemplate: '%{customdata}: %{y:,} ' + L('ilan', 'listings') + '<extra></extra>',
    }] : null, base({
        // two-line axis title: one line runs past a phone's plot width and Plotly does not wrap it
        bargap: 0.08, margin: { t: 26, r: 16, b: 54, l: 8 },
        xaxis: { title: { text: L('artık % (eksi = model fazla tahmin etti)<br>gri bant = ±%10', 'residual % (negative = model over-predicted)<br>grey band = ±10%'), font: { size: 10 } }, ticksuffix: '%' },
        yaxis: { title: { text: L('ilan', 'listings'), font: { size: 10 } } },
        shapes: [
            { type: 'rect', xref: 'x', yref: 'paper', x0: -10, x1: 10, y0: 0, y1: 1, fillcolor: '#86857e', opacity: 0.08, line: { width: 0 }, layer: 'below' },
            { type: 'line', xref: 'x', yref: 'paper', x0: 0, x1: 0, y0: 0, y1: 1, line: { dash: 'dash', color: '#b91c1c', width: 1.2 } },
        ],
        annotations: rh ? [{
            xref: 'paper', yref: 'paper', x: 0, y: 1, xanchor: 'left', yanchor: 'bottom', showarrow: false, font: { size: 10, color: theme.muted },
            text: L(`görünüm dışı: ${fmtN(rh.below)} ilan < -%${-rh.lo} · ${fmtN(rh.above)} ilan > +%${-rh.lo}`, `outside view: ${fmtN(rh.below)} listings < -${-rh.lo}% · ${fmtN(rh.above)} > +${-rh.lo}%`),
        }] : [],
    }), 300);

    // Median APE per quartile, not MAPE — the export's name hides that (the generator notes it).
    const qe = dom.quantile_error || [];
    put('10-quartile-error', qe.length ? [{ type: 'bar', x: qe.map((r: any) => r[0]), y: qe.map((r: any) => r[1]), marker: { color: green }, text: qe.map((r: any) => r[1].toFixed(1)), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}% ' + L('medyan mutlak hata', 'median absolute error') + '<extra></extra>' }] : null,
        base({ margin: { t: 24, r: 16, b: 24, l: 8 }, yaxis: { title: { text: L('medyan mutlak hata %', 'median absolute error %'), font: { size: 10 } } } }), 260);

    // Error against how many listings a model has. Three series and a bucket line, as the generator
    // draws it: models with 1–4 listings are hollow, because their median comes from a handful of
    // ads and is mostly noise; the few models above the 40% cap sit as triangles on the edge rather
    // than stretching the axis; the red line is the median of those per-model medians per bucket.
    //
    // per_model_error carries all 745 models — site_data's residual_vs_n keeps only the 5+ ones, so
    // the hollow points exist only in the generator's metrics file (merged by shrink-site-data).
    const CAP = 40;
    const pme: number[][] = dom.per_model_error?.length ? dom.per_model_error : (dom.residual_vs_n || []).map((r: any) => [r[0], r[1]]);
    const buckets = dom.per_model_buckets || [];
    const nTick = (v: number) => v.toLocaleString(loc);
    const pick = (f: (n: number, m: number) => boolean) => pme.filter(([n, m]) => f(n, m));
    const many = pick((n, m) => n >= 5 && m <= CAP), few = pick((n, m) => n < 5 && m <= CAP), over = pick((_n, m) => m > CAP);
    const bLine = buckets
        .map((b: any) => {
            const ns = pme.filter(([n]) => n >= b.lo && n <= b.hi).map(([n]) => n).sort((x, y) => x - y);
            if (!ns.length) return null;
            const mid = ns.length >> 1;
            return { x: ns.length % 2 ? ns[mid] : (ns[mid - 1] + ns[mid]) / 2, y: b.median_of_medians, bin: b.bin };
        })
        .filter(Boolean) as { x: number; y: number; bin: string }[];
    const dot = (rows: number[][], extra: any) => ({ type: 'scatter', mode: 'markers', x: rows.map((r) => r[0]), y: rows.map((r) => r[1]), hovertemplate: '%{x} ' + L('ilan', 'listings') + ' · %{y:.1f}%<extra></extra>', ...extra });
    put('11-n-vs-error', pme.length ? [
        many.length && dot(many, { name: L('model (5+ ilan)', 'model (5+ listings)'), marker: { size: 6, color: green, opacity: 0.45 } }),
        few.length && dot(few, { name: L('model (1–4 ilan: medyanı birkaç ilandan, gürültülü)', 'model (1–4 listings: median from a few ads, noisy)'), marker: { size: 7, color: 'rgba(0,0,0,0)', line: { color: green, width: 1 } } }),
        over.length && { type: 'scatter', mode: 'markers', x: over.map((r) => r[0]), y: over.map(() => CAP + 1.5), name: L(`%${CAP} üstü: ${over.length} model (kenarda)`, `above ${CAP}%: ${over.length} models (at edge)`), marker: { size: 8, color: '#86857e', symbol: 'triangle-up' }, customdata: over.map((r) => r[1]), hovertemplate: '%{x} ' + L('ilan', 'listings') + ' · %{customdata:.1f}%<extra></extra>' },
        bLine.length && { type: 'scatter', mode: 'lines+markers+text', x: bLine.map((b) => b.x), y: bLine.map((b) => b.y), name: L('kova medyanı (1 · 2–4 · 5–19 · 20–99 · 100+ ilan)', 'bucket median (1 · 2–4 · 5–19 · 20–99 · 100+ listings)'), line: { color: '#b91c1c', width: 2.4 }, marker: { size: 7, color: '#b91c1c' }, text: bLine.map((b) => (lang === 'tr' ? `%${b.y.toFixed(1)}` : `${b.y.toFixed(1)}%`)), textposition: 'top center', textfont: { size: 10, color: '#b91c1c' }, customdata: bLine.map((b) => b.bin), hovertemplate: '%{customdata} ' + L('ilan', 'listings') + ' · %{y:.1f}%<extra></extra>' },
    ] : null,
        base({
            margin: { t: 8, r: 16, b: 40, l: 8 }, showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.26 },
            xaxis: { type: 'log', tickmode: 'array', tickvals: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], ticktext: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map(nTick), title: { text: L('modeldeki ilan sayısı (log)', 'listings per model (log)'), font: { size: 10 } } },
            yaxis: { range: [0, CAP + 4], ticksuffix: '%', title: { text: L('model başına medyan hata', 'median error per model'), font: { size: 10 } } },
        }), 320);

    const cf = dom.conformal;
    const cfHedef = cf?.coverage_hedef ?? 90;
    put('12-coverage', cf ? [{ type: 'bar', x: cf.by_quantile.map((r: any) => r[0]), y: cf.by_quantile.map((r: any) => r[1]), marker: { color: cf.by_quantile.map((r: any) => (r[1] >= cfHedef ? green : '#e08a1e')) }, text: cf.by_quantile.map((r: any) => r[1].toFixed(1) + '%'), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}% ' + L('kapsama', 'coverage') + '<extra></extra>' }] : null,
        base({ margin: { t: 24, r: 16, b: 24, l: 8 }, yaxis: { ticksuffix: '%' }, shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: cfHedef, y1: cfHedef, line: { dash: 'dash', color: '#86857e', width: 1 } }] }), 260);

    // ---------- drift ----------
    const dhist = dom.drift?.hist;
    const dsnapKeys = dhist ? snaps.filter((s) => Array.isArray(dhist[s])) : [];
    const dnbins = dsnapKeys.length ? dhist[dsnapKeys[0]].length : 0;
    const dkx = dom.drift?.kde_raw?.x;
    const dedges: number[] | null = dhist?.edges
        ? dhist.edges
        : (dkx && dnbins ? Array.from({ length: dnbins + 1 }, (_, i) => dkx[0] + (dkx[dkx.length - 1] - dkx[0]) * i / dnbins) : null);
    const dbinW = dedges ? dedges[1] - dedges[0] : 0;
    const dhistCenters = dedges ? dedges.slice(0, -1).map((e: number, i: number) => (e + dedges[i + 1]) / 2) : [];
    put('13-drift-hist', (dhist && dedges) ? dsnapKeys.map((s, i) => ({
        type: 'scatter', mode: 'lines', x: dhistCenters, y: dhist[s].map((v: number) => v * dbinW * 100), name: shortDate(s),
        line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2, shape: 'linear' as const },
        hovertemplate: shortDate(s) + ' · %{x:,.0f} ₺ · ' + L('frekans', 'freq') + ' %{y:.1f}%<extra></extra>',
    })) : null,
        base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { ticksuffix: '%' }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 34 } }), 280);

    const kraw = dom.drift?.kde_raw;
    put('14-drift-kde', kraw ? snaps.filter((s) => kraw[s]).map((s, i) => ({ type: 'scatter', mode: 'lines', x: kraw.x, y: kraw[s], name: shortDate(s), line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2, shape: 'spline' as const }, hovertemplate: shortDate(s) + ' · %{x:,.0f} ₺<extra></extra>' })) : null,
        base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { showticklabels: false }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 8 } }), 280);

    const btIns = met.backtest?.insample, btPer = met.backtest?.per_snapshot;
    const btLabels = btPer ? btPer.map((r: any) => r[0]) : (btIns ? btIns.map((r: any) => String(r[0]).replace('→', '')) : []);
    // What separates the two lines is how many listings each was trained on, so the pooled line
    // carries that count under each point and the per-period line states its range — the generator
    // made the same change, after the old "per-snapshot vs cumulative" labels left the reader to
    // guess why pooling helps.
    const btN = btPer ? btPer.map((r: any) => r[2]) : [];
    put('15-backtest', (btIns || btPer) ? [
        btPer && { type: 'scatter', mode: 'lines+markers', name: L(`yalnız o dönemin ilanları (${fmtN(Math.min(...btN))}–${fmtN(Math.max(...btN))} ilan)`, `that period's listings only (${fmtN(Math.min(...btN))}–${fmtN(Math.max(...btN))})`), x: btLabels, y: btPer.map((r: any) => r[1]), line: { color: '#e08a1e', width: 2 }, marker: { size: 6 }, text: btPer.map((r: any) => fmtN(r[2])), hovertemplate: L('dönem', 'period') + ' %{x}: %{y:.2f}% · %{text} ' + L('ilan', 'listings') + '<extra></extra>' },
        btIns && { type: 'scatter', mode: 'lines+markers+text', name: L('o tarihe kadarki tüm dönemler birlikte', 'all periods up to that date, pooled'), x: btLabels, y: btIns.map((r: any) => r[1]), line: { color: deep, width: 2 }, marker: { size: 7, color: green }, text: btIns.map((r: any) => `${fmtN(r[2])} ${L('ilan', 'listings')}`), textposition: 'bottom center', textfont: { size: 9, color: theme.muted }, hovertemplate: L('birikmiş →', 'pooled →') + '%{x}: %{y:.2f}%<extra></extra>' },
    ] : null,
        base({ margin: { t: 12, r: 16, b: 46, l: 34 }, yaxis: { ticksuffix: '%', title: { text: 'MAPE', font: { size: 10 } } }, xaxis: { title: { text: L('dönem', 'period'), font: { size: 10 } } }, showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.3 } }), 280);

    // ---------- data quality ----------
    // Columns that share an identical missing rate are empty in the SAME rows — a co-missing
    // block. Each shared rate gets its own colour so the blocks are visible at a glance.
    const sm = met.sistematik_missing;
    const smAll = sm?.column_missing_all ? [...sm.column_missing_all].sort((a: any, b: any) => a[1] - b[1]) : [];
    const SHARED_PALETTE = ['#7c5cff', '#0d9aba', '#0891b2', '#c026d3', '#059669', '#ef4444'];
    const smPctColor = new Map<number, string>();
    {
        const counts = new Map<number, number>();
        smAll.forEach((r: any) => counts.set(r[1], (counts.get(r[1]) || 0) + 1));
        [...counts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).forEach(([p], i) => smPctColor.set(p, SHARED_PALETTE[i % SHARED_PALETTE.length]));
    }
    put('16-missing', smAll.length ? [{ type: 'bar', orientation: 'h', y: smAll.map((r: any) => clabTab(r[0])), x: smAll.map((r: any) => r[1]), marker: { color: smAll.map((r: any) => smPctColor.get(r[1]) || '#e08a1e') }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 24, l: 8 } }), 520);

    const HEAT_ORDER = ['brand', 'series', 'model', 'segment', 'kb_body_type', 'kb_drivetrain', 'kb_transmission', 'kb_fuel'];
    const heatMatrix = (mm: any, hover: string) => {
        if (!mm?.labels || !mm.matrix) return null;
        const labels: string[] = [...HEAT_ORDER.filter((l) => mm.labels.includes(l)), ...mm.labels.filter((l: string) => !HEAT_ORDER.includes(l))];
        const idx = labels.map((l) => mm.labels.indexOf(l));
        const z = idx.map((ri) => idx.map((ci) => mm.matrix[ri][ci]));
        return [{ type: 'heatmap', z, x: labels, y: labels, zmin: 0, zmax: 1, colorscale: ramp, showscale: false, xgap: 1, ygap: 1, hovertemplate: hover }];
    };
    const heatLayout = base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } });
    put('17-theils-u', heatMatrix(met.theils_matrix, '%{y} | %{x}: %{z:.2f}<extra></extra>'), heatLayout, 360);
    put('18-cramers-v', heatMatrix(met.cramers_matrix, '%{y} · %{x}: %{z:.2f}<extra></extra>'), heatLayout, 360);

    const ssm = dom.series_segment_matrix || [];
    if (ssm.length) {
        const segOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'M', 'S'];
        const segCols = [...new Set(ssm.map((r: any) => r[1]))].sort((a: any, b: any) => {
            const ia = segOrder.indexOf(a), ib = segOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        }) as string[];
        const serRows = [...new Set(ssm.map((r: any) => r[0]))] as string[];
        const z = serRows.map((sr) => segCols.map((sc) => { const hit = ssm.find((r: any) => r[0] === sr && r[1] === sc); return hit ? hit[2] : null; }));
        put('19-series-segment', [{ type: 'heatmap', z, x: segCols, y: serRows, colorscale: ramp, showscale: false, hoverongaps: false, xgap: 1, ygap: 1, hovertemplate: '%{y} · %{x}: %{customdata}<extra></extra>', customdata: z.map((row) => row.map((v) => (v == null ? '—' : fmtM(v as number)))) }],
            base({ margin: { t: 8, r: 8, b: 24, l: 8 } }), 420);
    }

    const nc = dom.numeric_correlation;
    const numLabel = (raw: string) => (LBL.shortColumn[raw] ? LBL.label(LBL.shortColumn, raw, lang) : clab(raw));
    const DIVERGE: [number, string][] = [[0, '#ef4444'], [0.5, '#fdfcf9'], [1, '#059669']];
    const numHeat = (m: number[][]) => ((nc && m) ? [{ type: 'heatmap', z: m, x: nc.labels.map(numLabel), y: nc.labels.map(numLabel), zmin: -1, zmax: 1, colorscale: DIVERGE, showscale: false, xgap: 1, ygap: 1, hovertemplate: '%{y} · %{x}: %{z:.2f}<extra></extra>' }] : null);
    const corrLayout = base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } });
    put('20-pearson', numHeat(nc?.pearson), corrLayout, 340);
    put('21-spearman', numHeat(nc?.spearman), corrLayout, 340);

    // ---------- clusters ----------
    const pcaTrace = (pts: number[][] | null) => (pts ? [{ type: 'scatter', mode: 'markers', x: pts.map((r) => r[0]), y: pts.map((r) => r[1]), marker: { size: 4, opacity: 0.5, color: pts.map((r) => CATEGORICAL_LIST[r[2] % CATEGORICAL_LIST.length]) }, hoverinfo: 'skip' }] : null);
    const pcaLayout = base({ xaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid }, yaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid } });
    put('22-pca-scatter', pcaTrace(dom.pca_scatter ? sampleByCluster(dom.pca_scatter) : null), pcaLayout, 300);
    put('23-pca-scatter-13', pcaTrace(dom.pca_scatter_13 ? sampleByCluster(dom.pca_scatter_13) : null), pcaLayout, 300);

    const ksel = met.kmeans_selection;
    put('24-k-selection', ksel ? [
        { type: 'scatter', mode: 'lines+markers', name: L('İnertia (elbow)', 'Inertia (elbow)'), x: ksel.elbow.map((r: any) => r[0]), y: ksel.elbow.map((r: any) => r[1]), line: { color: deep, width: 2 }, marker: { size: 5 }, hovertemplate: 'k=%{x}: inertia %{y:.4s}<extra></extra>' },
        { type: 'scatter', mode: 'lines+markers', name: 'Silhouette', yaxis: 'y2', x: ksel.silhouette.map((r: any) => r[0]), y: ksel.silhouette.map((r: any) => r[1]), line: { color: '#e08a1e', width: 2 }, marker: { size: 7, color: ksel.silhouette.map((r: any) => (r[0] === ksel.secilen_k ? deep : '#e08a1e')) }, hovertemplate: 'k=%{x}: silhouette %{y:.3f}<extra></extra>' },
    ] : null,
        base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.24 }, margin: { t: 12, r: 40, b: 40, l: 8 }, xaxis: { title: { text: 'k', font: { size: 10 } }, dtick: 1 }, yaxis: { tickformat: '~s', tickfont: { size: 10, color: '#047857' } }, yaxis2: { fixedrange: true, overlaying: 'y', side: 'right', gridcolor: 'transparent', zeroline: false, tickfont: { size: 10, color: '#e08a1e' } } }), 300);

    const ph = dom.price_histogram ? [...dom.price_histogram].filter((r: any) => r[1] > 0) : [];
    put('25-price-hist', ph.length ? [{ type: 'bar', x: ph.map((r: any) => r[0]), y: ph.map((r: any) => r[1]), marker: { color: green }, customdata: ph.map((r: any) => fmtM(r[0])), hovertemplate: '%{customdata}: %{y:,} ' + L('ilan', 'listings') + '<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { tickformat: '~s' }, shapes: dom.price_dist?.median ? [{ type: 'line', yref: 'paper', y0: 0, y1: 1, xref: 'x', x0: dom.price_dist.median, x1: dom.price_dist.median, line: { dash: 'dash', color: '#86857e', width: 1 } }] : [] }), 260);

    return out;
}

/**
 * The seven text-analysis figures, from public/text_data.json.
 *
 * Nothing renders these right now: the text report and the text-analysis page are both closed
 * (app/[lang]/projects/car-price/text-analysis/page.tsx). The builder stays because the four md
 * files and their figures are still in the repo — reopening that route is uncommenting it, not
 * rewriting this. Delete this block only if the text report goes for good.
 *
 * Every value these charts read matches the pipeline's metrics/*.json (checked field by field
 * against the 2026-09-16 run). One name does not: the pipeline renamed the contradiction flag,
 * so it is mapped below. Builders are the ones FinalTextAnalysis already uses.
 *
 * The labels are not lib/labels. Each chart sits next to a table the generator wrote, and the two
 * must name a signal the same way, so they mirror build_text_report.py (COEF_TR / COEF_EN,
 * CLAIM_EN, COUNT_KEY). lib/labels stays as it is — the dashboard and drift pages read it.
 */
const COEF_RENAMED: Record<string, string> = {
    "Aldatıcı 'temiz' iddiası (gizli hasar)": "Çelişkili 'temiz' beyanı (satıcının formu hasar gösteriyor)",
};
const COEF_TR: Record<string, string> = {
    'Premium audio': 'Premium ses sistemi', 'Mod suspension': 'Modifiye süspansiyon', 'Mod exhaust': 'Modifiye egzoz',
    'Mod engine/tune': 'Modifiye motor / yazılım', 'Navigation': 'Navigasyon', 'Heated seats': 'Isıtmalı koltuk',
    'Panoramic roof': 'Panoramik tavan', 'Driver assist': 'Sürüş asistanı', 'Mod wheels/body': 'Modifiye jant / kaporta',
    'Leather seats': 'Deri koltuk',
};
const COEF_EN: Record<string, string> = {
    'Servis kayıtlı': 'Service history', 'Yetkili servis': 'Franchised service', 'Garanti': 'Warranty',
    "Çelişkili 'temiz' beyanı (satıcının formu hasar gösteriyor)": "Contradictory 'clean' claim (seller's own form shows damage)",
};
const CLAIM_EN: Record<string, string> = {
    'değişensiz ama değişen var': "'no replaced parts' but has replaced",
    'boyasız ama boya var': "'no paint' but has paint",
    'blanket temiz ama yapısal hasar': "blanket 'clean' but structural damage",
};
const COUNT_KEY: Record<string, [string, string]> = {
    year: ['yıl', 'year'], hp: ['hp', 'hp'], model: ['model', 'model'], fuel: ['yakıt', 'fuel'],
    transmission: ['vites', 'transmission'], body: ['kasa', 'body'], drivetrain: ['çekiş', 'drivetrain'],
    engine_cc: ['motor hacmi', 'engine size'],
};
export function buildTextFigures(d: any, lang: Lang): Record<string, Fig> {
    if (!d) return {};

    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
    const theme = makeHybridTheme();
    const green = theme.accent, amber = '#e08a1e', red = '#b91c1c';
    const fmtN = (n: number) => Math.round(n).toLocaleString(loc);
    const pct = (n: number, digits = 1) => (lang === 'tr' ? '%' + Number(n).toFixed(digits) : Number(n).toFixed(digits) + '%');

    const sevT = LBL.labeller(LBL.severity, lang);
    const claimT = (k: string) => (lang === 'tr' ? k : CLAIM_EN[k] ?? k);
    const countT = (k: string) => COUNT_KEY[k]?.[lang === 'tr' ? 0 : 1] ?? k;
    const equipT = LBL.labeller(LBL.equipment, lang);
    // The flag's full name is the table's; on a phone one line of it would squeeze the bars to
    // nothing, so the parenthetical drops to a second line.
    const coefT = (raw: string) => {
        const f = COEF_RENAMED[raw] ?? raw;
        return (lang === 'tr' ? COEF_TR[f] ?? f : COEF_EN[f] ?? f).replace(' (', '<br>(');
    };
    const residT = LBL.labeller(LBL.residualSignal, lang);

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

    const sev = d.flag_severity, ex = d.extras, hc = d.hedonic_coefficients;
    const resid = d.residuals, fields = d.crosssource_fields;

    const out: Record<string, Fig> = {};
    const put = (slug: string, traces: any, layout: any, height: number) => {
        if (!traces || !traces.filter(Boolean).length) return;
        out[slug] = { traces: traces.filter(Boolean), layout, height };
    };

    const sevOrder = ['hafif', 'orta', 'ağır'].filter((k) => sev?.severity_n?.[k] != null);
    put('01-severity', sevOrder.length ? [{
        type: 'bar', x: sevOrder.map(sevT), y: sevOrder.map((k) => sev.severity_n[k]),
        marker: { color: [green, amber, red] },
        text: sevOrder.map((k) => `${sev.severity_n[k]} · ${sev.severity_pct?.[k] != null ? pct(sev.severity_pct[k]) : ''}`),
        textposition: 'outside', cliponaxis: false, hovertemplate: '%{x}: %{y}<extra></extra>',
    }] : null, base({ margin: { t: 28, r: 16, b: 28, l: 8 } }), 230);

    const distKeys = sev?.painted_dist ? Object.keys(sev.painted_dist) : [];
    put('02-panel-dist', distKeys.length ? [
        { type: 'bar', name: L('boyalı', 'painted'), x: distKeys, y: distKeys.map((k) => sev.painted_dist[k] ?? 0), marker: { color: amber }, hovertemplate: L('%{y} ilan · %{x} boyalı panel', '%{y} listings · %{x} painted panels') + '<extra></extra>' },
        { type: 'bar', name: L('değişen', 'replaced'), x: distKeys, y: distKeys.map((k) => sev.changed_dist?.[k] ?? 0), marker: { color: red }, hovertemplate: L('%{y} ilan · %{x} değişen panel', '%{y} listings · %{x} replaced panels') + '<extra></extra>' },
    ] : null, base({ barmode: 'group', showlegend: true, legend: { orientation: 'h', y: 1.14, x: 0, font: { size: 10 } }, margin: { t: 30, r: 16, b: 30, l: 8 }, xaxis: { title: { text: L('panel sayısı', 'panel count'), font: { size: 10 } } } }), 230);

    // The claim arms overlap — a listing can match more than one — so these sum above n_flag.
    const claimRows = sev?.claim_type_n ? Object.entries(sev.claim_type_n as Record<string, number>).sort((a, b) => a[1] - b[1]) : [];
    put('03-claim-type', claimRows.length ? [{
        type: 'bar', orientation: 'h', y: claimRows.map(([k]) => claimT(k)), x: claimRows.map(([, v]) => v),
        marker: { color: claimRows.map(([k]) => (k.startsWith('blanket') ? green : amber)) },
        text: claimRows.map(([, v]) => String(v)), textposition: 'outside', cliponaxis: false,
        hovertemplate: '%{y}: %{x}<extra></extra>',
    }] : null, base({ margin: { t: 8, r: 44, b: 36, l: 8 }, xaxis: { title: { text: L('ilan (bir ilan birden çok türde olabilir)', 'listings (one listing can match several)'), font: { size: 10 } } } }), 200);

    const eq = (ex?.equipment_coverage || []).slice().sort((a: any, b: any) => a.mention_pct - b.mention_pct);
    put('04-equipment', eq.length ? [{ type: 'bar', orientation: 'h', y: eq.map((r: any) => equipT(r.feature)), x: eq.map((r: any) => r.mention_pct), marker: { color: green }, text: eq.map((r: any) => pct(r.mention_pct)), textposition: 'outside', hovertemplate: '%{y}: %{x:.1f}% · %{customdata} ' + L('ilan', 'listings') + '<extra></extra>', customdata: eq.map((r: any) => fmtN(r.n)) }] : null,
        base({ margin: { t: 8, r: 46, b: 24, l: 8 } }), Math.max(260, eq.length * 26));

    const coefs = (hc?.coefficients || []).slice().sort((a: any, b: any) => a.controlled_pct - b.controlled_pct);
    put('05-controlled-effects', coefs.length ? [{ type: 'bar', orientation: 'h', y: coefs.map((c: any) => coefT(c.feature)), x: coefs.map((c: any) => c.controlled_pct), marker: { color: coefs.map((c: any) => (!c.sig ? '#b8b6ae' : c.controlled_pct >= 0 ? green : red)) }, error_x: { type: 'data', symmetric: false, array: coefs.map((c: any) => (c.ci95 ? c.ci95[1] - c.controlled_pct : 0)), arrayminus: coefs.map((c: any) => (c.ci95 ? c.controlled_pct - c.ci95[0] : 0)), color: '#b8b6ae', thickness: 1.2, width: 4 }, hovertemplate: '%{y}: %{x:+.1f}%<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted, ticksuffix: '%' } }), Math.max(300, coefs.length * 26));

    // Only `robust` signals may be shown (pipeline rule); the build already strips the rest.
    const residSig = (resid?.signals || []).filter((s: any) => s.robust).slice().sort((a: any, b: any) => a.lift - b.lift);
    put('06-residual-signals', residSig.length ? [{ type: 'bar', orientation: 'h', y: residSig.map((s: any) => residT(s.signal)), x: residSig.map((s: any) => s.lift), marker: { color: green }, text: residSig.map((s: any) => `${s.lift.toFixed(2)}× · n${s.n_in_top5pct}`), textposition: 'outside', hovertemplate: '%{y}: %{x:.2f}× lift<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 62, b: 24, l: 8 } }), Math.max(200, residSig.length * 40));

    const fcRows = Object.entries((fields?.counts || {}) as Record<string, number>).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
    put('07-field-contradictions', fcRows.length ? [{ type: 'bar', orientation: 'h', y: fcRows.map(([k]) => countT(k)), x: fcRows.map(([, v]) => v), marker: { color: amber }, text: fcRows.map(([, v]) => String(v)), textposition: 'outside', hovertemplate: '%{y}: %{x} ' + L('çelişki', 'conflicts') + '<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 40, b: 24, l: 8 } }), Math.max(240, fcRows.length * 30));

    return out;
}

const CONFIG = { displayModeBar: false as const, responsive: true, scrollZoom: false, doubleClick: false as const };

/** One figure, by the slug the pipeline gave it. Falls back to the PNG if the slug is unknown. */
export function ReportFigure({ fig, caption, fallback }: { fig?: Fig; caption: string; fallback?: string }) {
    if (!fig) {
        if (!fallback) return null;
        return (
            <figure className="m-0 my-7">
                {/* eslint-disable-next-line @next/next/no-img-element -- the PNG the pipeline
                    generated, shown only when a chart is unavailable; next/image would add a
                    loader for an image nobody normally sees */}
                <img src={fallback} alt={caption} className="w-full rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9]" />
                <figcaption className="mt-2 px-1 font-mono text-[11px] text-[#86857e]">{caption}</figcaption>
            </figure>
        );
    }
    return (
        <figure className="m-0 my-7 rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-3 shadow-[0_1px_3px_rgba(40,40,30,0.05)] sm:p-4">
            <figcaption className="mb-2 px-1 text-[13px] font-semibold text-[#1a1a1a]">{caption}</figcaption>
            <div style={{ height: fig.height, minHeight: 220, width: '100%' }}>
                <PlotlyChart data={fig.traces as any} layout={fig.layout as any} config={CONFIG} guard={false} />
            </div>
        </figure>
    );
}

/** The two reports read different files, so the hook picks the right builder for the page. */
export function useReportFigures(kind: 'car-price' | 'text-analysis', data: any, lang: Lang) {
    return useMemo(
        () => (kind === 'car-price' ? buildReportFigures(data, lang) : buildTextFigures(data, lang)),
        [kind, data, lang],
    );
}
