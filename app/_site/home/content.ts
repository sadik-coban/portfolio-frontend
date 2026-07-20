// Homepage content ported from the "Data Scientist Portfolio" reference design,
// translated to TR/EN. Language-neutral fields (values, tools, stack) stay as-is.
import type { Lang } from '../i18n';

type Bi = Record<Lang, string>;

/** One line of a project's metric stack on /projects. `stat` names a key in the live stats
 *  map the server derives from public/site_data.json — always prefer it. `value` is the
 *  literal escape hatch for figures that aren't in that file (a study with no model, say). */
export interface ProjectMetric {
    stat?: string;
    value?: string;
    label: Bi;
    accent?: boolean;
}

export interface HomeProject {
    domain: string;
    kind: 'live' | 'case';
    title: string;
    description: Bi;
    stack: string;
    cover: 'chart' | 'choropleth';
    href: string;
    /** The one number the editorial work index carries on the right of each row. */
    metric: string;
    metricLabel: Bi;
    /** /projects only — the year the work shipped, the topic chips, and the metric stack. */
    year: string;
    tags: string[];
    metrics: ProjectMetric[];
    /** The pages this project actually ships, linked straight from the homepage row. */
    surfaces: { label: Bi; href: string }[];
}

/** Identity ribbon under the hero — who/where/what, not project KPIs (each project row
 *  carries its own metric). The "Work" cell is computed from HOME_PROJECTS. */
export const HOME_RIBBON: { label: Bi; value: Bi; live?: boolean; accent?: boolean }[] = [
    { label: { en: 'Status', tr: 'Durum' }, value: { en: 'Open to roles', tr: 'Yeni rollere açık' }, live: true, accent: true },
    { label: { en: 'Role', tr: 'Rol' }, value: { en: 'Data Scientist · MLOps', tr: 'Veri Bilimci · MLOps' } },
    { label: { en: 'Based', tr: 'Konum' }, value: { en: 'İstanbul', tr: 'İstanbul' } },
];

// Kept in sync with public/site_data.json (domain.final_results.model_karsilastirma
// .lightgbm_tfidf_svd + meta.n_dedup). These are 5-fold out-of-fold figures, not a
// single holdout — the label says so, because the distinction is the point.
export const HOME_METRICS: { value: string; label: Bi; accent?: boolean }[] = [
    { value: '29,988', label: { en: 'Listings modelled', tr: 'Modellenen ilan' } },
    { value: '0.975', label: { en: 'Cross-validated R²', tr: 'Çapraz-doğrulanmış R²' }, accent: true },
    { value: '6.49%', label: { en: 'Out-of-fold MAPE', tr: 'Out-of-fold MAPE' } },
    { value: '₺110K', label: { en: 'Out-of-fold MAE', tr: 'Out-of-fold MAE' } },
];

export const HOME_PROJECTS: HomeProject[] = [
    {
        domain: 'Deployment · MLOps',
        kind: 'live',
        title: 'Car Price Prediction & MLOps',
        description: {
            en: 'End-to-end ML system on LightGBM with TF-IDF+SVD text features — scraping, dedup, leak-free 5-fold evaluation, drift monitoring, SHAP explainability, and a FastAPI serving layer. The complete production cycle, not just a notebook.',
            tr: 'LightGBM ve TF-IDF+SVD metin öznitelikleriyle kurulmuş, uçtan uca bir ML sistemi: veri toplama, tekilleştirme, sızıntısız 5-fold değerlendirme, drift izleme, SHAP açıklanabilirliği ve FastAPI servis katmanı. Bu sadece bir defter değil, eksiksiz bir üretim döngüsü.',
        },
        stack: 'LightGBM · FastAPI · DuckDB · Railway',
        cover: 'chart',
        href: '/projects/car-price',
        metric: '6.49%',
        metricLabel: { en: 'out-of-fold MAPE', tr: 'out-of-fold MAPE' },
        year: '2026',
        tags: ['LightGBM', 'TF-IDF+SVD', 'FastAPI', 'DuckDB', 'Railway', 'Next.js'],
        metrics: [
            { stat: 'mape', label: { en: 'out-of-fold MAPE', tr: 'out-of-fold MAPE' }, accent: true },
            { stat: 'r2', label: { en: 'cross-validated R²', tr: 'çapraz-doğrulanmış R²' } },
            { stat: 'listings', label: { en: 'listings modelled', tr: 'modellenen ilan' } },
        ],
        surfaces: [
            { label: { en: 'Overview', tr: 'Genel bakış' }, href: '/projects/car-price' },
            { label: { en: 'Report', tr: 'Rapor' }, href: '/projects/car-price/report-v2' },
            { label: { en: 'Dashboard', tr: 'Pano' }, href: '/projects/car-price/dashboard' },
        ],
    },
    // mRFEI case study — deactivated (hidden from listings; route 404s). Source kept
    // in app/mrfei/. To restore: uncomment this entry + remove the
    // notFound() in app/[lang]/mrfei/page.tsx.
    // {
    //     domain: 'Statistical · Geospatial',
    //     kind: 'case',
    //     title: 'Retail Food Environment Index',
    //     description: {
    //         en: 'A statistical and geospatial study of food-access inequality. The defining decision was methodological restraint — rigorous 95% confidence intervals, and a deliberate choice not to force an ML model where it wasn’t warranted.',
    //         tr: 'Gıdaya erişim eşitsizliğinin istatistiksel ve mekânsal incelemesi. Belirleyici karar metodolojik özdenetimdi — titiz %95 güven aralıkları ve gereksiz yere ML modeli zorlamama tercihi.',
    //     },
    //     stack: 'pandas · scipy · GeoPandas · scikit-learn',
    //     cover: 'choropleth',
    //     href: '/mrfei',
    //     metric: '3,143',
    //     metricLabel: { en: 'US counties', tr: 'ABD ilçesi' },
    //     year: '2025',
    //     tags: ['pandas', 'scipy', 'GeoPandas', 'scikit-learn'],
    //     // Literal values: this study predates site_data.json and has no model metrics.
    //     metrics: [
    //         { value: '3,143', label: { en: 'US counties', tr: 'ABD ilçesi' } },
    //         { value: '95% CI', label: { en: 'methodology', tr: 'metodoloji' }, accent: true },
    //         { value: 'no ML', label: { en: 'by design', tr: 'bilinçli tercih' } },
    //     ],
    //     surfaces: [{ label: { en: 'Case study', tr: 'Vaka çalışması' }, href: '/mrfei' }],
    // },
];

// What each tool actually did on the car-price system — kept honest against the code:
// LightGBM won on a shared leak-free split, the model ships as one S3 pickle on Railway,
// and the raw rows stay in DuckDB behind the API. No registry, no MultiQuantile.
// Grouped by where each tool earns its place — the editorial homepage renders these as
// three columns, so the copy per item stays short (one line of what it actually did).
export const HOME_ARSENAL: { group: Bi; items: { tool: string; did: Bi }[] }[] = [
    {
        group: { en: 'Modelling & Stats', tr: 'Modelleme & İstatistik' },
        items: [
            { tool: 'LightGBM · CatBoost', did: { en: 'One leak-free 5-fold split — LightGBM won at 6.49% MAPE.', tr: 'Tek sızıntısız 5-fold bölünme — LightGBM %6.49 MAPE ile kazandı.' } },
            { tool: 'scikit-learn · TF-IDF+SVD', did: { en: 'Listing titles into 170 dense dimensions, bundled with the model.', tr: 'İlan başlıkları 170 yoğun boyuta; modelle aynı pakette.' } },
            { tool: 'SciPy · statsmodels', did: { en: 'Hedonic regression with bootstrap CIs; KS + Wasserstein for drift.', tr: 'Bootstrap GA’lı hedonik regresyon; drift için KS + Wasserstein.' } },
        ],
    },
    {
        group: { en: 'Serving & Data', tr: 'Servis & Veri' },
        items: [
            { tool: 'FastAPI · DuckDB', did: { en: 'Prediction, drift and BI endpoints aggregating 30K rows server-side.', tr: '30 bin satırı sunucuda toplayan tahmin, drift ve BI uç noktaları.' } },
            { tool: 'Railway · S3', did: { en: 'Model bundle and listing database load from object storage at boot.', tr: 'Model paketi ve ilan veritabanı açılışta nesne depolamadan yükleniyor.' } },
            { tool: 'pandas · NumPy', did: { en: 'Scraping, dedup and the columnar aggregation behind the dashboard.', tr: 'Kazıma, tekilleştirme ve panonun arkasındaki kolonlu toplama.' } },
        ],
    },
    {
        group: { en: 'Frontend & Viz', tr: 'Arayüz & Görselleştirme' },
        items: [
            { tool: 'Next.js', did: { en: 'Static analysis report and the app pages rendering this work.', tr: 'Statik analiz raporu ve bu çalışmayı gösteren uygulama sayfaları.' } },
            { tool: 'Plotly · ECharts', did: { en: 'Notebook-grade figures and the live market dashboard.', tr: 'Defter kalitesinde grafikler ve canlı pazar panosu.' } },
            { tool: 'Tailwind', did: { en: 'The editorial and app layers of this design system.', tr: 'Bu tasarım sisteminin editorial ve uygulama katmanları.' } },
        ],
    },
];
