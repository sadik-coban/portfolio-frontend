// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all SEO, social and brand text.
// Edit a value here and it updates everywhere: page <title>s, meta descriptions,
// Open Graph / Twitter tags, the JSON-LD Person schema, the sitemap/robots base
// URL, the PWA manifest, and the footer/wordmark brand.
// (Localized UI copy still lives in i18n.tsx — this file is the SEO/brand layer.)
// ─────────────────────────────────────────────────────────────────────────────

/** Both languages ship, so every page's title and description carry both. */
type Bi = { en: string; tr: string };
type PageSeo = { title: Bi; description: Bi };

export const site = {
    /** Production origin. Overridden by NEXT_PUBLIC_BASE_URL in the environment. */
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sadikcoban.com',

    /** Brand / personal name — wordmark aria-label, footer ©, JSON-LD name. */
    brand: 'Sadık Çoban',

    /** Browser-tab titles. `default` = home/fallback; other pages render as
     *  "<page title>" run through `template` → e.g. "About | Sadık Çoban". */
    title: {
        default: 'Sadık Çoban | Data Scientist Portfolio',
        template: '%s | Sadık Çoban',
    },

    /** Site-wide fallback meta description (pages can override below). */
    description:
        'Personal portfolio of Sadık Çoban — Data Scientist & MLOps Engineer building intelligent, end-to-end data systems: models, pipelines and the dashboards that ship them.',

    /** Open Graph (link-preview) defaults. Leave `image` empty for no preview image. */
    openGraph: {
        siteName: 'Sadık Çoban',
        locale: 'en_US',
        type: 'website' as const,
        title: 'Sadık Çoban | Data Scientist Portfolio',
        description: 'Explore my Artificial Intelligence and Data Science projects.',
        image: '', // e.g. '/og.png' (place the file in /public) — enables a large preview when set.
    },

    /** Twitter card. Becomes summary_large_image automatically when an image is set. */
    twitter: {
        title: 'Sadık Çoban | Data Scientist Portfolio',
        description: 'Explore my Artificial Intelligence and Data Science projects.',
        image: '',
    },

    /** schema.org/Person JSON-LD, rendered in the root layout. */
    person: {
        jobTitle: 'Data Scientist',
        description: 'Specializing in Artificial Intelligence, Data Science, and MLOps.',
        worksFor: 'Freelance / Open to Work',
    },

    /** Public profiles — feed JSON-LD `sameAs`, the footer icons and the contact email. */
    social: {
        github: 'https://github.com/sadik-coban',
        linkedin: 'https://www.linkedin.com/in/sadikcoban',
        email: 's.c_2004@hotmail.com',
    },

    /** PWA manifest. */
    manifest: {
        name: 'Sadık Çoban | Data Scientist Portfolio',
        shortName: "Sadık's DS Portfolio",
        themeColor: '#ffffff',
        backgroundColor: '#ffffff',
        icons: [
            { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
            { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
        ],
    },

    /** Per-page SEO. Key = route path (no locale prefix). title → "<title> | brand". */
    pages: {
        '/': {
            title: { en: 'Data Scientist Portfolio', tr: 'Veri Bilimci Portfolyosu' },
            description: {
                en: 'Data Scientist & MLOps Engineer building intelligent, end-to-end data systems — from models and pipelines to the dashboards that ship them.',
                tr: 'Uçtan uca veri sistemleri kuran bir Veri Bilimci ve MLOps Mühendisi — modellerden veri hatlarına, onları sahaya çıkaran panolara kadar.',
            },
        },
        '/about': {
            title: { en: 'About', tr: 'Hakkında' },
            description: {
                en: 'About Sadık Çoban — a Data Scientist & MLOps Engineer who builds and ships models end to end, from data collection to monitored production APIs.',
                tr: 'Sadık Çoban hakkında — modeli veri toplamadan izlenen üretim API’sine kadar uçtan uca kuran bir Veri Bilimci ve MLOps Mühendisi.',
            },
        },
        '/projects/car-price': {
            title: { en: 'Car Price Prediction & MLOps', tr: 'Araç Fiyat Tahmini & MLOps' },
            description: {
                en: 'An end-to-end car-price prediction & MLOps system on LightGBM with TF-IDF+SVD text features — scraping, dedup, leak-free 5-fold evaluation, drift monitoring, SHAP explainability and a FastAPI serving layer.',
                tr: 'LightGBM ve TF-IDF+SVD metin öznitelikleriyle kurulmuş uçtan uca araç fiyat tahmini ve MLOps sistemi — veri toplama, tekilleştirme, sızıntısız 5-fold değerlendirme, drift izleme, SHAP açıklanabilirliği ve FastAPI servis katmanı.',
            },
        },
        '/projects/car-price/dashboard': {
            title: { en: 'Dashboard', tr: 'Pano' },
            description: {
                en: 'Live market dashboard for the car-price project — price trends, brand ranges, mileage density and damage analysis over real listings.',
                tr: 'Araç fiyatı projesinin canlı piyasa panosu — gerçek ilanlar üzerinde fiyat eğilimleri, marka aralıkları, kilometre yoğunluğu ve hasar analizi.',
            },
        },
        '/projects/car-price/eda': {
            title: { en: 'EDA', tr: 'Keşifsel Veri Analizi' },
            description: {
                en: 'Exploratory data analysis of the Turkish used-car market: price distributions, correlations, body-type and damage effects.',
                tr: 'Türkiye ikinci el araç piyasasının keşifsel veri analizi: fiyat dağılımları, korelasyonlar, kasa tipi ve hasar etkileri.',
            },
        },
        '/projects/car-price/predict': {
            title: { en: 'Price Prediction', tr: 'Fiyat Tahmini' },
            description: {
                en: 'Estimate a car’s market value with a LightGBM · TF-IDF+SVD model that returns a price range, not just a point estimate.',
                tr: 'Tek bir sayı yerine fiyat aralığı veren LightGBM · TF-IDF+SVD modeliyle bir aracın piyasa değerini tahmin edin.',
            },
        },
        '/projects/car-price/drift': {
            title: { en: 'Drift Analysis', tr: 'Drift Analizi' },
            description: {
                en: 'Data-drift analysis between model versions using statistical tests on the training-data distribution.',
                tr: 'Eğitim verisi dağılımı üzerinde istatistiksel testlerle model sürümleri arasındaki veri kayması analizi.',
            },
        },
        '/projects/car-price/shap': {
            title: { en: 'SHAP Report', tr: 'SHAP Raporu' },
            description: {
                en: 'How the car-price model builds a price: exact TreeExplainer attributions over all 29,988 listings, out of fold, grouped and read as price multipliers.',
                tr: 'Araç fiyat modeli fiyatı neye bakarak kuruyor: 29.988 ilanın tamamında, out-of-fold, exact TreeExplainer atıfları — gruplanmış ve fiyat çarpanı olarak okunmuş.',
            },
        },
        // The v1 report has no route any more (app/[lang]/.../report-v1 removed). Its
        // component source is kept at app/_site/report-v1/ for reference; nothing is
        // served, so it needs no SEO entry. The two entries below are the reports the
        // analysis pipeline generates, now served at their own routes.
        '/projects/car-price/report': {
            title: { en: 'Decision Note', tr: 'Karar Notu' },
            description: {
                en: 'What the car-price model is worth in money and where not to trust it: the error against a dealer’s own rule of thumb, what moves a price, and the cases the model cannot price.',
                tr: 'Araç fiyat modelinin parasal karşılığı ve nerede güvenilmeyeceği: galerinin kendi refleksine karşı hata, fiyatı ne taşıyor ve modelin fiyatlayamadığı durumlar.',
            },
        },
        '/projects/car-price/report/technical': {
            title: { en: 'Technical Report', tr: 'Teknik Rapor' },
            description: {
                en: 'The protocol behind the car-price model: cleaning and leakage checks, missingness, redundancy, the hedonic model, model comparison, calibration and drift — every number read from the pipeline’s own export.',
                tr: 'Araç fiyat modelinin protokolü: temizlik ve sızıntı kontrolleri, eksiklik, fazlalık, hedonik model, model karşılaştırma, kalibrasyon ve kayma — her sayı analiz hattının kendi çıktısından.',
            },
        },
        '/projects/car-price/journal': {
            title: { en: 'Project Journal', tr: 'Proje Günlüğü' },
            description: {
                en: 'Engineering notes, technical challenges and case studies behind the car-price prediction project.',
                tr: 'Araç fiyat tahmini projesinin ardındaki mühendislik notları, teknik zorluklar ve vaka çalışmaları.',
            },
        },
        '/blog': {
            title: { en: 'Blog', tr: 'Blog' },
            description: {
                en: 'Notes on data science, MLOps and the systems behind them, by Sadık Çoban.',
                tr: 'Sadık Çoban’dan veri bilimi, MLOps ve arkalarındaki sistemler üzerine notlar.',
            },
        },
    } as Record<string, PageSeo>,
};

/** schema.org/Person object for the JSON-LD <script> in the root layout. */
export function personJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${site.baseUrl}/#person`,
        name: site.brand,
        url: site.baseUrl,
        jobTitle: site.person.jobTitle,
        description: site.person.description,
        worksFor: { '@type': 'Organization', name: site.person.worksFor },
        sameAs: [site.social.github, site.social.linkedin],
    };
}
