import type { Metadata } from 'next';
import FinalTextAnalysis from '@/app/_site/text-analysis/FinalTextAnalysis';
import { getTextData } from '@/app/_site/text-analysis/text-data';
import { pageSeo } from '@/app/_site/seo';
import { site } from '@/app/_site/site-config';

const PATH = '/projects/car-price/text-analysis';

// Static (SSG): prerender the analysis to HTML (AI-bot / no-JS readable); charts
// hydrate client-side. Mirrors the report-v2 pattern — force-static empties the
// cookies()/headers() from the parent layouts, and a page-level title keeps SEO right.
export const dynamic = 'force-static';

export function generateMetadata(): Metadata {
    const base = pageSeo('en', PATH);
    const title = site.pages[PATH]?.title ?? '';
    return { ...base, title: { absolute: site.title.template.replace('%s', title) } };
}

export default async function Page() {
    const data = await getTextData();
    return <FinalTextAnalysis initialData={data} />;
}
