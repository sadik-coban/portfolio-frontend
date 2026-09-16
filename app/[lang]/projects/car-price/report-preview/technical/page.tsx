import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReport } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Teknik rapor', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en] = await Promise.all([
        getReport('car-price', 'technical', 'tr'),
        getReport('car-price', 'technical', 'en'),
    ]);

    return (
        <ReportPreview
            kind="car-price"
            active="report-technical"
            kicker="Car Price · Rapor"
            title="Teknik rapor"
            note="Protokol, kontroller ve sınırlar. İş notuyla aynı hesaptan beslenir — bir rakam iki raporda farklı çıkamaz."
            docs={{ tr, en }}
        />
    );
}
