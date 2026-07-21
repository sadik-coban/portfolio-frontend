import FinalProjects from '@/app/_site/FinalProjects';
import { getSiteData } from '@/app/_site/report/site-data';

// The work index quotes each project's headline numbers, so it reads them from the same
// public/site_data.json the analysis pages render — not from lib/eda-data.json, a June
// snapshot of an older, smaller dataset. Formatted here (server-side) in both locales,
// because the index itself is a client component and can't reach the file.
export default async function Page() {
    const data = await getSiteData();
    const lgb = data?.domain?.final_results?.model_karsilastirma?.lightgbm_tfidf_svd;
    const n = data?.meta?.n_dedup;

    const both = (s: string) => ({ en: s, tr: s });
    const stats: Record<string, { en: string; tr: string }> = {};
    if (lgb?.MAPE != null) stats.mape = both(`${lgb.MAPE.toFixed(2)}%`);
    if (lgb?.R2 != null) stats.r2 = both(lgb.R2.toFixed(3));
    if (n != null) stats.listings = { en: n.toLocaleString('en-US'), tr: n.toLocaleString('tr-TR') };

    return <FinalProjects stats={stats} />;
}
