import type { Metadata } from 'next';
import ReportView from '@/app/_site/reports/ReportView';
import { getReport, type ReportLang } from '@/app/_site/reports/report-source';
import type { LangParams } from '@/app/_site/seo';

// TEMPORARY — a trial of NotebookShell's slim rail, so the shape can be judged without touching
// any published page. It renders the technical report because that is the hard case: 37 contents
// entries, so the rail scrolls and anything parked under the contents falls below the fold.
//
// It is deliberately absent from site.pages, so it never enters the sitemap, and it answers
// noindex. The kicker says what it is; nothing here should be mistaken for real content.
//
// Keeping the slim rail → give the three real routes rail="slim" (or flip the default) and delete
// this directory. Dropping it → delete this directory and the `rail` prop in NotebookShell and
// ReportView. Either way this file goes.

export const metadata: Metadata = {
    title: { absolute: 'Rail trial' },
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
            rail="slim"
            kicker={tr ? 'Deneme · raf: sade' : 'Trial · rail: slim'}
            title={tr ? 'Teknik rapor' : 'Technical report'}
            doc={doc}
        />
    );
}
