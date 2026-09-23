// Data behind the project tiles' mini figures. Every number is copied from the project's own
// report — the file and section are named above each block, so a figure can be checked against
// its source rather than trusted. Nothing here is illustrative except the MFF schematic, which
// says so on the tile.
import type { Lang } from '../i18n';

type Bi = Record<Lang, string>;

export interface Bar {
    label: Bi;
    value: number;
    /** Drawn in the accent; the rest are neutral. */
    highlight?: boolean;
    /** A trailing mark after the label (the report's ★ winner). */
    mark?: string;
}

// content/reports/car-price/technical.en.md §Model variants — 5-fold out-of-fold MAPE, %.
// LightGBM is "the model" of the report and carries the accent; CatBoost TF-IDF+SVD takes the
// producer's MAPE-only ★ by 0.05 points, which the report calls a practical tie.
export const CAR_PRICE_MAPE: Bar[] = [
    { label: { en: 'CatBoost · TF-IDF+SVD', tr: 'CatBoost · TF-IDF+SVD' }, value: 6.45, mark: '★' },
    { label: { en: 'LightGBM · TF-IDF+SVD', tr: 'LightGBM · TF-IDF+SVD' }, value: 6.5, highlight: true },
    { label: { en: 'CatBoost · native text', tr: 'CatBoost · native text' }, value: 6.59 },
    { label: { en: 'model+year median', tr: 'model+yıl medyanı' }, value: 11.2 },
];

// openaqseriesanalytics/clean/FINDINGS.en.md (and FINDINGS.md for the Turkish names) — the
// rule table, "flagged" column. The five sum to 388, the document's own count of pathology
// rule results; out-of-range and frozen-series fired on none and are listed as zeros.
export const OPENAQ_RULES: Bar[] = [
    { label: { en: 'level shift', tr: 'seviye kayması' }, value: 140 },
    { label: { en: 'negative within-day minimum', tr: 'gün-içi negatif minimum' }, value: 118 },
    { label: { en: 'extreme spike', tr: 'aşırı sıçrama' }, value: 93 },
    { label: { en: 'negative value', tr: 'negatif değer' }, value: 20 },
    { label: { en: 'near-zero baseline', tr: 'sıfıra yakın taban' }, value: 17 },
];
export const OPENAQ_ZERO_RULES: Bi[] = [
    { en: 'out of range', tr: 'makullük aralığı dışı' },
    { en: 'frozen series', tr: 'donmuş seri' },
];

// mRFEI Analysis/reports/mRFEI-2017-brief.md §2 — median tract score per planning region, and
// the Summary's statewide healthy share. Region names are proper nouns; the Turkish brief keeps
// them in English too.
export const MRFEI_STATE = 17.89;
export const MRFEI_REGIONS: { region: string; median: number }[] = [
    { region: 'Central/Southeast Sierra', median: 14.3 },
    { region: 'San Luis Obispo', median: 14.8 },
    { region: 'Shasta', median: 15.5 },
    { region: 'Sacramento Area', median: 16.7 },
    { region: 'San Diego', median: 16.7 },
    { region: 'Southern California', median: 16.7 },
    { region: 'Bay Area', median: 17.5 },
    { region: 'Northern Sacramento Valley', median: 18.2 },
    { region: 'Butte', median: 18.9 },
    { region: 'Santa Barbara', median: 20.0 },
    { region: 'Northeast Sierra', median: 20.0 },
    { region: 'Monterey Bay', median: 21.1 },
    { region: 'San Joaquin Valley', median: 22.2 },
    { region: 'North Coast', median: 27.3 },
];
