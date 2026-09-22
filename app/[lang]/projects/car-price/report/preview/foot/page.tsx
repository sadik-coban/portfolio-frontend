import type { Metadata } from 'next';
import ReportView from '@/app/_site/reports/ReportView';
import { getReport, type ReportLang } from '@/app/_site/reports/report-source';
import type { LangParams } from '@/app/_site/seo';

// TEMPORARY — the third rail shape, next to ../page.tsx's slim one, so all three can be compared
// against the live /report/technical without touching anything published.
//
// 'foot' puts the sibling reports under a label on the floor of the rail. TocNav is flex-1 and
// scrolls inside itself, so that block stays on screen however long the contents runs — measured:
// 37 entries scroll within a 590px window inside a rail that does not scroll at all.
//
// Absent from site.pages, so it never reaches the sitemap, and it answers noindex.
// Whichever shape wins, the whole preview/ directory goes.

export const metadata: Metadata = {
    title: { absolute: 'Rail trial · foot' },
    robots: { index: false, follow: false },
};

export default async function Page({ params }: LangParams) {
    const { lang } = await params;
    const doc = await getReport('car-price', 'technical', lang as ReportLang);
    const tr = lang === 'tr';
    return (
        <ReportView
            kind="car-price"
            active="report-technical"
            rail="foot"
            kicker={tr ? 'Deneme · raf: dipte etiketli' : 'Trial · rail: labelled foot'}
            title={tr ? 'Teknik rapor' : 'Technical report'}
            doc={doc}
        />
    );
}
