// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all SEO, social and brand text.
// Edit a value here and it updates everywhere: page <title>s, meta descriptions,
// Open Graph / Twitter tags, the JSON-LD Person schema, the sitemap/robots base
// URL, the PWA manifest, and the footer/wordmark brand.
// (Localized UI copy still lives in i18n.tsx — this file is the SEO/brand layer.)
// ─────────────────────────────────────────────────────────────────────────────

type PageSeo = { title: string; description: string };

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
        linkedin: 'https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253',
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
        '/': { title: 'Data Scientist Portfolio', description: 'Data Scientist & MLOps Engineer building intelligent, end-to-end data systems — from models and pipelines to the dashboards that ship them.' },
        '/about': { title: 'About', description: 'About Sadık Çoban — a Data Scientist & MLOps Engineer who builds and ships models end to end, from data collection to monitored production APIs.' },
        '/projects': { title: 'Projects', description: 'Selected end-to-end data science and MLOps projects — from predictive models to live production dashboards.' },
        '/projects/car-price': { title: 'Car Price Prediction & MLOps', description: 'An end-to-end car-price prediction & MLOps system on LightGBM with TF-IDF+SVD text features — scraping, dedup, leak-free 5-fold evaluation, drift monitoring, SHAP explainability and a FastAPI serving layer.' },
        '/projects/car-price/dashboard': { title: 'Dashboard', description: 'Live market dashboard for the car-price project — price trends, brand ranges, mileage density and damage analysis over real listings.' },
        '/projects/car-price/eda': { title: 'EDA', description: 'Exploratory data analysis of the Turkish used-car market: price distributions, correlations, body-type and damage effects.' },
        '/projects/car-price/predict': { title: 'Price Prediction', description: 'Estimate a car’s market value with a LightGBM · TF-IDF+SVD model that returns a price range, not just a point estimate.' },
        '/projects/car-price/drift': { title: 'Drift Analysis', description: 'Data-drift analysis between model versions using statistical tests on the training-data distribution.' },
        '/projects/car-price/shap': { title: 'SHAP Analysis', description: 'SHAP explainability for the car-price model — which features push each prediction up or down.' },
        // The v1 report has no route any more (app/[lang]/.../report-v1 removed). Its
        // component source is kept at app/_site/report-v1/ for reference; nothing is
        // served, so it needs no SEO entry.
        '/projects/car-price/report': { title: 'Analytics Report', description: 'Notebook-style analytics report for the car-price pipeline — EDA, hedonic drivers, modelling, calibration, drift and methodology, deep-linkable by section.' },
        '/projects/car-price/text-analysis': { title: 'Text Analysis', description: 'What 29,988 used-car listing descriptions carry that the structured fields never record: where the ad copy and the ad form disagree, equipment with no column at all, an anomaly queue and controlled text coefficients.' },
        '/projects/car-price/journal': { title: 'Project Journal', description: 'Engineering notes, technical challenges and case studies behind the car-price prediction project.' },
        '/blog': { title: 'Blog', description: 'Notes on data science, MLOps and the systems behind them, by Sadık Çoban.' },
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
