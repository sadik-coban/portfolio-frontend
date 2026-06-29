import { getBlogPosts } from '@/lib/mdx';
import ArticleShell from './ArticleShell';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug);
    try {
        const { frontmatter } = await import(`@/content/${cleanSlug}.mdx`);
        return { title: frontmatter?.title || 'Post', description: frontmatter?.description };
    } catch {
        return { title: 'Post' };
    }
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug);
    const { default: Post, frontmatter } = await import(`@/content/${cleanSlug}.mdx`);

    return (
        <ArticleShell frontmatter={frontmatter}>
            <Post />
        </ArticleShell>
    );
}
