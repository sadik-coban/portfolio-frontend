"use client";

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import FinalShell from '../FinalShell';
import { useLang, localize } from '../i18n';

export default function FinalJournal({ posts }: { posts: any[] }) {
    const { t, lang } = useLang();
    return (
        <FinalShell active="journal" kicker={t('jr.desc')} title={t('jr.title')}>
            <div className="flex flex-col max-w-3xl">
                {posts.length > 0 ? posts.map((post) => (
                    <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group py-6 border-t border-[#e9e7e2]">
                        <div className="flex items-center gap-3 text-sm text-[#86857e] mb-2">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[12px]"><Calendar size={14} />{post.meta.date}</span>
                            {post.meta.tags?.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="font-mono text-xs text-[#86857e]">#{tag}</span>
                            ))}
                        </div>
                        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1a1a1a] mb-2 group-hover:text-[#047857] transition-colors">
                            {post.meta.title}
                        </h2>
                        <p className="text-[15px] leading-[1.6] text-[#5f5f5a] mb-2">{post.meta.description}</p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#047857] opacity-0 group-hover:opacity-100 transition-opacity">
                            {t('blog.readArticle')} <ArrowRight size={15} />
                        </span>
                    </Link>
                )) : (
                    <p className="text-[15px] text-[#86857e] py-10">{t('blog.empty')}</p>
                )}
            </div>
        </FinalShell>
    );
}
