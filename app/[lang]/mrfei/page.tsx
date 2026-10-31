import { notFound } from 'next/navigation';
// mRFEI case study — DEACTIVATED. Source kept in app/mrfei/.
// To restore: remove notFound() below + uncomment the import/render, and
// re-add the entry in app/home/content.ts.
// import FinalMrfei from '@/app/_site/mrfei/FinalMrfei';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/mrfei', { title: 'Retail Food Environment Index (mRFEI)' });

export default function Page() {
    notFound();
    // return <FinalMrfei />;
}
