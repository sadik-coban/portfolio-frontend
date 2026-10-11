"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- site_data.json and text_data.json are
   emitted by the Python pipeline and carry no schema; every accessor here mirrors one that
   already reads them the same way in FinalReportLab/FinalTextAnalysis. Typing 30 domain keys
   by hand would invent a contract the generator never promised and would drift from it. */

import { useMemo } from 'react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme, CATEGORICAL_LIST, GREEN_RAMP } from '../../_charts/types';
import { sampleRepresentative } from '../../_charts/sample';
import * as LBL from '@/lib/labels';

// Native Plotly for the figures the analysis pipeline ships as PNGs.
//
// The pipeline draws its figures with matplotlib and writes them next to the markdown. The
// site already had those charts as interactive Plotly — the mapping is 1:1, slug for slug — so
// nothing new is invented here: the trace builders are the ones FinalReportLab already uses,
// keyed by the pipeline's figure slug so the markdown can ask for one by name.
//
// The data is public/report-data.json, the current pipeline run. That matters: the site's
// older public/site_data.json is a different run from the report text it would sit next to, and a
// chart that contradicts the paragraph above it is worse than no chart. Since the generator's
// 2026-09-25 restructure its keys are English (cardatasys/docs/site-data-renames.json).

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
    // model_year_median.baseline) — the report names LightGBM as "the model" even where CatBoost
    // edges it on MAPE, so the variant table's winner is not the right source here.
    const fmtK = (n: number) => '₺' + Math.round(n / 1e3).toLocaleString(loc) + 'K';
    const baseMae = dom.model_year_median?.baseline?.MAE, modelMae = dom.model_compare?.lightgbm?.MAE;
    put('00-base-vs-model', (baseMae != null && modelMae != null) ? [{
        type: 'bar', x: [L('emsal medyanı', 'comparable median'), 'model'], y: [baseMae, modelMae],
        marker: { color: ['#b8b6ae', green] }, text: [fmtK(baseMae), fmtK(modelMae)], textposition: 'outside', cliponaxis: false,
        hovertemplate: '%{x}: %{text}<extra></extra>',
    }] : null, base({ margin: { t: 24, r: 16, b: 28, l: 8 }, yaxis: { tickformat: '~s', title: { text: L('ortalama mutlak hata (₺)', 'mean absolute error (₺)'), font: { size: 10 } } } }), 260);

    // ---------- market shape ----------
    // As the generator draws figure 01: each bar's label carries its listing count, the export's order
    // (cheapest first) runs top to bottom, the axis is in ₺M.
    const body = (dom.body_median || []).filter((r: any) => r[0] && r[0] !== 'missing');
    put('01-body-median',
        [{ type: 'bar', orientation: 'h', y: body.map((r: any) => `${r[0]} · ${fmtN(r[2])}`), x: body.map((r: any) => r[1] / 1e6), marker: { color: green }, hovertemplate: '%{y}: %{customdata}<extra></extra>', customdata: body.map((r: any) => fmtM(r[1])) }],
        base({ margin: { t: 8, r: 16, b: 34, l: 8 }, yaxis: { autorange: 'reversed' }, xaxis: { title: { text: L('medyan fiyat (₺M)', 'median price (₺M)'), font: { size: 10 } } } }), 300);

    // No document asks for this slug right now: the generator dropped the cluster section
    // from the decision note on 2026-09-22 and took the figure with it. Kept because a figure
    // file returns with the next sync while a builder would have to be written again.
    const seg = [...(dom.segment_ladder || [])].sort((a: any, b: any) => a[1] - b[1]);
    put('02-segment-median',
        [{ type: 'bar', x: seg.map((r: any) => r[0]), y: seg.map((r: any) => r[1]), marker: { color: green }, text: seg.map((r: any) => fmtM(r[1])), textposition: 'outside', hovertemplate: '%{x}: %{text} · %{customdata} ' + L('ilan', 'listings') + '<extra></extra>', customdata: seg.map((r: any) => fmtN(r[2])) }],
        base({ margin: { t: 24, r: 16, b: 28, l: 8 } }), 300);

    // ---------- hedonic drivers ----------
    // The same regression under two controls, side by side on each term's row, as the generator draws
    // figure 03: segment control, and model control — effects within one model name, the column the
    // decision note prints. Effects in % (exp(β)−1) with 95% intervals clustered by model. Rows follow
    // the segment column's term order; the model column is matched to it by term id.
    const hcols = dom.hedonic_reliability?.columns;
    const hterms: string[] = (hcols?.segment?.coefficients || []).map((r: any) => r.term);
    const hRow = (col: string) => {
        const by = new Map((hcols?.[col]?.coefficients || []).map((r: any) => [r.term, r]));
        return hterms.map((t) => by.get(t) as any);
    };
    const pctS = (v: number) => (v < 0 ? '−' : '+') + (lang === 'tr' ? `%${Math.abs(v).toFixed(2)}` : `${Math.abs(v).toFixed(2)}%`);
    const hedTrace = (col: string, name: string, colour: string, off: number) => {
        const rows = hRow(col);
        if (!rows.length || rows.some((r) => !r)) return null;
        return {
            type: 'scatter', mode: 'markers', name, x: rows.map((r) => r.pct_effect), y: hterms.map((_, i) => i + off),
            error_x: { type: 'data', symmetric: false, array: rows.map((r) => r.pct_hi - r.pct_effect), arrayminus: rows.map((r) => r.pct_effect - r.pct_lo), color: colour, thickness: 1.4, width: 3 },
            marker: { size: 7, color: colour },
            customdata: rows.map((r, i) => [LBL.label(LBL.hedonicTermId, hterms[i], lang), pctS(r.pct_effect), pctS(r.pct_lo), pctS(r.pct_hi)]),
            hovertemplate: `%{customdata[0]} · ${name}: %{customdata[1]} [%{customdata[2]}, %{customdata[3]}]<extra></extra>`,
        };
    };
    put('03-hedonic-ci', hterms.length ? [
        hedTrace('segment', L('segment kontrolü', 'segment control'), '#86857e', -0.16),
        hedTrace('model', L('model kontrolü', 'model control'), green, 0.16),
    ] : null,
        base({
            showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.16 }, margin: { t: 8, r: 16, b: 44, l: 8 },
            xaxis: { ticksuffix: '%', title: { text: L('fiyata etki %', 'effect on price %'), font: { size: 10 } } },
            yaxis: { tickmode: 'array', tickvals: hterms.map((_, i) => i), ticktext: hterms.map((t) => LBL.label(LBL.hedonicTermId, t, lang)), autorange: 'reversed', showgrid: false },
            shapes: [{ type: 'line', xref: 'x', x0: 0, x1: 0, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dash', color: '#86857e', width: 1 } }],
        }), 400);

    // methodology.lofo holds 22 rows: 19 single-feature removals AND 3 group removals. Drawing all
    // of them on one axis double-counts — DAMAGE_COLS competes with its own 13 members — which is
    // exactly what the note under this figure says the chart must not do. So the same five
    // non-overlapping keys the generator picks (build_report.py, `flat_keys`), in its order, on its
    // ₺-thousand axis, named as the generator names them (report_common.py lofo_name: a group key gets
    // its own label, a single feature its column label).
    const LOFO_FLAT = ['gb_mileage', 'vehicle_age', 'DAMAGE_COLS', 'MODEL_SERIES', 'ENGINE'];
    const LOFO_GROUP: Record<string, string> = { DAMAGE_COLS: L('hasar grubu', 'damage group'), MODEL_SERIES: L('model/seri adı', 'model/series name'), ENGINE: L('motor (hp + cc)', 'engine (hp + cc)') };
    const lofoBy: Record<string, number> = Object.fromEntries((met.lofo || []).map((r: any) => [r[0], r[1]]));
    const lofo = LOFO_FLAT.filter((k) => lofoBy[k] != null);
    put('04-lofo-flat', lofo.length ? [{ type: 'bar', orientation: 'h', y: lofo.map((k) => LOFO_GROUP[k] ?? clab(k)), x: lofo.map((k) => lofoBy[k] / 1000), marker: { color: lofo.map((k) => (lofoBy[k] >= 0 ? green : '#ef4444')) }, hovertemplate: '%{y}: %{x:+,.1f}<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 34, l: 8 }, yaxis: { autorange: 'reversed' }, xaxis: { zeroline: true, zerolinecolor: theme.muted, title: { text: L('ΔRMSE (₺bin)', 'ΔRMSE (₺k)'), font: { size: 10 } } } }), 300);

    // ---------- depreciation curves (median, plus mean when the export carries it) ----------
    // Axes as the generator labels them, price in ₺M. Mileage rows are 25k-km buckets keyed by their
    // lower edge; the generator plots each at the bucket's middle, in thousands of km.
    const curve = (rows: any[], xs: number[], hov: string, colour: string) => {
        if (!rows?.length) return null;
        const hasMean = rows.some((r: any) => r[3] != null);
        return [
            { type: 'scatter', mode: 'lines+markers', name: L('medyan', 'median'), x: xs, y: rows.map((r: any) => r[1] / 1e6), line: { color: colour, width: 2 }, marker: { size: 4 }, hovertemplate: hov + ' · ' + L('medyan', 'median') + ' %{customdata}<extra></extra>', customdata: rows.map((r: any) => fmtM(r[1])) },
            ...(hasMean ? [{ type: 'scatter', mode: 'lines+markers', name: L('ortalama', 'mean'), x: xs, y: rows.map((r: any) => r[3] / 1e6), line: { color: '#e08a1e', width: 2, dash: 'dot' as const }, marker: { size: 4 }, hovertemplate: hov + ' · ' + L('ort', 'mean') + ' %{customdata}<extra></extra>', customdata: rows.map((r: any) => fmtM(r[3])) }] : []),
        ];
    };
    const curveLayout = (xTitle: string) => base({
        showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.3 }, margin: { t: 8, r: 16, b: 48, l: 8 },
        xaxis: { title: { text: xTitle, font: { size: 10 } } }, yaxis: { title: { text: L('fiyat (₺M)', 'price (₺M)'), font: { size: 10 } } },
    });
    const ad = dom.age_depreciation || [], kp = dom.km_price || [];
    const kmW = kp.length > 1 ? kp[1][0] - kp[0][0] : 0;
    put('05-age-price', curve(ad, ad.map((r: any) => r[0]), L('%{x} yaş', 'age %{x}'), deep), curveLayout(L('yaş (yıl)', 'age (years)')), 280);
    put('06-km-price', curve(kp, kp.map((r: any) => (r[0] + kmW / 2) / 1000), L('%{x} bin km', '%{x}k km'), green), curveLayout(L('kilometre (bin km)', 'mileage (k km)')), 280);

    const bc = dom.brand_compare;
    put('07-brand', bc ? [{ type: 'bar', x: ['BMW', 'Audi'], y: [bc.bmw_median, bc.audi_median], marker: { color: [green, '#0d9aba'] }, text: [bc.bmw_median, bc.audi_median].map(fmtM), textposition: 'outside', hovertemplate: '%{x}: %{text}<extra></extra>' }] : null,
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
    // per_model_error carries all 745 models — domain.residual_vs_n keeps only the 5+ ones, so the
    // hollow points come from the export's own error_drivers block (the same one figures 27–30 read).
    const ed = d.error_drivers ?? {};
    const CAP = 40;
    const pme: number[][] = ed.per_model_error?.length ? ed.per_model_error : (dom.residual_vs_n || []).map((r: any) => [r[0], r[1]]);
    const buckets = ed.per_model_buckets || [];
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

    // ---------- error in lira and the engine rule (figures 27–30, from error_drivers) ----------
    // The generator draws 27, 29 and 30 as two panels side by side (report_common.py :739, :785,
    // :826). Here the two panels stack: side by side, a phone gets ~150px per panel. Each panel
    // owns an explicit domain, and its title is an annotation pinned to the top of that domain.
    const TOP: [number, number] = [0.6, 1], BOTTOM: [number, number] = [0, 0.4];
    const ax = (o: any = {}) => ({ fixedrange: true, automargin: true, gridcolor: theme.grid, zeroline: false, linecolor: theme.grid, tickfont: { size: 10, color: theme.muted }, ...o });
    const axTitle = (text: string) => ({ text, font: { size: 10 } });
    const panelTitle = (text: string, top: number) => ({ text, xref: 'paper', yref: 'paper', x: 0.5, y: top, xanchor: 'center', yanchor: 'bottom', showarrow: false, font: { size: 11, color: theme.text } });
    // Below the bottom panel's tick labels (and its axis title, when it has one — pass a larger drop).
    const footnote = (text: string, drop = 44) => ({ text, xref: 'paper', yref: 'paper', x: 0.5, y: 0, xanchor: 'center', yanchor: 'top', yshift: -drop, showarrow: false, font: { size: 9, color: theme.muted } });
    const pctTxt = (v: number) => (lang === 'tr' ? `%${v.toFixed(1)}` : `${v.toFixed(1)}%`);
    const grey = '#86857e', red = '#b91c1c';

    // 27 · where the lira error adds up, and the bias — both with listings grouped by what the model
    // predicted (since the generator's 2026-09-28 run; the left panel used to group by actual price).
    // The bias axis is fixed at ±MAE/2, as the generator draws it, so a small bar reads as small
    // instead of filling the panel.
    const lq: any[] = ed.lira_quartile || [], pq: any[] = ed.pred_quartile || [];
    const halfMae = (dom.model_compare?.lightgbm?.MAE ?? 0) / 2 / 1e3;
    put('27-quartile-lira', (lq.length && pq.length && halfMae) ? [
        { type: 'bar', xaxis: 'x', yaxis: 'y', x: lq.map((r) => r[0]), y: lq.map((r) => r[2]), marker: { color: green }, text: lq.map((r) => pctTxt(r[2])), textposition: 'outside', cliponaxis: false, customdata: lq.map((r) => fmtK(r[3])), hovertemplate: '%{x}: %{text} · ' + L('ort. |hata|', 'mean |error|') + ' %{customdata}<extra></extra>', showlegend: false },
        { type: 'bar', xaxis: 'x2', yaxis: 'y2', name: L('ortalama', 'mean'), x: pq.map((r) => r[0]), y: pq.map((r) => r[2] / 1e3), marker: { color: green }, hovertemplate: '%{x} · ' + L('ortalama', 'mean') + ' %{y:+.1f} ' + L('₺bin', '₺k') + '<extra></extra>' },
        { type: 'bar', xaxis: 'x2', yaxis: 'y2', name: L('medyan', 'median'), x: pq.map((r) => r[0]), y: pq.map((r) => r[3] / 1e3), marker: { color: grey }, hovertemplate: '%{x} · ' + L('medyan', 'median') + ' %{y:+.1f} ' + L('₺bin', '₺k') + '<extra></extra>' },
    ] : null, base({
        barmode: 'group', showlegend: true, margin: { t: 24, r: 16, b: 34, l: 8 },
        // Inside the bias panel's top-right: the axis runs to ±MAE/2 and the bars stay near zero, so
        // that corner is empty — above the panel it collided with the panel title on a phone.
        legend: { font: { size: 9 }, orientation: 'h', x: 1, xanchor: 'right', y: BOTTOM[1], yanchor: 'top', bgcolor: 'rgba(0,0,0,0)' },
        xaxis: { anchor: 'y', title: axTitle(L('tahmin edilen fiyat çeyreği', 'predicted-price quartile')) },
        yaxis: { domain: TOP, range: [0, Math.max(...lq.map((r) => r[2]), 0) * 1.18], title: axTitle(L('toplam lira hatasındaki pay %', 'share of total lira error %')) },
        xaxis2: ax({ anchor: 'y2', title: axTitle(L('tahmin edilen fiyat çeyreği', 'predicted-price quartile')) }),
        yaxis2: ax({ domain: BOTTOM, range: [-halfMae, halfMae], zeroline: true, zerolinecolor: grey, title: axTitle(L('sapma: tahmin − gerçek (₺bin; eksen ±MAE/2)', 'bias: predicted − actual (₺k; axis ±MAE/2)')) }),
        annotations: [panelTitle(L('hata nerede birikiyor', 'where the error adds up'), TOP[1]), panelTitle(L('tahmine göre gruplanınca sapma', 'bias when grouped by prediction'), BOTTOM[1])],
    }), 560);

    // 28 · error in lira against the prediction. The generator scatters all 29,988 [actual, pred]
    // pairs; here the same pairs (the outlier-preserving sample) take the density + red-ring
    // language of figures 08 and 09, so the extremes survive the binning.
    const liraPts: number[][] = pvtObj?.points ? pvtObj.points.map((p: number[]) => [p[1] / 1e6, (p[1] - p[0]) / 1e6]) : [];
    const diagLira = liraPts.length ? sampleRepresentative(liraPts, (p: number[]) => Math.abs(p[1])) : null;
    put('28-residual-lira', diagLira ? [hb2d(liraPts), scOut(diagLira.outliers)] : null,
        base({
            margin: { t: 8, r: 12, b: 34, l: 46 },
            xaxis: { title: axTitle(L('tahmin edilen fiyat (₺M)', 'predicted price (₺M)')) },
            yaxis: { title: axTitle(L('tahmin − gerçek (₺M; eksi = düşük tahmin)', 'predicted − actual (₺M; negative = under)')) },
            shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0, y1: 0, line: { color: red, width: 1.2 } }],
        }), 320);

    // 29 · from a range to one number: each candidate's distance from the same model's exact value.
    // Boxes from the export's percentiles ([p5, p25, p50, p75, p95]) — whiskers are p5–p95, no
    // fliers — with the chosen candidate filled and its median printed in bold, as the generator does.
    const er = ed.engine_rule;
    const ENG: [string, string][] = [['engine_cc', L('motor hacmi', 'engine size')], ['power_hp', L('motor gücü', 'engine power')]];
    const CAND: [string, string][] = [['lower', L('alt sınır', 'lower bound')], ['mid', L('orta nokta', 'midpoint')], ['upper', L('üst sınır', 'upper bound')]];
    const num = (v: number) => (Number.isInteger(v) ? fmtN(v) : v.toLocaleString(loc, { maximumFractionDigits: 1 }));
    if (er?.engine_cc && er?.power_hp) {
        const traces: any[] = [], notes: any[] = [];
        ENG.forEach(([k], i) => {
            const h = er[k], xs = i ? 'x2' : 'x', ys = i ? 'y2' : 'y';
            CAND.forEach(([c, label], j) => {
                const p = h.candidates?.[c]?.percentiles;
                if (!p) return;
                const chosen = c === h.chosen;
                const name = chosen ? `${label}<br>(${L('seçilen', 'chosen')})` : label;
                traces.push({ type: 'box', xaxis: xs, yaxis: ys, x: [name], width: 0.5, lowerfence: [p[0]], q1: [p[1]], median: [p[2]], q3: [p[3]], upperfence: [p[4]], boxpoints: false, fillcolor: chosen ? green : '#e4e2dd', line: { color: '#33332f', width: 1.2 }, whiskerwidth: 0.4, showlegend: false, hoverinfo: 'y' });
                // x by category index, not name: j + 0.28 sits just past the box's right edge (width
                // 0.5) at every chart width, where a pixel shift would land on the box on a wide one.
                notes.push({ xref: xs, yref: ys, x: j + 0.28, y: p[2], text: chosen ? `<b>${num(p[2])}</b>` : num(p[2]), xanchor: 'left', showarrow: false, font: { size: 10, color: theme.text } });
            });
        });
        const title = (k: string, heading: string) => `${heading} · ` + L(`referanslı ${fmtN(er[k].with_reference)} aralıklı ilan`, `${fmtN(er[k].with_reference)} range listings with a reference`);
        const yTitle = (k: string) => axTitle(L(`|aday − kesin değer| (${er[k].unit})`, `|candidate − exact value| (${er[k].unit})`));
        put('29-hp-cc-rule', traces, base({
            margin: { t: 24, r: 16, b: 80, l: 8 },
            xaxis: { anchor: 'y' },
            yaxis: { domain: TOP, rangemode: 'tozero', title: yTitle('engine_cc') },
            xaxis2: ax({ anchor: 'y2' }),
            yaxis2: ax({ domain: BOTTOM, rangemode: 'tozero', title: yTitle('power_hp') }),
            annotations: [
                ...notes,
                panelTitle(title('engine_cc', ENG[0][1]), TOP[1]), panelTitle(title('power_hp', ENG[1][1]), BOTTOM[1]),
                footnote(L('kutu = çeyrekler · çizgi ve sayı = medyan · bıyık = %5–%95<br>kesin değer = aynı modelin kesin değerli ilanlarının medyanı',
                    'box = quartiles · line and number = median · whiskers = 5th–95th percentile<br>exact value = median of the same model’s exact-value listings')),
            ],
        }), 600);

        // 30 · what the site gives: lower × upper bound. Each (lower, upper) pair is one bubble, its area
        // proportional to the listings behind it; exact values sit on the diagonal, ranges above it.
        const t30: any[] = [];
        const lims: [number, number][] = [];
        ENG.forEach(([k], i) => {
            const pairs: any[] = er[k].pairs || [];
            if (!pairs.length) { lims.push([0, 1]); return; }
            const xs = i ? 'x2' : 'x', ys = i ? 'y2' : 'y', leg = i ? 'legend2' : 'legend';
            const all = pairs.flatMap((r) => [r[0], r[1]]);
            const lim: [number, number] = [Math.min(...all) * 0.95, Math.max(...all) * 1.02];
            lims.push(lim);
            const nMax = Math.max(...pairs.map((r) => r[3]));
            const sizeref = (2 * nMax) / 34 ** 2; // largest bubble ≈ 34px across
            ([[false, green, L('kesin değer', 'exact value')], [true, red, L('aralık', 'range')]] as [boolean, string, string][]).forEach(([isRange, colour, label]) => {
                const rows = pairs.filter((r) => Boolean(r[2]) === isRange);
                if (!rows.length) return;
                const total = rows.reduce((s, r) => s + r[3], 0);
                t30.push({
                    type: 'scatter', mode: 'markers', xaxis: xs, yaxis: ys, legend: leg,
                    // Two lines, so both entries fit one row on a phone (the count on its own line).
                    name: `${label}<br>${fmtN(total)} ${L('ilan', 'listings')}`,
                    x: rows.map((r) => r[0]), y: rows.map((r) => r[1]), customdata: rows.map((r) => fmtN(r[3])),
                    marker: { size: rows.map((r) => r[3]), sizemode: 'area', sizeref, sizemin: 3, color: colour, opacity: 0.55, line: { width: 0 } },
                    hovertemplate: `${L('alt', 'lower')} %{x:,} · ${L('üst', 'upper')} %{y:,} ${er[k].unit} · %{customdata} ${L('ilan', 'listings')}<extra></extra>`,
                });
            });
            t30.push({ type: 'scatter', mode: 'lines', xaxis: xs, yaxis: ys, legend: leg, name: 'y = x', showlegend: false, x: lim, y: lim, line: { dash: 'dash' as const, color: grey, width: 1 }, hoverinfo: 'skip' });
        });
        // The equal scale shrinks each panel to a centred square, so a legend pinned to the paper's
        // left edge floated away from it on a wide screen. A centred row above the square stays with
        // it at every width; the panel title moves up to make room. The y = x line stays out of the
        // legend — the footnote already says exact values sit on the diagonal — so the row fits a phone.
        const legAt = (top: number) => ({ font: { size: 9 }, orientation: 'h', x: 0.5, xanchor: 'center', y: top, yanchor: 'bottom', itemsizing: 'constant', bgcolor: 'rgba(0,0,0,0)' });
        const titleAbove = (text: string, top: number) => ({ ...panelTitle(text, top), yshift: 36 });
        const eqAxes = (i: number, lim: [number, number], unit: string) => ({
            [i ? 'xaxis2' : 'xaxis']: ax({ anchor: i ? 'y2' : 'y', range: lim, constrain: 'domain', title: axTitle(L(`alt sınır (${unit})`, `lower bound (${unit})`)) }),
            [i ? 'yaxis2' : 'yaxis']: ax({ domain: i ? BOTTOM : TOP, anchor: i ? 'x2' : 'x', range: lim, scaleanchor: i ? 'x2' : 'x', scaleratio: 1, title: axTitle(L(`üst sınır (${unit})`, `upper bound (${unit})`)) }),
        });
        const c = er.engine_cc, h = er.power_hp;
        put('30-engine-bounds', t30, {
            ...base({ margin: { t: 66, r: 16, b: 92, l: 8 }, showlegend: true }),
            ...eqAxes(0, lims[0], c.unit), ...eqAxes(1, lims[1], h.unit),
            legend: legAt(TOP[1]), legend2: legAt(BOTTOM[1]),
            annotations: [
                titleAbove(ENG[0][1], TOP[1]), titleAbove(ENG[1][1], BOTTOM[1]),
                footnote(L(`nokta büyüklüğü = ilan sayısı · kesin değer köşegende (alt = üst)<br>çizilemeyen: açık uçlu aralık ${fmtN(c.open_ended)}/${fmtN(h.open_ended)}, değersiz ${fmtN(c.no_value)}/${fmtN(h.no_value)} ilan (hacim/güç)`,
                    `point size = listings · exact values on the diagonal (lower = upper)<br>not drawn: open-ended range ${fmtN(c.open_ended)}/${fmtN(h.open_ended)}, no value ${fmtN(c.no_value)}/${fmtN(h.no_value)} listings (size/power)`), 50),
            ],
        }, 720);
    }

    // Two arms per predicted-price band, as the generator draws figure 12: one margin for every listing,
    // and a margin set per band (Mondrian), both cross-calibrated. The axis starts 5 points below the
    // lowest bar, the generator's floor, so the gap to the target line stays readable.
    const cf = dom.conformal;
    const cfHedef = cf?.coverage_target ?? 90;
    const cfOne: any[] = cf?.by_quantile || [], cfBand: any[] = cf?.mondrian_by_quantile || [];
    const cfArm = (rows: any[], name: string, colour: string) => ({
        type: 'bar', name, x: rows.map((r) => r[0]), y: rows.map((r) => r[1]), marker: { color: colour },
        // Bare numbers over the bars, as in figure 10 — the axis carries the %, and with "%" two
        // neighbouring labels touch on a phone.
        text: rows.map((r) => r[1].toFixed(1)), textposition: 'outside', cliponaxis: false, textfont: { size: 10 },
        hovertemplate: '%{x} · ' + name + ': %{y:.1f}% ' + L('kapsama', 'coverage') + '<extra></extra>',
    });
    put('12-coverage', cfOne.length ? [
        cfArm(cfOne, L('tek oran', 'one margin'), '#b8b6ae'),
        cfBand.length && cfArm(cfBand, L('banda göre', 'per band'), green),
    ] : null, base({
        barmode: 'group', showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.3 }, margin: { t: 24, r: 16, b: 44, l: 8 },
        xaxis: { title: { text: L('tahmin edilen fiyat çeyreği', 'predicted-price quartile'), font: { size: 10 } } },
        yaxis: { ticksuffix: '%', range: [Math.min(...[...cfOne, ...cfBand].map((r) => r[1])) - 5, 100] },
        shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: cfHedef, y1: cfHedef, line: { dash: 'dash', color: '#86857e', width: 1 } }],
    }), 300);

    // ---------- drift ----------
    // 13 as the generator draws it: each snapshot's histogram as a step line over the export's bin
    // edges, density per ₺M (the export's per-₺ density × 1e6), price in ₺M.
    const driftLayout = (xTitle: string, yTitle: string) => base({
        showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.3 }, margin: { t: 12, r: 12, b: 48, l: 8 },
        xaxis: { title: { text: xTitle, font: { size: 10 } } }, yaxis: { title: { text: yTitle, font: { size: 10 } } },
    });
    const dhist = dom.drift?.hist;
    const dedges: number[] = dhist?.edges || [];
    const dsnapKeys = dhist ? snaps.filter((s) => Array.isArray(dhist[s]) && dhist[s].length + 1 === dedges.length) : [];
    put('13-drift-hist', dsnapKeys.length ? dsnapKeys.map((s, i) => ({
        type: 'scatter', mode: 'lines', name: shortDate(s),
        // 'hv' holds each bin's height across it; the last height is repeated to close the final bin
        x: dedges.map((e) => e / 1e6), y: [...dhist[s], dhist[s][dhist[s].length - 1]].map((v: number) => v * 1e6),
        line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 1.6, shape: 'hv' as const },
        hovertemplate: shortDate(s) + ' · %{x:.2f} ₺M · ' + L('yoğunluk', 'density') + ' %{y:.2f}<extra></extra>',
    })) : null, driftLayout(L('fiyat (₺M)', 'price (₺M)'), L('yoğunluk (₺M başına)', 'density (per ₺M)')), 300);

    // 14 is the density of LOG price (the export's kde_log), as its caption says — not of raw price.
    const klog = dom.drift?.kde_log;
    put('14-drift-kde', klog?.x ? snaps.filter((s) => klog[s]).map((s, i) => ({
        type: 'scatter', mode: 'lines', x: klog.x, y: klog[s], name: shortDate(s),
        line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2, shape: 'spline' as const },
        customdata: klog.x.map((x: number) => fmtM(Math.exp(x))),
        hovertemplate: shortDate(s) + ' · log %{x:.2f} (%{customdata}) · ' + L('yoğunluk', 'density') + ' %{y:.2f}<extra></extra>',
    })) : null, driftLayout(L('log fiyat', 'log price'), L('yoğunluk', 'density')), 300);

    const btIns = met.backtest?.insample, btPer = met.backtest?.per_snapshot;
    const btLabels = btPer ? btPer.map((r: any) => r[0]) : (btIns ? btIns.map((r: any) => String(r[0]).replace('→', '')) : []);
    // What separates the two lines is how many listings each was trained on, so the pooled line
    // carries that count under each point and the per-period line states its range — the generator
    // made the same change, after the old "per-snapshot vs cumulative" labels left the reader to
    // guess why pooling helps.
    const btN = btPer ? btPer.map((r: any) => r[2]) : [];
    put('15-backtest', (btIns || btPer) ? [
        btPer && { type: 'scatter', mode: 'lines+markers', name: L(`yalnız o dönemin ilanları (${fmtN(Math.min(...btN))}–${fmtN(Math.max(...btN))} ilan)`, `that period's listings only (${fmtN(Math.min(...btN))}–${fmtN(Math.max(...btN))})`), x: btLabels, y: btPer.map((r: any) => r[1]), line: { color: '#e08a1e', width: 2 }, marker: { size: 6 }, text: btPer.map((r: any) => fmtN(r[2])), hovertemplate: L('dönem', 'period') + ' %{x}: %{y:.2f}% · %{text} ' + L('ilan', 'listings') + '<extra></extra>' },
        btIns && { type: 'scatter', mode: 'lines+markers+text', name: L('o tarihe kadarki tüm dönemler birlikte', 'all periods up to that date, pooled'), x: btLabels, y: btIns.map((r: any) => r[1]), line: { color: deep, width: 2 }, marker: { size: 7, color: green }, text: btIns.map((r: any) => `${fmtN(r[2])} ${L('ilan', 'listings')}`),
            // The end labels lean inward: centred, a phone's plot edge cut "10,901" and "29,988 listings" in
            // half. The last one goes above its point, into the empty band between the two lines — below
            // it, on a phone, it ran into the line coming up from the third point.
            textposition: btIns.map((_: any, i: number) => (i === 0 ? 'bottom right' : i === btIns.length - 1 ? 'top left' : 'bottom center')), textfont: { size: 9, color: theme.muted }, hovertemplate: L('birikmiş →', 'pooled →') + '%{x}: %{y:.2f}%<extra></extra>' },
    ] : null,
        base({ margin: { t: 12, r: 16, b: 46, l: 34 }, yaxis: { ticksuffix: '%', title: { text: 'MAPE', font: { size: 10 } } }, xaxis: { title: { text: L('dönem', 'period'), font: { size: 10 } } }, showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.3 } }), 280);

    // ---------- data quality ----------
    // Colour = membership of a co-missing block (systematic_groups, the table under the figure), grey =
    // outside any block — as the caption says and the generator draws it. Colouring by an identical
    // missing rate was wrong: transmission_brand (74.1%) and gb_drivetrain (74.0%) are close in rate but
    // only 48% co-missing, while the 16-column catalogue block spans 27.5–27.7%.
    const sm = met.systematic_missing;
    const smAll: any[] = sm?.column_missing_all || [];
    const BLOCK_PALETTE = ['#059669', '#7c3aed', '#0891b2', '#d97706', '#2563eb', '#db2777'];
    const smBlock = new Map<string, string>();
    (sm?.systematic_groups || []).forEach((g: any, gi: number) => (g.columns || []).forEach((c: string) => smBlock.set(c, BLOCK_PALETTE[gi % BLOCK_PALETTE.length])));
    // The generator's label: the column label, plus the tab's name only where a gb_/kb_ twin carries the
    // same label (Drivetrain (Overview) vs the model's kb_drivetrain).
    const col16 = (k: string) => {
        const t = clab(k);
        const twin = k.startsWith('gb_') ? 'kb_' + k.slice(3) : k.startsWith('kb_') ? 'gb_' + k.slice(3) : null;
        if (twin && CL[twin] && clab(twin) === t) return t + (k.startsWith('gb_') ? L(' (Genel Bakış)', ' (Overview)') : L(' (KısaBilgi)', ' (Quick info)'));
        return t;
    };
    put('16-missing', smAll.length ? [{ type: 'bar', orientation: 'h', y: smAll.map((r) => col16(r[0])), x: smAll.map((r) => r[1]), marker: { color: smAll.map((r) => smBlock.get(r[0]) || '#b8b6ae') }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }] : null,
        base({ margin: { t: 8, r: 16, b: 34, l: 8 }, yaxis: { autorange: 'reversed' }, xaxis: { title: { text: L('eksik %', 'missing %'), font: { size: 10 } } } }), 560);

    // 17 (Theil's U), 18 (Cramér's V), 20 (Pearson), 22/23 (PCA) and 24 (k selection) left the
    // technical report in the generator's 2026-09-28/29 simplification, their numbers kept empty.

    // ---------- the two matrices (19, 21), in the generator's full form ----------
    // Rows top to bottom in the generator's order, its labels, and a colour scale. Cells sit on index
    // axes (ticks carry the names) so the single-listing dots of 19 can be placed inside a cell.
    const colorbar = (title: string) => ({ thickness: 10, len: 0.9, outlinewidth: 0, tickfont: { size: 9, color: theme.muted }, title: { text: title, font: { size: 9, color: theme.muted } } });
    const idxAxis = (labels: string[], o: any = {}) => ({ tickmode: 'array', tickvals: labels.map((_, i) => i), ticktext: labels, showgrid: false, zeroline: false, ...o });

    // 19 · series × segment, median price in ₺M. Both axes sorted as the generator sorts them (code-point
    // order: digits, then capitals, then "i Serisi"); a black dot marks a cell that is a single listing,
    // as the caption says. The ramp starts at a pale green, not at the paper colour, so the cheapest cell
    // (A1 × B) is still visible.
    const ssm: any[] = dom.series_segment_matrix || [];
    if (ssm.length) {
        const serRows = [...new Set(ssm.map((r) => r[0] as string))].sort();
        const segCols = [...new Set(ssm.map((r) => r[1] as string))].sort();
        const cell = (sr: string, sc: string) => ssm.find((r) => r[0] === sr && r[1] === sc);
        const z = serRows.map((sr) => segCols.map((sc) => { const h = cell(sr, sc); return h ? h[2] / 1e6 : null; }));
        const cd = serRows.map((sr) => segCols.map((sc) => { const h = cell(sr, sc); return h ? `${fmtM(h[2])} · ${fmtN(h[3])} ${L('ilan', 'listings')}` : ''; }));
        const singles = ssm.filter((r) => r[3] === 1);
        const ramp19 = GREEN_RAMP.slice(1).map((c, i, a) => [i / (a.length - 1), c] as [number, string]);
        put('19-series-segment', [
            { type: 'heatmap', z, x: segCols.map((_, i) => i), y: serRows.map((_, i) => i), colorscale: ramp19, showscale: true, colorbar: colorbar('₺M'), hoverongaps: false, xgap: 1, ygap: 1, customdata: cd, hovertemplate: '%{customdata}<extra></extra>' },
            singles.length && { type: 'scatter', mode: 'markers', x: singles.map((r) => segCols.indexOf(r[1]) + 0.32), y: singles.map((r) => serRows.indexOf(r[0]) - 0.3), marker: { size: 6, color: '#111', line: { width: 1, color: '#fff' } }, hovertemplate: L('tek ilan', 'single listing') + '<extra></extra>' },
        ], base({
            margin: { t: 8, r: 8, b: 28, l: 8 },
            xaxis: idxAxis(segCols, { range: [-0.5, segCols.length - 0.5] }),
            yaxis: idxAxis(serRows, { range: [serRows.length - 0.5, -0.5] }),
        }), 560);
    }

    // 21 · Spearman, named with the column labels the report's text uses ("Power (hp)–Engine (cc) 0.61").
    const nc = dom.numeric_correlation;
    const DIVERGE: [number, string][] = [[0, '#ef4444'], [0.5, '#fdfcf9'], [1, '#059669']];
    if (nc?.spearman && nc.labels) {
        const nl: string[] = nc.labels.map(clab);
        put('21-spearman', [{ type: 'heatmap', z: nc.spearman, x: nl.map((_, i) => i), y: nl.map((_, i) => i), zmin: -1, zmax: 1, colorscale: DIVERGE, showscale: true, colorbar: colorbar('ρ'), xgap: 1, ygap: 1, customdata: nl.map((ry) => nl.map((cx) => `${ry} · ${cx}`)), hovertemplate: '%{customdata}: %{z:.2f}<extra></extra>' }],
            base({
                margin: { t: 8, r: 8, b: 12, l: 12 },
                // upright, not the generator's 45°: at 45° fourteen labels overlap on a phone
                xaxis: idxAxis(nl, { tickangle: -90, tickfont: { size: 9, color: theme.muted }, range: [-0.5, nl.length - 0.5] }),
                yaxis: idxAxis(nl, { range: [nl.length - 0.5, -0.5] }),
            }), 480);
    }

    // Rows are [bin's lower edge, count]; each bar spans its bin (the generator draws them edge-aligned),
    // so the dashed median lands in the bin it belongs to. Price in ₺M.
    const phAll: any[] = dom.price_histogram || [];
    const phW = phAll.length > 1 ? phAll[1][0] - phAll[0][0] : 0;
    const ph = phAll.filter((r) => r[1] > 0);
    put('25-price-hist', (ph.length && phW) ? [{ type: 'bar', x: ph.map((r) => (r[0] + phW / 2) / 1e6), y: ph.map((r) => r[1]), width: (phW * 0.9) / 1e6, marker: { color: green }, customdata: ph.map((r) => `${fmtM(r[0])} … ${fmtM(r[0] + phW)}`), hovertemplate: '%{customdata}: %{y:,} ' + L('ilan', 'listings') + '<extra></extra>' }] : null,
        base({
            margin: { t: 8, r: 16, b: 34, l: 8 },
            xaxis: { title: { text: L('fiyat (₺M)', 'price (₺M)'), font: { size: 10 } } }, yaxis: { title: { text: L('ilan', 'listings'), font: { size: 10 } } },
            shapes: dom.price_dist?.median ? [{ type: 'line', yref: 'paper', y0: 0, y1: 1, xref: 'x', x0: dom.price_dist.median / 1e6, x1: dom.price_dist.median / 1e6, line: { dash: 'dash', color: '#b91c1c', width: 1.2 } }] : [],
        }), 280);

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
