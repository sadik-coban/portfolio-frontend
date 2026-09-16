import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReportHtml, getReportMeta } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Metin · teknik', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en, trMeta, enMeta] = await Promise.all([
        getReportHtml('text-analysis', 'technical', 'tr'),
        getReportHtml('text-analysis', 'technical', 'en'),
        getReportMeta('text-analysis', 'technical', 'tr'),
        getReportMeta('text-analysis', 'technical', 'en'),
    ]);

    return (
        <ReportPreview
            active="text-technical"
            kicker="Car Price · Metin"
            title="Metin · teknik"
            note="Metin zincirinin protokolü: çıkarım, kontrollü etkiler, sınırlar."
            docs={{ tr: { ...tr, ...trMeta }, en: { ...en, ...enMeta } }}
        />
    );
}
