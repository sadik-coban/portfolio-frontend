import { getPostsByProject } from '@/lib/mdx';
import FinalJournal from '@/app/_site/journal/FinalJournal';


export default function Page() {
    const posts = getPostsByProject('car-price');
    return <FinalJournal posts={posts} />;
}
