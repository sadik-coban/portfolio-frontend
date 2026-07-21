"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, ArrowLeft } from 'lucide-react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme, CATEGORICAL_LIST, GREEN_RAMP } from '../../_charts/types';
import * as LBL from '@/lib/labels';
import { useLang, localize } from '../i18n';
import { Monogram } from '../Monogram';

// Car-price analytics report, driven entirely by public/site_data.json
// (BMW + Audi Turkish used-car market, 4 snapshots). Schema + per-section
// narrative follow METHODOLOGY.md: meta (künye) · domain (market insights) ·
// methodology (model decisions). Numbers are read live from the JSON — nothing
// hardcoded. Charts are Plotly with zoom/pan disabled (fixedrange). Geographic
// analysis and the outlier experiment are intentionally omitted.

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

export default function FinalReportLab({ initialData }: { initialData?: any } = {}) {
    const { lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const theme = useMemo(() => makeHybridTheme(), []);
    // Seed from server-provided data when present (static SSR path) so the first
    // render — server AND client — already has the content: no skeleton, and the
    // body text is in the prerendered HTML (AI-bot / no-JS readable). The client
    // fetch below stays only as a fallback for the non-SSR path.
    const [d, setD] = useState<any>(initialData ?? null);
    const [err, setErr] = useState(false);
    const [scMode, setScMode] = useState<'density' | 'points'>('density'); // OOF diagnostics render toggle
    // Kaggle-notebook shell state: TOC (built from the rendered sections), scroll-spy active id, read progress, mobile drawer.
    const [toc, setToc] = useState<{ id: string; title: string; chapter: string; chapterId: string }[]>([]);
    const [activeId, setActiveId] = useState('');
    const [drawer, setDrawer] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    // Read-progress is written straight to the bar's DOM node (ref, not state) so
    // scrolling never re-renders this component — see the scroll effect below.
    const progressRef = useRef<HTMLDivElement>(null);
    const goTo = (id: string) => {
        setDrawer(false);
        const el = document.getElementById(id);
        if (!el) return;
        // The 05 groups are <details> and appear in the TOC. Jumping to a collapsed one would land
        // on a closed box, so open the target (and any collapsed ancestor) first, then let Plotly
        // re-measure the charts that were mounted at zero width while hidden.
        for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p.tagName === 'DETAILS') (p as HTMLDetailsElement).open = true;
        window.dispatchEvent(new Event('resize'));
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        // Shareable deep-link: reflect the target in the URL without a second jump.
        // (Set instantly on click; the scroll-spy keeps the hash in sync as you scroll —
        // both via replaceState, so back/forward history stays clean.)
        history.replaceState(null, '', '#' + id);
    };

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
        if (initialData) return; // already seeded from the server (static SSR) — skip the fetch
        fetch('/site_data.json')
            .then((r) => r.text())
            .then((txt) => setD(JSON.parse(txt.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'))))
            .catch(() => setErr(true));
    }, [initialData]);

    // After the notebook renders: build the TOC from the [data-section]/[data-chapter] nodes,
    // wire a scroll-spy (top-most visible section → active TOC item) + a read-progress bar.
    useEffect(() => {
        if (!d) return;
        const root = mainRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-section],[data-chapter]'));
        const items: { id: string; title: string; chapter: string; chapterId: string }[] = [];
        let chapter = '', chapterId = '';
        nodes.forEach((el, i) => {
            if (!el.id) el.id = 'sec-' + i;
            const title = el.getAttribute('data-title') || '';
            if (el.hasAttribute('data-chapter')) { chapter = title; chapterId = el.id; return; }
            items.push({ id: el.id, title, chapter, chapterId });
        });
        setToc(items);
        // Scroll-spy: highlight the top-most visible section AND reflect it in the URL
        // hash (debounced) so the address bar tracks what you're reading. replaceState
        // (not pushState) adds no history entry and doesn't scroll, so Back still leaves
        // the page and the write can't fight the scroll. The 120ms debounce collapses a
        // fast / click-driven pass through many sections into a single final write.
        let hashTimer: ReturnType<typeof setTimeout> | null = null;
        const io = new IntersectionObserver((entries) => {
            const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (!vis[0]) return;
            const id = vis[0].target.id;
            setActiveId(id);
            if (hashTimer) clearTimeout(hashTimer);
            hashTimer = setTimeout(() => { if (window.location.hash !== '#' + id) history.replaceState(null, '', '#' + id); }, 120);
        }, { rootMargin: '-84px 0px -66% 0px', threshold: 0 });
        items.forEach((it) => { const el = document.getElementById(it.id); if (el) io.observe(el); });
        // Progress: rAF-throttled, written directly to the bar's DOM node — no setState,
        // so scrolling never re-renders the heavy chart tree.
        let raf = 0;
        const paint = () => {
            raf = 0;
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
            if (progressRef.current) progressRef.current.style.width = (p * 100).toFixed(1) + '%';
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); if (hashTimer) clearTimeout(hashTimer); };
    }, [d, lang]);

    // Deep-link + print for the collapsible 05 groups. A #id target inside a closed
    // <details> stays hidden, and browsers differ on Ctrl+F into collapsed content — so on
    // load and on hashchange, open the ancestor <details> then scroll; before printing, open
    // every <details>. DOM-level, so the memoized body (and its 25 charts) isn't re-rendered.
    useEffect(() => {
        if (!d) return;
        // Sections that moved in the restructure keep their old permalinks working.
        const HASH_ALIAS: Record<string, string> = {
            'lofo-feature-importance': 'price-drivers',   // LOFO folded into the hedonic block (02)
            'lofo': 'price-drivers',
            'size-body': 'clusters',                     // size/body charts now sit with the clusters
            'price-distribution': 'built',               // skew/log became "Why log price" (05)
            'segmentation-kmeans': 'clusters',
            'pca-axis-meanings': 'built',
            'decision-summary': 'whats-it-worth',
            'dataset': 'data-quality',
        };
        const reveal = () => {
            const raw = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
            if (!raw) return;
            const id = document.getElementById(raw) ? raw : (HASH_ALIAS[raw] ?? raw);
            const el = document.getElementById(id);
            if (!el) return;
            for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p.tagName === 'DETAILS') (p as HTMLDetailsElement).open = true;
            el.scrollIntoView({ block: 'start' });
        };
        const openAll = () => document.querySelectorAll('details').forEach((n) => { (n as HTMLDetailsElement).open = true; });
        const t = setTimeout(reveal, 0);
        window.addEventListener('hashchange', reveal);
        window.addEventListener('beforeprint', openAll);
        return () => { clearTimeout(t); window.removeEventListener('hashchange', reveal); window.removeEventListener('beforeprint', openAll); };
    }, [d]);

    // Heavy notebook body — memoized so scroll-driven shell re-renders (progress via
    // ref, activeId, drawer) reuse the SAME element; React then skips reconciling this
    // subtree and never re-runs Plotly.react on the ~25 charts (element-identity bailout).
    const body = useMemo(() => {
        if (!d) return null;
        const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
        const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
        const fmtN = (n: number) => Math.round(n).toLocaleString(loc);
        const fmtM = (n: number) => '₺' + (n / 1e6).toFixed(2) + 'M';
        const fmtKm = (n: number) => (n / 1000).toFixed(0) + 'k';
        const fmtK = (n: number) => '₺' + Math.round(n / 1000).toLocaleString(loc) + 'K';
        const pct = (n: number, digits = 1) => (lang === 'tr' ? '%' + Number(n).toFixed(digits) : Number(n).toFixed(digits) + '%');
        const signPct = (n: number) => (n > 0 ? '+' : '') + (lang === 'tr' ? '%' + n : n + '%');
    const meta = d.meta, dom = d.domain, met = d.methodology;
    // column_labels (ham kolon → {tr,en,tab}) — eksen/grup etiketlerini veriden çevir (fallback: ham ad).
    const CL: Record<string, any> = d.column_labels || {};
    const clab = (raw: string) => { const e = CL[raw]; return e && (e.tr || e.en) ? L(e.tr, e.en) : raw; };
    // Strip the source-tab prefix for display in technical chip lists (kept features, cluster
    // discriminators, dup-def columns, PCA loadings). Keeps snake_case; only drops the kb_/gb_ noise.
    // Content that relies on the prefix (gb_segment, the gb_/kb_ dual-source table, "Redundant kb/gb"
    // reason, G≡MPV) is left untouched — none of those flow through this helper.
    const noTab = (raw: string) => String(raw).replace(/^(kb|gb)_/, '');
    // like clab, but appends the source-tab (Genel Bakış / KısaBilgi) so gb_/kb_ twins are distinguishable.
    const TABNAME: Record<string, string> = { gb: LBL.label(LBL.sourceTab, CL._tab_meaning?.gb ?? 'Genel Bakış', lang), kb: LBL.label(LBL.sourceTab, CL._tab_meaning?.kb ?? 'KısaBilgi', lang) };
    const clabTab = (raw: string) => { const e = CL[raw]; if (!e) return raw; const bl = L(e.tr, e.en); return e.tab ? `${bl} (${TABNAME[e.tab] || e.tab})` : bl; };
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
    const BASELINE_KEYS = ['naive', 'dealer'];
    const frModels: any[] = frMk
        ? Object.entries(frMk).filter(([key, v]: any) => !BASELINE_KEYS.includes(key) && v && typeof v === 'object' && v.MAPE != null).map(([key, v]: any) => ({ key, label: mLabel(key), ...v }))
        : [];
    // The single median baseline: model+year median WITH fallback, 5-fold OOF on the same split as
    // the models. Kept OUT of frModels (BASELINE_KEYS still filters the legacy naive/dealer keys out
    // of the variant list). This is "the dealer's reflex" — same model, same year, look at the
    // median — but computed properly: when a (model,year) cell is empty in train it falls back to
    // (model) then global. taban = overall OOF metrics; metrik_kirilim = per-fallback-tier detail.
    const mym = dom.model_yil_medyani;
    const frBase = mym?.taban && mym.taban.MAPE != null ? mym.taban : null;
    const frWinM = frModels.length ? frModels.reduce((a, b) => (b.MAPE < a.MAPE ? b : a)) : null;
    // headline lift is against that baseline — the realistic human benchmark
    const baseBetter = frBase && frWinM ? Math.round((frBase.MAE - frWinM.MAE) / frBase.MAE * 100) : 0;
    const gainToModel = frBase && frWinM ? frBase.MAE - frWinM.MAE : 0;            // what the model buys over the baseline
    const frWin = frWinM?.label ?? '';
    // The irreducible floor: identical-spec cars (model·year·km·hp·body) still list this far apart.
    // No model can go below it. The "no hyperparameter search" claim rests on THIS, not on the MAE
    // (dividing the tuning gain by the MAE and calling it a noise floor would be circular).
    const nf = dom.noise_floor;
    const floorRatio = (nf && frWinM) ? frWinM.MAE / nf.mae_floor : 0;
    const headroom = (nf && frWinM) ? frWinM.MAE - nf.mae_floor : 0;
    // 00 · decomposition — two typical-error bars: the model+year median baseline → the model.
    // One grey + one teal so the eye lands on the model bar. Plotly draws the first row at the
    // bottom, so the arrays are reversed to read top-down in the listed order.
    const decompRows: { k: string; v: number }[] = (frBase && frWinM) ? [
        { k: L('Model+yıl medyanı', 'Model+year median'), v: frBase.MAE },
        { k: L('Model', 'Model'), v: frWinM.MAE },
    ] : [];
    const decompData = decompRows.length ? [{
        type: 'bar', orientation: 'h',
        y: decompRows.map((r) => r.k).reverse(),
        x: decompRows.map((r) => r.v).reverse(),
        marker: { color: decompRows.map((_, i) => (i === decompRows.length - 1 ? theme.accent : '#d8d6d0')).reverse() },
        text: decompRows.map((r) => fmtK(r.v)).reverse(),
        textposition: 'outside', cliponaxis: false,
        hovertemplate: '%{y}: %{text} ' + L('tipik hata', 'typical error') + '<extra></extra>',
    }] : null;
    const hr = dom.hedonic_reliability;
    const hedoTerm = (t: string) => LBL.label(LBL.hedonicTerm, t, lang);
    // feature-drop reasons come from the data as Turkish — English rendering for the EN site
    const fdReason = (tr: string) => LBL.label(LBL.featureDropReason, tr, lang);
    const vifTerm = (t: string) => LBL.label(LBL.vifTerm, t, lang);
    const fmtP = (p: number | null): string => (p == null ? '—' : p < 0.001 ? '<0.001' : p.toFixed(3));
    const boot: any[] = hr?.bootstrap || [];
    // single hedonic source of truth: prefer the detailed bootstrap-fit (hedonic_reliability)
    // so the hero KPI + depreciation lead agree with the Hedonic section (domain.hedonic is the stale summary).
    // effect % of a bootstrap term: use yuzde_etki if present, else derive from the log coefficient (e^β − 1)
    const bpEff = (b: any): number => (b?.yuzde_etki != null ? b.yuzde_etki : (Math.exp(b.nokta) - 1) * 100);
    const bootPct = (t: string): number | undefined => { const b = boot.find((x: any) => x.terim === t); return b == null ? undefined : bpEff(b); };
    const r1 = (n: number): number => Number(n.toFixed(1));
    const hedAge = r1(bootPct('yaş') ?? g?.age_pct ?? 0);
    const hedKm = r1(bootPct('km(100K)') ?? g?.km100k_pct ?? 0);
    const lastSnapPct = g?.snapshot?.length ? r1(Number(g.snapshot[g.snapshot.length - 1][1])) : 0;   // cumulative market move over the snapshots (+5.3%)
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
    // Brand ablation (adding brand on top of series+model changes nothing) + brand Theil's U
    // (brand is fully determined by both model and series → carries no separate information).
    const bAbl = dom.brand_ablation;
    const uBrand = (b: string) => { const tm = met.theils_matrix; if (!tm?.labels) return null; const i = tm.labels.indexOf('brand'), j = tm.labels.indexOf(b); return (i >= 0 && j >= 0) ? tm.matrix[i][j] : null; };
    const uBrandModel = uBrand('model'), uBrandSeries = uBrand('series');

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
    // Cluster names come from the pipeline, derived from the axis that actually separates each one
    // (age+km vs the market median, then damage or engine). No value words ("premium"/"economy") and
    // no frontend disambiguation — the pipeline guarantees unique names, so this is a pure TR→EN pass.
    const clusterName = (p: any) => LBL.clusterName(p?.ad ?? '', lang);
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
    // (snapshot bar-histogram removed: drift.hist has a single owner — 04 · How long you can trust it.)
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
    const cmissData = [{ type: 'bar', orientation: 'h', y: cmiss.map((r: any) => clabTab(r[0])), x: cmiss.map((r: any) => r[1]), marker: { color: '#e08a1e' }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }];
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
    const smData = smAll.length ? [{ type: 'bar', orientation: 'h', y: smAll.map((r: any) => clabTab(r[0])), x: smAll.map((r: any) => r[1]), marker: { color: smAll.map((r: any) => smPctColor.get(r[1]) || '#e08a1e') }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }] : null;
    const smGroups: any[] = sm?.sistematik_gruplar || [];
    // §2 gb_/kb_ dual-source: the same attribute lives in two tabs; the Overview (gb) tab is often
    // heavily empty while QuickInfo (kb) is populated → the populated side is used. column_missing_all
    // only lists the high-missing (gb) side; the kb twin sits near 0% (not listed).
    const gbEmpty = (sm?.column_missing_all || []).filter((r: any) => String(r[0]).startsWith('gb_') && r[1] >= 40)
        .sort((a: any, b: any) => b[1] - a[1]).map((r: any) => ({ label: clab(r[0]), gb: r[1] }));
    const specCorr = sm?.spec_missing_korelasyon;   // scalar ~1.0 (co-missing correlation of the spec block)
    const smNot = sm?.not;

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

    // ---- previously-forgotten sections: price histogram · conformal coverage · numeric correlation · content-duplication ----
    const ph = dom.price_histogram ? [...dom.price_histogram].filter((r: any) => r[1] > 0) : [];
    const phData = ph.length ? [{ type: 'bar', x: ph.map((r: any) => r[0]), y: ph.map((r: any) => r[1]), marker: { color: green }, customdata: ph.map((r: any) => fmtM(r[0])), hovertemplate: '%{customdata}: %{y:,} ' + L('ilan', 'listings') + '<extra></extra>' }] : null;

    const cf = dom.conformal;
    const cfHedef = cf?.coverage_hedef ?? 90;
    const cfData = cf ? [{ type: 'bar', x: cf.by_quantile.map((r: any) => r[0]), y: cf.by_quantile.map((r: any) => r[1]), marker: { color: cf.by_quantile.map((r: any) => (r[1] >= cfHedef ? green : '#e08a1e')) }, text: cf.by_quantile.map((r: any) => r[1].toFixed(1) + '%'), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}% ' + L('kapsama', 'coverage') + '<extra></extra>' }] : null;

    // short heatmap-axis overrides; anything else falls back to column_labels (clab).
    const numLabel = (raw: string) => LBL.shortColumn[raw] ? LBL.label(LBL.shortColumn, raw, lang) : clab(raw);
    const nc = dom.numeric_correlation;
    const DIVERGE: [number, string][] = [[0, '#ef4444'], [0.5, '#fdfcf9'], [1, '#059669']];
    const numHeat = (m: number[][]) => (nc && m) ? [{ type: 'heatmap', z: m, x: nc.labels.map(numLabel), y: nc.labels.map(numLabel), zmin: -1, zmax: 1, colorscale: DIVERGE, showscale: false, xgap: 1, ygap: 1, hovertemplate: '%{y} · %{x}: %{z:.2f}<extra></extra>' }] : null;
    const pearsonHeat = numHeat(nc?.pearson);
    const spearmanHeat = numHeat(nc?.spearman);

    const idup = met.icerik_duplike;
    // (SHAP moved to its own /shap page — bar + beeswarm images per model. Not in the report.)

        return (
            <div className="max-w-[860px]">
            {/* No preamble, no KPI strips (spec P1). The page opens with the question. Every number
                those three strips carried already lives in the chapter that owns it: the scale in 01,
                the drivers in 02, the model table in 03. Two heroes = no hero. */}

            {/* ============ 00 · WHAT'S IT WORTH? ============ */}
                    <GroupHeading id="decision" n="00" title={L('Ne değerinde?', 'What’s it worth?')} />
                    {(() => {
                        let sn = 0; const N = () => String(++sn).padStart(2, '0');
                        const mae = frWinM ? fmtK(frWinM.MAE) : '—', mape = frWinM ? pct(frWinM.MAPE, 2) : '—';
                        const bmae = frBase ? fmtK(frBase.MAE) : '—';
                        const mk = mym?.metrik_kirilim;
                        return (
                    <>

                    <Section id="whats-it-worth" n={N()} title={L('Ne değerinde?', 'What’s it worth?')}
                        lead={L(`Bir ilan ${fmtM(dom.price_dist.median)} istiyor. Fazla mı? Model+yıl medyanı — aynı model, aynı yıl, medyana bak — ${bmae} yanılıyor. Model ${mae}: %${baseBetter} daha iyi.`, `A listing asks ${fmtM(dom.price_dist.median)}. Too much? The model+year median — same model, same year, look at the median — misses by ${bmae}. The model misses by ${mae}: ${baseBetter}% better.`)}>
                        {decompData && (
                            <div className="rounded-[16px] border border-[#cfe8dc] bg-gradient-to-br from-[#f1f8f4] to-[#fbfdfb] p-4 sm:p-5">
                                <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                                    <span className="font-mono text-[28px] font-bold tabular-nums text-[#047857] sm:text-[34px]">{mae}</span>
                                    <span className="font-mono text-[15px] text-[#22332b]">{mape} MAPE</span>
                                    <span className="font-mono text-[13px] text-[#86857e]">· {L('model+yıl medyanı', 'model+year median')} {bmae} → {L(`%${baseBetter} daha iyi`, `${baseBetter}% better`)}</span>
                                </div>
                                <Chart h={160}><PlotlyChart data={decompData} layout={base({ margin: { t: 6, r: 76, b: 22, l: 8 }, xaxis: { tickformat: '~s', range: [0, Math.max(...decompRows.map((r) => r.v)) * 1.14], title: { text: L('tipik hata (MAE, ₺)', 'typical error (MAE, ₺)'), font: { size: 10 } } } })} config={config} guard={false} /></Chart>
                                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-[#5f5f5a]">{L(`Model+yıl medyanına bakmak ${bmae} yanılıyor; model ${mae}. Kalan ${fmtK(gainToModel)}’yı model+yılın ötesi kapatıyor: km, hasar, motor. Model bir arama tablosu değil.`, `Looking at the model+year median misses by ${bmae}; the model misses by ${mae}. The remaining ${fmtK(gainToModel)} is closed by what lies beyond model+year: km, damage, engine. The model isn’t a lookup table.`)}</p>
                                {mk && mk.length >= 3 && (
                                    <p className="mt-1.5 max-w-[620px] font-mono text-[11px] leading-[1.5] text-[#86857e]">{L(`Bu taban her araca fiyat verir (emsal yoksa modele, sonra globale iner): %${mk[0][2]}’i model+yıl (${fmtK(mk[0][4])}), %${mk[1][2]} model-fallback (${fmtK(mk[1][4])}), %${mk[2][2]} global (${fmtK(mk[2][4])}). Emsalsizde taban çöküyor; model her yerde ${mae}. Tam kırılım → `, `This baseline prices every car (falls back to model, then global, when no comp exists): ${mk[0][2]}% at model+year (${fmtK(mk[0][4])}), ${mk[1][2]}% model-fallback (${fmtK(mk[1][4])}), ${mk[2][2]}% global (${fmtK(mk[2][4])}). Without a comp the baseline collapses; the model stays at ${mae} everywhere. Full breakdown → `)}<a href="#model-worth" className="text-[#047857] underline underline-offset-2">03</a>.</p>
                                )}
                            </div>
                        )}

                        <p className="mt-3 max-w-[620px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L('Bunun bir sonucu: yaş ve km ayrı ama korelasyonlu iki eksen, düşük-km yaşlı araç ikisinin ayrıştığı yer — yaş cezasını yemiş ama km cezasını yememiş, o yüzden sistematik olarak ucuz kalıyor. Modelin fiyatlamanın ötesinde gördüğü masadaki para → ', 'One consequence: age and km are separate but correlated axes, and a low-km old car is where they diverge — it paid the age penalty but not the km one, so it stays systematically underpriced. Money on the table the model sees, beyond just pricing → ')}<a href="#depreciation" className="text-[#047857] underline underline-offset-2">{L('02 · km ve yaş nasıl ısırıyor', '02 · how km and age bite')}</a>.</p>

                        <div className="mt-5 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                            <div className="mb-1 text-[15px] font-semibold text-[#1a1a1a]">{L('Nokta değil, aralık', 'A range, not a point')}</div>
                            <p className="max-w-[620px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L(`Okuyucu iki yönlü. Alıcıya fazla tahmin, satıcıya düşük tahmin pahalıya patlar; model tek, okuyucu iki. O yüzden tek sayı değil %${cfHedef} conformal aralık verilir. Aralık ucuz araçlarda tutmuyor (Q1 hedefin altında kapsıyor); gerekçesi `, `The reader cuts both ways. Over-estimating costs the buyer, under-estimating costs the seller; one model, two readers. So the output is a ${cfHedef}% conformal range, not one number. The range stops holding on cheap cars (Q1 under-covers the target); the rationale is in `)}<a href="#range-width" className="text-[#047857] underline underline-offset-2">03</a>{L('’te.', '.')}</p>
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 text-[15px] font-semibold text-[#1a1a1a]">{L('Nerede kırılıyor', 'Where it breaks')}</div>
                            <ul className="space-y-2">
                                {[
                                    L('Nadir ve uç araçları elle fiyatla; model orada saçılıyor, aralık tutmuyor.', 'Price rare and edge cars by hand; the model scatters there and the range stops holding.'),
                                    L('Ucuz araçlarda aralığı genişlet; Q1 hedefin altında kapsıyor, tek sayıya güvenme.', 'Widen the range on cheap cars; Q1 under-covers the target, so a point estimate misleads.'),
                                    L(`Aylık yeniden eğit; piyasa 5 ayda +%${lastSnapPct} kaydı, model zamansız.`, `Retrain monthly; the market moved +${lastSnapPct}% in 5 months and the model is time-blind.`),
                                ].map((t) => (
                                    <li key={t} className="flex gap-2.5 text-[14px] leading-[1.6] text-[#33332f]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e08a1e]" />{t}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 text-[15px] font-semibold text-[#1a1a1a]">{L('Söylemediği', 'What it doesn’t say')}</div>
                            <ul className="space-y-2">
                                {[
                                    L('Satış fiyatını. Model, ilan fiyatını tahmin eder; pazarlık payı hedefin içinde kalır.', 'The sale price. The model predicts the asking price, not what the car sells for; the haggling margin sits inside the target.'),
                                    <>{L('Markadan bir şey. BMW–Audi farkı harekete geçilemeyecek kadar küçük → ', 'Anything about brand. The BMW–Audi gap is too small to act on → ')}<a href="#brand" className="text-[#047857] underline underline-offset-2">02</a>.</>,
                                    L('Nedensellik. Bunlar kontrollü ilişkiler; “boya yaptır, fiyat düşer” demez.', 'Causation. These are controlled associations; it won’t say “repaint it and the price drops”.'),
                                    <>{L('Hasarlı bir aracın gerçek değeri. “Hasarlı” çizikten pert’e kadar değişir ama hepsi modelin ayıramadığı tek bir düşük kümede fiyatlanır — belirli bir hasarlıya verdiği tek sayı güvenilir değil → ', 'The real value of a damaged car. “Damaged” spans a scratch to a rebuilt wreck, yet they all price into one low cluster the model can’t tell apart — so its single number for a specific one isn’t reliable → ')}<a href="#model-weak" className="text-[#047857] underline underline-offset-2">03</a>.</>,
                                    <>{L('Donanım ve modifiye. Full-donanımlı ya da modifiyeli bir araç modele, aynı spec’in baz hâliyle aynı görünür — ekstraları göremez; aynı-spec araçların arasındaki açıklığın bir parçası → ', 'Trim and modifications. A loaded or modified car looks the same to the model as a base one of the same specs — it can’t see the extras; part of the spread among identical-spec cars → ')}<a href="#model-worth" className="text-[#047857] underline underline-offset-2">03</a>.</>,
                                ].map((t, i) => (
                                    <li key={i} className="flex gap-2.5 text-[14px] leading-[1.6] text-[#5f5f5a]"><span className="mt-[1px] shrink-0 font-mono text-[13px] text-[#86857e]">·</span>{t}</li>
                                ))}
                            </ul>
                        </div>

                        <Method className="mt-5">{L('Bu sayfa yapısal alanları kullanır: yaş, km, motor, kasa. İlan metni ayrı bir analizde → ', 'This page uses the structural fields: age, km, engine, body. The listing text is a separate analysis → ')}<a href={localize('/projects/car-price/text-analysis', lang)} className="text-[#047857] underline underline-offset-2">{L('metin analizi', 'text analysis')}</a>{L('. Kontrollü ilişkiler; iki premium marka · Türkiye · 5 ay.', '. Controlled associations; two premium brands · Turkey · 5 months.')}</Method>
                    </Section>
                    </>
                    ); })()}

            {/* ============ 01 · IS THIS DATA ANY GOOD? ============ */}
                    <GroupHeading id="data" n="01" title={L('Veri sağlam mı?', 'Is this data any good?')} />
                    {(() => {
                        let sn = 0; const N = () => String(++sn).padStart(2, '0');
                        const tm = met.theils_matrix;
                        const uVal = (a: string, b: string) => { if (!tm?.labels) return null; const i = tm.labels.indexOf(a), j = tm.labels.indexOf(b); return (i >= 0 && j >= 0) ? tm.matrix[i][j] : null; };
                        // Redundancy = model ↔ series only. uVal(a,b)=U(a|b): model determines series
                        // (U≈1), series leaves model ambiguous (U<1) → series is a coarsening of model.
                        const uSerMod = uVal('series', 'model'), uModSer = uVal('model', 'series');
                        const scrapeArtifact = meta.n_raw - meta.n_dedup;
                        return (
                    <>

                    <Section id="data-quality" n={N()} title={L('Veri sağlam mı?', 'Is this data any good?')} sub={L('Scrape edilmiş pazaryeri verisi. Tekrar bir sızıntı riski, eksiklik rastgele değil; ikisi de fiyattan önce çözüldü.', 'Scraped marketplace data. Duplication is a leakage risk, missingness isn’t random; both settled before pricing.')}
                        lead={L('Scrape edilmiş pazaryeri verisinde tekrar bir temizlik meselesi değil, sızıntı riski — yani 00’daki sayının ön koşulu. Açılışta ne bozuktu, kapanışta ne kaldı:', 'On scraped marketplace data, duplication isn’t housekeeping, it’s a leakage risk: the precondition for the number in 00. What was broken on arrival, and what’s left:')}>

                        <div id="scale" data-section data-title={L('Ölçek', 'Scale')} className="mb-6 scroll-mt-[84px]">
                            <h3 className="mb-2 text-[16px] font-semibold text-[#1a1a1a]">{L('Ölçek', 'Scale')}</h3>
                            <p className="mb-3 max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L(`${fmtN(meta.n_raw)} snapshot → ${fmtN(meta.n_dedup)} ilan. Aradaki ${fmtN(scrapeArtifact)} satır aynı ilanın tekrar taranması; veri değil, tarama artığı. Kaynak: TR-plakalı gerçek 2.el ilan detayları (BMW + Audi), ${snaps.length} dönem (${snapRange} 2026), ad_id başına en son snapshot. 117 ham kolonun 15’i kullanılamaz durumda → 05.`, `${fmtN(meta.n_raw)} snapshots → ${fmtN(meta.n_dedup)} listings. The ${fmtN(scrapeArtifact)} rows between are the same ad re-scraped: scrape residue, not data. Source: real TR-registered used-car detail pages (BMW + Audi), ${snaps.length} snapshots (${snapRange} 2026), latest snapshot per ad_id. Of 117 raw columns, 15 are unusable → 05.`)}</p>
                            <Table head={[L('Alan', 'Field'), L('Değer', 'Value')]} rows={[
                                [L('Tekil ilan', 'Unique listings'), fmtN(meta.n_dedup)],
                                [L('Ham satır (snapshot)', 'Raw rows (snapshots)'), fmtN(meta.n_raw)],
                                [L('Dönem', 'Snapshots'), `${snaps.length} · ${snapRange}`],
                                [L('Kullanılan değişken', 'Features used'), String(meta.n_features)],
                                [L('Marka', 'Brands'), `BMW ${fmtN(meta.brands.bmw)} · Audi ${fmtN(meta.brands.audi)}`],
                                [L('Hedef', 'Target'), 'price · log1p'],
                            ]} />
                            {dom.price_dist?.p10 != null && (
                                <p className="mt-3 max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L(`Medyan ilan fiyatı ${fmtM(dom.price_dist.median)}, ${fmtM(dom.price_dist.p10)}–${fmtM(dom.price_dist.p90)} arası (P10–P90). Fiyat sağa çarpık; model neden log-fiyat üzerinde eğitildi → `, `Median asking price ${fmtM(dom.price_dist.median)}, ranging ${fmtM(dom.price_dist.p10)}–${fmtM(dom.price_dist.p90)} (P10–P90). Price is right-skewed; why the model trains on log-price → `)}<a href="#target-prep" className="text-[#047857] underline underline-offset-2">{L('05 · Hedef ve önişleme', '05 · Target and preprocessing')}</a>.</p>
                            )}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { k: L('1 · Yapısal', '1 · Structural'), v: L('yaş · km · motor gücü/hacmi · kasa · yakıt · vites · çekiş · segment', 'age · km · engine power/size · body · fuel · transmission · drivetrain · segment') },
                                    { k: L('2 · Hasar / ekspertiz', '2 · Damage / inspection'), v: L('13 panel × {değişen, boyalı, lokal} + tramer + ağır-hasar', '13 panels × {changed, painted, local} + tramer fee + heavy damage') },
                                    { k: L('3 · Serbest metin', '3 · Free text'), v: L('satıcı açıklaması → ayrı analiz (beyan · donanım · anomali)', 'seller description → separate analysis (claims · equipment · anomaly)') },
                                ].map((s) => (
                                    <div key={s.k} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                        <div className="mb-1.5 font-mono text-[12px] font-semibold text-[#047857]">{s.k}</div>
                                        <div className="text-[12px] leading-[1.6] text-[#5f5f5a]">{s.v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* The all-columns duplication tiers used to live here. Removed: it and 05's
                            content-based duplication are the same measurement at different strictness
                            (112 cols → 2 excess · 110 → 41 · 12 → 137 · 12 loose → 209, same n, same
                            metric). Two ends of one ladder, four chapters apart, read as a 0.14-vs-0.46
                            contradiction. 05 keeps it; the leakage block below cites that number. */}

                        <div id="leakage" data-section data-title={L('Sızıntı', 'Leakage')} className="mb-6 border-t border-[#ece9e3] pt-6 scroll-mt-[84px]">
                            <h3 className="mb-2 text-[16px] font-semibold text-[#1a1a1a]">{L('Sızıntı', 'Leakage')}</h3>
                            <p className="mb-2 max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L('Dedup ad_id üzerinden ve CV’den önce yapıldı. Değerlendirme 5-fold out-of-fold: her ilan tam olarak bir kez, kendisini görmemiş bir modelle tahmin edildi.', 'Dedup runs on ad_id, before the CV split. Evaluation is 5-fold out-of-fold: every listing is predicted exactly once, by a model that never saw it.')}</p>
                            <p className="max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">
                                {L('Asıl risk ad_id’nin göremediği: aynı araba iki ayrı ilanla girmiş olabilir. Bu ayrı bir kontrol — içerik-bazlı duplikasyon: ayırt edici tüm alanları aynı olan ', 'The real risk is the one ad_id can’t see: the same car entering as two separate listings. That is a separate check — content-based duplication: ')}
                                {idup && <b className="text-[#22332b]">{L(`${fmtN(idup.kati_tanim_fazla)} satır (${pct(idup.kati_tanim_pct, 2)})`, `${fmtN(idup.kati_tanim_fazla)} rows (${pct(idup.kati_tanim_pct, 2)}) with every distinguishing field identical`)}</b>}
                                {idup && L(`, en gevşek tanımla ${fmtN(idup.gevsek_tanim_fazla)} (${pct(idup.gevsek_tanim_pct, 2)}) → `, `, ${fmtN(idup.gevsek_tanim_fazla)} (${pct(idup.gevsek_tanim_pct, 2)}) under the loosest definition → `)}
                                <a href="#dropped" className="text-[#047857] underline underline-offset-2">{L('05 · İçerik-bazlı duplikasyon', '05 · Content-based duplication')}</a>
                                {L('. Yani fold’lar arası çakışabilecek gerçek tekrar %1’in altında.', '. So the real repeats that could straddle folds sit under 1%.')}
                            </p>
                        </div>

                        <div id="missingness" data-section data-title={L('Eksiklik', 'Missingness')} className="mb-6 border-t border-[#ece9e3] pt-6 scroll-mt-[84px]">
                            <h3 className="mb-2 text-[16px] font-semibold text-[#1a1a1a]">{L('Eksiklik rastgele değil', 'Missingness isn’t random')}</h3>
                            <p className="max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L(`15 kolon birlikte düşüyor; birlikte-eksiklik korelasyonu ${specCorr != null ? Number(specCorr).toFixed(2) : '1.00'}. Bu “eksik veri” değil, katalog eşleşmesinin çöktüğü ilanlar: standart modeller eşleşir, niş varyantlar eşleşmez, tüm spec birden boşalır. Aynı blok, aynı sebep, tek karar → `, `15 columns drop together; co-missing correlation ${specCorr != null ? Number(specCorr).toFixed(2) : '1.00'}. This isn’t “missing data”, it’s listings where catalog matching collapsed: standard models match, niche variants don’t, and all their specs go blank at once. One block, one cause, one decision → `)}<a href="#dropped" className="text-[#047857] underline underline-offset-2">{L('05 · Neyi attım, neden', '05 · What I dropped, and why')}</a>.</p>
                        </div>

                        <div id="redundancy" data-section data-title={L('Fazlalık', 'Redundancy')} className="mb-6 border-t border-[#ece9e3] pt-6 scroll-mt-[84px]">
                            <h3 className="mb-2 text-[16px] font-semibold text-[#1a1a1a]">{L('Fazlalık', 'Redundancy')}</h3>
                            <p className="max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L(`Seri, modelin kabalaştırılmış hâli — türetilmiş bir kolon, bağımsız bilgi değil. Theil’s U (yönlü bağımlılık): U(seri | model) = ${uSerMod != null ? Number(uSerMod).toFixed(2) : '1.00'} (model seriyi tam belirler), ama U(model | seri) = ${uModSer != null ? Number(uModSer).toFixed(2) : '0.39'} (seri modeli belirsiz bırakır). Asimetri yönü veriyor. Cramér’s V simetrik olduğu için bunu göremezdi; yön bulgunun kendisi. Tam 8×8 matris → `, `Series is a coarsened view of model — a derived column, not independent information. Theil’s U (directional dependence): U(series | model) = ${uSerMod != null ? Number(uSerMod).toFixed(2) : '1.00'} (model fully determines series), but U(model | series) = ${uModSer != null ? Number(uModSer).toFixed(2) : '0.39'} (series leaves model ambiguous). The asymmetry gives direction. Cramér’s V is symmetric and couldn’t show this; the direction is the finding. The full 8×8 matrix → `)}<a href="#leakage-checks" className="text-[#047857] underline underline-offset-2">{L('05 · Sızıntı ve fazlalık kontrolleri', '05 · Leakage and redundancy checks')}</a>.</p>
                            <div className="mt-4 max-w-[520px] rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#86857e]">{L('Theil’s U — model ↔ seri', 'Theil’s U — model ↔ series')}</div>
                                {[
                                    { from: 'model', to: L('seri', 'series'), u: uSerMod != null ? Number(uSerMod) : 1.0, full: true, note: L('belirler', 'determines') },
                                    { from: L('seri', 'series'), to: 'model', u: uModSer != null ? Number(uModSer) : 0.39, full: false, note: L('belirsiz', 'ambiguous') },
                                ].map((r, i) => (
                                    <div key={i} className="mb-1.5 flex items-center gap-2 last:mb-0 sm:gap-3">
                                        <div className="flex w-[120px] shrink-0 items-center gap-1 font-mono text-[11px] sm:w-[146px] sm:gap-1.5 sm:text-[12px]">
                                            <span className="rounded-[6px] border border-[#e9e7e2] bg-[#f3f1ec] px-1.5 py-0.5 text-[#33332f]">{r.from}</span>
                                            <span className="text-[#86857e]">→</span>
                                            <span className="rounded-[6px] border border-[#e9e7e2] bg-[#f3f1ec] px-1.5 py-0.5 text-[#33332f]">{r.to}</span>
                                        </div>
                                        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eeece7]">
                                            <div className={`h-full rounded-full ${r.full ? 'bg-[#047857]' : 'bg-[#e08a1e]'}`} style={{ width: `${Math.round(r.u * 100)}%` }} />
                                        </div>
                                        <div className={`w-[104px] shrink-0 text-right font-mono text-[11px] tabular-nums ${r.full ? 'text-[#047857]' : 'text-[#e08a1e]'}`}><b>U={r.u.toFixed(2)}</b> <span className="text-[#86857e]">{r.note}</span></div>
                                    </div>
                                ))}
                                <p className="mt-3 text-[12px] leading-[1.55] text-[#5f5f5a]">{L('Model seriyi tam belirliyor; seri modeli belirsiz bırakıyor. Seri, modelin kabalaştırılmışı — ayrı bilgi taşımaz.', 'Model fully determines series; series leaves model ambiguous. Series is a coarsened view of model — it carries no separate information.')}</p>
                            </div>
                            <div className="mt-4 max-w-[560px] rounded-[12px] border border-[#efe0cf] bg-[#fdf8f1] p-4">
                                <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#b06a2a]">{L('Ayrı bir mesele — veri bozukluğu: gb_segment', 'A separate issue — data corruption: gb_segment')}</div>
                                <p className="max-w-[600px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L('Ham beslemedeki “G” segmenti gerçek değil: satırların neredeyse tamamı MPV gövde (Active / Gran Tourer). Bu bir eksik ya da fazlalık değil — bozuk kaynak. O yüzden ham gb_segment atıldı, segment seriden yeniden türetildi; MPV sinyali body_type’ta tutuldu. Sayılar ve ısı haritası → ', 'The raw feed’s “G” segment isn’t real: nearly all its rows are MPV bodies (Active / Gran Tourer). This is neither a gap nor a redundancy — it’s a corrupt source. So raw gb_segment was dropped and segment re-derived from series; the MPV signal kept in body_type. Counts and heatmap → ')}<a href="#leakage-checks" className="text-[#047857] underline underline-offset-2">{L('05 · Sızıntı ve fazlalık', '05 · Leakage and redundancy checks')}</a>.</p>
                                {met.g_mpv && typeof met.g_mpv === 'object' && (
                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-[#86857e]">
                                        <span>G ∧ MPV <b className="text-[#b06a2a]">{fmtN(met.g_mpv.mpv_and_g)}</b></span>
                                        <span>{L('toplam G', 'total G')} {fmtN(met.g_mpv.g_total)}</span>
                                        <span>{L('toplam MPV', 'total MPV')} {fmtN(met.g_mpv.mpv_total)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-[#ece9e3] pt-6">
                            <h3 className="mb-2 text-[16px] font-semibold text-[#1a1a1a]">{L('Kalan ne yapar', 'What the rest does')}</h3>
                            <p className="max-w-[640px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L('Geriye yapısal alanlar kalıyor: yaş, km, motor, kasa. İlan metni burada değil → ', 'What’s left is the structural fields: age, km, engine, body. The listing text isn’t here → ')}<a href={localize('/projects/car-price/text-analysis', lang)} className="text-[#047857] underline underline-offset-2">{L('metin analizi', 'text analysis')}</a>{L('. Bunların ne kadar iyi fiyatladığı → ', '. How well they price → ')}<a href="#model-worth" className="text-[#047857] underline underline-offset-2">{L('03 · Sayıya ne kadar güvenmeli', '03 · How much to trust the number')}</a>.</p>
                        </div>
                    </Section>
                    </>
                    ); })()}

            {/* ============ 02 · WHAT SETS THE PRICE ============ */}
                    <GroupHeading id="market" n="02" title={L('Bu piyasa fiyatı nasıl kuruyor', 'How this market builds a price')} />
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    <Section id="clusters" n={N()} title={L('Bu piyasada üç tip araç var', 'Three kinds of car in this market')} sub={L('Piyasanın şekli — modelin girdisi değil · KMeans k=3 · nasıl bulunduğu → 05', 'The market’s shape — not a model input · KMeans k=3 · how they were found → 05')}
                        lead={L(`Denetimsiz kümeleme piyasayı ${km.length} gruba ayırıyor; adlar kümeyi ayıran eksenden geliyor (yaş+km, sonra motor ya da hasar) — “premium/ekonomik” gibi değer yargısı yok. Okuyucu modelin hangi arabaları fiyatladığını burada görür.`, `Unsupervised clustering splits the market into ${km.length} groups; each name comes from the axis that actually separates it (age+km, then engine or damage) — no “premium/economy” value words. This is where you see which cars the model is pricing.`)}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {km.map((p: any) => (
                                <div key={p.cluster} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORICAL_LIST[p.cluster % CATEGORICAL_LIST.length] }} />
                                        <span className="font-mono text-[12px] font-semibold text-[#1a1a1a]">{clusterName(p)}</span>
                                        <span className="ml-auto font-mono text-[11px] text-[#86857e]">{fmtN(p.n)}</span>
                                    </div>
                                    <div className="font-mono text-[15px] font-bold text-[#047857]">{fmtM(p.medyan)}</div>
                                    <div className="mt-1 font-mono text-[11px] text-[#86857e]">{p.yas} {L('yaş', 'yr')} · {fmtKm(p.km)} km · {p.hp} hp · {L('hasar', 'dmg')} {pct(p.agir_hasar_pct, 0)}</div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {p.ayirt_edici.map((a: any, ai: number) => (
                                            <span key={ai} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{noTab(a[0])} {a[1] === '+' ? '↑' : '↓'}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L('Kasa tipine göre medyan', 'Median by body style')}><Chart h={300}><PlotlyChart data={bodyData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                            <Fig title={L('Segmente göre medyan fiyat', 'Median price by segment')}><Chart h={300}><PlotlyChart data={segData} layout={base({ margin: { t: 24, r: 16, b: 28, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        </div>
                        <Method className="mt-3">{L('Kasa ve segment, kümeleri tamamlıyor: küme kartları yaş/km/hasar eksenini, bu ikisi gövde/boyut eksenini taşıyor. Coupe en pahalı, Hatchback en ucuz; segment B’den F/S’ye monotonik tırmanıyor. Segment ham veriden değil seriden türetildi (neden → ', 'Body and segment complete the clusters: the cards carry the age/km/damage axis, these two carry the body/size axis. Coupe is priciest, hatchback cheapest; segment climbs monotonically from B to F/S. Segment is derived from the series, not the raw feed (why → ')}<a href="#leakage-checks" className="text-[#047857] underline underline-offset-2">05</a>{L(').', ').')}</Method>
                        <Method className="mt-2">{L(`Kümeler ne katıyor, ne katmıyor: yaş ve km sürekli değişken, k=${km.length} onların bir ayrıklaştırması — piyasa gerçekten ${km.length} ayrı “tip”ten oluşmuyor, k silhouette ile seçildi (→ `, `What the clusters do and don’t add: age and km are continuous, so k=${km.length} is a discretisation of them — the market isn’t really made of ${km.length} discrete “kinds”; k was chosen by silhouette (→ `)}<a href="#segments-found" className="text-[#047857] underline underline-offset-2">05</a>{L(`). Yeni bir fiyat sürücüsü de eklemiyorlar: ayrıldıkları eksenleri (yaş, km, hasar) hedonik zaten güven aralığıyla ölçüyor. Değeri şurada: hasar sinyali hedonik, PCA ve KMeans’te birbirinden bağımsız çıkıyor — üç yöntem aynı şeyi söylüyor.`, `). Nor do they add a new price driver: the hedonic model already measures the very axes they split on (age, km, damage), with confidence intervals. Their value is this: the damage signal surfaces independently in the hedonic model, PCA and KMeans — three methods, same answer.`)}</Method>
                    </Section>

                    {hr && (
                        <Section id="price-drivers" n={N()} title={L('Fiyatı hangi öznitelikler taşıyor', 'Which features carry the price')} sub={L('Hedonik OLS · LOFO ΔRMSE ile teyit', 'Hedonic OLS · confirmed by LOFO ΔRMSE')}
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
                                    <Table className="mt-2" head={[L('Yakıt', 'Fuel'), 'Pearson', 'Spearman', 'cc/HP', 'n']} rows={hr.yakit_korelasyon.map((f: any) => [LBL.label(LBL.fuel, f.yakit, lang), f.pearson.toFixed(3), f.spearman.toFixed(3), String(f.cc_hp_oran), fmtN(f.n)])} />
                                </details>
                            )}
                            {Array.isArray(hr.vif) && hr.vif.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-mono text-[12px] text-[#5f5f5a]">{L('VIF · çoklu-bağıntı kontrolü', 'VIF · multicollinearity check')}</summary>
                                    <Table className="mt-2" head={[L('Terim', 'Term'), 'VIF']} rows={hr.vif.map((v: any) => [vifTerm(v[0]), Number(v[1]).toFixed(2)])} />
                                    <Method className="mt-2">{L('Tüm VIF < 5 → çoklu-bağıntı düşük; katsayılar birbirinden ayrıştırılabilir (motor gücü ↔ hacmi ilişkili ama şişme sınırlı).', 'All VIF < 5 → low multicollinearity; the coefficients are separable (engine power ↔ size are related but the inflation is bounded).')}</Method>
                                </details>
                            )}
                            {Array.isArray(g?.snapshot) && g.snapshot.length > 0 && (
                                <div className="mt-4">
                                    <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#86857e]">{L('Zaman etkisi (hedonik kontrol ediyor)', 'Time effect (controlled by the hedonic model)')}</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {g.snapshot.map((s: any, si: number) => (
                                            <Stat key={s[0]} k={s[0]} v={signPct(r1(Number(s[1])))} sub={L('kümülatif', 'cumulative')} accent={si === g.snapshot.length - 1} />
                                        ))}
                                    </div>
                                    <Method className="mt-3">{L('Bunlar hedonik regresyonun snapshot-kukla katsayıları — zamanı modelin içinde tutar; LightGBM tahmini ise zamansızdır. Piyasanın gerçekten kayıp kaymadığı (şekil mi seviye mi) ayrı bir soru → ', 'These are the hedonic model’s snapshot-dummy coefficients — they hold time inside the regression, while the LightGBM predictor is time-agnostic. Whether the market itself is drifting (shape vs level) is a separate question → ')}<a href="#go-stale" className="text-[#047857] underline underline-offset-2">{L('04 · Ne kadar süre güvenilir', '04 · How long you can trust it')}</a>.</Method>
                                </div>
                            )}
                            {hr.varsayim && (hr.varsayim.not || hr.varsayim.homoskedastisite_p != null) && (
                                <Method className="mt-3">{L(
                                    `Varsayım testleri: Breusch-Pagan (homoskedastisite p=${fmtP(hr.varsayim.homoskedastisite_p)}) ve Jarque-Bera (normallik p=${fmtP(hr.varsayim.normallik_p)}) ihlal → çıkarım HC3 robust SE + ${hr.bootstrap_ayar?.n_boot ? fmtN(hr.bootstrap_ayar.n_boot) + '×' : '1000×'} bootstrap ile yapıldı, çıplak OLS p-değeriyle değil.`,
                                    `Assumption tests: Breusch-Pagan (homoskedasticity p=${fmtP(hr.varsayim.homoskedastisite_p)}) and Jarque-Bera (normality p=${fmtP(hr.varsayim.normallik_p)}) are violated → inference uses HC3 robust SEs + ${hr.bootstrap_ayar?.n_boot ? fmtN(hr.bootstrap_ayar.n_boot) + '×' : '1000×'} bootstrap, not the bare OLS p-value.`,
                                )}</Method>
                            )}
                            {(hr.not || hr.karar) && <Method className="mt-3">{L(hr.not || hr.karar, 'Raw (no log) cc + HP: per-unit interpretation. 1000 bootstrap iterations, each with HC3 robust SEs. cc and HP are correlated but the ratio varies by fuel (diesel highest). All coefficients are solid.')}</Method>}
                            {lofoData && <Fig className="mt-4" title={L('LOFO — öznitelik çıkınca ΔRMSE (ikinci yöntem, aynı sıralama)', 'LOFO — ΔRMSE when a feature is removed (a second method, same ranking)')}><Chart h={360}><PlotlyChart data={lofoData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted } })} config={config} guard={false} /></Chart></Fig>}
                            {lofoData && <Method className="mt-2">{L('Hedonik katsayı ve LOFO ayrı iki yöntem, aynı şeyi söylüyor: km ve yaş baskın. İki yöntemin aynı sıralamayı vermesi bulgunun kendisi.', 'The hedonic coefficient and LOFO are two separate methods that say the same thing: km and age dominate. That the two produce the same ranking is the finding.')}</Method>}
                        </Section>
                    )}

                    <Section id="depreciation" n={N()} title={L('km ve yaş fiyatı nasıl yiyor', 'How km and age actually bite')} sub={L('Medyan + ortalama eğrileri · kontrollü etkiler yukarıda', 'Median + mean curves · the controlled effects are above')}
                        lead={L(`Hedonik “km ve yaş baskın” diyor; bu iki eğri o baskınlığın şeklini gösteriyor. Düşüş ilk yıllarda dik, sonra yavaşlıyor. Yaş yılda ${pct(Math.abs(hedAge))}, km her 100k km ${pct(Math.abs(hedKm))} değer kaybettiriyor — ayrı ama korelasyonlu iki eksen. Düşük-km yaşlı araç ikisinin ayrıştığı yer: yaş cezasını yemiş ama km cezasını yememiş → sistematik olarak ucuz fiyatlanıyor, arbitraj orada.`, `The hedonic model says km and age dominate; these two curves show the shape of that dominance. The drop is steep in the early years then flattens. Age costs ${pct(Math.abs(hedAge))} a year, km ${pct(Math.abs(hedKm))} per 100k km — two separate but correlated axes. A low-km old car is where the two diverge: it has paid the age penalty but not the km one → systematically under-priced, that’s where the arbitrage is.`)}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L(ageHasMean ? 'Yaşa göre fiyat (medyan + ort.)' : 'Yaşa göre medyan fiyat', ageHasMean ? 'Price by age (median + mean)' : 'Median price by age')}><Chart h={260}><PlotlyChart data={ageData} layout={base(ageHasMean ? { showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, margin: { t: 8, r: 16, b: 40, l: 8 } } : {})} config={config} guard={false} /></Chart></Fig>
                            <Fig title={L(kmHasMean ? 'Kilometreye göre fiyat (medyan + ort.)' : 'Kilometreye göre medyan fiyat', kmHasMean ? 'Price by mileage (median + mean)' : 'Median price by mileage')}><Chart h={260}><PlotlyChart data={kmData} layout={base(kmHasMean ? { showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, margin: { t: 8, r: 16, b: 40, l: 8 } } : {})} config={config} guard={false} /></Chart></Fig>
                        </div>
                        {(ageHasMean || kmHasMean) && dom.age_km_note && <Method className="mt-3">{L(dom.age_km_note, 'Median = the typical price; mean = outlier-influenced. The gap between the two curves is the price skew (mean sits above median). The %/year and %/100k quoted above are the hedonic controlled effects, not the raw drop drawn here.')}</Method>}
                    </Section>

                    <Section id="brand" n={N()} title={L('Marka fiyatı etkilemeli mi? Hayır.', 'Should brand affect price? No.')} sub={L('Marka bilgi taşımıyor; `model` taşıyor. Marka zaten `model`in içinde — üstüne bir şey eklemiyor.', 'Brand carries no information; `model` does. Brand is already inside `model` — it adds nothing on top.')}
                        lead={L(`Marka ayrı bir şey söylemiyor çünkü zaten ${'`model`'}in (ve ${'`seri`'}nin) içinde: ikisi de markayı tam belirliyor. Bunu dağılım testiyle değil doğrudan ölçtüm — model+seri’ye brand eklemek hatayı değiştirmiyor.`, `Brand says nothing separate because it already lives inside ${'`model`'} (and ${'`series`'}): both fully determine it. I measured this directly, not with a distributional test — adding brand on top of series+model doesn’t move the error.`)}>
                        {bAbl && (() => {
                            const rows = [
                                { key: 'sadece_brand', lbl: L('sadece brand', 'brand only'), star: false },
                                { key: 'seri_model', lbl: L('seri + model', 'series + model'), star: true },
                                { key: 'brand_seri_model', lbl: L('brand + seri + model', 'brand + series + model'), star: false },
                            ].map((r) => ({ ...r, ...bAbl[r.key] }));
                            const maxMAE = Math.max(...rows.map((r: any) => r.MAE));
                            const d1 = rows[0].MAE - rows[1].MAE, d2 = rows[1].MAE - rows[2].MAE;
                            return (
                                <div className="max-w-[560px] rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#86857e]">{L('Marka ablasyonu — MAE (₺, düşük iyi)', 'Brand ablation — MAE (₺, lower better)')}</div>
                                    {rows.map((r: any, i: number) => (
                                        <div key={r.key}>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-[128px] shrink-0 font-mono text-[11px] text-[#33332f] sm:w-[150px] sm:text-[12px]">{r.lbl}{r.star && <span className="text-[#047857]"> ★</span>}</div>
                                                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-[#eeece7]">
                                                    <div className="h-full rounded-[4px]" style={{ width: `${Math.round(r.MAE / maxMAE * 100)}%`, background: r.star ? '#047857' : '#9a9a92' }} />
                                                </div>
                                                <div className="w-[104px] shrink-0 text-right font-mono text-[11px] tabular-nums text-[#1a1a1a]">{fmtK(r.MAE)}<span className="ml-1 text-[#86857e]">{pct(r.MAPE, 2)}</span></div>
                                            </div>
                                            {i === 0 && <div className="my-1 pl-[136px] font-mono text-[10.5px] text-[#047857] sm:pl-[162px]">↳ +{L('seri', 'series')}+model: −₺{fmtN(d1)} {L('(gerçek kazanç)', '(real gain)')}</div>}
                                            {i === 1 && <div className="my-1 pl-[136px] font-mono text-[10.5px] text-[#86857e] sm:pl-[162px]">↳ +brand: −₺{fmtN(d2)} {L('(≈0, katkısız)', '(≈0, adds nothing)')}</div>}
                                        </div>
                                    ))}
                                    <p className="mt-3 text-[12px] leading-[1.55] text-[#5f5f5a]">{L('Numerikler (km · yaş · hasar · hp) üç varyantta da sabit; yalnız kimlik kolonu değişiyor — o yüzden series+model zaten tam modelin ₺110K’sına ulaşıyor. Son iki bar aynı: model+seri’ye brand eklemek MAE’yi 1₺, MAPE’yi 0.00 puan değiştiriyor. Kazanç seri+model’den geliyor, markadan değil.', 'Numerics (km · age · damage · hp) are held constant across all three; only the identity column changes — which is why series+model already reaches the full model’s ₺110K. The last two bars are identical: adding brand to series+model moves MAE by ₺1 and MAPE by 0.00 pts. The gain comes from series+model, not brand.')}</p>
                                </div>
                            );
                        })()}
                        <div className="mt-3 max-w-[520px] rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#86857e]">{L('Theil’s U — brand nereden belli', 'Theil’s U — what determines brand')}</div>
                            {[
                                { from: 'model', u: uBrandModel != null ? Number(uBrandModel) : 1.0 },
                                { from: L('seri', 'series'), u: uBrandSeries != null ? Number(uBrandSeries) : 1.0 },
                            ].map((r, i) => (
                                <div key={i} className="mb-1.5 flex items-center gap-2 last:mb-0 sm:gap-3">
                                    <div className="flex w-[120px] shrink-0 items-center gap-1 font-mono text-[11px] sm:w-[146px] sm:gap-1.5 sm:text-[12px]">
                                        <span className="rounded-[6px] border border-[#e9e7e2] bg-[#f3f1ec] px-1.5 py-0.5 text-[#33332f]">{r.from}</span>
                                        <span className="text-[#86857e]">→</span>
                                        <span className="rounded-[6px] border border-[#e9e7e2] bg-[#f3f1ec] px-1.5 py-0.5 text-[#33332f]">brand</span>
                                    </div>
                                    <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eeece7]">
                                        <div className="h-full rounded-full bg-[#047857]" style={{ width: `${Math.round(r.u * 100)}%` }} />
                                    </div>
                                    <div className="w-[104px] shrink-0 text-right font-mono text-[11px] tabular-nums text-[#047857]"><b>U={r.u.toFixed(2)}</b> <span className="text-[#86857e]">{L('belirler', 'determines')}</span></div>
                                </div>
                            ))}
                            <p className="mt-3 text-[12px] leading-[1.55] text-[#5f5f5a]">{L('Model de seri de markayı tam belirliyor (U=1.00) → brand ikisinin de içinde, ayrı bilgi yok. Ablation da bunu söylüyor.', 'Both model and series fully determine brand (U=1.00) → brand sits inside both, no separate information. The ablation says the same.')}</p>
                        </div>
                        <details className="mt-4 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9]/70">
                            <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[12px] text-[#33332f] [&::-webkit-details-marker]:hidden">
                                <span className="text-[#047857]">▸ </span>{L('Marka · dağılım testi + ablation tablosu', 'Brand · distributional test + ablation table')}
                            </summary>
                            <div className="border-t border-[#ece9e3] px-4 py-5">
                                <Fig title={L('Medyan fiyat: BMW vs Audi', 'Median price: BMW vs Audi')}><Chart h={260}><PlotlyChart data={brandData} layout={base({ margin: { t: 24, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <Stat k="Cliff’s δ" v={bc.cliffs_delta.toFixed(3)} sub={L('etki boyutu (ihmal edilebilir)', 'effect size (negligible)')} accent />
                                    <Stat k="Mann–Whitney p" v={bc.mwu_p.toExponential(1)} sub={L('anlamlı ama önemsiz', 'significant yet immaterial')} />
                                </div>
                                <Method className="mt-3">{L('Büyük-n tuzağı: çok veriyle her fark “anlamlı” çıkar; effect size (δ) gerçeği söyler — fark pratikte önemsiz. Dağılım testi markanın önemsizliğini gösterir; ablation ise doğrudan ölçer.', 'The big-n trap: with enough data every gap turns “significant”; the effect size (δ) tells the truth — the gap is immaterial. The distributional test shows brand is immaterial; the ablation measures it directly.')}</Method>
                                <Table className="mt-4" head={[L('Varyant', 'Variant'), 'MAPE', 'MAE', 'R²']} rows={[
                                    [L('sadece brand', 'brand only'), pct(bAbl.sadece_brand.MAPE, 2), fmtN(bAbl.sadece_brand.MAE), bAbl.sadece_brand.R2.toFixed(4)],
                                    [L('seri + model', 'series + model'), pct(bAbl.seri_model.MAPE, 2), fmtN(bAbl.seri_model.MAE), bAbl.seri_model.R2.toFixed(4)],
                                    [L('brand + seri + model', 'brand + series + model'), pct(bAbl.brand_seri_model.MAPE, 2), fmtN(bAbl.brand_seri_model.MAE), bAbl.brand_seri_model.R2.toFixed(4)],
                                ]} />
                            </div>
                        </details>
                    </Section>

                    </>
                    ); })()}

            {/* ============ 03 · HOW MUCH TO TRUST THE NUMBER ============ */}
                    <GroupHeading id="model" n="03" title={L('Sayıya ne kadar güvenmeli', 'How much to trust the number')} />
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    {frWinM && (
                        <Section id="model-worth" n={N()} title={L('Model işe yarıyor mu?', 'Is the model worth it?')} sub={L('3 varyant + 1 medyan tabanı (fallback’li) · 5-fold OOF', '3 variants + 1 median baseline (with fallback) · 5-fold OOF')}
                            lead={L(`${frModels.length} model varyantı 5-fold OOF (sızıntısız) ile karşılaştırıldı; final modeller tüm veriyle eğitildi. Kazanan ${frWin} — MAPE ${pct(frWinM.MAPE, 2)}${frBase ? `, model+yıl medyanından (fallback’li) %${baseBetter} daha iyi` : ''}.`, `${frModels.length} model variants compared with 5-fold OOF (leak-free); final models trained on all data. Winner ${frWin} — MAPE ${pct(frWinM.MAPE, 2)}${frBase ? `, ${baseBetter}% better than the model+year median (with fallback)` : ''}.`)}>
                            <Table head={[L('Model', 'Model'), 'MAPE', 'R²', 'MAE', 'MedAE', 'RMSE']} rows={[
                                ...frModels.map((m) => [`${m.label}${m === frWinM ? ' ★' : ''}`, pct(m.MAPE, 2), m.R2.toFixed(4), fmtN(m.MAE), fmtN(m.MedAE), fmtN(m.RMSE)]),
                                ...(frBase ? [[L('Model+yıl medyanı · fallback’li', 'Model+year median · with fallback'), pct(frBase.MAPE, 2), frBase.R2.toFixed(4), fmtN(frBase.MAE), fmtN(frBase.MedAE), fmtN(frBase.RMSE)]] : []),
                            ]} />
                            <Method className="mt-3">{L(`${pct(frWinM.MAPE, 2)} tek bir holdout değil, ${fmtN(meta.n_dedup)} ilan üzerinde 5-fold OOF çapraz-doğrulama. Medyan tabanı da aynı 5-fold’da, sızıntısız.`, `The ${pct(frWinM.MAPE, 2)} is 5-fold OOF cross-validation over ${fmtN(meta.n_dedup)} listings, not a single holdout. The median baseline runs on the same 5-fold, leak-free.`)}</Method>
                            {mym?.metrik_kirilim && Array.isArray(mym.metrik_kirilim) && (
                                <details className="mt-3 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9]/70">
                                    <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[12px] text-[#33332f] [&::-webkit-details-marker]:hidden">
                                        <span className="text-[#047857]">▸ </span>{L('Model+yıl medyanı — basamak kırılımı (fallback cezası)', 'Model+year median — per-tier breakdown (fallback penalty)')}
                                    </summary>
                                    <div className="border-t border-[#ece9e3] px-4 py-5">
                                        {Array.isArray(mym.merdiven) && <p className="mb-3 max-w-[620px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L(`Merdiven: ${mym.merdiven.join(' → ')}. Test'te (model, yıl) hücresi train'de yoksa taban bir alt basamağa iner; her inişte hata belirgin büyür — emsalsiz araçta taban zaten zayıf.`, `Ladder: (model, year) median → (model) median across all years → global median. When a (model, year) cell is absent in train, the baseline drops a tier; each drop enlarges the error sharply — a car with no comp has a weak baseline to begin with.`)}</p>}
                                        <Table head={[L('Basamak', 'Tier'), 'n', '%', 'MAPE', 'MAE', 'R²']} rows={mym.metrik_kirilim.map((r: any) => [
                                            L(String(r[0]), String(r[0]).replace('yıl', 'year')),
                                            fmtN(r[1]), pct(r[2], 2), pct(r[3], 2), fmtN(r[4]), Number(r[5]).toFixed(4),
                                        ])} />
                                        {mym.not && <Method className="mt-3">{L(String(mym.not), 'Fallback OOF median baseline — medians computed only on train in each fold (leak-free, same 5-fold as the model). If the (model, year) cell is absent in train, the ladder descends: (model) all years → global. base = OOF metrics over all rows; per-tier breakdown = [tier, n, %, MAPE, MAE, R²] — error rises sharply on the fallback tiers. Model metrics for comparison; same protocol → the gap is real gain.')}</Method>}
                                    </div>
                                </details>
                            )}
                            {nf && (
                                <div className="mt-4 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-1.5 text-[15px] font-semibold text-[#1a1a1a]">{L('Hatanın ne kadarı modelin?', 'How much of the error is even the model’s?')}</div>
                                    <p className="max-w-[640px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L(`Aynı spec’teki arabalar (aynı model · yıl · km · hp · kasa) birbirinden ${fmtK(nf.mae_floor)} aralıkla ilan ediliyor — ${fmtN(nf.twin_rows)} satır, ${fmtN(nf.twin_groups)} grup. Bu bir taban: aynı arabayı satıcılar farklı fiyatlıyor (donanım, modifiye, aciliyet, pazarlık) ve hiçbir model bunun altına inemez. Model ${fmtK(frWinM.MAE)}’de, yani tabanın ${floorRatio.toFixed(2)} katında; geriye kalan TÜM pay ${fmtK(headroom)}. Hiperparametre araması tipik olarak bunun ~${fmtK(5000)}’sini alır, o yüzden yapılmadı.`, `Cars with identical specs (same model · year · km · hp · body) still list ${fmtK(nf.mae_floor)} apart — ${fmtN(nf.twin_rows)} rows, ${fmtN(nf.twin_groups)} groups. That is a floor: sellers price the same car differently (options and mods, urgency, haggling) and no model can go below it. The model sits at ${fmtK(frWinM.MAE)}, ${floorRatio.toFixed(2)}× the floor, so the entire remaining headroom is ${fmtK(headroom)}. A hyperparameter search typically claims ~${fmtK(5000)} of that, which is why none was run.`)}</p>
                                </div>
                            )}
                            {(() => {
                                const cars: any[] = Array.isArray(fr.ornek_tahminler) && fr.ornek_tahminler.length ? fr.ornek_tahminler : (fr.ornek_tahmin ? [fr.ornek_tahmin] : []);
                                if (!cars.length) return null;
                                const BAND = (b: string) => LBL.label(LBL.priceBand, b, lang);
                                return (
                                    <div className="mt-4">
                                        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#86857e]">{cars.length > 1 ? L('Örnek tahminler · 3 fiyat bandı', 'Sample predictions · 3 price bands') : L('Örnek tahmin', 'Sample prediction')}</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {cars.map((c: any, ci: number) => (
                                                <div key={ci} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                                    <div className="mb-1.5 flex items-center gap-2">
                                                        {c.fiyat_bandi && <span className="rounded-full border border-[#cfe8dc] bg-[#f1f8f4] px-2 py-0.5 font-mono text-[10px] text-[#047857]">{BAND(c.fiyat_bandi)}</span>}
                                                        <span className="font-mono text-[10px] text-[#86857e]">{[c.segment, c.yas != null && `${c.yas} ${L('yaş', 'yr')}`, c.km != null && `${fmtKm(c.km)} km`].filter(Boolean).join(' · ')}</span>
                                                    </div>
                                                    <div className="mb-2.5 text-[13px] font-semibold leading-snug text-[#1a1a1a]">{c.arac}</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">{L('Gerçek', 'Actual')}</div><div className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-[#1a1a1a]">{fmtM(c.gercek)}</div></div>
                                                        <div><div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#86857e]">LightGBM ★</div><div className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-[#047857]">{fmtM(c.lightgbm_tahmin)}</div></div>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {c.lgb_sapma_pct != null && <span className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{L('sapma', 'dev')} {signPct(c.lgb_sapma_pct)}</span>}
                                                        {c.oof_artik_pct != null && <span className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{L('OOF artık', 'OOF resid')} {signPct(c.oof_artik_pct)}</span>}
                                                    </div>
                                                    {(c.catboost_tahmin != null || c.catboost_native_tahmin != null) && (
                                                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-[#86857e]">
                                                            {c.catboost_tahmin != null && <span>CatBoost {fmtM(c.catboost_tahmin)}</span>}
                                                            {c.catboost_native_tahmin != null && <span>native {fmtM(c.catboost_native_tahmin)}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
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

                    <Section id="model-weak" n={N()} title={L('Model nerede zayıf', 'Where the model is weak')} sub={L('Çeyrek MAPE · örneklem-boyu güvenilirlik', 'Quartile MAPE · sample-size reliability')}
                        lead={L('Modelin zayıflığı üç açıdan aynı yeri işaret ediyor: fiyat çeyreğine göre hata (ucuz araçlarda zorlanır), model ilan-adedi vs hata (nadir modeller saçılır) ve en iyi/en kötü tahminler (uç vakalar). Hepsi: nadir · uç · ucuz.', 'The model’s weakness points to the same place from three angles: error by price quartile (harder on cheap cars), per-model sample size vs error (rare models scatter) and the best/worst predictions (edge cases). All of it: rare · edge · cheap.')}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L('Çeyreğe göre hata (MAPE %)', 'Error by quartile (MAPE %)')}><Chart h={260}><PlotlyChart data={qeData} layout={base({ margin: { t: 24, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                            <Fig title={L('Model ilan-adedi vs medyan hata (log eksen)', 'Per-model sample size vs median error (log axis)')}><Chart h={260}><PlotlyChart data={residData} layout={base({ margin: { t: 8, r: 16, b: 32, l: 8 }, xaxis: { title: { text: L('ilan adedi', 'listings'), font: { size: 10 } } }, yaxis: { type: 'log' } })} config={config} guard={false} /></Chart></Fig>
                        </div>
                        {oofClipped && <Method className="mt-3">{L('Not: çeyrek yüzde-hataları birkaç OOF tavana-kırpması (₺50M) yüzünden şişkin; backtest (~%6.6) gerçek performansı yansıtır.', 'Note: the quartile percentage errors are inflated by a few OOF predictions clipped to a cap (₺50M); the backtest (~6.6%) reflects the true performance.')}</Method>}
                        {dom.oof_best && (
                            <div className="mt-4">
                                <div className="mb-2 font-mono text-[12px] font-semibold text-[#047857]">{L('En iyi tahminler', 'Best predictions')}</div>
                                <Table head={[L('Model', 'Model'), L('Yaş', 'Age'), 'km', L('Gerçek', 'Actual'), L('Tahmin', 'Pred'), L('Hata', 'Err')]}
                                    rows={dom.oof_best.slice(0, 5).map((r: any) => [r[0], String(r[1]), fmtN(r[2]), fmtM(r[3]), fmtM(r[4]), pct(r[5])])} />
                            </div>
                        )}
                        <div className="mb-2 mt-4 font-mono text-[12px] font-semibold text-[#b91c1c]">{L('En çok yanıldığı ilanlar', 'Biggest misses')}</div>
                        <Table head={[L('Model', 'Model'), L('Yaş', 'Age'), 'km', L('Gerçek', 'Actual'), L('Tahmin', 'Pred'), L('Hata', 'Err')]}
                            rows={dom.oof_outliers.slice(0, 6).map((r: any) => [r[0], String(r[1]), fmtN(r[2]), fmtM(r[3]), fmtM(r[4]), pct(r[5])])} />
                        {oofClipped && <Method className="mt-3">{L('Tahmin sütunundaki ₺50M değerleri log-model taşmasının tavana kırpılmasıdır — dürüstçe gösteriyoruz.', 'The ₺50M values in the Pred column are the log-model overflow clipped to a cap — shown honestly.')}</Method>}
                    </Section>

                    {cfData && (
                        <Section id="range-width" n={N()} title={L('Ne kadar geniş aralık vermeli?', 'How wide a range should you quote?')} sub={L(`Conformal · %${cfHedef} hedef`, `Conformal · ${cfHedef}% target`)}
                            lead={L(`Yukarıdaki zayıflık, aralık vermenin sebebi. Conformal aralıkların gerçek kapsama oranı fiyat çeyreğine göre; hedef %${cfHedef}. Üst çeyrekler tutturuyor, Q1 (ucuz araçlar) altında kalıyor — 00’daki “ucuzlarda aralığı genişlet” uyarısı buradan geliyor.`, `The weakness above is why you quote a range at all. Actual coverage of the conformal intervals by price quartile; target ${cfHedef}%. The upper quartiles hit it; Q1 (cheap cars) falls below — which is where 00’s “widen the range on cheap cars” comes from.`)}>
                            <Fig title={L(`Kapsama % (hedef %${cfHedef})`, `Coverage % (target ${cfHedef}%)`)}><Chart h={260}><PlotlyChart data={cfData} layout={base({ margin: { t: 24, r: 16, b: 24, l: 8 }, yaxis: { ticksuffix: '%' }, shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: cfHedef, y1: cfHedef, line: { dash: 'dash', color: '#86857e', width: 1 } }] })} config={config} guard={false} /></Chart></Fig>
                            {cf.not && <Method className="mt-3">{L(cf.not, 'Q1 (cheap) under-coverage: the model is less certain on cheap cars.')}</Method>}
                        </Section>
                    )}
                    </>
                    ); })()}

            {/* ============ 04 · WHEN TO RETRAIN ============ */}
                    <GroupHeading id="retrain" n="04" title={L('Ne kadar süre güvenilir', 'How long you can trust it')} />
                    {(() => { let sn = 0; const N = () => String(++sn).padStart(2, '0'); return (
                    <>

                    <Section id="go-stale" n={N()} title={L('Bu model ne zaman bayatlar?', 'When does this model go stale?')} sub={L('PSI, KS, ileri-test', 'PSI, KS, forward test')}
                        lead={L('İki kanıt aynı kararı veriyor. Dağılım kayması: dönemler arası eğriler neredeyse çakışık, PSI hep <0.05 (şekil stabil), KS hafif büyür (istatistiksel — büyük-n tuzağı). Zamansal backtest: eski dönemde eğit, sonraki dönemin yalnızca yeni ilanlarında test et (sızıntısız); kümülatif strateji daha stabil. Sonuç: piyasa SEVİYESİ +%5.3 kaydı ama ŞEKİL sabit → aylık retrain yeter.', 'Two lines of evidence give the same call. Distribution drift: the period curves nearly overlap, PSI stays <0.05 (shape stable), KS grows slightly (statistical — the big-n trap). Temporal backtest: train on an earlier period and test only on the next period’s NEW listings (leak-free); the cumulative strategy is more stable. Verdict: the market LEVEL shifted +5.3% but the SHAPE held → monthly retraining suffices.')}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {driftHistData.length > 0 && <Fig title={L('Köşeli · kdesiz · frekans (son commit stili)', 'Angular · no-KDE · frequency (committed style)')}><Chart h={280}><PlotlyChart data={driftHistData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { ticksuffix: '%' }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 34 } })} config={config} guard={false} /></Chart></Fig>}
                            {driftRawData.length > 0 && <Fig title={L('Yumuşak · KDE', 'Smooth · KDE')}><Chart h={280}><PlotlyChart data={driftRawData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.22 }, yaxis: { showticklabels: false }, xaxis: { tickformat: '~s' }, margin: { t: 12, r: 12, b: 36, l: 8 } })} config={config} guard={false} /></Chart></Fig>}
                        </div>
                        {driftRows.length > 0 && <Table className="mt-4" head={driftHead} rows={driftRows} />}
                        <Method className="mt-3">{L('Drift tablosu: 6 snapshot çiftinin tamamı. KS = en büyük dağılım farkı · PSI < 0.10 güvenli / > 0.25 yeniden eğit · p = KS testi anlamlılığı.', 'Drift table: all 6 snapshot pairs. KS = max distribution gap · PSI < 0.10 safe / > 0.25 retrain · p = KS-test significance.')}</Method>
                        {btInsData && <Fig className="mt-4" title={L('OOF MAPE · dönem başına vs kümülatif', 'OOF MAPE · per-snapshot vs cumulative')}><Chart h={260}><PlotlyChart data={btInsData} layout={base({ margin: { t: 12, r: 16, b: 40, l: 34 }, yaxis: { ticksuffix: '%' }, showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.25 } })} config={config} guard={false} /></Chart></Fig>}
                        {bts?.single && <Table className="mt-4" head={[L('Eğitim → Test', 'Train → Test'), L('Tek MAPE', 'Single MAPE'), L('Kümül. MAPE', 'Cumul. MAPE'), 'n']} rows={bts.single.map((r: any, i: number) => { const c = bts.cumulative[i]; return [`${r[0]} → ${r[1]}`, pct(r[2], 2), c ? pct(c[2], 2) : '—', fmtN(r[3])]; })} />}
                        {bts?.not && <Method className="mt-3">{L(bts.not, 'Backtest — single: train on one snapshot, predict forward. cumulative: train up to t. Only NEW ad_ids (leak-free).')}</Method>}
                    </Section>
                    </>
                    ); })()}

            {/* ============ 05 · HOW IT WAS BUILT ============ */}
                    <GroupHeading id="built" n="05" title={L('Nasıl kuruldu', 'How it was built')} />
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                        <p className="max-w-[560px] text-[14px] leading-[1.65] text-[#5f5f5a]">{L('Kirli scrape verisiyle çalışabilmek için verdiğim kararlar.', 'The decisions I took to work with dirty scraped data.')}</p>

                    </div>

                    <div id="dropped" data-section data-title={L('Neyi attım, neden', 'What I dropped, and why')} className="mb-4 scroll-mt-[84px] rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]/70">
                        <div className="list-none px-5 py-4 font-mono text-[13px] leading-[1.55] text-[#33332f] [&::-webkit-details-marker]:hidden">
                            <b className="font-semibold">{L('Neyi attım, neden', 'What I dropped, and why')}</b>{L(' — 15 kolon, hepsi aynı sebepten eksik', ' — 15 columns, all missing for the same reason')}
                        </div>
                        <div className="border-t border-[#ece9e3] px-4 py-7 sm:px-6">

                    <Sub title={L('Öznitelik seçimi', 'Feature selection')}
                        lead={L(`117 ham kolondan ${meta.n_features}’ya indirildi. Çıkarma keyfi değil: sabit kolonlar, redundant kb/gb ikizleri, sızıntı/kimlik, blok-eksik, çoklu-bağlantı, granüler hasar (agregatlandı) ve ampirik audit.`, `From 117 raw columns down to ${meta.n_features}. Nothing dropped arbitrarily: constants, redundant kb/gb twins, leakage/identity, block-missing, collinearity, granular damage (aggregated) and an empirical audit.`)}>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {met.feature_kept.map((f: string) => (
                                <span key={f} className="rounded-[8px] border border-[#cfe8dc] bg-[#f1f8f4] px-2 py-1 font-mono text-[11px] text-[#22332b]">{noTab(f)}</span>
                            ))}
                        </div>
                        <Table head={[L('Grup', 'Group'), L('Gerekçe', 'Reason'), L('~kolon', '~cols')]} rows={met.feature_drop.map((r: any) => [r[0], fdReason(r[1]), String(r[2])])} />
                        {met.impute_note && <Method className="mt-3">{L(met.impute_note, 'Hierarchical imputation: missing values filled by series > segment > brand median (most-specific group first). torque_nm was dropped (27.6% missing); the rest are handled natively by the tree model.')}</Method>}
                    </Sub>

                    <Sub title={L('15 kolon neden atıldı', 'Why 15 columns were dropped')}
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
                        {gbEmpty.length > 0 && (
                            <div className="mt-4">
                                <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]">{L('gb_ / kb_ çift-kaynak — dolu taraf (kb) seçildi', 'gb_ / kb_ dual source — the populated side (kb) is used')}</div>
                                <Table head={[L('Alan', 'Field'), `${L('Genel Bakış (gb) boş', 'Overview (gb) empty')} %`]} rows={gbEmpty.map((t: any) => [t.label, pct(t.gb, 1)])} />
                                <Method className="mt-2">{L('Aynı alanlar KısaBilgi (kb) tabında büyük ölçüde dolu → analizde dolu taraf (kb) kullanıldı. Örn. çekiş: gb %74 boş, kb neredeyse tam.', 'The same fields are largely populated in the QuickInfo (kb) tab → the populated side (kb) is used. E.g. drivetrain: gb 74% empty, kb nearly complete.')}</Method>
                            </div>
                        )}
                        {specCorr != null && (
                            <div className="mt-4 rounded-[12px] border border-[#cfe8dc] bg-[#f1f8f4] p-4">
                                <div className="mb-2 flex items-baseline justify-between gap-3">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]">{L('Birlikte-eksiklik korelasyonu (spec bloğu)', 'Co-missing correlation (spec block)')}</span>
                                    <span className="font-mono text-[19px] font-bold tabular-nums text-[#047857]">{Number(specCorr).toFixed(3)}</span>
                                </div>
                                {smNot && <p className="text-[13px] leading-[1.6] text-[#22332b]">{L(smNot, 'This is MISSING correlation (presence/absence co-moves) — NOT value correlation (~0.59). Spec columns come from catalog matching: standard models match, special variants don’t → all specs go blank together. Each spec carries different information, but their presence/absence is tied to one source.')}</p>}
                            </div>
                        )}
                        <Method className="mt-3">{L('Sebep: spec verisi model–katalog eşleştirmesinden gelir — standart modeller (“320i”) eşleşir, niş varyantlar (“320i 50th Year M Edition”) eşleşmez, o yüzden o ilanların tüm spec’leri birden boş kalır. Modele koymadım: niş varyantlarda hep eksik olurlardı ve model adı (TF-IDF ile) o bilgiyi zaten yakalıyor.', 'Cause: spec data comes from model–catalog matching — standard models (“320i”) match, niche variants (“320i 50th Year M Edition”) don’t, so all their specs go blank at once. Excluded from the model: they’d always be missing on niche variants, and the model name (via TF-IDF) already captures that information.')}</Method>
                    </Sub>

                    {idup && (
                        <Sub title={L('İçerik-bazlı duplikasyon', 'Content-based duplication')}
                            lead={L('ad_id-dedup DIŞINDA bir kontrol: ad_id farklı ama tüm ayırt edici özellikler (fiyat, km, yaş, model, hasar, motor) aynı olan ilanlar. Oran düşük — veri toplama temizliğini doğrular; bir kısmı gerçek tekrar-ilan, bir kısmı yaygın modellerde tesadüfi çakışma.', 'A check beyond ad_id-dedup: listings whose ad_id differs but whose every distinguishing feature (price, mileage, age, model, damage, engine) is identical. The rate is low — confirming clean collection; some are genuine re-posts, some coincidental overlaps among common models.')}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Stat k={L('Katı-tanım tekrar', 'Strict-def dupes')} v={fmtN(idup.kati_tanim_fazla)} sub={pct(idup.kati_tanim_pct, 2)} accent />
                                <Stat k={L('Gevşek-tanım tekrar', 'Loose-def dupes')} v={fmtN(idup.gevsek_tanim_fazla)} sub={pct(idup.gevsek_tanim_pct, 2)} />
                                <Stat k={L('Duplike grubu', 'Duplicate groups')} v={fmtN(idup.duplike_grup_sayisi)} />
                                <Stat k={L('Tanım kolonları', 'Def. columns')} v={String(idup.kati_tanim_kolonlari.length)} />
                            </div>
                            <div className="mt-4 mb-4 flex flex-wrap gap-1.5">
                                {idup.kati_tanim_kolonlari.map((c: string) => (
                                    <span key={c} className="rounded-[8px] border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-1 font-mono text-[11px] text-[#5f5f5a]">{noTab(c)}</span>
                                ))}
                            </div>
                            {Array.isArray(idup.en_cok_tekrar) && idup.en_cok_tekrar.length > 0 &&
                                <Table head={[L('Model', 'Model'), L('Tekrar', 'Repeats'), L('Fiyat', 'Price'), L('Yıl', 'Year')]} rows={idup.en_cok_tekrar.map((r: any) => [r.model, String(r.n_tekrar), fmtM(r.fiyat), String(r.yil)])} />}
                            {idup.not && <Method className="mt-3">{L(idup.not, 'A content-based duplicate check beyond ad_id-dedup: ad_id differs but every distinguishing feature (price, km, age, model, damage, engine) matches. A low rate confirms clean collection.')}</Method>}
                        </Sub>
                    )}

                        </div>
                    </div>

                    <div id="leakage-checks" data-section data-title={L('Sızıntı ve fazlalık kontrolleri', 'Leakage and redundancy checks')} className="mb-4 scroll-mt-[84px] rounded-[14px] border border-[#cfe8dc] bg-[#f1f8f4]/50">
                        <div className="list-none px-5 py-4 font-mono text-[13px] leading-[1.55] text-[#22332b] [&::-webkit-details-marker]:hidden">
                            <b className="font-semibold">{L('Sızıntı ve fazlalık kontrolleri', 'Leakage and redundancy checks')}</b>{L(' — U(segment | seri) = 1.00; segment türetilmiş', ' — U(segment | series) = 1.00; segment is derived')}
                        </div>
                        <div className="border-t border-[#cfe8dc] px-4 py-7 sm:px-6">

                    <Sub title={L('Kategorik bağıntı (Cramér’s V + Theil’s U)', 'Categorical dependence (Cramér’s V + Theil’s U)')}
                        lead={L('Cramér’s V ilişkinin gücünü (simetrik), Theil’s U yönünü (asimetrik) verir — ikisi de KATEGORİK öznitelikler içindir: `model` (metin), marka, seri, segment, kasa, çekiş, vites, yakıt. `model` diğerlerini neredeyse tam belirliyor (U≈1) ama tersi değil → `model` hedonik OLS’ten dışlandı (çok yüksek kardinalite; LightGBM’de TF-IDF metniyle ayrıca kullanılır). Not: hasar sayaçları ve motor (hp/cc) SAYISAL olduğundan burada değil.', 'Cramér’s V gives association strength (symmetric); Theil’s U its direction (asymmetric) — both are for CATEGORICAL features: `model` (text), brand, series, segment, body, drivetrain, transmission, fuel. `model` almost fully determines the rest (U≈1) but not vice-versa → `model` is excluded from the hedonic OLS (too high-cardinality; it’s used in the LightGBM via TF-IDF text instead). Note: damage counters and engine specs (hp/cc) are NUMERIC, so they’re not here.')}>
                        {(cramersFull || theilsFull) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {theilsFull && <Fig title={L("Theil’s U (yönlü · ana)", "Theil’s U (directional · main)")}><Chart h={360}><PlotlyChart data={theilsFull} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                                {cramersFull && <Fig title={L("Cramér’s V (simetrik · ikincil)", "Cramér’s V (symmetric · secondary)")}><Chart h={360}><PlotlyChart data={cramersFull} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                            </div>
                        ) : null}
                        {assoc.length > 0 && <Table className="mt-4" head={[L('model →', 'model →'), "Cramér’s V", "Theil’s U"]} rows={assoc.map((r: any) => [r[0], r[1].toFixed(3), r[2].toFixed(3)])} />}
                        <Fig className="mt-4" title={L('Her seri tek bir segmente düşüyor — medyan fiyat (seri × segment)', 'Every series lands in exactly one segment — median price (series × segment)')}><Chart h={420}><PlotlyChart data={ssmData} layout={base({ margin: { t: 8, r: 8, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        <Method className="mt-2">{L('Isı haritasında her satır (seri) yalnız bir sütunda (segment) dolu. U(segment | seri) = 1.00’ın görüntüsü: segment seriden türetilmiş bir kolon, bağımsız bilgi değil. Tersi doğru değil — bir segmentte birden çok seri var (U(seri | segment) < 1).', 'In the heatmap each row (series) is filled in exactly one column (segment). This is what U(segment | series) = 1.00 looks like: segment is a column derived from series, not independent information. The reverse doesn’t hold — a segment holds several series (U(series | segment) < 1).')}</Method>
                        {met.g_mpv && (
                            <div className="mt-5 rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                <div className="mb-1.5 font-mono text-[12px] font-semibold text-[#047857]">{L('G ≡ MPV — türetmenin somut hali', 'G ≡ MPV — the derivation, concretely')}</div>
                                <p className="mb-3 max-w-[620px] text-[13px] leading-[1.6] text-[#5f5f5a]">{L('Ham veride “G” segmenti vardı ama gerçek değil: G’lerin neredeyse tamamı MPV gövde (Active/Gran Tourer). Segment seriden türetildi, MPV bilgisi body_type’ta tutuldu — yukarıdaki asimetrinin görünür hali.', 'The raw feed had a “G” segment, but it isn’t real: nearly all G rows are MPV bodies (Active/Gran Tourer). Segment is derived from the series, the MPV signal kept in body_type — the asymmetry above, made visible.')}</p>
                                {typeof met.g_mpv === 'object' ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <Stat k={L('G ∧ MPV', 'G ∧ MPV')} v={fmtN(met.g_mpv.mpv_and_g)} accent />
                                        <Stat k={L('Toplam G', 'Total G')} v={fmtN(met.g_mpv.g_total)} />
                                        <Stat k={L('Toplam MPV', 'Total MPV')} v={fmtN(met.g_mpv.mpv_total)} />
                                    </div>
                                ) : (
                                    <Method>{L(String(met.g_mpv), 'Segment is derived deterministically from the series; the raw gb_segment was too dirty to use.')}</Method>
                                )}
                            </div>
                        )}
                    </Sub>

                    {nc && (
                        <Sub title={L('Sayısal korelasyon (Pearson + Spearman)', 'Numeric correlation (Pearson + Spearman)')}
                            lead={L('Sayısal öznitelikler arası korelasyon — üstteki kategorik bağıntının sayısal karşılığı. Yeşil = pozitif, kırmızı = negatif. Pearson lineer, Spearman monotonik ilişkiyi ölçer. |r|>0.5 çiftler çoklu-bağlantı için işaretlenir (VIF ile de kontrol edildi, hepsi <3).', 'Correlation among numeric features — the numeric counterpart to the categorical dependence above. Green = positive, red = negative. Pearson measures linear, Spearman monotonic association. |r|>0.5 pairs are flagged for collinearity (also checked via VIF, all <3).')}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {pearsonHeat && <Fig title="Pearson"><Chart h={340}><PlotlyChart data={pearsonHeat} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                                {spearmanHeat && <Fig title="Spearman"><Chart h={340}><PlotlyChart data={spearmanHeat} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                            </div>
                            {Array.isArray(nc.yuksek_ciftler) && nc.yuksek_ciftler.length > 0 &&
                                <Table className="mt-4" head={[L('Yüksek korelasyon çifti', 'High-correlation pair'), 'r']} rows={nc.yuksek_ciftler.map((p: any) => [`${numLabel(p[0])} · ${numLabel(p[1])}`, p[2].toFixed(3)])} />}
                            {nc.not && <Method className="mt-3">{L(nc.not, 'Numeric-feature correlation (Cramér/Theil handle the categoricals). Pearson = linear, Spearman = monotonic. |r|>0.5 pairs stand out; collinearity was also checked via VIF (all <3).')}</Method>}
                        </Sub>
                    )}

                        </div>
                    </div>

                    <div id="segments-found" data-section data-title={L('Segmentler nasıl bulundu', 'How the segments were found')} className="mb-4 scroll-mt-[84px] rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]/70">
                        <div className="list-none px-5 py-4 font-mono text-[13px] leading-[1.55] text-[#33332f] [&::-webkit-details-marker]:hidden">
                            <b className="font-semibold">{L('Segmentler nasıl bulundu', 'How the segments were found')}</b>{L(' — k=3, elbow ve silhouette hemfikir', ' — k=3, and elbow and silhouette agree')}
                        </div>
                        <div className="border-t border-[#ece9e3] px-4 py-7 sm:px-6">

                    <Sub title={L('KMeans + PCA — yöntem', 'KMeans + PCA — method')}
                        lead={L(`k=3 silhouette ile seçildi, PCA saçılımıyla doğrulandı: ${km.length} grup yaş × km × güç ekseninde ayrışıyor, hasarlı küme PC3’te. Kümelerin ne olduğu (isim, medyan, hasar) → 02. Hasar sinyalinin hedonik + PCA + KMeans’te bağımsızca çıkması sağlamlık teşhisi.`, `k=3 was chosen by silhouette and corroborated with the PCA scatter: ${km.length} groups separate along age × mileage × power, the damaged cluster on PC3. What the clusters are (name, median, damage) → 02. The damage signal appearing independently across the hedonic model, PCA and KMeans is a robustness check.`)}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Fig title={L(`PCA — PC1 ${axPct(0)} × PC2 ${axPct(1)} (güç)`, `PCA — PC1 ${axPct(0)} × PC2 ${axPct(1)} (power)`)}><Chart h={300}><PlotlyChart data={pcaData} layout={base({ xaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid }, yaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid } })} config={config} guard={false} /></Chart></Fig>
                            {pca13Data && <Fig title={L(`PCA — PC1 ${axPct(0)} × PC3 ${axPct(2)} (hasar)`, `PCA — PC1 ${axPct(0)} × PC3 ${axPct(2)} (damage)`)}><Chart h={300}><PlotlyChart data={pca13Data} layout={base({ xaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid }, yaxis: { showgrid: false, zeroline: true, zerolinecolor: theme.grid } })} config={config} guard={false} /></Chart></Fig>}
                        </div>
                        {kselData && <Fig className="mt-4" title={L('k seçimi — Elbow + Silhouette', 'k selection — Elbow + Silhouette')}><Chart h={300}><PlotlyChart data={kselData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.24 }, margin: { t: 12, r: 40, b: 40, l: 8 }, xaxis: { title: { text: 'k', font: { size: 10 } }, dtick: 1 }, yaxis: { tickformat: '~s', tickfont: { size: 10, color: '#047857' } }, yaxis2: { fixedrange: true, overlaying: 'y', side: 'right', gridcolor: 'transparent', zeroline: false, tickfont: { size: 10, color: '#e08a1e' } } })} config={config} guard={false} /></Chart></Fig>}
                        {ksel && <Method className="mt-3">{L(`k seçimi: silhouette k=${ksel.secilen_k} işaret ediyor; ${ksel.secilen_k} küme hem optimal hem yorumlanabilir. ${ksel.not || ''}`.trim(), `k choice: silhouette points to k=${ksel.secilen_k}; ${ksel.secilen_k} clusters are both optimal and interpretable. Chosen transparently, not blindly.`)}</Method>}
                        {axes.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {axes.map((ax: any) => (
                                    <div key={ax.pc} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                        <div className="mb-1 flex items-baseline justify-between">
                                            <span className="font-mono text-[13px] font-semibold text-[#047857]">{ax.pc}</span>
                                            <span className="font-mono text-[11px] text-[#86857e]">{pct(ax.var_pct)}</span>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {ax.top.slice(0, 4).map((t: any, ti: number) => (
                                                <div key={ti} className="flex items-center justify-between font-mono text-[11px]">
                                                    <span className="text-[#5f5f5a]">{noTab(t[0])}</span>
                                                    <span className={`tabular-nums ${t[1] >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>{t[1] >= 0 ? '+' : ''}{t[1].toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Sub>

                        </div>
                    </div>

                    <div id="target-prep" data-section data-title={L('Hedef ve önişleme', 'Target and preprocessing')} className="mb-12 scroll-mt-[84px] rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]/70">
                        <div className="list-none px-5 py-4 font-mono text-[13px] leading-[1.55] text-[#33332f] [&::-webkit-details-marker]:hidden">
                            <b className="font-semibold">{L('Hedef ve önişleme', 'Target and preprocessing')}</b>{L(' — neden log-fiyat üzerinde eğitildi', ' — why it trains on log price')}
                        </div>
                        <div className="border-t border-[#ece9e3] px-4 py-7 sm:px-6">

                    <Sub title={L('Neden log-fiyat', 'Why log price')}
                        lead={L(`Ham fiyat sağa çarpık (çarpıklık ${dom.price_dist.skew_raw.toFixed(2)}); log dönüşümü simetriğe yaklaştırıyor (${dom.price_dist.skew_log.toFixed(2)}). Modeli log1p(price) üzerinde eğittim: uç değerler kareli kayıpta tüm hatayı yutuyordu. Bir modelleme kararı, piyasa bulgusu değil — o yüzden burada.`, `Raw price is right-skewed (skew ${dom.price_dist.skew_raw.toFixed(2)}); a log transform pulls it toward symmetry (${dom.price_dist.skew_log.toFixed(2)}). I trained on log1p(price): under squared loss the extremes were swallowing the whole error budget. A modelling decision, not a market finding — which is why it lives here.`)}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Stat k={L('Çarpıklık (ham)', 'Skew (raw)')} v={dom.price_dist.skew_raw.toFixed(2)} />
                            <Stat k={L('Çarpıklık (log)', 'Skew (log)')} v={dom.price_dist.skew_log.toFixed(2)} accent />
                            <Stat k={L('Medyan fiyat', 'Median price')} v={fmtM(dom.price_dist.median)} />
                        </div>
                        {phData && <Fig className="mt-4" title={L('Fiyat histogramı — tüm veri (₺ · kesikli çizgi = medyan)', 'Price histogram — all data (₺ · dashed line = median)')}><Chart h={260}><PlotlyChart data={phData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { tickformat: '~s' }, shapes: [{ type: 'line', yref: 'paper', y0: 0, y1: 1, xref: 'x', x0: dom.price_dist.median, x1: dom.price_dist.median, line: { dash: 'dash', color: '#86857e', width: 1 } }] })} config={config} guard={false} /></Chart></Fig>}
                        <Method className="mt-3">{L('Dönemler arası dağılım kayması ayrı bir soru — orada da tek sahip 04. Buradaki histogram tüm dedup veriyi gösterir, zaman kırılımı değil.', 'Drift across periods is a separate question, and 04 owns it. The histogram here is all deduped data, not a time split.')}</Method>
                    </Sub>

                        </div>
                    </div>

            </div>
        );
    }, [d, lang, scMode, theme, diag]);

    if (err) return <p className="text-[15px] text-[#86857e]">{L('Analiz verisi yüklenemedi.', 'Could not load analysis data.')}</p>;
    if (!d) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/2 rounded bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fbfbf9] text-[#1a1a1a]">
            {/* mobile top bar (< md) */}
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e9e7e2] bg-[#fbfbf9]/95 px-4 py-3 backdrop-blur md:hidden">
                <button onClick={() => setDrawer(true)} aria-label={L('İçindekiler', 'Contents')} className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><Menu size={20} /></button>
                <span className="truncate font-mono text-[12px] text-[#5f5f5a]">{toc.find((x) => x.id === activeId)?.title ?? L('Analitik Rapor', 'Analytics Report')}</span>
                <span className="ml-auto"><Monogram /></span>
            </header>

            {/* mobile drawer — Radix Dialog (focus-trap · esc · scroll-lock) */}
            <Dialog.Root open={drawer} onOpenChange={setDrawer}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 md:hidden" />
                    <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[300px] flex-col border-r border-[#e9e7e2] bg-[#fdfcf9] p-5 shadow-xl focus:outline-none md:hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#86857e]">{L('İçindekiler', 'Contents')}</Dialog.Title>
                            <Dialog.Close asChild><button aria-label={L('Kapat', 'Close')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><X size={18} /></button></Dialog.Close>
                        </div>
                        <a href={localize('/projects/car-price', lang)} className="mb-3 flex items-center gap-2 font-mono text-[12px] text-[#86857e] hover:text-[#5f5f5a]"><ArrowLeft size={14} /> {L('Proje', 'Project')}</a>
                        <TocNav toc={toc} activeId={activeId} onGo={goTo} />
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="mx-auto flex w-full max-w-[1280px]">
                {/* desktop TOC rail */}
                <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fbfbf9] px-5 py-8 md:flex">
                    {/* v1 report has no route any more — the sibling link went with it. */}
                    <div className="mb-4">
                        <Monogram />
                    </div>
                    <a href={localize('/projects/car-price', lang)} className="mb-4 flex items-center gap-2 font-mono text-[12px] text-[#86857e] transition-colors hover:text-[#5f5f5a]"><ArrowLeft size={14} /> {L('Proje', 'Project')}</a>
                    <div className="mb-5 h-[3px] w-full overflow-hidden rounded-full bg-[#ece9e3]"><div ref={progressRef} className="h-full rounded-full bg-[#047857]" style={{ width: '0%' }} /></div>
                    <TocNav toc={toc} activeId={activeId} onGo={goTo} />
                </aside>

                <main ref={mainRef} className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12 lg:px-14">
                    {body}
                </main>
            </div>
        </div>
    );
}

// ---------- Kaggle-notebook TOC nav (shared by the desktop rail + the mobile drawer) ----------
function TocNav({ toc, activeId, onGo }: { toc: { id: string; title: string; chapter: string; chapterId: string }[]; activeId: string; onGo: (id: string) => void }) {
    const chapters: { name: string; id: string; items: { id: string; title: string }[] }[] = [];
    toc.forEach((it) => {
        let ch = chapters.find((c) => c.name === it.chapter);
        if (!ch) { ch = { name: it.chapter, id: it.chapterId, items: [] }; chapters.push(ch); }
        ch.items.push({ id: it.id, title: it.title });
    });
    if (!chapters.length) return null;
    // A child that repeats its chapter's own title (00's decision Section, 01's wrapper Section)
    // would render the same text twice in the nav — the chapter link already goes there, so drop
    // it. Filter by name (not "only child"): 01 now has real sub-anchors (scale/leakage/…), so the
    // parent Section must be dropped even though it's no longer the lone child.
    chapters.forEach((c) => { c.items = c.items.filter((it) => it.title !== c.name); });
    // Real <a href="#slug"> anchors: shareable/right-clickable + work with JS off; the
    // click handler keeps the smooth-scroll, drawer-close and hash update (see goTo).
    const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); onGo(id); };
    return (
        <nav className="flex-1 overflow-y-auto text-[13px]">
            {chapters.map((ch) => (
                <div key={ch.name} className="mb-4">
                    {ch.name && <a href={'#' + ch.id} onClick={(e) => go(e, ch.id)} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[#86857e] transition-colors hover:text-[#047857]">{ch.name}</a>}
                    <ul className="space-y-0.5">
                        {ch.items.map((it) => {
                            const on = it.id === activeId;
                            return (
                                <li key={it.id}>
                                    <a href={'#' + it.id} onClick={(e) => go(e, it.id)} aria-current={on ? 'true' : undefined}
                                        className={`block w-full rounded-[6px] px-2.5 py-1.5 text-left leading-snug transition-colors ${on ? 'bg-[#e7f3ec] font-semibold text-[#047857]' : 'text-[#5f5f5a] hover:bg-[#f1efe9] hover:text-[#1a1a1a]'}`}>
                                        {it.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

// ---------- presentational helpers ----------
// Stable, semantic anchor slug from a heading (id wins if given). Rendered server-
// side, so `#slug` deep-links work in the prerendered HTML (no-JS / bots) too. Slugs
// derive from the English title (the site is English-only) → stable permalinks.
function slugify(s: string): string {
    return s
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics (e-acute -> e)
        .replace(/[’'`]/g, '')                        // drop apostrophes (model's -> models)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function GroupHeading({ id, n, title }: { id?: string; n: string; title: string }) {
    return (
        <div id={id ?? slugify(title)} data-chapter data-title={title} className="scroll-mt-[84px] mb-8 mt-16 flex items-center gap-3 border-t-2 border-[#047857]/25 pt-6 first:mt-0">
            <span className="font-mono text-[12px] font-bold text-[#047857]">{n}</span>
            <h2 className="text-[13px] font-mono uppercase tracking-[0.16em] text-[#5f5f5a]">{title}</h2>
        </div>
    );
}

function Section({ id, n, title, sub, lead, children }: { id?: string; n: string; title: string; sub?: string; lead?: string; children: React.ReactNode }) {
    return (
        <section id={id ?? slugify(title)} data-section data-title={title} className="group relative mb-12 scroll-mt-[84px] sm:pl-14">
            {/* execution-count gutter — Jupyter/Kaggle run-count feel: mono [n], absolute on desktop */}
            <div className="mb-3 flex items-baseline gap-3">
                <span className="hidden font-mono text-[12px] tabular-nums text-[#9a9a92] transition-colors group-hover:text-[#047857] sm:block sm:absolute sm:left-0 sm:top-1.5 sm:w-11 sm:text-right">[{n}]</span>
                <span className="font-mono text-[13px] font-bold text-[#047857] sm:hidden">[{n}]</span>
                <div>
                    <h2 className="text-[21px] font-semibold tracking-[-0.028em] text-[#1a1a1a] sm:text-[23px]">{title}</h2>
                    {sub && <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.07em] text-[#86857e]">{sub}</div>}
                </div>
            </div>
            {lead && <p className="mb-6 max-w-[680px] text-[15px] leading-[1.7] text-[#33332f] sm:text-[16px]">{lead}</p>}
            {children}
        </section>
    );
}

// Lighter heading for items nested inside a collapsible block (05 · How it was built) — no
// data-section attribute, so these do NOT each become their own TOC entry (one block, not eight).
function Sub({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
    return (
        <div className="mb-9 border-t border-[#ece9e3] pt-7 first:border-t-0 first:pt-0">
            <h3 className="mb-2 text-[17px] font-semibold tracking-[-0.02em] text-[#1a1a1a]">{title}</h3>
            {lead && <p className="mb-4 max-w-[680px] text-[14px] leading-[1.65] text-[#5f5f5a] sm:text-[15px]">{lead}</p>}
            {children}
        </div>
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
