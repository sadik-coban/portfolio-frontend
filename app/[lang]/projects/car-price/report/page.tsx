import type { Metadata } from 'next';
import ReportView from '@/app/_site/reports/ReportView';
import { getReport, type ReportLang } from '@/app/_site/reports/report-source';
import { pageSeo, type LangParams } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

// The decision note the analysis pipeline generates, at the address the hand-written report used
// to hold — every link to /report, including the report-v2 redirect, still lands on a report.
const PATH = '/projects/car-price/report';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
    const { lang } = await params;
    const base = pageSeo(lang, PATH);
    const title = site.pages[PATH]?.title[lang === 'tr' ? 'tr' : 'en'] ?? '';
    return { ...base, title: { absolute: site.title.template.replace('%s', title) } };
}

export default async function Page({ params }: LangParams) {
    const { lang } = await params;
    const doc = await getReport('car-price', 'business', lang as ReportLang);
    const tr = lang === 'tr';
    return (
        <ReportView
            kind="car-price"
            active="report-business"
            kicker={tr ? 'Araç Fiyatı · Rapor' : 'Car Price · Report'}
            title={tr ? 'Karar notu' : 'Decision note'}
            doc={doc}
        />
    );
}
