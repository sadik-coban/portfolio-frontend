import type { Metadata } from 'next';
import FinalReportLab from '@/app/_site/report-v2/FinalReportLab';
import { getSiteData } from '@/app/_site/report-v2/site-data';
import { pageSeo } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

const PATH = '/projects/car-price/report-v2';

// Static (SSG): prerender the report body to HTML so AI bots / no-JS clients can
// read the written analysis (KPIs, narrative, tables, findings) — the charts still
// hydrate client-side. `force-static` empties the cookies()/headers() the parent
// layouts use, so this route prerenders and is edge-cached; the other car-price
// routes stay dynamic (they don't set the flag).
export const dynamic = 'force-static';

// force-static empties the headers() the [lang] layout uses to derive metadata, so
// it would otherwise mis-tag this page as the homepage — set report-v2's own
// title/description/canonical here (page metadata overrides the layout's). The
// layout's injected home title also breaks the brand-suffix template chain for this
// page, so emit the fully-formed title via `absolute` (built from site.title.template,
// no hardcoded brand) to stay consistent with every other page.
export function generateMetadata(): Metadata {
    const base = pageSeo('en', PATH);
    const title = site.pages[PATH]?.title ?? '';
    return { ...base, title: { absolute: site.title.template.replace('%s', title) } };
}

export default async function Page() {
    const data = await getSiteData();
    return <FinalReportLab initialData={data} />;
}
