import { notFound } from 'next/navigation';

// Text analysis — DEACTIVATED. The generator archived its reports (cardatasys clean/_arsiv/
// text_analysis), so the page would show findings the pipeline no longer maintains. Everything
// stays in place: app/_site/text-analysis/, public/text_data.json (still read by the project
// overview), content/reports/text-analysis/ and its 14 figures.
//
// To restore: remove notFound() below, restore the import and render, put the site.pages entry
// and the FinalShell sidebar entry back, and re-sync the reports from the pipeline.
// import FinalTextAnalysis from '@/app/_site/text-analysis/FinalTextAnalysis';
// import { getTextData } from '@/app/_site/text-analysis/text-data';

export const metadata = { title: 'Text Analysis' };

export default function Page() {
    notFound();
    // const data = await getTextData();
    // return <FinalTextAnalysis initialData={data} />;
}
