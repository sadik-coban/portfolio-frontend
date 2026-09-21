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
            kicker={tr ? 'Car Price · Rapor' : 'Car Price · Report'}
            title={tr ? 'Teknik rapor' : 'Technical report'}
            note={tr
                ? 'Protokol, kontroller ve sınırlar. Karar notuyla aynı hesaptan beslenir — bir rakam iki raporda farklı çıkamaz.'
                : 'Protocol, checks and limits. It draws on the same computation as the decision note — one number cannot differ between the two.'}
            doc={doc}
        />
    );
}
