// Shared types + theme tokens for the dashboard chart-library comparison.

export type ChartLib = 'echarts' | 'plotly' | 'recharts' | 'observable';
export type ThemeKey = 'hybrid';

export interface RawDashboardData {
    brands: string[];
    seriesList: string[];
    kpi: { total: number; avgPrice: number };
    boxplotData: Record<string, number[]>;
    scatterData: Record<string, number[][]>; // [km, price]
    lineChartData: { years: number[]; prices: number[] };
    donutChartData: { name: string; value: number }[];
    damageChartData: { part: string; value: number }[];
    radarChartData?: any;
}

export interface ChartTheme {
    key: ThemeKey;
    palette: string[];
    accent: string;
    grid: string;
    axis: string;
    text: string;
    muted: string;
    surface: string;     // card bg (css color)
    fontMono: string;
    fontSans: string;
}

// Warm paper-editorial chart theme: green/teal/violet/amber on a warm grid with
// ink text and #fdfcf9 surfaces. Red is reserved for damage only. The site is
// light-only (forcedTheme="light"), so there is no dark variant.
export function makeHybridTheme(): ChartTheme {
    return {
        key: 'hybrid',
        palette: ['#059669', '#0d9aba', '#7c5cff', '#e08a1e', '#ef4444', '#0891b2'],
        accent: '#059669',
        grid: '#ece9e3',
        axis: '#dcd9d2',
        text: '#1a1a1a',
        muted: '#9a9a92',
        surface: '#fdfcf9',
        fontMono: 'var(--font-geist-mono), ui-monospace, monospace',
        fontSans: 'var(--font-geist-sans), Inter, sans-serif',
    };
}

// --- Warm chart tokens shared by every figure (mirrors design 2's lib/chart-theme.ts) ---

/** Single-hue green ramp for density / heatmaps (sparse → dense). */
export const GREEN_RAMP = ['#fdfcf9', '#d1f0e0', '#6ee7b7', '#059669', '#065f46'];

/** Fixed categorical palette (fuel types, classes). */
export const CATEGORICAL = {
    benzin: '#059669',
    dizel: '#0d9aba',
    lpg: '#7c5cff',
    hibrit: '#e08a1e',
};

/** Categorical palette as an ordered array for index-based series. */
export const CATEGORICAL_LIST = ['#059669', '#0d9aba', '#7c5cff', '#e08a1e'];

/** Red is reserved strictly for damage / negative signal. */
export const DAMAGE_RED = '#ef4444';

/** Shared axis-label style (mono, faint). */
export function axisLabel(theme: ChartTheme) {
    return { color: theme.muted, fontFamily: theme.fontMono, fontSize: 11 };
}

/** Shared tooltip style (warm surface, ink text). */
export function tooltipStyle(theme: ChartTheme) {
    return {
        backgroundColor: theme.surface,
        borderColor: '#e4e2dd',
        borderWidth: 1,
        padding: [8, 12] as [number, number],
        textStyle: { color: theme.text, fontFamily: theme.fontSans, fontSize: 12 },
    };
}
