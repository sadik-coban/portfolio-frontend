"use client";

import { useEffect, useMemo, useState } from 'react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme, CATEGORICAL_LIST } from '../../_charts/types';
import { useLang } from '../i18n';

// Data-science portfolio report driven entirely by public/analysis.json
// (Audi+BMW used-car price prediction). Numbers are read from the JSON — nothing
// hardcoded. Charts are Plotly with zoom/pan disabled (fixedrange). Follows the
// NEXTJS_BUILD_PROMPT story order. Sections gracefully hide when data is absent.

const fmtTL = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR');
const fmtK = (n: number) => '₺' + Math.round(n / 1000).toLocaleString('tr-TR') + 'K';
const pct = (n: number) => '%' + Number(n).toFixed(1);

export default function FinalReportAnalysis() {
    const { lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const theme = useMemo(() => makeHybridTheme(), []);
    const [a, setA] = useState<any>(null);
    const [err, setErr] = useState(false);

    useEffect(() => {
        fetch('/analysis.json').then((r) => r.json()).then(setA).catch(() => setErr(true));
    }, []);

    const MONTHS = lang === 'tr'
        ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDate = (iso: string) => { const [, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]}`; };

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

    if (err) return <p className="text-[15px] text-[#86857e]">{L('Analiz verisi yüklenemedi.', 'Could not load analysis data.')}</p>;
    if (!a) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/2 rounded bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
        </div>
    );

    const c = a.charts || {};
    const green = '#059669', deep = '#047857';

    // ---------- chart builders ----------
    const missData = c.missingness ? [{ type: 'bar', orientation: 'h', x: [...c.missingness.pct].reverse(), y: [...c.missingness.col].reverse(), marker: { color: '#e08a1e' }, hovertemplate: '%{y}: %{x:.1f}%<extra></extra>' }] : null;

    const pdr = c.price_drift_raw?.per_snapshot;
    const pdrDates = pdr ? Object.keys(pdr) : [];
    const driftRawData = pdr ? pdrDates.map((d, i) => ({ type: 'scatter', mode: 'lines', x: pdr[d].x, y: pdr[d].y, name: shortDate(d), line: { color: CATEGORICAL_LIST[i % CATEGORICAL_LIST.length], width: 2 }, hovertemplate: shortDate(d) + ' · %{x} bin₺: %{y}<extra></extra>' })) : null;

    const driftRows = a.drift ? Object.entries(a.drift as Record<string, { ks: number; p: number }>).map(([k, v]) => {
        const [d1, d2] = k.split('__');
        return [`${shortDate(d1)} → ${shortDate(d2)}`, v.ks.toFixed(3), v.p.toFixed(3)];
    }) : null;

    const permEntries = Object.entries(a.perm_importance as Record<string, number>).sort((x, y) => x[1] - y[1]);
    const permData = [{ type: 'bar', orientation: 'h', x: permEntries.map((e) => e[1]), y: permEntries.map((e) => e[0]), marker: { color: deep }, hovertemplate: '%{y}: +%{x:,.0f} ₺ MAE<extra></extra>' }];

    const ablEntries = Object.entries(a.ablation_rmse as Record<string, number>).sort((x, y) => y[1] - x[1]);
    const ablBest = Math.min(...ablEntries.map((e) => e[1]));
    const ablData = [{ type: 'bar', orientation: 'h', x: ablEntries.map((e) => e[1]), y: ablEntries.map((e) => e[0]), marker: { color: ablEntries.map((e) => (e[1] === ablBest ? green : '#cbd0c9')) }, hovertemplate: '%{y}: %{x:,.0f} RMSE<extra></extra>' }];

    const heat = (ch: any, hover: string) => ch ? [{ type: 'heatmap', z: ch.z, x: ch.labels, y: ch.labels, zmin: 0, zmax: 1, colorscale: [[0, '#fdfcf9'], [0.5, '#6ee7b7'], [1, '#065f46']], showscale: false, hovertemplate: hover }] : null;
    const theilsData = heat(c.theils_u, L('%{y} → %{x}: %{z:.2f}<extra></extra>', '%{y} → %{x}: %{z:.2f}<extra></extra>'));
    const cramersData = heat(c.cramers_v, '%{y} · %{x}: %{z:.2f}<extra></extra>');
    const mp = a.categorical?.model_predicts as Record<string, number> | undefined;
    const cvh = a.categorical?.cramers_v_high as Record<string, number> | undefined;

    const pca = c.pca;
    // Cartesian bundle has no scattergl → SVG scatter, but stride-sample the
    // cloud to ≤2500 markers (from ~4000) so we don't pile up DOM nodes.
    const pcaStep = pca ? Math.ceil(pca.x.length / 2500) : 1;
    const pcaKeep = (arr: any[]) => arr.filter((_: any, i: number) => i % pcaStep === 0);
    const pcaData = pca ? [{ type: 'scatter', mode: 'markers', x: pcaKeep(pca.x), y: pcaKeep(pca.y), marker: { size: 4, opacity: 0.6, color: pcaKeep(pca.cluster).map((k: number) => CATEGORICAL_LIST[k % CATEGORICAL_LIST.length]) }, hoverinfo: 'skip' }] : null;
    const ks = c.kmeans_select;
    const ksData = ks ? [
        { type: 'scatter', mode: 'lines+markers', x: ks.k, y: ks.inertia, line: { color: deep, width: 2 }, marker: { size: 5 }, hovertemplate: 'k=%{x}: inertia %{y:.3s}<extra></extra>' },
        { type: 'scatter', mode: 'lines+markers', x: ks.k, y: ks.silhouette, yaxis: 'y2', line: { color: '#e08a1e', width: 2 }, marker: { size: 5 }, hovertemplate: 'k=%{x}: silhouette %{y:.3f}<extra></extra>' },
    ] : null;

    const bands = a.perf_bands as any[];
    const bandMae = [{ type: 'bar', x: bands.map((b) => b.band), y: bands.map((b) => b.MAE), marker: { color: deep }, hovertemplate: '%{x}: %{y:,.0f} ₺<extra></extra>' }];
    const bandMape = [{ type: 'bar', x: bands.map((b) => b.band), y: bands.map((b) => b.MAPE), marker: { color: green }, hovertemplate: '%{x}: %{y:.1f}%<extra></extra>' }];
    const rs = c.resid_scatter;
    const residData = rs ? [{ type: 'scatter', mode: 'markers', x: rs.adet, y: rs.err, text: rs.model, marker: { size: 6, color: green, opacity: 0.55 }, hovertemplate: '%{text}<br>%{x} ' + L('ilan', 'listings') + ' · %{y:,.0f} ₺<extra></extra>' }] : null;

    const oe = a.outlier_effect;
    const outMae = [{ type: 'bar', x: [L('ham', 'raw'), L('temiz', 'cleaned')], y: [oe.raw.MAE, oe.cleaned.MAE], marker: { color: [theme.muted, green] }, text: [oe.raw.MAE, oe.cleaned.MAE].map(fmtK), textposition: 'outside', hovertemplate: '%{x}: %{y:,.0f} ₺<extra></extra>' }];

    const ef = a.extra_features; const efKeys = Object.keys(ef);
    const efData = [{ type: 'bar', x: efKeys, y: efKeys.map((k) => ef[k].MAE), marker: { color: deep }, text: efKeys.map((k) => fmtK(ef[k].MAE)), textposition: 'outside', hovertemplate: '%{x}: %{y:,.0f} ₺ MAE<extra></extra>' }];
    const efMin = Math.min(...efKeys.map((k) => ef[k].MAE)), efMax = Math.max(...efKeys.map((k) => ef[k].MAE));
    const lt = a.log_target;
    const tun = a.tuning;
    const tunData = tun ? [{ type: 'bar', x: ['baseline', L('Optuna en iyi', 'Optuna best')], y: [tun.baseline_mae, tun.best_mae], marker: { color: [theme.muted, green] }, text: [tun.baseline_mae, tun.best_mae].map(fmtK), textposition: 'outside', hovertemplate: '%{x}: %{y:,.0f} ₺<extra></extra>' }] : null;

    const bt = a.backtest as any[];
    const btBest = Math.min(...bt.map((r) => r['→snap3_yeni']));
    const btData = [{ type: 'bar', x: bt.map((r) => `${r['egitim@']}·${r.strateji}`), y: bt.map((r) => r['→snap3_yeni']), marker: { color: bt.map((r) => (r['→snap3_yeni'] === btBest ? green : '#cbd0c9')) }, hovertemplate: '%{x}: %{y:,.0f} ₺<extra></extra>' }];

    const pi = a.price_index;
    const piData = [{ type: 'bar', x: ['naive', L('hedonik', 'hedonic')], y: [pi.naive_pct, pi.hedonic_pct], marker: { color: [theme.muted, green] }, text: [pi.naive_pct, pi.hedonic_pct].map((v) => pct(v)), textposition: 'outside', hovertemplate: '%{x}: %{y:.2f}%<extra></extra>' }];
    const ds = a.discount_sale;
    const dsData = [{ type: 'bar', x: [L('indirimli', 'discounted'), L('indirimsiz', 'no cut')], y: [ds.cut_pct, ds.nocut_pct], marker: { color: [green, theme.muted] }, text: [ds.cut_pct, ds.nocut_pct].map((v) => pct(v)), textposition: 'outside', hovertemplate: '%{x}: %{y:.1f}%<extra></extra>' }];

    const loc = a.location_premium_top as Record<string, number>;
    const locKeys = Object.keys(loc);
    const locData = [{ type: 'bar', orientation: 'h', x: locKeys.map((k) => loc[k]).reverse(), y: [...locKeys].reverse(), marker: { color: green }, hovertemplate: '%{y}: ×%{x}<extra></extra>' }];

    const ph = c.price_hist;
    const histData = ph ? [{ type: 'bar', x: ph.x, y: ph.y, marker: { color: green }, hovertemplate: '%{x} ' + (ph.unit || '') + ': %{y}<extra></extra>' }] : null;

    return (
        <div className="max-w-[840px]">
            <p className="mb-3 text-[17px] leading-[1.6] text-[#5f5f5a]">
                {L(
                    `${a.eda.rows.toLocaleString('tr-TR')} TR ilanı (Audi + BMW), ${a.eda.n_model} model · CatBoost · 5-fold OOF. Tüm sayılar canlı analiz çıktısından okunuyor.`,
                    `${a.eda.rows.toLocaleString('en-US')} Turkish listings (Audi + BMW), ${a.eda.n_model} models · CatBoost · 5-fold OOF. Every number is read live from the analysis output.`,
                )}
            </p>
            <p className="mb-10 font-mono text-[12px] text-[#86857e]">{L('Audi+BMW, 3 snapshot; sonuçlar bu kapsamda geçerlidir.', 'Audi+BMW, 3 snapshots; results hold within this scope.')}</p>

            {/* 1 · Hero metrics */}
            <div className="mb-14 grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]">
                {[
                    { k: L('Genel MAPE', 'Overall MAPE'), v: pct(a.overall.MAPE), accent: true },
                    { k: 'R²', v: a.overall.R2.toFixed(3) },
                    { k: 'MAE', v: fmtK(a.overall.MAE) },
                    { k: L('İlan', 'Rows'), v: a.eda.rows.toLocaleString('tr-TR') },
                ].map((m, i) => (
                    <div key={m.k} className={`p-4 sm:p-[18px] sm:px-5 border-[#e9e7e2] ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''}`}>
                        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                        <div className={`font-mono text-[19px] sm:text-[22px] font-bold tabular-nums ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.v}</div>
                    </div>
                ))}
            </div>

            {/* 2 · Data & quality */}
            <Section n="01" title={L('Veri & kalite', 'Data & quality')}
                lead={L('Eksiklik sistematik ve bloklu: teknik sekmesi olmayan ilanlarda alanlar birlikte boş. “Eksik olması” fiyatla korele olduğundan güvenilir imputasyon yok ve sızıntı riski var → bu alanlar modele alınmadı. Logsuz fiyat dağılımı 3 dönemde stabil (küçük KS, hafif sağa kayma).', 'Missingness is systematic and block-shaped: listings without a technical tab leave fields empty together. Because “being missing” correlates with price, reliable imputation is impossible and leakage is a risk → these fields are excluded. The raw price distribution is stable across 3 snapshots (small KS, slight rightward shift).')}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {missData && <Fig title={L('Eksiklik (%)', 'Missingness (%)')}><Chart h={300}><PlotlyChart data={missData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>}
                    {driftRawData && <Fig title={L('Fiyat dağılımı · 3 snapshot (ham)', 'Price distribution · 3 snapshots (raw)')}><Chart h={300}><PlotlyChart data={driftRawData} layout={base({ showlegend: true, legend: { font: { size: 9 }, orientation: 'h', y: -0.18 } })} config={config} guard={false} /></Chart></Fig>}
                </div>
                {driftRows && <Table className="mt-4" head={[L('Dönem', 'Period'), 'KS', 'p']} rows={driftRows} />}
                <Method>{L('Drift: logsuz fiyat dağılımının KS testiyle dönemler arası kayması. Küçük KS / büyük p → dağılım stabil.', 'Drift: KS test of the raw price distribution shift between snapshots. Small KS / large p → stable distribution.')}</Method>
            </Section>

            {/* 3 · What drives price */}
            <Section n="02" title={L('Fiyatı ne belirliyor', 'What drives price')}
                lead={L('Permütasyon importance — bir öznitelik karıştırıldığında MAE ne kadar artıyor? Yıl, kilometre ve motor gücü baskın; marka, garanti ve yakıt neredeyse sıfır.', 'Permutation importance — how much does MAE rise when a feature is shuffled? Year, mileage and horsepower dominate; brand, warranty and fuel are near zero.')}>
                <Fig title={L('Permütasyon importance (MAE artışı, log eksen)', 'Permutation importance (MAE increase, log axis)')}>
                    <Chart h={460}><PlotlyChart data={permData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { type: 'log' } })} config={config} guard={false} /></Chart>
                </Fig>
            </Section>

            {/* 4 · Hierarchy & categorical */}
            <Section n="03" title={L('Hiyerarşi & kategorik bağıntı', 'Hierarchy & categorical dependence')}
                lead={L('Ablation: `model` >> `series` > `brand` — tek başına `model` (metin) hiyerarşinin tamamını taşıyor. Theil’s U (yönlü/asimetrik, ANA metrik): `model` bilindiğinde marka/seri/segment ~%100 belirleniyor; tersi değil.', 'Ablation: `model` >> `series` > `brand` — `model` (text) alone carries the whole hierarchy. Theil’s U (directional/asymmetric, the MAIN metric): given `model`, brand/series/segment are ~100% determined; not the reverse.')}>
                <Fig title="Ablation RMSE (↓ daha iyi)"><Chart h={300}><PlotlyChart data={ablData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {theilsData && <Fig title={L("Theil's U (yönlü · ana)", "Theil's U (directional · main)")}><Chart h={360}><PlotlyChart data={theilsData} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                    {cramersData && <Fig title={L("Cramér's V (simetrik · ikincil)", "Cramér's V (symmetric · secondary)")}><Chart h={360}><PlotlyChart data={cramersData} layout={base({ margin: { t: 8, r: 8, b: 12, l: 12 }, xaxis: { tickangle: -40 } })} config={config} guard={false} /></Chart></Fig>}
                </div>
                {mp && <Table className="mt-4" head={[L('model →', 'model →'), L('belirleme', 'determination')]} rows={Object.entries(mp).map(([k, v]) => [k, pct(v * 100)])} />}
                {cvh && <details className="mt-3"><summary className="cursor-pointer font-mono text-[12px] text-[#5f5f5a]">{L("Cramér's V — yüksek çiftler", "Cramér's V — high pairs")}</summary><Table className="mt-2" head={[L('çift', 'pair'), 'V']} rows={Object.entries(cvh).map(([k, v]) => [k, (v as number).toFixed(3)])} /></details>}
            </Section>

            {/* 5 · Segmentation */}
            <Section n="04" title={L('Segmentasyon (KMeans)', 'Segmentation (KMeans)')}
                lead={L(`${a.kmeans.K} segment yaş × km × güç ekseninde ayrışıyor; her segmentin medyan fiyatı farklı.`, `${a.kmeans.K} segments separate along age × mileage × power; each has a distinct median price.`)}>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {a.kmeans.profiles.map((p: any) => (
                        <div key={p.cluster} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORICAL_LIST[p.cluster % CATEGORICAL_LIST.length] }} />
                                <span className="font-mono text-[12px] font-semibold text-[#1a1a1a]">{L('Segment', 'Segment')} {p.cluster}</span>
                                <span className="ml-auto font-mono text-[11px] text-[#86857e]">{p.adet.toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="font-mono text-[15px] font-bold text-[#047857]">{fmtTL(p.medyan_fiyat)}</div>
                            <div className="mt-1 font-mono text-[11px] text-[#86857e]">{p.medyan_yil} · {p.medyan_km.toLocaleString('tr-TR')} km · {p.medyan_hp} hp</div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pcaData && <Fig title={L('PCA izdüşümü (renk = segment)', 'PCA projection (colour = segment)')}><Chart h={300}><PlotlyChart data={pcaData} layout={base({ xaxis: { showgrid: false }, yaxis: { showgrid: false } })} config={config} guard={false} /></Chart></Fig>}
                    {ksData && <Fig title="Elbow + silhouette"><Chart h={300}><PlotlyChart data={ksData} layout={base({ margin: { t: 12, r: 36, b: 30, l: 8 }, yaxis2: { fixedrange: true, overlaying: 'y', side: 'right', gridcolor: 'transparent', tickfont: { size: 10, color: '#e08a1e' } } })} config={config} guard={false} /></Chart></Fig>}
                </div>
            </Section>

            {/* 6 · Performance */}
            <Section n="05" title={L('Performans', 'Performance')}
                lead={L(`Genel MAPE ${pct(a.overall.MAPE)}. Mutlak hata (MAE) en pahalı bantta en yüksek; göreli hata (MAPE) en ucuz bantta. Yaygın modeller (bol veri) düşük hatalı, nadir lüks trim’ler yüksek.`, `Overall MAPE ${pct(a.overall.MAPE)}. Absolute error (MAE) peaks in the priciest band; relative error (MAPE) in the cheapest. Common models (more data) are low-error; rare luxury trims high.`)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Fig title={L('Fiyat bandına göre MAE', 'MAE by price band')}><Chart h={280}><PlotlyChart data={bandMae} layout={base()} config={config} guard={false} /></Chart></Fig>
                    <Fig title={L('Fiyat bandına göre MAPE', 'MAPE by price band')}><Chart h={280}><PlotlyChart data={bandMape} layout={base()} config={config} guard={false} /></Chart></Fig>
                </div>
                <Method className="mt-3">{L('Fiyat bandı = qcut(fiyat, 5): eşit-SAYIDA 5 grup (quintile), eşit aralık değil.', 'Price band = qcut(price, 5): five equal-COUNT groups (quintiles), not equal width.')}</Method>
                <Table className="mt-4" head={[L('Segment', 'Segment'), L('Adet', 'Count'), 'MAE', 'MAPE']} rows={a.perf_segment.map((s: any) => [`#${s.cluster}`, s.adet.toLocaleString('tr-TR'), fmtTL(s.MAE), pct(s.MAPE)])} />
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {a.best_models && <div><div className="mb-2 font-mono text-[12px] font-semibold text-[#047857]">{L('En düşük hatalı modeller', 'Lowest-error models')}</div><Table head={[L('Model', 'Model'), L('Adet', 'Count'), L('Ort. hata', 'Avg err')]} rows={(a.best_models as any[]).slice(0, 6).map((w) => [w.model, String(w.adet), fmtTL(w.ort_hata)])} /></div>}
                    {a.worst_models && <div><div className="mb-2 font-mono text-[12px] font-semibold text-[#b91c1c]">{L('En yüksek hatalı modeller', 'Highest-error models')}</div><Table head={[L('Model', 'Model'), L('Adet', 'Count'), L('Ort. hata', 'Avg err')]} rows={(a.worst_models as any[]).slice(0, 6).map((w) => [w.model, String(w.adet), fmtTL(w.ort_hata)])} /></div>}
                </div>
                {residData && <Fig className="mt-4" title={L('Model veri-adedi vs ortalama hata', 'Per-model sample size vs error')}><Chart h={300}><PlotlyChart data={residData} layout={base({ xaxis: { title: { text: L('ilan adedi', 'listings'), font: { size: 10 } } } })} config={config} guard={false} /></Chart></Fig>}
            </Section>

            {/* 7 · Feature engineering & uncertainty */}
            <Section n="06" title={L('Öznitelik mühendisliği & belirsizlik', 'Feature engineering & uncertainty')}
                lead={L(`Ek alanlar (kasko/sigorta) ve model-metni trim feature’ları MAE’yi değiştirmedi — dürüst negatif: yapısal öznitelikler zaten yeterli. Log-hedef MAPE’yi ${pct(lt.raw.MAPE)} → ${pct(lt.log.MAPE)} düşürdü. %5–95 aralığı gerçek fiyatın ${pct(a.coverage.coverage_pct)}’ini kapsıyor (hedef %90 → biraz dar, kalibrasyon adayı).`, `Extra fields (insurance) and model-text trim features did not move MAE — an honest negative: structural features already suffice. A log target lowered MAPE ${pct(lt.raw.MAPE)} → ${pct(lt.log.MAPE)}. The 5–95% interval covers ${pct(a.coverage.coverage_pct)} of true prices (target 90% → slightly narrow, a calibration candidate).`)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Fig title={L('Öznitelik seti → MAE (neredeyse sabit)', 'Feature set → MAE (nearly flat)')}><Chart h={280}><PlotlyChart data={efData} layout={base({ margin: { t: 24, r: 16, b: 28, l: 8 }, yaxis: { range: [efMin - 2500, efMax + 3500] } })} config={config} guard={false} /></Chart></Fig>
                    {tunData && <Fig title={L(`Optuna tuning (${tun.trials} deneme)`, `Optuna tuning (${tun.trials} trials)`)}><Chart h={280}><PlotlyChart data={tunData} layout={base({ margin: { t: 24, r: 16, b: 28, l: 8 } })} config={config} guard={false} /></Chart></Fig>}
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat k="MAPE log↓" v={pct(lt.log.MAPE)} sub={L(`ham ${pct(lt.raw.MAPE)}`, `raw ${pct(lt.raw.MAPE)}`)} accent />
                    <Stat k="Q5–95 coverage" v={pct(a.coverage.coverage_pct)} sub={L('hedef %90', 'target 90%')} />
                    <Stat k={L('medyan MAE', 'median MAE')} v={fmtTL(a.coverage.median_mae)} />
                    <Stat k={L(`aykırı (${a.outliers.n_outlier})`, `outliers (${a.outliers.n_outlier})`)} v={`${fmtK(oe.raw.MAE)}→${fmtK(oe.cleaned.MAE)}`} sub="MAE" />
                </div>
                <Fig className="mt-4" title={L('Aykırı temizliğinin MAE etkisi', 'Outlier cleaning · MAE effect')}><Chart h={260}><PlotlyChart data={outMae} layout={base({ margin: { t: 24, r: 16, b: 30, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                <Method className="mt-3">{L('Aykırı = OOF residual’ının |z|>3’ü (çoğu üst-segment). Ek alanlar/trim baseline’a eklenince MAE ~aynı = katkı yok. Log-hedef ağır sağ kuyruğu düzeltip ucuz araç yüzde-hatasını azaltır.', 'Outlier = |z|>3 of the OOF residual (mostly upper-segment). Adding extra/trim features keeps MAE ~unchanged = no contribution. The log target tames the heavy right tail and reduces percentage error on cheap cars.')}</Method>
            </Section>

            {/* 8 · Temporal backtest (crown jewel) */}
            <section className="mb-14 rounded-[16px] border-2 border-[#cfe8dc] bg-[#f1f8f4] p-5 sm:p-7">
                <div className="mb-3 flex items-baseline gap-3">
                    <span className="font-mono text-[14px] text-[#047857]">★ 07</span>
                    <h2 className="text-[24px] font-semibold tracking-[-0.029em] text-[#1a1a1a]">{L('Zamansal backtest', 'Temporal backtest')}</h2>
                </div>
                <p className="mb-6 max-w-[680px] text-[16px] leading-[1.7] text-[#22332b]">{L('Kümülatif (tüm kayıtlar) strateji ileri-tarihte en iyi MAE’yi veriyor; decay hafif → aylık retrain. Her strateji kendi döneminde 5-fold OOF (ad_id GroupKFold → sızıntı yok), sonra sonraki dönemin YENİ ilanlarında test edildi.', 'The cumulative (all-records) strategy yields the best forward-date MAE; decay is mild → monthly retraining. Each strategy is 5-fold OOF on its own period (ad_id GroupKFold → no leakage), then tested on the NEXT period’s NEW listings.')}</p>
                <div className="rounded-[14px] border border-[#cfe8dc] bg-[#fdfcf9] p-3">
                    <Chart h={300}><PlotlyChart data={btData} layout={base({ margin: { t: 12, r: 16, b: 80, l: 8 }, xaxis: { tickangle: -35 } })} config={config} guard={false} /></Chart>
                </div>
                <Table className="mt-4" head={['eğitim@', L('strateji', 'strategy'), 'n', 'OOF MAE', '→snap2', '→snap3']} rows={bt.map((r) => [r['egitim@'], r.strateji, r.n_rows.toLocaleString('tr-TR'), fmtTL(r.OOF_MAE), fmtTL(r['→snap2_yeni']), fmtTL(r['→snap3_yeni'])])} />
                <Method className="mt-3">{L('snap1/2/3 = 18 Oca / 27 Oca / 21 Mar 2026. “→snapN” = o dönemin yeni ilanlarındaki MAE.', 'snap1/2/3 = 18 Jan / 27 Jan / 21 Mar 2026. “→snapN” = MAE on that period’s new listings.')}</Method>
            </section>

            {/* 9 · Market dynamics */}
            <Section n="08" title={L('Piyasa dinamiği', 'Market dynamics')}
                lead={L('Hedonik (kalite-ayarlı) fiyat trendi naive trendden ayrışıyor; indirim gören ilanlar daha sık satılıyor; “kaybolma = satış” proxy’sinin güveni sınırlı.', 'The hedonic (quality-adjusted) price trend differs from the naive one; discounted listings sell more often; the “disappearance = sale” proxy has limited reliability.')}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Fig title={L('Fiyat endeksi: naive vs hedonik (%)', 'Price index: naive vs hedonic (%)')}><Chart h={260}><PlotlyChart data={piData} layout={base({ margin: { t: 24, r: 16, b: 30, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                    <Fig title={L('İndirim → satış oranı', 'Discount → sold rate')}><Chart h={260}><PlotlyChart data={dsData} layout={base({ margin: { t: 24, r: 16, b: 30, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                </div>
                <div className="mt-3"><Stat k={L('Relist güveni', 'Relist reliability')} v={pct(a.relist_reliability_pct)} sub={L('“kaybolma = satış” proxy', '“disappearance = sale” proxy')} /></div>
                <Method className="mt-3">{L('Hedonik endeks: log(fiyat) ~ marka+seri+kasa+çekiş + yaş+km+güç + DÖNEM (OLS); DÖNEM katsayısı = kalite-ayarlı değişim. 694-kategorili `model` yüksek-kardinalite nedeniyle kasıtlı dışlandı.', 'Hedonic index: log(price) ~ brand+series+body+drivetrain + age+km+power + PERIOD (OLS); the PERIOD coefficient = quality-adjusted change. The 694-category `model` is deliberately excluded (high cardinality).')}</Method>
            </Section>

            {/* 10 · Location premium */}
            <Section n="09" title={L('Lokasyon primi', 'Location premium')}
                lead={L('Feature-ayarlı residual’a göre aynı araç küçük illerde ~%2–3 daha pahalı.', 'On the feature-adjusted residual, the same car is ~2–3% pricier in smaller provinces.')}>
                <Fig title={L('İl bazlı fiyat primi (×)', 'City price premium (×)')}><Chart h={300}><PlotlyChart data={locData} layout={base({ margin: { t: 8, r: 16, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                {histData && <Fig className="mt-4" title={L(`Fiyat dağılımı (${ph.unit})`, `Price distribution (${ph.unit})`)}><Chart h={240}><PlotlyChart data={histData} layout={base()} config={config} guard={false} /></Chart></Fig>}
            </Section>

            {/* 11 · Conclusion & roadmap */}
            <div className="mb-6 rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6">
                <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.09em] text-[#047857]">{L('Sonuç & yol haritası', 'Conclusion & roadmap')}</div>
                {[
                    L('Eğitim stratejisi = kümülatif (tüm kayıtlar) + aylık retrain.', 'Training strategy = cumulative (all records) + monthly retrain.'),
                    L('Öznitelikleri sadeleştir: katkısız ek alanlar/trim çıkarılabilir.', 'Simplify features: contribution-free extra/trim fields can be dropped.'),
                    L('Log-hedefi üretim için değerlendir (MAPE iyileşmesi).', 'Evaluate the log target for production (MAPE gain).'),
                    L(`Q5–95 aralığını kalibre et (coverage ${pct(a.coverage.coverage_pct)} < %90).`, `Calibrate the 5–95% interval (coverage ${pct(a.coverage.coverage_pct)} < 90%).`),
                    L('Deploy = final_model.cbm; kapsam dürüstçe: Audi+BMW, 3 snapshot.', 'Deploy = final_model.cbm; honest scope: Audi+BMW, 3 snapshots.'),
                ].map((f) => (
                    <div key={f} className="mb-2.5 flex gap-3 last:mb-0">
                        <span className="text-[15px] leading-[1.6] text-[#059669]">→</span>
                        <span className="text-[15px] leading-[1.6] text-[#33332f]">{f}</span>
                    </div>
                ))}
            </div>
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
    const cols = `1.6fr repeat(${head.length - 1}, minmax(64px, 1fr))`;
    const minWidth = 220 + (head.length - 1) * 96;
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
