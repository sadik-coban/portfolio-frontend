import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReportHtml, getReportMeta } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Karar notu', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en, trMeta, enMeta] = await Promise.all([
        getReportHtml('car-price', 'business', 'tr'),
        getReportHtml('car-price', 'business', 'en'),
        getReportMeta('car-price', 'business', 'tr'),
        getReportMeta('car-price', 'business', 'en'),
    ]);

    return (
        <ReportPreview
            active="report-business"
            kicker="Car Price · Rapor"
            title="Karar notu"
            note="Analiz hattının ürettiği karar notu — ne yapmalı, ne kadar para. Yöntem adı geçmez; o teknik raporda."
            docs={{ tr: { ...tr, ...trMeta }, en: { ...en, ...enMeta } }}
        />
    );
}
