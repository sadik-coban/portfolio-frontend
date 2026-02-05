"use client";
import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useMemo } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { useTheme } from "next-themes";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

// --- Sub-Component: Dynamic Pie Chart ---
function ChartPieDonut({ data, config }: { data: any[], config: ChartConfig }) {
    if (!data || data.length === 0) return null;

    // Calculate total for "trending" text or summary
    const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

    return (
        <Card className="flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader className="items-center pb-0">
                <CardTitle>Fuel Type Distribution</CardTitle>
                <CardDescription>Market Share by Fuel</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={config}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" payload={undefined} />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Total Vehicles: {total.toLocaleString()} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Distribution of available vehicles
                </div>
            </CardFooter>
        </Card>
    )
}

interface ChartProps {
    data: any;
}

export default function ObservableCharts({ data }: ChartProps) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const scatterRef = useRef<HTMLDivElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);
    const rangeRef = useRef<HTMLDivElement>(null);

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
            (points as number[][]).forEach(pt => {
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

    // D) Donut / Pie Data
    let color = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "gray", "black"];
    const donutData = useMemo(() => {
        return (data.donutChartData || []).map((d: any, i: number) => ({
            ...d,
            fill: color[i % color.length]
        }));
    }, [data.donutChartData]);
    useEffect(() => {
        console.log(donutData);
    }, [donutData]);
    const donutConfig = useMemo(() => {
        const config: ChartConfig = {
            value: { label: "Count" }
        };
        (data.donutChartData || []).forEach((d: any, i: number) => {
            config[d.name] = {
                label: d.name,
                color: color[i % color.length]
            };
        });
        return config;
    }, [data.donutChartData]);

    // E) Heatmap Data (Same Grid Logic)
    const damageGrid = useMemo(() => {
        if (!data.damageChartData) return [];
        const grid = [
            [{ part: 'Sol Ön Çamurluk', label: 'L.F. Wing' }, { part: 'Kaput', label: 'Hood' }, { part: 'Sağ Ön Çamurluk', label: 'R.F. Wing' }],
            [{ part: 'Sol Ön Kapı', label: 'L.F. Door' }, { part: 'Tavan', label: 'Roof' }, { part: 'Sağ Ön Kapı', label: 'R.F. Door' }],
            [{ part: 'Sol Arka Kapı', label: 'L.R. Door' }, { part: null }, { part: 'Sağ Arka Kapı', label: 'R.R. Door' }],
            [{ part: 'Sol Arka Çamurluk', label: 'L.R. Wing' }, { part: 'Bagaj', label: 'Trunk' }, { part: 'Sağ Arka Çamurluk', label: 'R.R. Wing' }]
        ];
        const getValue = (partName: string) => {
            const found = data.damageChartData.find((d: any) => d.part === partName);
            return found ? found.value : 0;
        };
        return grid.map(row => row.map(cell => cell ? { ...cell, value: getValue(cell.part!) } : null));
    }, [data.damageChartData]);


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
                    r: 1,
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
                // Noktalar (Smaller: r: 3)
                Plot.dot(lineData, {
                    x: "year",
                    y: "price",
                    fill: primaryColor,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    r: 3,
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
                // Hover Noktası (Smaller: r: 5)
                Plot.dot(lineData, Plot.pointerX({
                    x: "year",
                    y: "price",
                    stroke: primaryColor,
                    fill: "var(--background)",
                    r: 5,
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

            {/* 3. SATIR: Pie + Heatmap */}
            <div className="grid gap-8 lg:grid-cols-2">
                <ChartPieDonut data={donutData} config={donutConfig} />

                <Card className="flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Damage Heatmap (Top View)</CardTitle>
                        <CardDescription>Damage frequency by part</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center py-6">
                        <div className="grid grid-col-1 gap-2">
                            {damageGrid.map((row, rIndex) => (
                                <div key={rIndex} className="flex justify-center gap-2">
                                    {row.map((cell, cIndex) => {
                                        if (!cell) return <div key={cIndex} className="w-20 h-16" />;
                                        const bgClass = cell.value > 0
                                            ? (isDarkMode ? `bg-red-900/50 border-red-500` : `bg-red-100 border-red-300`)
                                            : (isDarkMode ? `bg-slate-800 border-slate-700` : `bg-slate-100 border-slate-200`);

                                        return (
                                            <div
                                                key={cIndex}
                                                className={`w-20 h-16 rounded-lg border flex flex-col items-center justify-center p-1 text-center transition-all hover:scale-105 ${bgClass}`}
                                                title={`${cell.part}: ${cell.value} hasarlı`}
                                            >
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{cell.label}</span>
                                                {cell.value > 0 && <span className="font-bold text-red-600 dark:text-red-400 text-sm">{cell.value}</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}