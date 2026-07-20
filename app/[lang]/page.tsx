import { getBlogPosts } from '@/lib/mdx';
import FinalHome from '@/app/_site/FinalHome';

// The editorial homepage carries no chart — the hero is a statement and the work index
// shows each project's headline metric instead of a cover figure — so it no longer reads
// lib/eda-data.json (a June snapshot of an older, smaller dataset). /projects still does.
export default function Page() {
    const recentPosts = getBlogPosts().slice(0, 3);
    return <FinalHome recentPosts={recentPosts} />;
}
