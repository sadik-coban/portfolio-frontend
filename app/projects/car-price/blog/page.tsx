import Link from 'next/link';
import { getPostsByProject } from '@/lib/mdx';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from 'lucide-react';

export default function CarPriceBlogList() {
    // Filtreleme yapmadan TÜM yazıları çekiyoruz
    const posts = getPostsByProject('car-price');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">

            {/* Sayfa üstü ve altı boşlukları (padding) düzenlendi: py-24 */}
            <main className="max-w-4xl mx-auto px-6 py-24 lg:py-32">

                {/* --- HEADER --- */}
                {/* Başlık ile liste arasına mesafe kondu (mb-16) ve ortalandı */}
                <div className="max-w-2xl mx-auto text-center mb-16 space-y-6">

                    {/* Geri Dön Linki (Opsiyonel ama önerilir) */}
                    <div className="flex justify-center mb-6">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Projects
                        </Link>
                    </div>

                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mb-2">
                        <BookOpen className="text-blue-600 dark:text-blue-400" size={32} />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Project Journal
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                        Development notes, technical challenges, and case studies for the <span className="font-semibold text-slate-900 dark:text-slate-200">Car Price Prediction</span> project.
                    </p>
                </div>

                {/* --- BLOG LIST --- */}
                {/* Liste genişliği ana konteyner ile uyumlu hale getirildi ve gap arttırıldı */}
                <div className="flex flex-col gap-8">
                    {posts.map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                            {/* KART STİLİ (Dokunulmadı - Senin Kodun) */}
                            <article className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">

                                {/* Sol Kenar Çizgisi (Hover Efekti için) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {post.meta.date}
                                        </div>
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