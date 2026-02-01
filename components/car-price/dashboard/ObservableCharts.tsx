"use client";
import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ChartProps {
    data: any;
}

export default function ObservableCharts({ data }: ChartProps) {
    const scatterRef = useRef<HTMLDivElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);
    const rangeRef = useRef<HTMLDivElement>(null);
    // DonutRef kaldırıldı

    // --- 1. VERİ DÖNÜŞÜMÜ (Transformation) ---

    // A) Line Chart Verisi
    const lineData = (data.lineChartData?.years || []).map((year: number, i: number) => ({
        year: year,
        price: data.lineChartData?.prices?.[i] || 0
    }));

    // B) Scatter Verisi
    const scatterPoints: any[] = [];
    if (data.scatterData) {
        Object.entries(data.scatterData).forEach(([brand, points]: [string, any]) => {
            (points as number[][]).slice(0, 100).forEach(pt => {
                scatterPoints.push({ brand, km: pt[0], price: pt[1] });
            });
        });
    }

    // C) Fiyat Aralığı Verisi
    const rangeData: any[] = [];
    if (data.boxplotData) {
        Object.entries(data.boxplotData).forEach(([brand, prices]: [string, any]) => {
            if (Array.isArray(prices) && prices.length > 0) {
                const sortedPrices = [...prices].sort((a, b) => a - b);
                const len = sortedPrices.length;
                const min = sortedPrices[0];
                const max = sortedPrices[len - 1];
                const mid = Math.floor(len / 2);
                const median = len % 2 !== 0 ? sortedPrices[mid] : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
                const q1 = sortedPrices[Math.floor(len * 0.25)];
                const q3 = sortedPrices[Math.floor(len * 0.75)];

                rangeData.push({ brand, min, q1, median, q3, max });
            }
        });
    }

    // --- ORTAK STİL AYARLARI (Theme Config) ---
    const commonPlotStyle = {
        background: "transparent",
        color: "var(--foreground)",
        fontSize: "13px",
        fontFamily: "var(--font-sans)",
        overflow: "visible"
    };

    // --- CHART 1: Market Scatter ---
    useEffect(() => {
        if (!scatterPoints.length || !scatterRef.current) return;

        const plot = Plot.plot({
            style: commonPlotStyle,
            height: 400,
            marginTop: 20,
            marginLeft: 50,
            marginBottom: 50,
            inset: 20,
            grid: true,
            color: { legend: true, scheme: "Tableau10" },
            x: {
                label: "Mileage (KM)",
                tickFormat: "s",
                nice: true,
                tickSize: 0,
                tickPadding: 10,
                labelOffset: 40,
                labelAnchor: "center"
            },
            y: {
                label: "Price (₺)",
                tickFormat: (d) => `${d / 1000000}M`,
                nice: true,
                tickSize: 0,
                tickPadding: 10
            },
            marks: [
                Plot.dot(scatterPoints, {
                    x: "km",
                    y: "price",
                    fill: "brand",
                    strokeWidth: 1,
                    fillOpacity: 0.7,
                    r: 5,
                    title: (d) => `${d.brand}\n${d.km.toLocaleString()} km\n${d.price.toLocaleString()} ₺`,
                }),
                Plot.tip(scatterPoints, Plot.pointer({
                    x: "km",
                    y: "price",
                    fill: "var(--popover)",
                    stroke: "var(--border)",
                    color: "var(--popover-foreground)",
                    title: (d) => `${d.brand} • ${d.km.toLocaleString()} km • ${d.price.toLocaleString()} ₺`
                }))
            ]
        });

        scatterRef.current.replaceChildren(plot);
        return () => plot.remove();
    }, [scatterPoints]);

    // --- CHART 2: Price Trend (Dark Mode Uyumlu) ---
    useEffect(() => {
        if (!lineData.length || !lineRef.current) return;

        const primaryColor = "#8b5cf6";

        const plot = Plot.plot({
            style: commonPlotStyle,
            height: 320,
            marginTop: 20,
            marginLeft: 50,
            x: {
                label: null,
                tickFormat: "d",
                tickSize: 0,
                tickPadding: 10
            },
            y: {
                label: "Average Price (₺)",
                tickFormat: (d) => `${d / 1000000}M`,
                grid: true,
                tickSize: 0,
                tickPadding: 10
            },
            marks: [
                Plot.areaY(lineData, {
                    x: "year",
                    y: "price",
                    fill: primaryColor,
                    fillOpacity: 0.1,
                    curve: "natural"
                }),
                Plot.lineY(lineData, {
                    x: "year",
                    y: "price",
                    stroke: primaryColor,
                    strokeWidth: 8,
                    strokeOpacity: 0.15,
                    curve: "natural"
                }),
                Plot.lineY(lineData, {
                    x: "year",
                    y: "price",
                    stroke: primaryColor,
                    strokeWidth: 3,
                    curve: "natural"
                }),
                // Kılavuz Çizgi
                Plot.ruleX(lineData, Plot.pointerX({
                    x: "year",
                    py: "price",
                    stroke: "var(--muted-foreground)",
                    strokeOpacity: 0.5,
                    strokeDasharray: "3,3"
                })),
                // Noktalar (Dark Mode Uyumlu)
                Plot.dot(lineData, {
                    x: "year",
                    y: "price",
                    fill: primaryColor,
                    stroke: "var(--background)",
                    strokeWidth: 3,
                    r: 5,
                }),
                // Tooltip (Dark Mode Uyumlu)
                Plot.tip(lineData, Plot.pointerX({
                    x: "year",
                    y: "price",
                    fill: "var(--popover)",
                    stroke: "var(--border)",
                    color: "var(--popover-foreground)",
                    title: (d) => `${d.year}\nMean: ${d.price.toLocaleString()} ₺`
                })),
                // Hover Noktası
                Plot.dot(lineData, Plot.pointerX({
                    x: "year",
                    y: "price",
                    stroke: primaryColor,
                    fill: "var(--background)",
                    r: 7,
                    strokeWidth: 2
                }))
            ]
        });
        lineRef.current.replaceChildren(plot);
        return () => plot.remove();
    }, [lineData]);

    // --- CHART 3: Price Ranges (Range Plot) ---
    useEffect(() => {
        if (!rangeData.length || !rangeRef.current) return;

        const plot = Plot.plot({
            style: commonPlotStyle,
            height: 350,
            marginLeft: 100,
            marginBottom: 60,
            inset: 10,
            x: {
                label: "Price Range (₺)",
                tickFormat: (d) => `${d / 1000000}M`,
                nice: true,
                grid: true,
                tickPadding: 10,
                labelAnchor: "center",
                labelOffset: 45
            },
            y: {
                label: null,
                tickSize: 0,
                domain: rangeData.map(d => d.brand)
            },
            color: { scheme: "Tableau10" },
            marks: [
                Plot.ruleY(rangeData, {
                    x1: "min",
                    x2: "max",
                    y: "brand",
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 2,
                    strokeOpacity: 0.3
                }),
                Plot.tickX(rangeData, { x: "min", y: "brand", stroke: "var(--muted-foreground)", strokeWidth: 2 }),
                Plot.tickX(rangeData, { x: "max", y: "brand", stroke: "var(--muted-foreground)", strokeWidth: 2 }),
                Plot.ruleY(rangeData, {
                    x1: "q1",
                    x2: "q3",
                    y: "brand",
                    stroke: "brand",
                    strokeWidth: 10,
                    strokeOpacity: 0.4
                }),
                Plot.dot(rangeData, {
                    x: "median",
                    y: "brand",
                    fill: "brand",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    r: 6,
                }),
                Plot.tip(rangeData, Plot.pointerY({
                    x: "median",
                    y: "brand",
                    fill: "var(--popover)",
                    stroke: "var(--border)",
                    color: "var(--popover-foreground)",
                    title: (d) => {
                        const fmt = (val: number) => `${(val / 1_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M ₺`;
                        return `${d.brand}\n` +
                            `----------------\n` +
                            `Max: ${fmt(d.max)}\n` +
                            `Q3: ${fmt(d.q3)}\n` +
                            `Medyan: ${fmt(d.median)}\n` +
                            `Q1: ${fmt(d.q1)}\n` +
                            `Min: ${fmt(d.min)}`;
                    }
                }))
            ]
        });

        rangeRef.current.replaceChildren(plot);
        return () => plot.remove();
    }, [rangeData]);

    // EĞER HİÇ VERİ YOKSA
    if (!lineData.length && !scatterPoints.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <h3 className="text-lg font-bold">No Summary Data</h3>
                <p>Dashboard aggregated data is missing.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 mt-8">
            {/* 1. SATIR: Range Plot & Scatter */}
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Price Range by Brand</h3>
                    <p className="text-xs text-slate-500 mb-4">Min — Median — Max prices</p>
                    <div ref={rangeRef} className="w-full overflow-x-auto [&_svg]:w-full" />
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Sample Market Depth</h3>
                    <div ref={scatterRef} className="w-full overflow-x-auto [&_svg]:w-full" />
                </Card>
            </div>

            {/* 2. SATIR: Line Chart (Tam Genişlik) */}
            <div className="grid gap-8 grid-cols-1">
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Price Trend by Model Year</h3>
                    <div ref={lineRef} className="w-full overflow-x-auto [&_svg]:w-full" />
                </Card>
            </div>
        </div>
    );
}