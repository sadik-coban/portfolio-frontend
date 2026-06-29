import { getBlogPosts } from '@/lib/mdx';
import FinalBlog from '@/app/_site/FinalBlog';


export default function Page() {
    const posts = getBlogPosts();
    return <FinalBlog posts={posts} />;
}
