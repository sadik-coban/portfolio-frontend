import { getPostBySlug, getBlogPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { notFound } from 'next/navigation';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPost(props: Props) {
    const params = await props.params;
    const { slug } = params;

    const cleanSlug = decodeURIComponent(slug);
    const post = getPostBySlug(cleanSlug);

    if (!post) {
        return notFound();
    }

    // --- SMART BACK LINK ---
    const backLink = post.meta.project
        ? `/projects/${post.meta.project}/blog`
        : '/blog';

    const backLabel = post.meta.project
        ? 'Back to Project Journal'
        : 'Back to All Posts';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            <Navbar />

            <article className="max-w-3xl mx-auto py-32 px-6 animate-in fade-in duration-700">

                {/* --- NAVIGATION AREA --- */}
                <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">

                    {/* 1. Smart Return (Project or General) */}
                    <Link
                        href={backLink}
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" /> {backLabel}
                    </Link>

                    {/* 2. Return to Main Blog (Show only if inside a Project) */}
                    {post.meta.project && (
                        <>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <Link
                                href="/blog"
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors"
                            >
                                <BookOpen size={16} className="mr-2" /> Blog Home
                            </Link>
                        </>
                    )}
                </div>

                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                        {post.meta.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium border-b border-slate-200 dark:border-slate-800 pb-8">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                            {post.meta.date}
                        </span>
                        <span>•</span>
                        <span>{post.meta.readTime} min read</span>

                        {post.meta.tags && (
                            <div className="flex gap-2 ml-auto">
                                {post.meta.tags.map(tag => (
                                    <span key={tag} className="text-blue-600 dark:text-blue-400">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className="prose prose-lg dark:prose-invert prose-slate max-w-none 
                    prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:underline
                    prose-img:rounded-2xl prose-img:shadow-lg">
                    <MDXRemote source={post.content} />
                </div>
            </article>
        </div>
    );
}