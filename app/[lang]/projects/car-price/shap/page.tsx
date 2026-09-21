import type { Metadata } from 'next';
import ReportView from '@/app/_site/reports/ReportView';
import { getReport, type ReportLang } from '@/app/_site/reports/report-source';
import { pageSeo, type LangParams } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

// The SHAP report the analysis pipeline generates, at the address the hand-written SHAP page used
// to hold. That page showed six static plots behind a model selector; this one is the write-up
// that reads them. Its figures have no native builder in figures.tsx and none is planned: a
// beeswarm of 29,988 listings and a waterfall are matplotlib's own idiom, and ReportFigure's PNG
// fallback is exactly the path for a slug the registry does not know.
const PATH = '/projects/car-price/shap';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
    const { lang } = await params;
    const base = pageSeo(lang, PATH);
    const title = site.pages[PATH]?.title[lang === 'tr' ? 'tr' : 'en'] ?? '';
    return { ...base, title: { absolute: site.title.template.replace('%s', title) } };
}

export default async function Page({ params }: LangParams) {
    const { lang } = await params;
    const doc = await getReport('car-price', 'shap', lang as ReportLang);
    const tr = lang === 'tr';
    return (
        <ReportView
            kind="car-price"
            active="report-shap"
            kicker={tr ? 'Araç Fiyatı · Rapor' : 'Car Price · Report'}
            title={tr ? 'SHAP raporu' : 'SHAP report'}
            doc={doc}
        />
    );
}
