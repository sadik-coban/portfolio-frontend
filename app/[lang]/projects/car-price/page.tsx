import FinalOverview from '@/app/_site/overview/FinalOverview';
import { getSiteData } from '@/app/_site/report-v2/site-data';
import { getTextData } from '@/app/_site/text-analysis/text-data';

// The overview is the project's landing page, so its numbers must be the same ones the
// analysis reports — it reads site_data.json (metrics, baselines, ablation) and
// text_data.json (what the free text catches that the columns never recorded) server-side
// through the same cached readers the report and NLP pages already use. Nothing is hardcoded,
// so the landing page can't drift from the analysis behind it.
export default async function Page() {
    const [data, nlp] = await Promise.all([getSiteData(), getTextData()]);
    return <FinalOverview initialData={data} initialNlp={nlp} />;
}
