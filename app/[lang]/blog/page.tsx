import { notFound } from 'next/navigation';
import { getBlogPosts } from '@/lib/mdx';
import FinalBlog from '@/app/_site/FinalBlog';
import { WRITING_ENABLED } from '@/app/_site/writing-config';


// Closed while WRITING_ENABLED is false (app/_site/writing-config.ts). Everything below is
// untouched, so flipping that flag brings the page back as it was.
export default function Page() {
    if (!WRITING_ENABLED) notFound();
    const posts = getBlogPosts();
    return <FinalBlog posts={posts} />;
}
