import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReport } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Metin · teknik', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en] = await Promise.all([
        getReport('text-analysis', 'technical', 'tr'),
        getReport('text-analysis', 'technical', 'en'),
    ]);

    return (
        <ReportPreview
            kind="text-analysis"
            active="text-technical"
            kicker="Car Price · Metin"
            title="Metin · teknik"
            note="Metin zincirinin protokolü: çıkarım, kontrollü etkiler, sınırlar."
            docs={{ tr, en }}
        />
    );
}
