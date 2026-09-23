import FinalProjects from '@/app/_site/FinalProjects';

// The work index used to read its headline numbers from public/site_data.json. That file
// stopped being regenerated in July and went on quoting a MAPE (6.49%) the current technical
// report no longer gives (6.50%), so the figures now live beside each project in
// app/_site/home/content.ts, quoted from its report with the source named.
export default function Page() {
    return <FinalProjects />;
}
