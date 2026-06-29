"use client";

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme } from '../../_charts/types';
import { useLang } from '../i18n';
import { PHASES, LOFO, ABLATION, OUTLIERS, CRAMERS, FOLDS, FINAL, FINDINGS } from './reportContent';

export default function FinalReportNative({ eda }: { eda: any }) {
    const { resolvedTheme } = useTheme();
    const { lang } = useLang();
    const dev = resolvedTheme === 'dark';
    const theme = useMemo(() => makeHybridTheme(dev), [dev]);
    const config = { displayModeBar: false, responsive: true };

    const base = (over: any = {}) => ({
        margin: { t: 10, r: 14, b: 40, l: 50 },
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        font: { family: theme.fontSans, size: 11, color: theme.muted },
        showlegend: false,
        hoverlabel: { bgcolor: theme.surface, font: { color: theme.text } },
        xaxis: { gridcolor: theme.grid, zeroline: false, linecolor: theme.grid },
        yaxis: { gridcolor: theme.grid, zeroline: false, linecolor: theme.grid },
        ...over,
    });

    function buildChart(id: string): { data: any[]; layout: any } | null {
        switch (id) {
            case 'priceDist':
                return { data: [{ type: 'bar', x: eda.priceHistogram.labels, y: eda.priceHistogram.counts, marker: { color: theme.accent }, hovertemplate: '%{x}M: %{y}<extra></extra>' }], layout: base() };
            case 'corr':
                return {
                    data: [{ type: 'heatmap', z: eda.corrMatrix.z, x: eda.corrMatrix.labels, y: eda.corrMatrix.labels, zmin: -1, zmax: 1, colorscale: dev ? [[0, '#ef4444'], [0.5, '#0a0e14'], [1, '#10b981']] : [[0, '#b91c1c'], [0.5, '#f5f5f5'], [1, '#047857']], showscale: true, hovertemplate: '%{y} · %{x}: %{z}<extra></extra>', colorbar: { thickness: 8, tickfont: { size: 9 } } }],
                    layout: base({ margin: { t: 10, r: 10, b: 50, l: 60 } }),
                };
            case 'damage':
                return { data: [{ type: 'bar', x: eda.damageImpact.labels, y: eda.damageImpact.avg, marker: { color: [theme.palette[0], '#ef4444'] }, text: eda.damageImpact.avg.map((v: number) => `₺${v}M`), textposition: 'auto', hovertemplate: '%{x}: ₺%{y}M<extra></extra>' }], layout: base() };
            case 'cramers':
                return {
                    data: [{ type: 'bar', orientation: 'h', y: [...CRAMERS].reverse().map((d) => d.p), x: [...CRAMERS].reverse().map((d) => d.v), marker: { color: theme.accent }, text: [...CRAMERS].reverse().map((d) => d.v.toFixed(3)), textposition: 'auto', hovertemplate: '%{y}: %{x}<extra></extra>' }],
                    layout: base({ margin: { t: 10, r: 14, b: 36, l: 180 }, xaxis: { gridcolor: theme.grid, zeroline: false, range: [0, 1.05] } }),
                };
            case 'ablation':
                return {
                    data: [{ type: 'bar', orientation: 'h', y: [...ABLATION].reverse().map((d) => d.c), x: [...ABLATION].reverse().map((d) => d.v), marker: { color: theme.accent }, text: [...ABLATION].reverse().map((d) => d.v.toLocaleString()), textposition: 'auto', hovertemplate: '%{y}: %{x:,} RMSE<extra></extra>' }],
                    layout: base({ margin: { t: 10, r: 14, b: 36, l: 175 }, xaxis: { gridcolor: theme.grid, zeroline: false, range: [188000, 193000] } }),
                };
            case 'outliers':
                return { data: [{ type: 'bar', x: OUTLIERS.map((d) => d.m), y: OUTLIERS.map((d) => d.v), marker: { color: [theme.palette[3], theme.palette[4], '#ef4444'] }, text: OUTLIERS.map((d) => d.v), textposition: 'auto', hovertemplate: '%{x}: %{y}<extra></extra>' }], layout: base() };
            case 'lofo': {
                const sorted = [...LOFO].sort((a, b) => a.v - b.v); // ascending → most important on top
                return {
                    data: [{ type: 'bar', orientation: 'h', y: sorted.map((d) => d.f), x: sorted.map((d) => d.v), marker: { color: sorted.map((d) => (d.v >= 0 ? theme.accent : '#ef4444')) }, hovertemplate: '%{y}: %{x:+,} RMSE<extra></extra>' }],
                    layout: base({ height: undefined, margin: { t: 10, r: 14, b: 36, l: 130 }, xaxis: { gridcolor: theme.grid, zeroline: true, zerolinecolor: theme.muted } }),
                };
            }
            case 'folds':
                return { data: [{ type: 'bar', x: FOLDS.map((_, i) => `Fold ${i + 1}`), y: FOLDS, marker: { color: theme.accent }, text: FOLDS.map((v) => `${(v / 1000).toFixed(0)}k`), textposition: 'auto', hovertemplate: '%{x}: %{y:,} ₺<extra></extra>' }], layout: base({ yaxis: { gridcolor: theme.grid, zeroline: false, range: [130000, 146000] } }) };
            default:
                return null;
        }
    }

    const bestAbl = Math.min(...ABLATION.map((d) => d.v));

    return (
        <div className="max-w-[760px]">
            <p className="mb-12 text-[17px] leading-[1.6] text-[#5f5f5a]">
                {lang === 'tr'
                    ? 'Aşağıda, eğitim defterindeki uçtan uca analiz — gerçek sonuç sayılarıyla — sayfada yerel olarak, etkileşimli Plotly grafikleriyle yeniden çiziliyor.'
                    : 'Below is the end-to-end analysis from the training notebook — with its real result numbers — rebuilt natively on the page with interactive Plotly charts.'}
            </p>

            {PHASES.map((ph) => {
                const chart = ph.chart ? buildChart(ph.chart) : null;
                const tall = ph.chart === 'lofo';
                return (
                    <section key={ph.id} className="mb-14">
                        <div className="mb-3 flex items-baseline gap-3">
                            <span className="font-mono text-[14px] text-[#047857]">{ph.n}</span>
                            <h2 className="text-[24px] font-semibold tracking-[-0.029em] text-[#1a1a1a]">{ph.title[lang]}</h2>
                        </div>
                        <p className="mb-6 text-[16px] leading-[1.7] text-[#33332f]">{ph.body[lang]}</p>

                        {/* ablation comparison table (design 2 · real CV RMSE) */}
                        {ph.id === 'baseline' && (
                            <div className="mb-6 overflow-hidden rounded-[12px] border border-[#e4e2dd]">
                                <div className="grid grid-cols-[1.6fr_1fr] bg-[#f1efe9] px-[18px] py-[11px] font-mono text-[10px] uppercase tracking-[0.05em] text-[#5f5f5a]">
                                    <span>{lang === 'tr' ? 'Yıl + kasa kodlaması' : 'Year + body encoding'}</span>
                                    <span className="text-right">CV RMSE (₺)</span>
                                </div>
                                {ABLATION.map((m) => {
                                    const best = m.v === bestAbl;
                                    return (
                                        <div key={m.c} className={`grid grid-cols-[1.6fr_1fr] items-center border-t border-[#ece9e3] px-[18px] py-[13px] ${best ? 'bg-[#f1f8f4]' : 'bg-[#fdfcf9]'}`}>
                                            <span className={`font-mono text-[13px] text-[#1a1a1a] ${best ? 'font-semibold' : 'font-medium'}`}>{m.c}{best ? '  ★' : ''}</span>
                                            <span className={`text-right font-mono text-[13px] tabular-nums ${best ? 'font-semibold text-[#047857]' : 'text-[#5f5f5a]'}`}>{m.v.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {ph.id === 'final' && (
                            <div className="mb-5 grid grid-cols-3 gap-3">
                                {[
                                    { k: 'R²', v: FINAL.r2 },
                                    { k: 'MAE', v: `${FINAL.mae} ₺` },
                                    { k: 'CV RMSE', v: `${FINAL.cvRmse} ₺` },
                                ].map((m) => (
                                    <div key={m.k} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4 text-center shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                                        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                                        <div className="font-mono text-[20px] font-bold tabular-nums text-[#047857]">{m.v}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {chart && (
                            <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-4 shadow-[0_1px_3px_rgba(40,40,30,0.05)]" style={{ height: tall ? 520 : 340 }}>
                                <PlotlyChart data={chart.data} layout={chart.layout} config={config} />
                            </div>
                        )}
                    </section>
                );
            })}

            {/* key findings (design 2 · real numbers) */}
            <div className="mt-2 rounded-[12px] border border-[#cfe8dc] bg-[#f1f8f4] p-6">
                <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.09em] text-[#047857]">
                    {lang === 'tr' ? 'Öne çıkan bulgular' : 'Key findings'}
                </div>
                {FINDINGS.map((f) => (
                    <div key={f.en} className="mb-3 flex gap-3 last:mb-0">
                        <span className="text-[15px] leading-[1.6] text-[#059669]">→</span>
                        <span className="text-[15px] leading-[1.6] text-[#22332b]">{f[lang]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
