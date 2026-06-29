// Homepage content ported from the "Data Scientist Portfolio" reference design,
// translated to TR/EN. Language-neutral fields (values, tools, stack) stay as-is.
import type { Lang } from '../i18n';

type Bi = Record<Lang, string>;

export interface HomeProject {
    domain: string;
    kind: 'live' | 'case';
    title: string;
    description: Bi;
    stack: string;
    cover: 'chart' | 'choropleth';
    href: string;
}

export const HOME_METRICS: { value: string; label: Bi; accent?: boolean }[] = [
    { value: '13,904', label: { en: 'Rows modelled', tr: 'Modellenen satır' } },
    { value: '0.98', label: { en: 'Best holdout R²', tr: 'En iyi holdout R²' }, accent: true },
    { value: '7.4%', label: { en: 'Overall MAPE', tr: 'Genel MAPE' } },
    { value: '₺123K', label: { en: 'Overall MAE', tr: 'Genel MAE' } },
];

export const HOME_PROJECTS: HomeProject[] = [
    {
        domain: 'Deployment · MLOps',
        kind: 'live',
        title: 'Car Price Prediction & MLOps',
        description: {
            en: 'End-to-end ML system on CatBoost with MultiQuantile loss — data ingestion, training, drift monitoring, SHAP explainability, and a serving API. The complete production cycle, not just a notebook.',
            tr: 'CatBoost ve MultiQuantile kayıp fonksiyonuyla kurulmuş, uçtan uca bir ML sistemi: veri toplama, eğitim, drift izleme, SHAP açıklanabilirliği ve bir servis API’si. Bu sadece bir defter değil, eksiksiz bir üretim döngüsü.',
        },
        stack: 'CatBoost · FastAPI · Hugging Face',
        cover: 'chart',
        href: '/projects/car-price',
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
    // },
];

export const HOME_ARSENAL: { tool: string; did: Bi }[] = [
    { tool: 'CatBoost · scikit-learn', did: { en: 'Gradient boosting for price prediction; classical models where interpretability mattered more than raw accuracy.', tr: 'Fiyat tahmini için gradient boosting; yorumlanabilirliğin ham doğruluktan önemli olduğu yerlerde klasik modeller.' } },
    { tool: 'pandas · scipy', did: { en: '95% confidence-interval methodology over 70k+ rows — statistical rigor before reaching for ML.', tr: '70k+ satırda %95 güven aralığı metodolojisi; ML’ye başvurmadan önce istatistiksel titizlik.' } },
    { tool: 'FastAPI', did: { en: 'Versioned inference endpoint serving predictions in real time.', tr: 'Tahminleri gerçek zamanlı sunan, sürümlenen bir çıkarım uç noktası.' } },
    { tool: 'Hugging Face · Railway', did: { en: 'Model registry and zero-config deployment behind a promote-to-production flow.', tr: 'Model kayıt defteri ve üretime alma akışının arkasında sıfır yapılandırmalı dağıtım.' } },
    { tool: 'ECharts · Next.js', did: { en: 'The live dashboards and figures rendering this work in the browser.', tr: 'Bu çalışmayı tarayıcıda gösteren canlı panolar ve grafikler.' } },
];
