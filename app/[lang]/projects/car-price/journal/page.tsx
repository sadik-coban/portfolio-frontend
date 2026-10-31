import { notFound } from 'next/navigation';
import { getPostsByProject } from '@/lib/mdx';
import FinalJournal from '@/app/_site/journal/FinalJournal';
import { WRITING_ENABLED } from '@/app/_site/writing-config';
import { pageMetadata } from '@/app/_site/seo';

export const generateMetadata = pageMetadata('/projects/car-price/journal');

// Closed with the blog while WRITING_ENABLED is false — the journal is the same posts
// filtered by project, so it has nothing to show on its own.
export default function Page() {
    if (!WRITING_ENABLED) notFound();
    const posts = getPostsByProject('car-price');
    return <FinalJournal posts={posts} />;
}
