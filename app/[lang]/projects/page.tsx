import FinalProjects from '@/app/_site/FinalProjects';
import { getReportData } from '@/app/_site/report/site-data';

// The work index quotes each project's headline numbers, so it reads them from the current
// pipeline run (public/report-data.json, the file the report pages' charts are drawn from) —
// not from public/site_data.json, which stayed on the July run. Formatted here (server-side)
// in both locales, because the index itself is a client component and can't reach the file.
export default async function Page() {
    const data = await getReportData();
    const lgb = data?.domain?.final_results?.model_comparison?.lightgbm_tfidf_svd;
    const n = data?.meta?.n_dedup;

    const both = (s: string) => ({ en: s, tr: s });
    const stats: Record<string, { en: string; tr: string }> = {};
    if (lgb?.MAPE != null) stats.mape = both(`${lgb.MAPE.toFixed(2)}%`);
    // Four places, as the report prints it: at three, 0.9745 sits on a rounding edge.
    if (lgb?.R2 != null) stats.r2 = both(lgb.R2.toFixed(4));
    if (n != null) stats.listings = { en: n.toLocaleString('en-US'), tr: n.toLocaleString('tr-TR') };

    return <FinalProjects stats={stats} />;
}
