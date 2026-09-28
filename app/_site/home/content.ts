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

/** An absolute URL: a project that lives outside this site (a published package, say).
 *  Such an href must skip localize() — it would prefix /tr onto the URL — and be rendered as a
 *  plain anchor with target/rel rather than a next/link route. */
export const isExternalHref = (href: string) => /^https?:\/\//.test(href);

export interface HomeProject {
    domain: string;
    kind: 'live' | 'case' | 'package';
    title: string;
    /** Rendered by ProjectText: plain copy, except `[label](href)` becomes a link. */
    description: Bi;
    stack: string;
    /** The homepage card's cover: a figure drawn from the project's data, the (unused)
     *  choropleth sketch, or a typographic cover for a package that has no dataset to draw. */
    cover: 'chart' | 'choropleth' | 'package';
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
            { label: { en: 'Decision note', tr: 'Karar notu' }, href: '/projects/car-price/report' },
            { label: { en: 'Technical report', tr: 'Teknik rapor' }, href: '/projects/car-price/report/technical' },
            { label: { en: 'Dashboard', tr: 'Pano' }, href: '/projects/car-price/dashboard' },
        ],
    },
    // MFF — the one entry that lives off-site: the work is the CRAN release, so every link
    // (row, surfaces) points at cran.r-project.org and there is no local project page.
    // Authorship is stated plainly: DESCRIPTION lists Nihat Tak as author/maintainer and
    // Sadık Çoban as contributor (ctb), so the card says contributor, not author.
    {
        domain: 'Open source · R',
        kind: 'package',
        title: 'MFF — Meta Fuzzy Functions',
        description: {
            en: 'An R package on CRAN for fuzzy meta-ensembles. It takes the validation predictions of several base learners — penalised regression, random forest, XGBoost, LightGBM — learns membership weights over that prediction space with Fuzzy C-Means, possibilistic FCM, Gustafson–Kessel or k-means, and fits one regression per cluster, tuned by grid search on validation loss. [Nihat Tak](https://www.nihattak.com) is the author; I am a contributor (ctb).',
            tr: 'CRAN’de yayımlanan, bulanık meta-topluluklar için bir R paketi. Birden çok temel öğrenicinin — cezalı regresyon, rastgele orman, XGBoost, LightGBM — doğrulama tahminlerini alıyor, bu uzayda Fuzzy C-Means, olabilirlikçi FCM, Gustafson–Kessel ya da k-ortalamalar ile üyelik ağırlıkları öğreniyor ve her küme için doğrulama kaybına göre ayarlanmış ayrı bir regresyon kuruyor. Paketin yazarı [Nihat Tak](https://www.nihattak.com); ben katkıda bulunan (ctb) olarak yer alıyorum.',
        },
        // The card's stack line names the language only; the dependencies stay in the tags.
        stack: 'R',
        cover: 'package',
        href: 'https://cran.r-project.org/package=MFF',
        metric: 'v0.2.4',
        metricLabel: { en: 'on CRAN · MIT', tr: 'CRAN’de · MIT' },
        year: '2026',
        tags: ['R', 'Fuzzy C-Means', 'PFCM', 'Gustafson–Kessel', 'glmnet', 'xgboost', 'lightgbm'],
        // Literal values: a package release has no site_data.json metrics.
        metrics: [
            { value: '0.2.4', label: { en: 'CRAN version', tr: 'CRAN sürümü' }, accent: true },
            { value: '4', label: { en: 'clustering engines', tr: 'kümeleme motoru' } },
            { value: 'MIT', label: { en: 'license', tr: 'lisans' } },
        ],
        surfaces: [
            { label: { en: 'CRAN page', tr: 'CRAN sayfası' }, href: 'https://cran.r-project.org/package=MFF' },
            { label: { en: 'Reference manual', tr: 'Referans kılavuzu' }, href: 'https://cran.r-project.org/web/packages/MFF/MFF.pdf' },
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

// The homepage's "Technical skills" rows: one row per group, its tools on one line. Only what
// the work shown here actually used — R is MFF's language, SQL the DuckDB queries behind the API.
export const HOME_ARSENAL: { group: Bi; tools: string[] }[] = [
    {
        group: { en: 'Modelling & Stats', tr: 'Modelleme & İstatistik' },
        tools: ['LightGBM', 'CatBoost', 'scikit-learn', 'TF-IDF+SVD', 'SciPy', 'statsmodels', 'R'],
    },
    {
        group: { en: 'Serving & Data', tr: 'Servis & Veri' },
        tools: ['FastAPI', 'DuckDB', 'SQL', 'Railway', 'S3', 'pandas', 'NumPy'],
    },
    {
        group: { en: 'Frontend & Viz', tr: 'Arayüz & Görselleştirme' },
        tools: ['Next.js', 'Plotly', 'ECharts', 'Tailwind'],
    },
];
