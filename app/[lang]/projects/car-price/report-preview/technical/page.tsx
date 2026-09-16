import ReportPreview from '@/app/_site/reports/ReportPreview';
import { getReportHtml, getReportMeta } from '@/app/_site/reports/report-source';

export const metadata = { title: 'Teknik rapor', robots: { index: false, follow: false } };

export default async function Page() {
    const [tr, en, trMeta, enMeta] = await Promise.all([
        getReportHtml('car-price', 'technical', 'tr'),
        getReportHtml('car-price', 'technical', 'en'),
        getReportMeta('car-price', 'technical', 'tr'),
        getReportMeta('car-price', 'technical', 'en'),
    ]);

    return (
        <ReportPreview
            active="report-technical"
            kicker="Car Price · Rapor"
            title="Teknik rapor"
            note="Protokol, kontroller ve sınırlar. İş notuyla aynı hesaptan beslenir — bir rakam iki raporda farklı çıkamaz."
            docs={{ tr: { ...tr, ...trMeta }, en: { ...en, ...enMeta } }}
        />
    );
}
