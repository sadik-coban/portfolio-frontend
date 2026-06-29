"use client";

import ReactECharts from 'echarts-for-react';
import { ChartPanel } from './ChartPanel';
import type { ChartData } from './transform';
import type { ChartTheme } from './types';

export interface ChartLabels {
    priceByYear: [string, string];
    fuel: [string, string];
    brandRange: [string, string];
    scatter: [string, string];
}
const DEFAULT_LABELS: ChartLabels = {
    priceByYear: ['Price by Year', 'average · 2005–2025'],
    fuel: ['Fuel Distribution', 'market share'],
    brandRange: ['Price Range by Brand', 'Q1 · median · Q3'],
    scatter: ['Mileage vs Price', 'sampled market depth'],
};

export default function EChartsCharts({ data, theme, labels = DEFAULT_LABELS }: { data: ChartData; theme: ChartTheme; labels?: ChartLabels }) {
    const axisCommon = {
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 },
        splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
    };
    const tooltip = {
        // richText draws the tooltip inside the canvas at device-pixel ratio → crisp text,
        // no HTML-overlay transform blur. Trade-off: no HTML, so formatters use \n not <br/>.
        renderMode: 'richText' as const,
        backgroundColor: theme.surface,
        borderColor: '#e4e2dd',
        borderWidth: 1,
        padding: [9, 13] as [number, number],
        textStyle: { color: theme.text, fontFamily: theme.fontSans, fontSize: 12 },
        transitionDuration: 0,
    };

    // Price by year
    const lineOption = {
        grid: { top: 16, right: 16, bottom: 28, left: 44 },
        tooltip: { trigger: 'axis', ...tooltip, valueFormatter: (v: number) => `₺${(v / 1e6).toFixed(2)}M` },
        xAxis: { type: 'category', data: data.line.map((d) => d.year), ...axisCommon, boundaryGap: false },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: [{
            type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
            data: data.line.map((d) => d.price),
            lineStyle: { color: theme.accent, width: 3 },
            itemStyle: { color: theme.accent },
            areaStyle: { color: theme.accent, opacity: 0.1 },
        }],
    };

    // Brand range -> ECharts candlestick-like custom via boxplot-ish bars
    const brandRangeOption = {
        grid: { top: 16, right: 20, bottom: 28, left: 90 },
        tooltip: {
            trigger: 'item', ...tooltip,
            formatter: (p: any) => {
                const d = data.brandRange[p.dataIndex];
                if (!d) return '';
                const f = (x: number) => `₺${(x / 1e6).toFixed(2)}M`;
                return `${d.brand}\nMax ${f(d.max)}\nQ3 ${f(d.q3)}\nMed ${f(d.median)}\nQ1 ${f(d.q1)}\nMin ${f(d.min)}`;
            },
        },
        xAxis: { type: 'value', ...axisCommon, axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        yAxis: { type: 'category', data: data.brandRange.map((d) => d.brand), ...axisCommon, splitLine: { show: false } },
        series: [
            // IQR bar (q1->q3) using stacked bars
            { type: 'bar', stack: 'r', itemStyle: { color: 'transparent' }, data: data.brandRange.map((d) => d.q1), barWidth: 10, silent: true },
            {
                type: 'bar', stack: 'r', barWidth: 10,
                itemStyle: { color: theme.accent, opacity: 0.35, borderRadius: 4 },
                data: data.brandRange.map((d) => d.q3 - d.q1),
            },
            // median marker
            {
                type: 'scatter', symbolSize: 9,
                itemStyle: { color: theme.accent },
                data: data.brandRange.map((d) => [d.median, d.brand]),
            },
        ],
    };

    // Scatter mileage vs price
    const brands = Object.keys(data.scatterByBrand);
    const scatterOption = {
        grid: { top: 16, right: 16, bottom: 32, left: 48 },
        tooltip: {
            trigger: 'item', ...tooltip,
            formatter: (p: any) => `${p.seriesName}\n${(p.value[0] / 1000).toFixed(0)}k km · ₺${(p.value[1] / 1e6).toFixed(2)}M`,
        },
        legend: { show: false },
        xAxis: { type: 'value', name: 'km', ...axisCommon, axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` } },
        yAxis: { type: 'value', ...axisCommon, axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` } },
        series: brands.map((b, i) => ({
            name: b, type: 'scatter', symbolSize: 5,
            itemStyle: { color: theme.palette[i % theme.palette.length], opacity: 0.55 },
            data: data.scatterByBrand[b].map((p) => [p.km, p.price]),
        })),
    };

    // Fuel donut
    const fuelOption = {
        tooltip: { trigger: 'item', ...tooltip },
        legend: { bottom: 0, textStyle: { color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 } },
        series: [{
            type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
            itemStyle: { borderColor: theme.surface, borderWidth: 2 },
            label: { show: false }, labelLine: { show: false },
            data: data.fuel.map((d, i) => ({ name: d.name, value: d.value, itemStyle: { color: theme.palette[i % theme.palette.length] } })),
        }],
    };

    const opts = { renderer: 'canvas' as const };
    const style = { height: '100%', width: '100%' };

    return (
        <div className="grid lg:grid-cols-2 gap-4">
            <ChartPanel theme={theme} title={labels.priceByYear[0]} subtitle={labels.priceByYear[1]}>
                <ReactECharts option={lineOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.fuel[0]} subtitle={labels.fuel[1]}>
                <ReactECharts option={fuelOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.brandRange[0]} subtitle={labels.brandRange[1]} full height={340}>
                <ReactECharts option={brandRangeOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.scatter[0]} subtitle={labels.scatter[1]} full height={360}>
                <ReactECharts option={scatterOption} style={style} opts={opts} notMerge />
            </ChartPanel>
        </div>
    );
}
