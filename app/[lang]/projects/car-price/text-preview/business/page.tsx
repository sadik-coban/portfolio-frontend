import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReport } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Metin · karar notu', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en] = await Promise.all([
        getReport('text-analysis', 'business', 'tr'),
        getReport('text-analysis', 'business', 'en'),
    ]);

    return (
        <ReportPreview
            kind="text-analysis"
            active="text-business"
            kicker="Car Price · Metin"
            title="Metin · karar notu"
            note="İlan metninin yapısal kolonların kaydetmediği ne taşıdığı — karar diliyle."
            docs={{ tr, en }}
        />
    );
}
