"use client";
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { useTheme } from 'next-themes';
import { themeEcharts } from '@/lib/themeEcharts';

// Temayı kaydet
echarts.registerTheme('evidence', themeEcharts);

// Grafik Kapsayıcı Bileşeni
const ChartContainer = ({ title, children, className }: any) => (
    <div className={`flex flex-col h-full min-h-[400px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            </div>
        </div>
        <div className="flex-1 w-full relative z-0 min-h-0 overflow-hidden rounded-lg">
            {children}
        </div>
    </div>
);

export default function ChartsSection({ data }: { data: any }) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    // Renk ve Stil Ayarları
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const axisColor = isDarkMode ? '#334155' : '#cbd5e1';
    const chartTheme = isDarkMode ? 'dark' : 'evidence';

    // Tooltip Stilleri (Kesin Görünürlük İçin CSS String)
    const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
    const tooltipText = isDarkMode ? '#ffffff' : '#1e293b';

    // Tooltip Stillendirme
    const commonTooltip = {
        trigger: 'item',
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        textStyle: { color: isDarkMode ? '#ffffff' : '#1e293b', fontSize: 13 },
        padding: [12, 16],
        extraCssText: 'z-index: 9999; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border-radius: 12px;'
    };

    // --- 1. BOXPLOT OPTION ---
    const boxplotOption = useMemo(() => {
        const brandNames = Object.keys(data.boxplotData);
        const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

        return {
            backgroundColor: 'transparent',
            tooltip: {
                ...commonTooltip,
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.componentSubType === 'boxplot') {
                        const brand = params.name;
                        const stats = params.data; // [min, q1, median, q3, max]
                        return `
                    <div style="font-weight:700; margin-bottom:8px; border-bottom:1px solid ${axisColor}; padding-bottom:4px;">${brand}</div>
                    <div style="display:flex; justify-content:space-between; gap:15px; margin-bottom:2px;"><span>Max:</span><b>${formatCurrency(stats[5])}</b></div>
                    <div style="display:flex; justify-content:space-between; gap:15px; margin-bottom:2px;"><span>Q3:</span><b>${formatCurrency(stats[4])}</b></div>
                    <div style="display:flex; justify-content:space-between; gap:15px; margin-bottom:2px; color:#3b82f6;"><span>Median:</span><b>${formatCurrency(stats[3])}</b></div>
                    <div style="display:flex; justify-content:space-between; gap:15px; margin-bottom:2px;"><span>Q1:</span><b>${formatCurrency(stats[2])}</b></div>
                    <div style="display:flex; justify-content:space-between; gap:15px;"><span>Min:</span><b>${formatCurrency(stats[1])}</b></div>
                `;
                    }
                    return '';
                }
            },
            dataset: [
                { source: Object.values(data.boxplotData) },
                { transform: { type: 'boxplot', config: { itemNameFormatter: (p: any) => brandNames[p.value] } } },
                { fromDatasetIndex: 1, fromTransformResult: 1 }
            ],
            xAxis: { type: 'category', boundaryGap: true, axisLabel: { color: textColor, fontWeight: '600' }, axisLine: { lineStyle: { color: axisColor } } },
            yAxis: { type: 'value', name: 'Price (TL)', nameTextStyle: { color: textColor }, axisLabel: { formatter: (v: number) => `${(v / 1e6).toFixed(1)}M`, color: textColor }, splitLine: { lineStyle: { type: 'dashed', color: axisColor, opacity: 0.2 } } },
            series: [
                {
                    name: 'Distribution', type: 'boxplot', datasetIndex: 1,
                    itemStyle: { color: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', borderWidth: 2 },
                    emphasis: { itemStyle: { borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.5)' } }
                },
                { name: 'Outlier', type: 'scatter', datasetIndex: 2, itemStyle: { color: '#ef4444', opacity: 0.6 }, symbolSize: 6 }
            ]
        };
    }, [data, isDarkMode, textColor, axisColor, commonTooltip]);

    // --- 2. SCATTER OPTION (GÜNCELLENDİ: Daha Canlı Renkler) ---
    const scatterOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: commonTooltip,
        grid: { top: 40, right: 30, bottom: 50, left: 60, containLabel: true },
        xAxis: { name: 'KM', nameLocation: 'middle', nameGap: 30, type: 'value', scale: true, axisLine: { lineStyle: { color: axisColor } }, axisLabel: { color: textColor, formatter: (val: number) => `${(val / 1000).toFixed(0)}K` }, splitLine: { show: false } },
        yAxis: { type: 'value', scale: true, axisLabel: { color: textColor, formatter: (val: number) => `${(val / 1e6).toFixed(1)}M` }, splitLine: { lineStyle: { type: 'dashed', color: axisColor, opacity: 0.3 } } },
        series: Object.entries(data.scatterData).map(([brand, points]) => ({
            name: brand,
            type: 'scatter',
            data: points as any[],
            symbolSize: 8,
            // ✨ CANLI RENK AYARI: Opaklık artırıldı ve shadow eklendi
            itemStyle: {
                opacity: isDarkMode ? 0.9 : 0.6,
                shadowBlur: isDarkMode ? 10 : 0,
                shadowColor: isDarkMode ? 'inherit' : 'transparent'
            }
        }))
    }), [data, isDarkMode, textColor, axisColor, commonTooltip]);

    // --- 3. LINE CHART ---
    const lineOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { ...commonTooltip, trigger: 'axis' },
        grid: { left: 50, right: 20, top: 30, bottom: 30, containLabel: true },
        xAxis: { type: 'category', data: data.lineChartData?.years || [], axisLine: { lineStyle: { color: axisColor } }, axisLabel: { color: textColor } },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v / 1e6).toFixed(3)}M`, color: textColor }, splitLine: { lineStyle: { type: 'dashed', color: axisColor, opacity: 0.3 } } },
        series: [{
            name: 'Avg Price', data: data.lineChartData?.prices || [], type: 'line', smooth: true, showSymbol: false, symbolSize: 8,
            lineStyle: { width: 4, color: '#8b5cf6' },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.0)' }]) }
        }]
    }), [data, isDarkMode, textColor, axisColor, commonTooltip]);

    // --- 4. DONUT CHART ---
    const donutOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: commonTooltip,
        legend: { bottom: 0, textStyle: { color: textColor }, icon: 'circle' },
        series: [{
            name: 'Fuel Type', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
            itemStyle: { borderRadius: 8, borderColor: isDarkMode ? '#0f172a' : '#fff', borderWidth: 3 },
            label: { show: false },
            data: data.donutChartData || []
        }]
    }), [data, isDarkMode, textColor, commonTooltip]);

    // --- 5. RADAR CHART ---
    const radarOption = useMemo(() => {
        const formatValue = (val: number, name: string) => {
            if (name.includes('Price')) return `${(val / 1e6).toFixed(2)}M`;
            if (name.includes('KM')) return `${(val / 1000).toFixed(0)}K`;
            return val.toFixed(1);
        };

        return {
            backgroundColor: 'transparent',
            tooltip: {
                ...commonTooltip,
                confine: true,
                formatter: (params: any) => {
                    let html = `<div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid ${axisColor}; padding-bottom:4px; color:${commonTooltip.textStyle.color}">${params.name}</div>`;
                    params.value.forEach((val: number, i: number) => {
                        const indicatorName = data.radarChartData?.indicators[i]?.name || '';
                        html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:4px;">
                              <span style="color:${textColor}">${indicatorName}:</span>
                              <span style="font-weight:bold">${formatValue(val, indicatorName)}</span>
                           </div>`;
                    });
                    return html;
                }
            },
            radar: {
                indicator: data.radarChartData?.indicators || [],
                axisName: { color: textColor, fontWeight: 'bold' },
                splitArea: { areaStyle: { color: isDarkMode ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#fff'] } },
                splitLine: { lineStyle: { color: axisColor } }
            },
            series: [{
                type: 'radar', data: data.radarChartData?.series || [],
                areaStyle: { opacity: 0.2 }, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 }
            }]
        };
    }, [data, isDarkMode, textColor, axisColor, commonTooltip]);

    // --- 6. HEATMAP (GÜNCELLENDİ: Hatalar Düzeltildi) ---
    // ... önceki importlar ve kodlar ...

    // --- 6. HEATMAP (TAMİR EDİLDİ: Renkler ve Koordinatlar) ---
    const damageOption = useMemo(() => {
        if (!data.damageChartData || data.damageChartData.length === 0) return {};

        const partCoordinates: Record<string, number[]> = {
            "Kaput": [1, 4],
            "Sol Ön Çamurluk": [0, 4], "Sağ Ön Çamurluk": [2, 4],
            "Sol Ön Kapı": [0, 3], "Sağ Ön Kapı": [2, 3],
            "Tavan": [1, 2],
            "Sol Arka Kapı": [0, 2], "Sağ Arka Kapı": [2, 2],
            "Sol Arka Çamurluk": [0, 1], "Sağ Arka Çamurluk": [2, 1],
            "Bagaj": [1, 0]
        };

        const heatmapData = data.damageChartData.map((item: any) => {
            const coords = partCoordinates[item.part];
            if (!coords) return null;
            return [...coords, item.value, item.part];
        }).filter(Boolean);

        const maxValue = Math.max(...heatmapData.map((d: number[]) => d[2]), 1);

        return {
            backgroundColor: 'transparent',

            // 1. ÇÖZÜM: Toolbox'ı kesin olarak kapat
            toolbox: { show: false },

            tooltip: {
                trigger: 'item',
                position: 'top',
                // 2. ÇÖZÜM: Tooltip'in grafik dışına taşmasını engelle (Görünmeme sorunu çözer)
                confine: true,
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                textStyle: { color: tooltipText },
                // Mouse üzerine gelince titremesin diye pointer-events kapalı
                extraCssText: 'z-index: 9999; pointer-events: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 8px;',
                formatter: (params: { data: string | any[]; color: any; }) => {
                    if (!params.data || params.data.length < 4) return '';
                    const partName = params.data[3];
                    const value = params.data[2];

                    // Light mode'da yazı rengini garantiye alıyoruz
                    return `<div style="color: ${tooltipText}; font-family: sans-serif; min-width: 100px;">
                                <div style="font-weight:bold; margin-bottom:4px; font-size:13px;">${partName}</div>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="border-radius:50%; width:10px; height:10px; background-color:${params.color};"></span>
                                    <span style="font-size:12px;">Hasarlı: <b>${value}</b></span>
                                </div>
                            </div>`;
                }
            },
            // 3. ÇÖZÜM: Grafiğin küçülmesini engellemek için containLabel: false
            grid: { top: 20, bottom: 40, left: 10, right: 10, containLabel: false },
            xAxis: { type: 'category', data: ['Sol', 'Orta', 'Sağ'], show: false },
            yAxis: { type: 'category', data: ['Arka', 'Arka-Yan', 'Orta', 'Ön-Yan', 'Ön'], show: false },
            visualMap: {
                min: 0,
                max: maxValue,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                dimension: 2,
                itemWidth: 15,
                itemHeight: 200,
                inRange: {
                    color: isDarkMode
                        ? ['#1e293b', '#3b82f6', '#ef4444']
                        : ['#f1f5f9', '#60a5fa', '#ef4444']
                },
                textStyle: { color: textColor }
            },
            series: [{
                name: 'Hasar Yoğunluğu',
                type: 'heatmap',
                data: heatmapData,
                label: {
                    show: true,
                    formatter: (p: { data: number[]; }) => p.data[2] > 0 ? p.data[2] : '',
                    color: isDarkMode ? '#fff' : '#1e293b',
                    fontSize: 11,
                    fontWeight: 'bold'
                },
                itemStyle: {
                    borderRadius: 6,
                    borderColor: isDarkMode ? '#020617' : '#fff',
                    borderWidth: 3
                }
            }]
        };
    }, [data, isDarkMode, textColor]);

    // ... geri kalan return bloğu ...
    return (
        <div className="space-y-8 mt-8">
            {/* 1. SATIR: Boxplot & Scatter */}
            <div className="grid gap-8 lg:grid-cols-2">
                <ChartContainer title="Price Distribution Analysis">
                    <ReactECharts option={boxplotOption} theme={chartTheme} style={{ height: '100%', minHeight: '350px' }} notMerge={true} />
                </ChartContainer>
                <ChartContainer title="Depreciation Trend (Price vs KM)">
                    <ReactECharts option={scatterOption} theme={chartTheme} style={{ height: '100%', minHeight: '350px' }} notMerge={true} />
                </ChartContainer>
            </div>

            {/* 2. SATIR: Line & Donut */}
            <div className="grid gap-8 lg:grid-cols-3">
                <ChartContainer title="Price Trend by Model Year" className="lg:col-span-2">
                    <ReactECharts option={lineOption} theme={chartTheme} style={{ height: '100%', minHeight: '350px' }} notMerge={true} />
                </ChartContainer>
                <ChartContainer title="Fuel Type Distribution" className="lg:col-span-1">
                    <ReactECharts option={donutOption} theme={chartTheme} style={{ height: '100%', minHeight: '350px' }} notMerge={true} />
                </ChartContainer>
            </div>

            {/* 3. SATIR: Radar & Heatmap */}
            <div className="grid gap-8 lg:grid-cols-2">
                {data.radarChartData?.indicators && (
                    <ChartContainer title="Technical Specs Comparison">
                        <ReactECharts option={radarOption} theme={chartTheme} style={{ height: '100%', minHeight: '400px' }} notMerge={true} />
                    </ChartContainer>
                )}
                <ChartContainer title="Damage Heatmap (Top View)">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <ReactECharts option={damageOption} theme={chartTheme} style={{ height: '350px', width: '100%', maxWidth: '300px' }} notMerge={true} />
                    </div>
                </ChartContainer>
            </div>
        </div>
    );
}