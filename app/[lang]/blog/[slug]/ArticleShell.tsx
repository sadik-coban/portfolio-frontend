"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PaperShell from '@/app/_site/PaperShell';
import { useLang, localize } from '@/app/_site/i18n';

export default function ArticleShell({ frontmatter, children }: { frontmatter: any; children: React.ReactNode }) {
    const { t, lang } = useLang();
    const backHref = localize(frontmatter.project ? '/projects/car-price/journal' : '/blog', lang);
    const category = frontmatter.category || frontmatter.project || (frontmatter.tags && frontmatter.tags[0]);

    return (
        <PaperShell>
            <article className="mx-auto max-w-[720px] py-14">
                <Link href={backHref} className="mb-9 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5f5f5a] hover:text-[#1a1a1a] transition-colors">
                    <ArrowLeft size={14} /> {t('blog.allPosts')}
                </Link>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                    {category && <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-[#047857]">{category}</span>}
                    {category && <span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" />}
                    <span className="font-mono text-[12px] text-[#86857e]">{frontmatter.date}</span>
                    {frontmatter.readTime && <><span className="h-[3px] w-[3px] rounded-full bg-[#c4c2bb]" /><span className="font-mono text-[12px] text-[#86857e]">{frontmatter.readTime} {t('blog.min')}</span></>}
                </div>

                <h1 className="m-0 mb-5 text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-[-0.043em] text-[#1a1a1a]">{frontmatter.title}</h1>
                {frontmatter.description && (
                    <p className="m-0 mb-7 text-[19px] md:text-[20px] leading-[1.55] text-[#5f5f5a]">{frontmatter.description}</p>
                )}

                <div className="mb-9 flex items-center gap-3 border-y border-[#e9e7e2] py-[18px]">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#e4e2dd] font-mono text-[13px] font-semibold text-[#5f5f5a]">SÇ</div>
                    <div>
                        <div className="text-[14px] font-semibold text-[#1a1a1a]">Sadık Çoban</div>
                        <div className="font-mono text-[12px] text-[#86857e]">{t('blog.authorRole')}</div>
                    </div>
                </div>

                <div className="prose prose-lg prose-neutral max-w-none
                    prose-hr:border-[#e9e7e2] prose-strong:text-[#1a1a1a]
                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-[#1a1a1a]
                    prose-h2:text-[24px] prose-h2:tracking-[-0.025em] prose-h2:mb-3.5
                    prose-p:text-[#33332f] prose-p:leading-[1.75] prose-li:text-[#33332f]
                    prose-a:text-[#047857] hover:prose-a:underline
                    prose-blockquote:border-l-[3px] prose-blockquote:border-[#059669] prose-blockquote:pl-6 prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-[#1a1a1a]
                    prose-img:rounded-[12px] prose-img:shadow-sm
                    [&_pre]:w-[calc(100vw-3rem)] md:[&_pre]:w-full [&_pre]:overflow-x-auto
                    [&_pre]:bg-[#fbfaf7] [&_pre]:border [&_pre]:border-[#e4e2dd] [&_pre]:text-[#33332f] [&_pre]:p-4 [&_pre]:my-8 [&_pre]:rounded-[10px] [&_pre]:text-[13.5px] [&_pre]:leading-[1.7]
                    [&_pre_code]:before:content-none [&_pre_code]:after:content-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[13.5px] [&_pre_code]:font-mono
                    [&_:not(pre)>code]:bg-[#f3f1ec] [&_:not(pre)>code]:text-[#047857] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:before:content-[''] [&_:not(pre)>code]:after:content-['']">
                    {children}
                </div>

                {frontmatter.tags && frontmatter.tags.length > 0 && (
                    <div className="mt-9 flex flex-wrap gap-2 border-t border-[#e9e7e2] pt-[30px]">
                        {frontmatter.tags.map((tag: string) => (
                            <span key={tag} className="rounded-[20px] border border-[#d8d6d0] bg-[#fdfcf9] px-3 py-1.5 font-mono text-[12px] text-[#5f5f5a]">{tag}</span>
                        ))}
                    </div>
                )}
            </article>
        </PaperShell>
    );
}
