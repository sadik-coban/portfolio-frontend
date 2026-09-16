import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReportHtml, getReportMeta } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Metin · karar notu', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en, trMeta, enMeta] = await Promise.all([
        getReportHtml('text-analysis', 'business', 'tr'),
        getReportHtml('text-analysis', 'business', 'en'),
        getReportMeta('text-analysis', 'business', 'tr'),
        getReportMeta('text-analysis', 'business', 'en'),
    ]);

    return (
        <ReportPreview
            active="text-business"
            kicker="Car Price · Metin"
            title="Metin · karar notu"
            note="İlan metninin yapısal kolonların kaydetmediği ne taşıdığı — karar diliyle."
            docs={{ tr: { ...tr, ...trMeta }, en: { ...en, ...enMeta } }}
        />
    );
}
