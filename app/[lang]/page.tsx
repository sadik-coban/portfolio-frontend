import { getBlogPosts } from '@/lib/mdx';
import FinalHome from '@/app/_site/FinalHome';
import { getReportData } from '@/app/_site/report/site-data';
import { WRITING_ENABLED } from '@/app/_site/writing-config';
import type { Metadata } from 'next';
import { pageSeo, type LangParams } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

// The homepage shares its segment with the root layout, and a layout's title.template only
// reaches the segments below it, so the brand suffix is added here.
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
    const base = pageSeo((await params).lang, '');
    return typeof base.title === 'string'
        ? { ...base, title: { absolute: site.title.template.replace('%s', base.title) } }
        : base;
}

// The homepage figure and metric strip come from public/report-data.json — the run the reports
// and their charts are built on — read here, server-side, so only the few numbers the page
// shows reach the client. (July's version drew lib/eda-data.json, an older, smaller dataset.)
export default async function Page() {
    const recentPosts = WRITING_ENABLED ? getBlogPosts().slice(0, 3) : [];
    const d = await getReportData();
    // [age, median price, listings, mean] per vehicle age → the median in ₺ millions
    const curve = (d?.domain?.age_depreciation ?? []).map((r: number[]) => ({ x: r[0], price: r[1] / 1e6 }));
    const lgb = d?.domain?.final_results?.model_comparison?.lightgbm_tfidf_svd;
    const metrics = lgb && d?.meta?.n_dedup
        ? { listings: d.meta.n_dedup, r2: lgb.R2, mape: lgb.MAPE, mae: lgb.MAE }
        : null;
    return <FinalHome recentPosts={recentPosts} curve={curve} metrics={metrics} />;
}
