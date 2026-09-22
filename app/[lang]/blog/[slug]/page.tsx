import { notFound } from 'next/navigation';
import { getBlogPosts } from '@/lib/mdx';
import ArticleShell from './ArticleShell';
import { WRITING_ENABLED } from '@/app/_site/writing-config';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    if (!WRITING_ENABLED) return [];
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

// Closed while WRITING_ENABLED is false (app/_site/writing-config.ts).
export default async function Page({ params }: Props) {
    if (!WRITING_ENABLED) notFound();
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug);
    const { default: Post, frontmatter } = await import(`@/content/${cleanSlug}.mdx`);

    return (
        <ArticleShell frontmatter={frontmatter}>
            <Post />
        </ArticleShell>
    );
}
