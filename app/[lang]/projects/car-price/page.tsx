import FinalOverview from '@/app/_site/overview/FinalOverview';
import { getReportData } from '@/app/_site/report/site-data';
import { getTextData } from '@/app/_site/text-analysis/text-data';

// The overview is the project's landing page, so its numbers must be the same ones the
// analysis reports — it reads report-data.json (metrics, baselines, ablation, hedonic effects;
// the current run the report pages' charts are drawn from) and text_data.json (what the free
// text catches that the columns never recorded) server-side through cached readers. It used to
// read site_data.json, which stayed on the July run and drifted from the report beside it.
export default async function Page() {
    const [data, nlp] = await Promise.all([getReportData(), getTextData()]);
    return <FinalOverview initialData={data} initialNlp={nlp} />;
}
