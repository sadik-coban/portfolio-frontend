// src/lib/themeEcharts.ts

const colorPalette = [
    '#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
];

const fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';

export const themeEcharts = {
    color: colorPalette,
    title: {
        textStyle: {
            color: '#1e293b',
            fontWeight: 600,
            fontFamily: fontFamily,
            fontSize: 16,
        },
        subtextStyle: {
            color: '#64748b',
            fontFamily: fontFamily,
        },
    },
    textStyle: {
        fontFamily: fontFamily,
        color: '#475569',
    },
    grid: {
        top: 60, bottom: 30, left: 40, right: 20,
        containLabel: true,
        borderColor: '#e2e8f0',
    },
    categoryAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', fontFamily: fontFamily },
    },
    valueAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontFamily: fontFamily },
    },
    tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: '#1e293b', fontFamily: fontFamily, fontSize: 12 },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-radius: 8px;',
        axisPointer: {
            type: 'line',
            lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' },
        },
    },
    line: {
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { borderWidth: 2 },
    },
    bar: {
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
    }
};