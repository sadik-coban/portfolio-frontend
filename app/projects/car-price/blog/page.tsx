import Link from 'next/link';
import { getPostsByProject } from '@/lib/mdx';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function CarPriceBlogList() {
    // Get posts only for this project
    const posts = getPostsByProject('car-price');

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-500">

            <div className="space-y-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                        <BookOpen className="text-blue-600" size={36} />
                        Project Journal
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Development notes and case studies for the Car Price Prediction project.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        // NOTE: Linking to the global blog structure
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                        {post.meta.title}
                                    </h2>
                                    <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-slate-500 whitespace-nowrap">
                                        {post.meta.date}
                                    </span>
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">
                                    {post.meta.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {post.meta.tags && (
                                        <div className="flex gap-2">
                                            {post.meta.tags.map((tag: string) => (
                                                <span key={tag} className="text-blue-600 dark:text-blue-400">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                        No blog posts found for this project yet.
                    </div>
                )}
            </div>
        </div>
    );
}