"use client";

import Link from 'next/link';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { AreaFigure } from './home/AreaFigure';
import { ProjectCard } from './home/ProjectCard';
import { HOME_METRICS, HOME_PROJECTS, HOME_ARSENAL } from './home/content';

export default function FinalHome({ recentPosts, priceByYear }: { recentPosts: any[]; priceByYear: { year: number; price: number }[] }) {
    const { t, lang } = useLang();

    return (
        <PaperShell>
            {/* HERO */}
            <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-center gap-10 lg:gap-14 py-14 lg:py-20">
                <div>
                    <p className="mb-6 font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-[#047857]">{t('home.heroEyebrow')}</p>
                    <h1 className="m-0 mb-6 text-[40px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.04em] text-[#1a1a1a]">
                        {t('home.heroH1')} <span className="text-[#a8a7a0]">{t('home.heroH1Muted')}</span>
                    </h1>
                    <p className="m-0 mb-9 max-w-[460px] text-[18px] leading-[1.6] text-[#5f5f5a]">{t('home.heroSub')}</p>
                    <div className="flex flex-wrap items-center gap-5 md:gap-[22px]">
                        <Link href="#work" className="rounded-[9px] bg-[#1a1a1a] px-5 py-2.5 text-[14px] font-semibold text-[#f7f6f3] transition-opacity hover:opacity-90">{t('home.viewWork')}</Link>
                        <Link href={localize('/about', lang)} className="text-[14px] font-medium text-[#1a1a1a]">{t('home.getInTouch')}</Link>
                        <a href="https://github.com/sadik-coban" target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#5f5f5a] transition-colors hover:text-[#1a1a1a]">GitHub ↗</a>
                    </div>
                </div>

                <figure className="m-0 rounded-xl border border-[#e9e7e2] bg-[#fdfcf9] p-5 pb-4 shadow-[0_1px_2px_rgba(40,40,30,0.04)]">
                    <figcaption className="mb-3.5 flex items-baseline justify-between">
                        <span className="text-[14px] font-semibold text-[#1a1a1a]">{t('home.figCaption')}</span>
                        <span className="font-mono text-[11px] font-medium tracking-[0.05em] text-[#86857e]">{t('home.sampleFigure')}</span>
                    </figcaption>
                    <AreaFigure data={priceByYear} variant="hero" />
                </figure>
            </section>

            {/* METRIC STRIP */}
            <section className="pb-[60px]">
                <p className="mb-5 font-mono text-[12px] font-medium uppercase tracking-[0.15em] text-[#86857e]">{t('home.metricsLabel')}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[#e9e7e2]">
                    {HOME_METRICS.map((m, i) => (
                        <div key={m.label.en} className={`pt-[22px] pb-4 pr-6 border-[#e9e7e2] ${i % 2 === 0 ? 'pl-0' : 'pl-6'} ${i % 4 === 0 ? 'md:pl-0' : 'md:pl-6'} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}>
                            <div className={`font-mono text-[22px] md:text-[28px] font-medium tracking-[-0.035em] tabular-nums ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.value}</div>
                            <div className="mt-1.5 text-[13px] text-[#86857e]">{m.label[lang]}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SELECTED WORK */}
            <section id="work" className="border-t border-[#e9e7e2] py-14">
                <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.workLabel')}</h2>
                    <Link href={localize('/projects', lang)} className="text-[14px] font-medium text-[#1a1a1a] transition-colors hover:text-[#047857]">{t('home.work.viewAll')} →</Link>
                </div>
                {HOME_PROJECTS.map((p) => <ProjectCard key={p.title} project={p} priceByYear={priceByYear} />)}
                <div className="border-t border-[#e9e7e2]" />
            </section>

            {/* TECHNICAL ARSENAL */}
            <section className="border-t border-[#e9e7e2] py-14">
                <h2 className="m-0 mb-2 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.arsenalLabel')}</h2>
                <p className="m-0 mb-3.5 max-w-[580px] text-[16px] text-[#86857e]">{t('home.arsenalSub')}</p>
                {HOME_ARSENAL.map((item) => (
                    <div key={item.tool} className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-2 sm:gap-7 border-t border-[#e9e7e2] py-5">
                        <span className="font-mono text-[14px] font-medium tracking-[0.02em] text-[#047857]">{item.tool}</span>
                        <span className="text-[16px] leading-[1.5] text-[#33332f]">{item.did[lang]}</span>
                    </div>
                ))}
                <div className="border-t border-[#e9e7e2]" />
            </section>

            {/* LATEST WRITING */}
            <section className="border-t border-[#e9e7e2] py-14">
                <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.writingLabel')}</h2>
                    <Link href={localize('/blog', lang)} className="text-[14px] font-medium text-[#1a1a1a] transition-colors hover:text-[#047857]">{t('home.allPosts')}</Link>
                </div>
                {recentPosts.length > 0 ? recentPosts.map((post) => (
                    <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="flex items-center gap-4 sm:gap-6 border-t border-[#e9e7e2] py-[18px] group">
                        <span className="w-[64px] sm:w-[78px] shrink-0 font-mono text-[12px] font-medium tabular-nums text-[#565650]">{post.meta.date}</span>
                        <span className="flex-1 text-[15px] sm:text-[17px] font-medium text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{post.meta.title}</span>
                        {post.meta.readTime && <span className="font-mono text-[13px] text-[#565650] shrink-0">{post.meta.readTime} min</span>}
                    </Link>
                )) : <p className="border-t border-[#e9e7e2] py-6 text-[15px] text-[#86857e]">{t('blog.empty')}</p>}
            </section>
        </PaperShell>
    );
}
