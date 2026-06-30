"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';

function categoryOf(post: any): string {
    return post.meta.category || post.meta.project || (post.meta.tags && post.meta.tags[0]) || 'General';
}

export default function FinalBlog({ posts }: { posts: any[] }) {
    const { t, lang } = useLang();
    const [cat, setCat] = useState('All');

    const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map(categoryOf)))], [posts]);
    const featured = posts[0];
    const rest = useMemo(
        () => posts.slice(1).filter((p) => cat === 'All' || categoryOf(p) === cat),
        [posts, cat],
    );

    const href = (slug: string) => localize(`/blog/${slug}`, lang);

    return (
        <PaperShell>
            <header className="py-14 lg:py-[72px] lg:pb-10">
                <div className="mb-[22px] font-mono text-[12px] uppercase tracking-[0.16em] text-[#047857]">{t('home.writingLabel')}</div>
                <h1 className="m-0 max-w-[680px] text-[40px] md:text-[48px] font-bold leading-[1.06] tracking-[-0.042em] text-[#1a1a1a]">{t('blog.title')}</h1>
                <p className="mt-5 max-w-[520px] text-[18px] leading-[1.6] text-[#5f5f5a]">{t('blog.subtitle')}</p>
            </header>

            {/* category chips */}
            <div className="flex flex-wrap items-center gap-2.5 pb-1 pt-2">
                {categories.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCat(c)}
                        className={`cursor-pointer rounded-[20px] border px-3.5 py-[7px] font-mono text-[12px] transition-colors ${c === cat ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#f7f6f3]' : 'border-[#d8d6d0] bg-[#fdfcf9] text-[#5f5f5a] hover:border-[#86857e]'}`}
                    >
                        {c === 'All' ? t('blog.catAll') : c}
                    </button>
                ))}
            </div>

            {/* featured */}
            {featured && (
                <Link href={href(featured.slug)} className="block border-b border-[#e9e7e2] py-9 pb-14">
                    <div className="max-w-[680px]">
                        <div className="mb-[18px] flex items-center gap-3">
                            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-[#047857]">{t('blog.featured')}</span>
                            <span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" />
                            <span className="font-mono text-[12px] text-[#86857e]">{categoryOf(featured)}</span>
                        </div>
                        <h2 className="m-0 mb-4 text-[28px] md:text-[32px] font-bold leading-[1.15] tracking-[-0.037em] text-[#1a1a1a]">{featured.meta.title}</h2>
                        <p className="m-0 mb-6 text-[17px] leading-[1.6] text-[#5f5f5a]">{featured.meta.description}</p>
                        <div className="flex items-center gap-[18px] font-mono text-[13px] font-medium text-[#565650]">
                            <span>{featured.meta.date}</span>
                            {featured.meta.readTime && <><span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" /><span>{featured.meta.readTime} {t('blog.min')}</span></>}
                            <span className="ml-auto font-sans text-[14px] text-[#1a1a1a]">{t('blog.readPost')} →</span>
                        </div>
                    </div>
                </Link>
            )}

            {/* list — only when there are non-featured posts to show, so the
                featured-only case doesn't render "1 articles" over "No posts yet". */}
            {posts.length > 1 && (
            <div className="py-12 pb-16">
                <div className="mb-1.5 flex items-baseline justify-between">
                    <h2 className="m-0 font-mono text-[13px] uppercase tracking-[0.16em] text-[#5f5f5a]">{t('blog.allPosts')}</h2>
                    <span className="font-mono text-[13px] text-[#86857e]">{t(rest.length === 1 ? 'blog.article' : 'blog.articles', { n: rest.length })}</span>
                </div>
                {rest.length > 0 ? rest.map((p) => (
                    <Link key={p.slug} href={href(p.slug)} className="group block border-t border-[#e9e7e2] py-7">
                        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#047857]">{categoryOf(p)}</div>
                        <h3 className="m-0 mb-2 text-[21px] md:text-[23px] font-semibold leading-[1.25] tracking-[-0.026em] text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{p.meta.title}</h3>
                        <p className="m-0 mb-4 max-w-[640px] text-[15px] leading-[1.6] text-[#5f5f5a]">{p.meta.description}</p>
                        <div className="flex items-center gap-[14px] font-mono text-[13px] font-medium text-[#565650]">
                            <span>{p.meta.date}</span>
                            {p.meta.readTime && <><span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" /><span>{p.meta.readTime} {t('blog.min')}</span></>}
                            <span className="ml-auto font-sans text-[14px] text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{t('blog.readPost')} →</span>
                        </div>
                    </Link>
                )) : (
                    <p className="border-t border-[#e9e7e2] py-8 text-[15px] text-[#86857e]">{t('blog.empty')}</p>
                )}
                <div className="border-t border-[#e9e7e2]" />
            </div>
            )}
        </PaperShell>
    );
}
