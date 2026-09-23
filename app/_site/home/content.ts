// Homepage and /projects content, TR/EN. Language-neutral fields (titles, tools, stack) stay
// as-is. Every figure here is quoted from the project's own report — the source is named in a
// comment beside it, so a number can be checked against where it came from.
import type { Lang } from '../i18n';

type Bi = Record<Lang, string>;

/** A value that reads the same in both languages ('6.50%') or needs its own digit grouping
 *  per locale ({ en: '29,988', tr: '29.988' }). */
export type Localized = string | Bi;
export const localized = (v: Localized, lang: Lang) => (typeof v === 'string' ? v : v[lang]);

/** One line of a project's metric stack on /projects. Literal values, quoted from the
 *  project's report — the metrics used to be read from public/site_data.json, which stopped
 *  being regenerated in July and went on quoting a MAPE the current report no longer gives. */
export interface ProjectMetric {
    value: Localized;
    label: Bi;
    accent?: boolean;
}

/** An absolute URL: a project that lives outside this site (a published package, say).
 *  Such an href must skip localize() — it would prefix /tr onto the URL — and be rendered as a
 *  plain anchor with target/rel rather than a next/link route. */
export const isExternalHref = (href: string) => /^https?:\/\//.test(href);

/** Which mini figure a tile draws — the data behind each lives in ./figures.ts. */
export type ProjectFigure = 'carPrice' | 'openaq' | 'mrfei' | 'mff';

export interface HomeProject {
    domain: string;
    kind: 'live' | 'package' | 'study';
    title: string;
    /** One or two sentences for the homepage tile. Same `[label](href)` syntax as description. */
    summary: Bi;
    /** Rendered by ProjectText: plain copy, except `[label](href)` becomes a link. /projects only. */
    description: Bi;
    stack: string;
    /** Legacy — read only by the unused home/ProjectCard.tsx. */
    cover?: 'chart' | 'choropleth';
    /** Where the tile leads. Absent = nothing is published yet: the tile renders unlinked and
     *  carries a "coming soon" badge instead of pointing at a page that doesn't exist. */
    href?: string;
    /** The one number a homepage tile carries. Absent = the study has no final result yet. */
    metric?: Localized;
    metricLabel?: Bi;
    figure?: ProjectFigure;
    /** /projects only — the year the work shipped, the topic chips, and the metric stack. */
    year: string;
    tags: string[];
    metrics: ProjectMetric[];
    /** The pages this project actually ships, linked straight from its tile. */
    surfaces: { label: Bi; href: string }[];
}

// Order is layout: the homepage bento puts the first two on the top row (car price wide, the
// LLM study narrow) and the last three on an even row beneath.
export const HOME_PROJECTS: HomeProject[] = [
    // Figures: content/reports/car-price/technical.en.md — the opening summary (29,988 listings)
    // and §Model variants. "The model" of the report is LightGBM at 6.50%; CatBoost wins the
    // producer's MAPE-only rule at 6.45%, which the report itself calls a practical tie.
    {
        domain: 'Deployment · MLOps',
        kind: 'live',
        title: 'Car Price Prediction & MLOps',
        summary: {
            en: 'A live price model for used BMW and Audi listings — scraping, leak-free evaluation, drift monitoring and a serving API.',
            tr: 'İkinci el BMW ve Audi ilanları için canlı bir fiyat modeli — veri toplama, sızıntısız değerlendirme, drift izleme ve servis API’si.',
        },
        description: {
            en: 'End-to-end ML system on LightGBM with TF-IDF+SVD text features — scraping, dedup, leak-free 5-fold evaluation, drift monitoring, SHAP explainability, and a FastAPI serving layer. The complete production cycle, not just a notebook.',
            tr: 'LightGBM ve TF-IDF+SVD metin öznitelikleriyle kurulmuş, uçtan uca bir ML sistemi: veri toplama, tekilleştirme, sızıntısız 5-fold değerlendirme, drift izleme, SHAP açıklanabilirliği ve FastAPI servis katmanı. Bu sadece bir defter değil, eksiksiz bir üretim döngüsü.',
        },
        stack: 'LightGBM · FastAPI · DuckDB · Railway',
        cover: 'chart',
        href: '/projects/car-price',
        metric: '6.50%',
        metricLabel: { en: 'out-of-fold MAPE', tr: 'out-of-fold MAPE' },
        figure: 'carPrice',
        year: '2026',
        tags: ['LightGBM', 'CatBoost', 'TF-IDF+SVD', 'FastAPI', 'DuckDB', 'Railway', 'Next.js'],
        metrics: [
            { value: '6.50%', label: { en: 'out-of-fold MAPE', tr: 'out-of-fold MAPE' }, accent: true },
            { value: '0.9744', label: { en: 'cross-validated R²', tr: 'çapraz-doğrulanmış R²' } },
            { value: { en: '29,988', tr: '29.988' }, label: { en: 'listings modelled', tr: 'modellenen ilan' } },
        ],
        surfaces: [
            { label: { en: 'Overview', tr: 'Genel bakış' }, href: '/projects/car-price' },
            { label: { en: 'Decision note', tr: 'Karar notu' }, href: '/projects/car-price/report' },
            { label: { en: 'Technical report', tr: 'Teknik rapor' }, href: '/projects/car-price/report/technical' },
            { label: { en: 'Dashboard', tr: 'Pano' }, href: '/projects/car-price/dashboard' },
        ],
    },
    // In progress, and nothing of it is on this machine yet: no metric, no figure, no link.
    // The tile says what the study is and that results are coming — it does not guess them.
    {
        domain: 'NLP · LLMs',
        kind: 'study',
        title: 'LLMs vs Classical Text Classifiers',
        summary: {
            en: 'Open-weight LLMs served with vLLM, set against classical classifiers on the same labelled task.',
            tr: 'vLLM ile servis edilen açık ağırlıklı LLM’ler, aynı etiketli görevde klasik sınıflandırıcılara karşı.',
        },
        description: {
            en: 'Open-weight LLMs served with vLLM, set against classical classifiers on the same labelled task. Results will be published here once they are final.',
            tr: 'vLLM ile servis edilen açık ağırlıklı LLM’ler, aynı etiketli görevde klasik sınıflandırıcılara karşı. Sonuçlar kesinleştiğinde burada yayımlanacak.',
        },
        stack: 'vLLM',
        year: '2026',
        tags: ['vLLM', 'LLM', 'Text classification'],
        metrics: [],
        surfaces: [],
    },
    // Figures: openaqseriesanalytics/clean/FINDINGS.en.md — header line (1,853 series, 518,689
    // daily records) and the review-signal row (342). The author's own warning applies: 342 is
    // how many series raised a review signal, never "342 pathological series". Not published yet.
    {
        domain: 'Data quality · Open data',
        kind: 'study',
        title: 'OpenAQ Series Quality Audit',
        summary: {
            en: 'A unit-aware audit of OpenAQ air-quality series. A rule that fires is a review signal, not proof of a defect.',
            tr: 'OpenAQ hava kalitesi serilerinin birim-duyarlı taraması. Tetiklenen bir kural kusur kanıtı değil, inceleme sinyalidir.',
        },
        description: {
            en: 'A unit-aware audit of OpenAQ v3 air-quality series: 1,853 sensor–parameter–years through eight pathology rules and six separate quality axes. A rule that fires is a review signal, not proof of a defect — each flag is checked against neighbouring stations, multi-day episodes and the provider’s own flags.',
            tr: 'OpenAQ v3 hava kalitesi serilerinin birim-duyarlı taraması: 1.853 sensör–parametre–yıl, sekiz patoloji kuralından ve altı ayrı kalite ekseninden geçiyor. Tetiklenen bir kural kusur kanıtı değil, inceleme sinyalidir — her işaret komşu istasyonlara, çok günlü epizotlara ve sağlayıcının kendi bayraklarına karşı sınanıyor.',
        },
        stack: 'Python · pandas · NumPy · requests',
        metric: { en: '1,853', tr: '1.853' },
        metricLabel: { en: 'sensor–parameter–years', tr: 'sensör–parametre–yıl' },
        figure: 'openaq',
        year: '2026',
        tags: ['OpenAQ v3', 'pandas', 'Data quality', 'Rule-based audit'],
        metrics: [
            { value: { en: '1,853', tr: '1.853' }, label: { en: 'series audited', tr: 'taranan seri' }, accent: true },
            { value: { en: '518,689', tr: '518.689' }, label: { en: 'daily records', tr: 'günlük kayıt' } },
            { value: '342', label: { en: 'series with a review signal', tr: 'inceleme sinyali veren seri' } },
        ],
        surfaces: [],
    },
    // Figures: mRFEI Analysis/reports/mRFEI-2017-brief.md — Summary and §1 (8,057 tracts +
    // 1,523 places + 58 counties + 14 regions + the state = 9,653 units; 297 stable low-score
    // tracts; 17.89% statewide). This replaces an earlier entry quoting "3,143 US counties",
    // which no analysis supports, and the /mrfei page stays closed: its figures are illustrative.
    {
        domain: 'Public health · Spatial statistics',
        kind: 'study',
        title: 'California Food Environment (mRFEI 2017)',
        summary: {
            en: 'Where California’s food deserts are, and how sure we can be — CDPH’s retail food-environment index, 2017.',
            tr: 'Kaliforniya’nın gıda çölleri nerede ve bundan ne kadar emin olabiliriz — CDPH perakende gıda ortamı endeksi, 2017.',
        },
        description: {
            en: 'Where California’s food deserts are, and how sure we can be: CDPH’s modified Retail Food Environment Index across 9,653 tracts, places, counties and regions. Zero-score units are kept rather than dropped, and 297 tracts form low-score clusters that hold under every neighbour definition tested.',
            tr: 'Kaliforniya’nın gıda çölleri nerede ve bundan ne kadar emin olabiliriz: CDPH’nin değiştirilmiş Perakende Gıda Ortamı Endeksi, 9.653 tract, yerleşim, ilçe ve bölge üzerinde. Sıfır puanlı birimler atılmak yerine korunuyor; 297 tract, denenen her komşuluk tanımında ayakta kalan düşük puanlı kümeler oluşturuyor.',
        },
        stack: 'pandas · GeoPandas · PySAL · SciPy · FastAPI',
        metric: '297',
        metricLabel: { en: 'tracts in stable low-score clusters', tr: 'kararlı düşük puanlı kümedeki tract' },
        figure: 'mrfei',
        year: '2026',
        tags: ['GeoPandas', 'PySAL', 'Moran’s I', 'SciPy', 'FastAPI'],
        metrics: [
            { value: { en: '9,653', tr: '9.653' }, label: { en: 'units analysed', tr: 'incelenen birim' } },
            { value: '297', label: { en: 'stable low-score tracts', tr: 'kararlı düşük puanlı tract' }, accent: true },
            { value: '17.89%', label: { en: 'statewide healthy share', tr: 'eyalet sağlıklı payı' } },
        ],
        surfaces: [],
    },
    // MFF — the one entry that lives off-site: the work is the CRAN release, so every link
    // (tile, surfaces) points at cran.r-project.org and there is no local project page.
    // Authorship is stated plainly: DESCRIPTION lists Nihat Tak as author/maintainer and
    // Sadık Çoban as contributor (ctb), so the tile says contributor, not author.
    {
        domain: 'Open source · R',
        kind: 'package',
        title: 'MFF — Meta Fuzzy Functions',
        summary: {
            en: 'An R package on CRAN for fuzzy meta-ensembles. [Nihat Tak](https://www.nihattak.com) is the author; I am a contributor.',
            tr: 'Bulanık meta-topluluklar için CRAN’de bir R paketi. Paketin yazarı [Nihat Tak](https://www.nihattak.com); ben katkıda bulunanım.',
        },
        description: {
            en: 'An R package on CRAN for fuzzy meta-ensembles. It takes the validation predictions of several base learners — penalised regression, random forest, XGBoost, LightGBM — learns membership weights over that prediction space with Fuzzy C-Means, possibilistic FCM, Gustafson–Kessel or k-means, and fits one regression per cluster, tuned by grid search on validation loss. [Nihat Tak](https://www.nihattak.com) is the author; I am a contributor (ctb).',
            tr: 'CRAN’de yayımlanan, bulanık meta-topluluklar için bir R paketi. Birden çok temel öğrenicinin — cezalı regresyon, rastgele orman, XGBoost, LightGBM — doğrulama tahminlerini alıyor, bu uzayda Fuzzy C-Means, olabilirlikçi FCM, Gustafson–Kessel ya da k-ortalamalar ile üyelik ağırlıkları öğreniyor ve her küme için doğrulama kaybına göre ayarlanmış ayrı bir regresyon kuruyor. Paketin yazarı [Nihat Tak](https://www.nihattak.com); ben katkıda bulunan (ctb) olarak yer alıyorum.',
        },
        stack: 'R · glmnet · xgboost · lightgbm · ppclust',
        cover: 'chart',
        href: 'https://cran.r-project.org/package=MFF',
        metric: 'v0.2.4',
        metricLabel: { en: 'on CRAN · MIT', tr: 'CRAN’de · MIT' },
        figure: 'mff',
        year: '2026',
        tags: ['R', 'Fuzzy C-Means', 'PFCM', 'Gustafson–Kessel', 'glmnet', 'xgboost', 'lightgbm'],
        // Literal values: a package release has no evaluation metrics.
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
];

// The tools the work above actually used, as chips. The per-tool "what it did" lines are gone:
// they were written for the car-price system alone and had started to say things the current
// report contradicts (LightGBM "won at 6.49%" — the report now has a practical tie at ~6.5%).
export const HOME_ARSENAL: { group: Bi; tools: string[] }[] = [
    {
        group: { en: 'Modelling & Stats', tr: 'Modelleme & İstatistik' },
        tools: ['LightGBM', 'CatBoost', 'scikit-learn', 'SciPy', 'statsmodels', 'PySAL', 'R'],
    },
    {
        group: { en: 'Serving & Data', tr: 'Servis & Veri' },
        tools: ['FastAPI', 'DuckDB', 'pandas', 'NumPy', 'GeoPandas', 'Railway', 'S3'],
    },
    {
        group: { en: 'Frontend & Viz', tr: 'Arayüz & Görselleştirme' },
        tools: ['Next.js', 'Tailwind', 'Plotly', 'ECharts'],
    },
];
