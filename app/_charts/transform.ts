import type { RawDashboardData } from './types';

export interface LinePoint { year: number; price: number }
export interface BrandRange { brand: string; min: number; q1: number; median: number; q3: number; max: number }
export interface ScatterPoint { brand: string; km: number; price: number }
export interface DonutSlice { name: string; value: number }

export interface ChartData {
    line: LinePoint[];
    brandRange: BrandRange[];
    scatter: ScatterPoint[];
    scatterByBrand: Record<string, ScatterPoint[]>;
    fuel: DonutSlice[];
}

const quantile = (sorted: number[], q: number) => {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
};

export function transform(data: RawDashboardData, scatterCap = 1500): ChartData {
    // line
    const line: LinePoint[] = (data.lineChartData?.years || []).map((year, i) => ({
        year,
        price: data.lineChartData?.prices?.[i] || 0,
    }));

    // brand range (box stats)
    const brandRange: BrandRange[] = [];
    if (data.boxplotData) {
        for (const [brand, prices] of Object.entries(data.boxplotData)) {
            if (Array.isArray(prices) && prices.length > 0) {
                const s = [...prices].sort((a, b) => a - b);
                brandRange.push({
                    brand,
                    min: s[0],
                    q1: quantile(s, 0.25),
                    median: quantile(s, 0.5),
                    q3: quantile(s, 0.75),
                    max: s[s.length - 1],
                });
            }
        }
        brandRange.sort((a, b) => b.median - a.median);
    }

    // scatter (cap total points for perf, keep brand grouping)
    const scatterByBrand: Record<string, ScatterPoint[]> = {};
    const scatter: ScatterPoint[] = [];
    if (data.scatterData) {
        const entries = Object.entries(data.scatterData);
        const totalPts = entries.reduce((acc, [, pts]) => acc + (pts as number[][]).length, 0) || 1;
        const ratio = Math.min(1, scatterCap / totalPts);
        for (const [brand, pts] of entries) {
            const arr = pts as number[][];
            const step = ratio < 1 ? Math.max(1, Math.round(1 / ratio)) : 1;
            scatterByBrand[brand] = [];
            for (let i = 0; i < arr.length; i += step) {
                const p = { brand, km: arr[i][0], price: arr[i][1] };
                scatter.push(p);
                scatterByBrand[brand].push(p);
            }
        }
    }

    const fuel: DonutSlice[] = data.donutChartData || [];

    return { line, brandRange, scatter, scatterByBrand, fuel };
}

export const fmtM = (v: number) => `₺${(v / 1_000_000).toFixed(2)}M`;
export const fmtKm = (v: number) => `${(v / 1000).toFixed(0)}k`;
