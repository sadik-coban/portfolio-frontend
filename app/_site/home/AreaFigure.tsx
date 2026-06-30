"use client";

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const ACCENT = '#059669';
const ACCENT_DARK = '#10b981';

export function AreaFigure({
    data,
    variant = 'hero',
}: {
    data: { year: number; price: number }[]; // price in ₺ millions
    variant?: 'hero' | 'thumb';
}) {
    const dark = false;
    const isThumb = variant === 'thumb';
    const accent = dark ? ACCENT_DARK : ACCENT;

    const option = useMemo(() => ({
        animationDuration: 1400,
        grid: isThumb ? { left: 0, right: 6, top: 8, bottom: 2 } : { left: 2, right: 8, top: 14, bottom: 24 },
        tooltip: isThumb ? { show: false } : {
            trigger: 'axis',
            backgroundColor: dark ? '#0f172a' : '#fdfcf9',
            borderColor: dark ? 'rgba(255,255,255,0.1)' : '#e4e2dd',
            borderWidth: 1, padding: [8, 12],
            textStyle: { color: dark ? '#e2e8f0' : '#1a1a1a', fontFamily: 'var(--font-geist-sans)' },
            formatter: (p: any[]) => `<span style="font-family:var(--font-geist-mono);font-size:11px;color:#86857e">${p[0].axisValue}</span><br/><span style="font-family:var(--font-geist-mono);font-weight:600;color:${accent}">₺${Number(p[0].data).toFixed(2)}M</span>`,
        },
        xAxis: {
            type: 'category', data: data.map((d) => d.year), boundaryGap: false,
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: {
                show: !isThumb, color: dark ? '#64748b' : '#9a9a92', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11,
                interval: (_i: number, v: string) => v === String(data[0]?.year) || v === String(data[data.length - 1]?.year),
            },
        },
        yAxis: { type: 'value', show: false, scale: true },
        series: [{
            type: 'line', smooth: true, showSymbol: false, data: data.map((d) => d.price),
            lineStyle: { color: accent, width: isThumb ? 2.2 : 2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: dark ? 'rgba(16,185,129,0.18)' : 'rgba(5,150,105,0.14)' }, { offset: 1, color: 'rgba(5,150,105,0)' }] } },
            markPoint: { symbol: 'circle', symbolSize: isThumb ? 7 : 8, data: [{ coord: [data.length - 1, data[data.length - 1]?.price] }], itemStyle: { color: accent }, label: { show: false } },
        }],
    }), [data, isThumb, dark, accent]);

    return <ReactECharts option={option} opts={{ renderer: 'svg' }} style={{ width: '100%', height: isThumb ? '100%' : 200 }} notMerge />;
}

const GRID: number[][] = [
    [0, 0, 2, 3, 3, 2, 1, 0, 0, 0],
    [0, 2, 3, 4, 4, 3, 2, 1, 0, 0],
    [1, 3, 4, 5, 5, 4, 3, 2, 1, 0],
    [0, 2, 3, 4, 5, 4, 3, 2, 1, 0],
    [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
];
const OPACITY = [0, 0.16, 0.3, 0.48, 0.66, 0.9];

export function Choropleth() {
    const CELL = 26, PITCH = 30, PAD = 12;
    const cols = Math.max(...GRID.map((r) => r.length));
    const width = PAD * 2 + cols * PITCH - (PITCH - CELL);
    const height = PAD * 2 + GRID.length * PITCH - (PITCH - CELL);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-[104px] w-auto" role="img" aria-label="choropleth preview">
            {GRID.flatMap((row, r) => row.map((lvl, c) => lvl > 0 ? (
                <rect key={`${r}-${c}`} x={PAD + c * PITCH} y={PAD + r * PITCH} width={CELL} height={CELL} rx={3} fill="#059669" fillOpacity={OPACITY[lvl]} />
            ) : null))}
        </svg>
    );
}
