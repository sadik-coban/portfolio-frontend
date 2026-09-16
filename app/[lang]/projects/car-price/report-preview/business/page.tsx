import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReport } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Karar notu', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en] = await Promise.all([
        getReport('car-price', 'business', 'tr'),
        getReport('car-price', 'business', 'en'),
    ]);

    return (
        <ReportPreview
            kind="car-price"
            active="report-business"
            kicker="Car Price · Rapor"
            title="Karar notu"
            note="Analiz hattının ürettiği karar notu — ne yapmalı, ne kadar para. Yöntem adı geçmez; o teknik raporda."
            docs={{ tr, en }}
        />
    );
}
