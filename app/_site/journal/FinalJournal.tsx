"use client";

import Link from 'next/link';
import FinalShell from '../FinalShell';
import { useLang, localize } from '../i18n';

// Same category fallback the blog list uses, so the rows read identically.
function categoryOf(post: any): string {
    return post.meta.category || post.meta.project || (post.meta.tags && post.meta.tags[0]) || 'General';
}

export default function FinalJournal({ posts }: { posts: any[] }) {
    const { t, lang } = useLang();
    return (
        <FinalShell active="journal" kicker={t('jr.kicker')} title={t('jr.title')}>
            <p className="mb-6 max-w-[580px] text-[15px] leading-[1.6] text-[#5f5f5a]">{t('jr.desc')}</p>
            <div className="flex flex-col max-w-3xl">
                {posts.length > 0 ? posts.map((post) => (
                    <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group block border-t border-[#e9e7e2] py-7">
                        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#047857]">{categoryOf(post)}</div>
                        <h2 className="m-0 mb-2 text-[21px] md:text-[23px] font-semibold leading-[1.25] tracking-[-0.026em] text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{post.meta.title}</h2>
                        <p className="m-0 mb-4 max-w-[640px] text-[15px] leading-[1.6] text-[#5f5f5a]">{post.meta.description}</p>
                        <div className="flex items-center gap-[14px] font-mono text-[13px] font-medium text-[#565650]">
                            <span>{post.meta.date}</span>
                            {post.meta.readTime && <><span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" /><span>{post.meta.readTime} {t('blog.min')}</span></>}
                            <span className="ml-auto font-sans text-[14px] text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{t('blog.readPost')} →</span>
                        </div>
                    </Link>
                )) : (
                    <p className="text-[15px] text-[#86857e] py-10">{t('blog.empty')}</p>
                )}
                {posts.length > 0 && (
                    <p className="border-t border-[#e9e7e2] py-6 text-[14px] text-[#86857e]">{t('journal.more')}</p>
                )}
            </div>
        </FinalShell>
    );
}
