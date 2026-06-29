"use client";

import ReactECharts from 'echarts-for-react';
import { ChartPanel } from './ChartPanel';
import type { ChartTheme } from './types';

interface EdaData {
    meta: { totalRows: number; generatedAt: string };
    priceHistogram: { labels: string[]; counts: number[] };
    priceByYear: { years: number[]; avg: number[]; count: number[] };
    brandCounts: { brands: string[]; counts: number[] };
    scatter: { km: number[]; price: number[]; brand: string[] };
    fuelDist: { labels: string[]; values: number[] };
    transmissionDist: { labels: string[]; values: number[] };
    segmentDist: { labels: string[]; values: number[] };
    bodyBox: { body: string; min: number; q1: number; median: number; q3: number; max: number; n: number }[];
    corrMatrix: { labels: string[]; z: number[][] };
    damageImpact: { labels: string[]; avg: number[]; count: number[] };
}

export interface EdaLabels {
    priceDist: [string, string];
    priceYear: [string, string];
    brand: [string, string];
    fuel: [string, string];
    scatter: [string, string];
    body: [string, string];
    corr: [string, string];
    damage: [string, string];
}
const DEFAULT_EDA_LABELS: EdaLabels = {
    priceDist: ['Price Distribution', '₺M buckets'],
    priceYear: ['Average Price by Year', '₺M'],
    brand: ['Listings by Brand', 'count'],
    fuel: ['Fuel Type', 'distribution'],
    scatter: ['Mileage vs Price', '2.5k sample'],
    body: ['Price by Body Type', 'boxplot · ₺M'],
    corr: ['Feature Correlation', 'Pearson r'],
    damage: ['Heavy Damage Impact', 'average ₺M'],
};

export default function EChartsEdaPlots({ eda, theme, labels = DEFAULT_EDA_LABELS }: { eda: EdaData; theme: ChartTheme; labels?: EdaLabels }) {
    const style = { height: '100%', width: '100%' };
    const opts = { renderer: 'canvas' as const };

    const axis = {
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 },
        splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
    };
    const tooltip = {
        // richText → tooltip drawn in-canvas at DPR (crisp, no overlay blur). No HTML.
        renderMode: 'richText' as const,
        backgroundColor: theme.surface,
        borderColor: '#e4e2dd',
        borderWidth: 1,
        padding: [9, 13] as [number, number],
        textStyle: { color: theme.text, fontFamily: theme.fontSans, fontSize: 12 },
        transitionDuration: 0,
    };

    // histogram
    const histOption = {
        grid: { top: 16, right: 16, bottom: 30, left: 44 },
        tooltip: { trigger: 'axis', ...tooltip },
        xAxis: { type: 'category', data: eda.priceHistogram.labels, ...axis, axisLabel: { ...axis.axisLabel, rotate: 35 } },
        yAxis: { type: 'value', ...axis },
        series: [{ type: 'bar', data: eda.priceHistogram.counts, itemStyle: { color: theme.accent, borderRadius: [3, 3, 0, 0] } }],
    };

    // price by year
    const yearOption = {
        grid: { top: 16, right: 16, bottom: 28, left: 44 },
        tooltip: { trigger: 'axis', ...tooltip, valueFormatter: (v: number) => `₺${v}M` },
        xAxis: { type: 'category', data: eda.priceByYear.years, ...axis, boundaryGap: false },
        yAxis: { type: 'value', ...axis },
        series: [{
            type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: eda.priceByYear.avg,
            lineStyle: { color: theme.accent, width: 3 }, itemStyle: { color: theme.accent },
            areaStyle: { color: theme.accent, opacity: 0.1 },
        }],
    };

    // brand counts (horizontal)
    const brandsRev = [...eda.brandCounts.brands].reverse();
    const countsRev = [...eda.brandCounts.counts].reverse();
    const brandOption = {
        grid: { top: 12, right: 24, bottom: 28, left: 80 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltip },
        xAxis: { type: 'value', ...axis },
        yAxis: { type: 'category', data: brandsRev, ...axis, splitLine: { show: false } },
        series: [{ type: 'bar', data: countsRev, itemStyle: { color: theme.palette[1], borderRadius: [0, 4, 4, 0] } }],
    };

    // fuel donut
    const fuelOption = {
        tooltip: { trigger: 'item', ...tooltip },
        legend: { bottom: 0, textStyle: { color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 } },
        series: [{
            type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
            itemStyle: { borderColor: theme.surface, borderWidth: 2 },
            label: { show: false }, labelLine: { show: false },
            data: eda.fuelDist.labels.map((name, i) => ({ name, value: eda.fuelDist.values[i], itemStyle: { color: theme.palette[i % theme.palette.length] } })),
        }],
    };

    // scatter (canvas, large)
    const scatterOption = {
        grid: { top: 16, right: 16, bottom: 32, left: 48 },
        tooltip: {
            trigger: 'item', ...tooltip,
            formatter: (p: any) => `${(p.value[0] / 1000).toFixed(0)}k km · ₺${p.value[1]}M`,
        },
        xAxis: { type: 'value', ...axis, axisLabel: { ...axis.axisLabel, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` } },
        yAxis: { type: 'value', ...axis },
        series: [{
            type: 'scatter', symbolSize: 5, large: true, largeThreshold: 500, animation: false,
            itemStyle: { color: '#8fdcc0', opacity: 0.75 },
            data: eda.scatter.km.map((km, i) => [km, eda.scatter.price[i]]),
        }],
    };

    // boxplot by body type (native)
    const boxOption = {
        grid: { top: 16, right: 16, bottom: 60, left: 44 },
        tooltip: { trigger: 'item', ...tooltip },
        xAxis: { type: 'category', data: eda.bodyBox.map((b) => b.body), ...axis, axisLabel: { ...axis.axisLabel, rotate: 35 } },
        yAxis: { type: 'value', ...axis, name: '₺M', nameTextStyle: { color: theme.muted, fontSize: 9 } },
        series: [{
            type: 'boxplot',
            data: eda.bodyBox.map((b) => [b.min, b.q1, b.median, b.q3, b.max]),
            itemStyle: { color: '#eef0ee', borderColor: '#047857', borderWidth: 1.5 },
        }],
    };

    // correlation heatmap (native)
    const corrLabels = eda.corrMatrix.labels;
    const heatData: [number, number, number][] = [];
    eda.corrMatrix.z.forEach((row, y) => row.forEach((val, x) => heatData.push([x, y, val])));
    const heatOption = {
        grid: { top: 12, right: 12, bottom: 40, left: 60 },
        tooltip: { ...tooltip, position: 'top', formatter: (p: any) => `${corrLabels[p.value[1]]} · ${corrLabels[p.value[0]]}: ${p.value[2]}` },
        xAxis: { type: 'category', data: corrLabels, ...axis, splitArea: { show: true }, splitLine: { show: false }, axisLabel: { ...axis.axisLabel, rotate: 35 } },
        yAxis: { type: 'category', data: corrLabels, ...axis, splitLine: { show: false } },
        visualMap: {
            min: -1, max: 1, calculable: true, orient: 'vertical', right: 0, top: 'center', show: false,
            itemWidth: 8, itemHeight: 70, textStyle: { color: theme.muted, fontSize: 8 },
            inRange: { color: ['#b91c1c', '#f5f5f5', '#047857'] },
        },
        series: [{
            type: 'heatmap', data: heatData,
            label: { show: true, fontSize: 9, fontFamily: theme.fontMono, color: '#33332f' },
            emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } },
        }],
    };

    // damage impact
    const damageOption = {
        grid: { top: 16, right: 16, bottom: 28, left: 44 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltip, valueFormatter: (v: number) => `₺${v}M` },
        xAxis: { type: 'category', data: eda.damageImpact.labels, ...axis },
        yAxis: { type: 'value', ...axis },
        series: [{
            type: 'bar', barWidth: '45%',
            data: eda.damageImpact.avg.map((v, i) => ({ value: v, itemStyle: { color: i === 0 ? theme.palette[0] : '#ef4444', borderRadius: [4, 4, 0, 0] } })),
            label: { show: true, position: 'top', formatter: (p: any) => `₺${p.value}M`, color: theme.muted, fontFamily: theme.fontMono, fontSize: 10 },
        }],
    };

    return (
        <div className="grid lg:grid-cols-2 gap-4">
            <ChartPanel theme={theme} title={labels.priceDist[0]} subtitle={labels.priceDist[1]}>
                <ReactECharts option={histOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.priceYear[0]} subtitle={labels.priceYear[1]}>
                <ReactECharts option={yearOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.brand[0]} subtitle={labels.brand[1]}>
                <ReactECharts option={brandOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.fuel[0]} subtitle={labels.fuel[1]}>
                <ReactECharts option={fuelOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.scatter[0]} subtitle={labels.scatter[1]} full height={380}>
                <ReactECharts option={scatterOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.body[0]} subtitle={labels.body[1]} full height={340}>
                <ReactECharts option={boxOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.corr[0]} subtitle={labels.corr[1]}>
                <ReactECharts option={heatOption} style={style} opts={opts} notMerge />
            </ChartPanel>
            <ChartPanel theme={theme} title={labels.damage[0]} subtitle={labels.damage[1]}>
                <ReactECharts option={damageOption} style={style} opts={opts} notMerge />
            </ChartPanel>
        </div>
    );
}
