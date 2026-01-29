import Link from 'next/link';
import { getBlogPosts } from '@/lib/mdx';
import { Badge } from "@/components/ui/badge";
import Navbar from '@/components/layout/Navbar';
import { Calendar, ArrowRight } from 'lucide-react';

export default function GlobalBlogPage() {
    // Filtreleme yapmadan TÜM yazıları çekiyoruz
    const posts = getBlogPosts();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-32">
                {/* --- HEADER --- */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Writing & Thoughts
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Deep dives into software architecture, MLOps pipelines, data science, and the modern tech stack.
                    </p>
                </div>

                {/* --- BLOG LIST (SINGLE COLUMN) --- */}
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                    {posts.map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                            <article className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">

                                {/* Sol Kenar Çizgisi (Hover Efekti için) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {post.meta.date}
                                        </div>
                                        <span>•</span>
                                        <span>{post.meta.readTime} min read</span>
                                    </div>

                                    {post.meta.project && (
                                        <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 border-0 uppercase text-[10px] tracking-wider font-bold px-2 py-1">
                                            {post.meta.project}
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {post.meta.title}
                                </h2>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                    {post.meta.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {post.meta.tags?.map(tag => (
                                            <span key={tag} className="text-xs font-bold text-slate-400 group-hover:text-blue-500/80 transition-colors">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                        Read Article <ArrowRight size={16} />
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}