"use client";

import { Fragment, useCallback } from 'react';
import Link from 'next/link';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { AreaFigure } from './home/AreaFigure';
import { ProjectCard } from './home/ProjectCard';
import { HOME_PROJECTS, HOME_ARSENAL } from './home/content';
import { site } from './site-config';
import { WRITING_ENABLED } from './writing-config';
import { jumpToSection } from './jump';

/** The price model's headline numbers, read server-side from public/report-data.json. */
export type HomeMetrics = { listings: number; r2: number; mape: number; mae: number };

// Homepage in the July layout (254aee0): a two-column hero with a figure, one strip of the model's
// numbers, work cards with covers, the toolset as "tool | what it did" rows. What changed from
// July is the content, not the layout — every number and the figure are read from the current
// pipeline run, where July's were typed in from an older one — plus quieter type contrast fixes.
// Nav and footer come from PaperShell.
export default function FinalHome({ recentPosts, curve, metrics }: {
    recentPosts: any[];
    curve: { x: number; price: number }[];
    metrics: HomeMetrics | null;
}) {
    const { t, lang } = useLang();
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    // Stable per language: AreaFigure memoises its chart options on it.
    const ageLabel = useCallback((x: number) => (lang === 'tr' ? `${x} yaş` : `age ${x}`), [lang]);

    const cells = metrics ? [
        { v: metrics.listings.toLocaleString(loc), k: L('Modellenen ilan', 'Listings modelled') },
        { v: metrics.r2.toFixed(4), k: L('Çapraz-doğrulanmış R²', 'Cross-validated R²'), accent: true },
        { v: lang === 'tr' ? `%${metrics.mape.toFixed(2)}` : `${metrics.mape.toFixed(2)}%`, k: L('Out-of-fold MAPE', 'Out-of-fold MAPE') },
        { v: '₺' + Math.round(metrics.mae / 1000).toLocaleString(loc) + 'K', k: L('Out-of-fold MAE', 'Out-of-fold MAE') },
    ] : [];
    // One row per group, its tools on a single line.
    const skills = HOME_ARSENAL.map((g) => ({ group: g.group[lang], tools: g.tools }));

    return (
        <PaperShell>
            {/* HERO — the statement beside the model's own curve */}
            <section className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
                <div>
                    <p className="mb-6 font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-[#047857]">{t('home.heroEyebrow')}</p>
                    {/* The setup is muted and the payoff carries full ink. July's muted grey (#a8a7a0)
                        sat at 2.2:1; #86857e clears the 3:1 large-text floor. */}
                    <h1 className="m-0 mb-6 text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-[#1a1a1a] text-balance md:text-[56px]">
                        <span className="text-[#86857e]">{t('home.heroH1Lead')}</span> {t('home.heroH1Payoff')}
                    </h1>
                    <p className="m-0 mb-9 max-w-[480px] text-[18px] leading-[1.6] text-[#5f5f5a]">{t('home.heroSub')}</p>
                    <div className="flex flex-wrap items-center gap-5 md:gap-[22px]">
                        <Link href="#projects" onClick={(e) => jumpToSection(e, 'projects')} className="inline-flex h-[44px] items-center rounded-[10px] bg-[#1a1a1a] px-5 text-[14px] font-semibold text-[#f7f6f3] transition-opacity duration-200 hover:opacity-90">{t('home.viewWork')}</Link>
                        <Link href={localize('/about', lang)} className="text-[14px] font-medium text-[#1a1a1a] transition-colors duration-200 hover:text-[#047857]">{t('home.getInTouch')}</Link>
                        <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#5f5f5a] transition-colors duration-200 hover:text-[#1a1a1a]">GitHub ↗</a>
                    </div>
                </div>

                {/* July's card showed an older dataset marked "sample figure"; this is the median asking
                    price by vehicle age from the run the reports are built on. */}
                {curve.length > 1 && (
                    <figure className="m-0 rounded-xl border border-[#e9e7e2] bg-[#fdfcf9] p-5 pb-4 shadow-[0_1px_2px_rgba(40,40,30,0.04)]">
                        <figcaption className="mb-3.5 flex items-baseline justify-between gap-3">
                            <span className="text-[14px] font-semibold text-[#1a1a1a]">{t('home.figCaption')}</span>
                            {metrics && <span className="shrink-0 font-mono text-[11px] font-medium tracking-[0.05em] text-[#6b6a63]">{metrics.listings.toLocaleString(loc)} {L('ilan', 'listings')}</span>}
                        </figcaption>
                        <AreaFigure data={curve} variant="hero" xLabel={ageLabel} />
                    </figure>
                )}
            </section>

            {/* METRIC STRIP — the price model's four numbers, 5-fold out-of-fold */}
            {cells.length > 0 && (
                <section className="pb-[60px]">
                    <p className="mb-5 font-mono text-[12px] font-medium uppercase tracking-[0.15em] text-[#6b6a63]">{t('home.metricsLabel')}</p>
                    <div className="grid grid-cols-2 border-t border-[#e9e7e2] md:grid-cols-4">
                        {cells.map((m, i) => (
                            <div key={m.k} className={`border-[#e9e7e2] pb-4 pr-6 pt-[22px] ${i % 2 === 0 ? 'pl-0' : 'pl-6'} ${i % 4 === 0 ? 'md:pl-0' : 'md:pl-6'} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}>
                                <div className={`font-mono text-[22px] font-medium tabular-nums tracking-[-0.035em] md:text-[28px] ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.v}</div>
                                <div className="mt-1.5 text-[13px] text-[#6b6a63]">{m.k}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SELECTED WORK */}
            <section id="projects" className="scroll-mt-8 border-t border-[#e9e7e2] py-14">
                {/* This section is the whole list — there is no /projects index to point to. */}
                <h2 className="m-0 mb-3.5 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.workLabel')}</h2>
                {HOME_PROJECTS.map((p) => <ProjectCard key={p.title} project={p} curve={curve} xLabel={ageLabel} />)}
                <div className="border-t border-[#e9e7e2]" />
            </section>

            {/* TECHNICAL SKILLS — three group rows in July's two-column row style. No top border and
                no closing rule: the work list above already closes on one, and the footer opens on
                its own — July drew both and got two hairlines back to back at each seam. */}
            <section className="py-14">
                <h2 className="m-0 mb-3.5 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.arsenalLabel')}</h2>
                {skills.map((s) => (
                    <div key={s.group} className="grid grid-cols-1 gap-1.5 border-t border-[#e9e7e2] py-4 sm:grid-cols-[260px_1fr] sm:gap-7">
                        <span className="font-mono text-[13px] font-medium tracking-[0.02em] text-[#047857]">{s.group}</span>
                        {/* Each tool unbreakable, its separator glued to it: on a phone the line wraps only
                            after a "·" — never inside "TF-IDF+SVD", never leaving a dot at a line start. */}
                        <span className="text-[16px] leading-[1.6] text-[#33332f]">
                            {s.tools.map((tool, i) => (
                                <Fragment key={tool}>
                                    <span className="whitespace-nowrap">{tool}{i < s.tools.length - 1 ? ' ·' : ''}</span>
                                    {i < s.tools.length - 1 ? ' ' : ''}
                                </Fragment>
                            ))}
                        </span>
                    </div>
                ))}
            </section>

            {/* LATEST WRITING — gated with the blog: every row links to /blog/[slug] and the header
                to /blog, all of which answer 404 while the flag is off. */}
            {WRITING_ENABLED && (
                <section className="border-t border-[#e9e7e2] py-14">
                    <div className="mb-3.5 flex items-baseline justify-between">
                        <h2 className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.writingLabel')}</h2>
                        <Link href={localize('/blog', lang)} className="text-[14px] font-medium text-[#1a1a1a] transition-colors duration-200 hover:text-[#047857]">{t('home.allPosts')}</Link>
                    </div>
                    {recentPosts.length > 0 ? recentPosts.map((post) => (
                        <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group flex items-center gap-4 border-t border-[#e9e7e2] py-[18px] sm:gap-6">
                            <span className="shrink-0 font-mono text-[12px] font-medium tabular-nums text-[#565650]">{post.meta.date}</span>
                            <span className="flex-1 text-[15px] font-medium text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#047857] sm:text-[17px]">{post.meta.title}</span>
                            {post.meta.readTime && <span className="shrink-0 font-mono text-[13px] text-[#565650]">{post.meta.readTime} {t('blog.min')}</span>}
                        </Link>
                    )) : <p className="border-t border-[#e9e7e2] py-6 text-[15px] text-[#6b6a63]">{t('blog.empty')}</p>}
                </section>
            )}
        </PaperShell>
    );
}
