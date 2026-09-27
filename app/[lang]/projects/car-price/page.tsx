import FinalOverview from '@/app/_site/overview/FinalOverview';
import { getReportData } from '@/app/_site/report/site-data';

// The overview is the project's landing page, so its numbers must be the same ones the
// analysis reports — it reads report-data.json (metrics, baselines, ablation, hedonic effects;
// the current run the report pages' charts are drawn from) server-side through a cached reader.
// It used to read site_data.json, which stayed on the July run and drifted from the report beside
// it, and text_data.json for a free-text card the current analysis no longer makes.
export default async function Page() {
    const data = await getReportData();
    return <FinalOverview initialData={data} />;
}
