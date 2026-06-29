"use client";

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Activity, Car } from 'lucide-react';
import { ChartPanel } from '../_charts/ChartPanel';
import EChartsCharts, { type ChartLabels } from '../_charts/EChartsCharts';
import { transform } from '../_charts/transform';
import { makeHybridTheme, GREEN_RAMP, type RawDashboardData } from '../_charts/types';
import { useLang } from './i18n';

// Bin scatter points (km × price) into a density grid for the heatmap.
function buildDensity(raw: RawDashboardData) {
    const kmBin = 25000, kmMax = 500000;
    const pBin = 500000, pMax = 6000000;
    const nx = kmMax / kmBin, ny = pMax / pBin;
    const grid = new Map<string, number>();
    let max = 0;
    for (const pts of Object.values(raw.scatterData || {})) {
        for (const [km, price] of pts as number[][]) {
            if (km < 0 || km >= kmMax || price < 0 || price >= pMax) continue;
            const xi = Math.floor(km / kmBin), yi = Math.floor(price / pBin);
            const key = `${xi},${yi}`;
            const v = (grid.get(key) || 0) + 1;
            grid.set(key, v);
            if (v > max) max = v;
        }
    }
    const xLabels = Array.from({ length: nx }, (_, i) => `${(i * kmBin) / 1000}k`);
    const yLabels = Array.from({ length: ny }, (_, i) => `${i * (pBin / 1e6)}M`);
    const data: [number, number, number][] = [];
    grid.forEach((v, key) => {
        const [xi, yi] = key.split(',').map(Number);
        data.push([xi, yi, v]);
    });
    return { xLabels, yLabels, data, max };
}

function brandAverages(raw: RawDashboardData) {
    if (!raw.boxplotData) return [];
    return Object.entries(raw.boxplotData)
        .map(([brand, prices]) => ({ brand, avg: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0 }))
        .sort((a, b) => b.avg - a.avg);
}

export default function EChartsDashboard({ data: raw }: { data: RawDashboardData }) {
    const { resolvedTheme } = useTheme();
    const { t } = useLang();
    const isDark = resolvedTheme === 'dark';
    const theme = useMemo(() => makeHybridTheme(isDark), [isDark]);

    const chartLabels: ChartLabels = {
        priceByYear: [t('chart.priceByYear'), t('chart.priceByYear.s')],
        fuel: [t('chart.fuel'), t('chart.fuel.s')],
        brandRange: [t('chart.brandRange'), t('chart.brandRange.s')],
        scatter: [t('chart.scatter'), t('chart.scatter.s')],
    };

    const chartData = useMemo(() => transform(raw), [raw]);
    const density = useMemo(() => buildDensity(raw), [raw]);
    const brands = useMemo(() => brandAverages(raw), [raw]);

    const axis = {
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 },
        splitLine: { show: false },
    };

    const heatOption = {
        grid: { top: 16, right: 16, bottom: 50, left: 50 },
        tooltip: {
            position: 'top',
            renderMode: 'richText',
            backgroundColor: theme.surface, borderColor: '#e4e2dd', borderWidth: 1,
            padding: [9, 13],
            textStyle: { color: theme.text, fontFamily: theme.fontSans, fontSize: 12 },
            transitionDuration: 0,
            formatter: (p: any) => `${density.xLabels[p.value[0]]} km · ₺${density.yLabels[p.value[1]]}\n${p.value[2]} listings`,
        },
        xAxis: { type: 'category', data: density.xLabels, ...axis, name: 'km', nameTextStyle: { color: theme.muted, fontSize: 9 }, axisLabel: { ...axis.axisLabel, rotate: 35 } },
        yAxis: { type: 'category', data: density.yLabels, ...axis, name: '₺', nameTextStyle: { color: theme.muted, fontSize: 9 } },
        visualMap: {
            min: 0, max: density.max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
            itemWidth: 10, itemHeight: 80, textStyle: { color: theme.muted, fontSize: 9, fontFamily: theme.fontMono },
            inRange: { color: GREEN_RAMP },
        },
        series: [{ type: 'heatmap', data: density.data, emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } } }],
    };

    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const kpis = [
        { icon: LayoutDashboard, label: t('dash.totalListings'), value: raw.kpi?.total?.toLocaleString() ?? '–' },
        { icon: Activity, label: t('dash.avgPrice'), value: raw.kpi?.avgPrice ? `₺${(raw.kpi.avgPrice / 1e6).toFixed(2)}M` : '–', accent: true },
        ...brands.slice(0, 2).map((b) => ({ icon: Car, label: `${cap(b.brand)} ${t('dash.avg')}`, value: `₺${(b.avg / 1e6).toFixed(2)}M` })),
    ];

    // car top-view damage grid (from damageChartData, Turkish part names match backend)
    const damageLayout: ({ part: string; label: string } | null)[][] = [
        [{ part: 'Sol Ön Çamurluk', label: 'L.F. Wing' }, { part: 'Kaput', label: 'Hood' }, { part: 'Sağ Ön Çamurluk', label: 'R.F. Wing' }],
        [{ part: 'Sol Ön Kapı', label: 'L.F. Door' }, { part: 'Tavan', label: 'Roof' }, { part: 'Sağ Ön Kapı', label: 'R.F. Door' }],
        [{ part: 'Sol Arka Kapı', label: 'L.R. Door' }, null, { part: 'Sağ Arka Kapı', label: 'R.R. Door' }],
        [{ part: 'Sol Arka Çamurluk', label: 'L.R. Wing' }, { part: 'Bagaj', label: 'Trunk' }, { part: 'Sağ Arka Çamurluk', label: 'R.R. Wing' }],
    ];
    const dmgVal = (part: string) => raw.damageChartData?.find((d) => d.part === part)?.value ?? 0;
    const dmgMax = Math.max(1, ...((raw.damageChartData || []).map((d) => d.value)));

    return (
        <div>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[18px]">
                {kpis.map((k) => (
                    <div key={k.label} className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-[18px] px-5 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <div className="mb-3.5 flex items-center gap-2 text-[13px] font-medium text-[#5f5f5a]">
                            <k.icon size={14} className="text-[#047857]" />{k.label}
                        </div>
                        <div className={`font-mono text-[28px] font-bold tracking-[-0.035em] tabular-nums ${k.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* base 4 charts */}
            <EChartsCharts data={chartData} theme={theme} labels={chartLabels} />

            {/* heatmaps */}
            <div className="mt-4 grid lg:grid-cols-2 gap-4">
                <ChartPanel theme={theme} title={t('chart.density')} subtitle={t('chart.density.s')} height={360}>
                    <ReactECharts option={heatOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} notMerge />
                </ChartPanel>

                <ChartPanel theme={theme} title={t('chart.damage')} subtitle={t('chart.damage.s')} height={360}>
                    <div className="flex h-full flex-col items-center justify-center pb-1">
                        <div className="flex flex-col gap-3">
                            {damageLayout.map((row, ri) => (
                                <div key={ri} className="flex justify-center gap-3">
                                    {row.map((cell, ci) => {
                                        if (!cell) return <div key={ci} className="w-20 h-[56px]" />;
                                        const val = dmgVal(cell.part);
                                        const tIntensity = dmgMax > 0 ? val / dmgMax : 0;
                                        // red ramp #fdeaea → #dc2626 (design 2)
                                        const lerp = (a: number, b: number) => Math.round(a + (b - a) * tIntensity);
                                        const bg = val > 0 ? `rgb(${lerp(253, 220)}, ${lerp(234, 38)}, ${lerp(234, 38)})` : '#f3f1ec';
                                        const fg = tIntensity > 0.55 ? '#fff' : (val > 0 ? '#b91c1c' : '#9a9a92');
                                        return (
                                            <div
                                                key={ci}
                                                title={`${cell.label}: ${val.toLocaleString()}`}
                                                className="flex w-20 h-[56px] flex-col items-center justify-center gap-0.5 rounded-[12px] text-center transition-transform hover:scale-105"
                                                style={{ background: bg }}
                                            >
                                                <span className="text-[10px] font-medium leading-tight opacity-90" style={{ color: fg }}>{cell.label}</span>
                                                {val > 0 && <span className="font-mono text-[15px] font-bold tracking-[-0.02em]" style={{ color: fg }}>{val > 999 ? `${(val / 1000).toFixed(1)}k` : val}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        {/* legend */}
                        <div className="mt-[26px] flex items-center justify-center gap-2.5">
                            <span className="font-mono text-[10px] text-[#86857e]">low</span>
                            <div className="h-2 w-[130px] rounded-[5px]" style={{ background: 'linear-gradient(90deg,#fdeaea,#f4a8a8,#dc2626)' }} />
                            <span className="font-mono text-[10px] text-[#86857e]">high</span>
                            <span className="ml-2.5 font-mono text-[10px] text-[#9a9a92]">▢ no data</span>
                        </div>
                    </div>
                </ChartPanel>
            </div>
        </div>
    );
}
