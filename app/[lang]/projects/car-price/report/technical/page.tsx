import type { Metadata } from 'next';
import ReportView from '@/app/_site/reports/ReportView';
import { getReport, type ReportLang } from '@/app/_site/reports/report-source';
import { pageSeo, type LangParams } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

const PATH = '/projects/car-price/report/technical';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
    const { lang } = await params;
    const base = pageSeo(lang, PATH);
    const title = site.pages[PATH]?.title[lang === 'tr' ? 'tr' : 'en'] ?? '';
    return { ...base, title: { absolute: site.title.template.replace('%s', title) } };
}

export default async function Page({ params }: LangParams) {
    const { lang } = await params;
    const doc = await getReport('car-price', 'technical', lang as ReportLang);
    const tr = lang === 'tr';
    return (
        <ReportView
            kind="car-price"
            active="report-technical"
            kicker={tr ? 'Araç Fiyatı · Rapor' : 'Car Price · Report'}
            title={tr ? 'Teknik rapor' : 'Technical report'}
            doc={doc}
        />
    );
}
