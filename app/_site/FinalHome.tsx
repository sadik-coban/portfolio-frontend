"use client";

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { HOME_RIBBON, HOME_PROJECTS, HOME_ARSENAL } from './home/content';
import ProjectLink, { ProjectText } from './home/ProjectLink';
import { site } from './site-config';
import { WRITING_ENABLED } from './writing-config';

// Swiss-minimal homepage (design-system/sadik-coban/MASTER.md): a full-width statement, an
// identity ribbon, a numbered work index on a 12-column grid, and the arsenal. Monochrome,
// one blue accent that only ever marks a link. Nav and footer come from PaperShell.
export default function FinalHome({ recentPosts }: { recentPosts: any[] }) {
    const { t, lang } = useLang();

    // The ribbon used to carry a computed "Work · N projects" cell, and the section header
    // printed the same count again below it. With a focused body of work those counters only
    // ever advertised how few entries there are, so the page states what the work IS instead.
    return (
        <PaperShell>
            <div className="font-text">
                {/* HERO — statement only, no figure */}
                <section className="pt-16 pb-12 md:pt-28 md:pb-16">
                    <p className="mb-8 flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.14em] text-site-muted">
                        <span className="h-px w-8 bg-site-ink" aria-hidden="true" />
                        {t('home.heroEyebrow')}
                    </p>
                    {/* The setup is muted and the payoff carries full ink, so the four words that make
                        the argument are the darkest on the page. --site-muted is 7:1 on the ground. */}
                    <h1 className="m-0 mb-12 max-w-[1040px] font-display text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-site-ink text-balance sm:text-[64px] lg:text-[88px] lg:leading-[0.96] lg:tracking-[-0.045em]">
                        <span className="text-site-muted">{t('home.heroH1Lead')}</span> {t('home.heroH1Payoff')}
                    </h1>
                    <div className="grid grid-cols-1 gap-8 border-t border-site-line pt-8 md:grid-cols-12 md:gap-6">
                        <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-site-ink-2 md:col-span-7 md:text-[19px]">{t('home.heroSub')}</p>
                        {/* Three nowrap items don't fit one 327px line, so the row wraps below sm. */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 whitespace-nowrap md:col-span-5 md:justify-end md:self-end">
                            <Link href="#work" className="inline-flex h-11 items-center rounded-[8px] bg-site-primary px-6 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90">{t('home.viewWork')}</Link>
                            <Link href={localize('/about', lang)} className="text-[14px] font-medium text-site-ink transition-colors duration-200 hover:text-site-accent">{t('home.getInTouch')}</Link>
                            <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[14px] font-medium text-site-muted transition-colors duration-200 hover:text-site-accent">
                                GitHub <ArrowUpRight size={14} aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* IDENTITY RIBBON — one cohesive line, even weight.
                    The separators are the container's own background showing through a 1px grid gap,
                    not per-cell borders: a border-l picked by array index paints a stray vertical bar
                    on the left edge of every wrapped row, which is exactly what mobile used to show. */}
                <div className="grid grid-cols-1 gap-px border-y border-site-line bg-site-line sm:grid-cols-3">
                    {HOME_RIBBON.map((r) => (
                        <div key={r.label.en} className="flex items-center gap-3 bg-site-bg px-4 py-4 md:px-6 md:py-5">
                            {'live' in r && r.live && (
                                <span className="relative h-2 w-2 shrink-0" aria-hidden="true">
                                    <span className="absolute inset-0 rounded-full bg-site-live motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]" />
                                    <span className="absolute inset-0 rounded-full bg-site-live" />
                                </span>
                            )}
                            <div>
                                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-site-muted">{r.label[lang]}</div>
                                <div className={`text-[15px] font-medium ${'accent' in r && r.accent ? 'text-site-ink' : 'text-site-ink-2'}`}>{r.value[lang]}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SELECTED WORK — the anchor lives here, not on the ribbon above: "View work" should
                    land on the work, not on a strip of metadata. */}
                <section id="work" className="scroll-mt-8 pt-16 md:pt-20">
                    <h2 className="m-0 mb-8 font-display text-[28px] font-bold tracking-[-0.03em] text-site-ink sm:text-[36px]">{t('home.workLabel')}</h2>

                    {HOME_PROJECTS.map((p, i) => {
                        const live = p.kind === 'live';
                        return (
                            // Below md: index + badge on the left of one header line, the metric on its
                            // right, the body underneath. From md: a 12-column row — rail 2, body 7, metric 3.
                            <div
                                key={p.title}
                                className="group relative grid grid-cols-[1fr_auto] gap-x-4 gap-y-5 border-t border-site-line px-2 py-8 transition-colors duration-200 hover:bg-site-card md:grid-cols-12 md:gap-x-6 md:px-4 md:py-10"
                            >
                                <div className="col-start-1 row-start-1 flex items-center gap-3 md:col-span-2 md:flex-col md:items-start md:gap-4">
                                    <div className="font-display text-[15px] font-bold tabular-nums text-site-ink md:text-[18px]">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <span className={`inline-flex w-max items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] ${live ? 'border-site-live/40 text-site-ink' : 'border-site-line text-site-muted'}`}>
                                        <span className="relative h-1.5 w-1.5 shrink-0" aria-hidden="true">
                                            <span className={`absolute inset-0 ${live ? 'rounded-full bg-site-live motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]' : 'rounded-[1px] bg-site-muted'}`} />
                                            <span className={`absolute inset-0 ${live ? 'rounded-full bg-site-live' : 'rounded-[1px] bg-site-muted'}`} />
                                        </span>
                                        {t(live ? 'home.live' : p.kind === 'package' ? 'home.package' : 'home.case')}
                                    </span>
                                </div>

                                <div className="col-start-2 row-start-1 text-right md:col-span-3 md:col-start-10">
                                    <div className="font-mono text-[20px] font-medium tabular-nums tracking-[-0.03em] text-site-ink md:text-[34px]">{p.metric}</div>
                                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-site-muted">{p.metricLabel[lang]}</div>
                                </div>

                                {/* Body. The title is the row's real link and its ::after overlay makes the
                                    whole row clickable — the row can't be one big <a> any more, because the
                                    per-surface links below would then be anchors nested inside an anchor. */}
                                <div className="col-span-2 row-start-2 md:col-span-7 md:col-start-3 md:row-start-1">
                                    <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-site-muted">{p.domain}</div>
                                    <h3 className="m-0 mb-3 font-display text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-site-ink transition-colors duration-200 group-hover:text-site-accent sm:text-[34px]">
                                        <ProjectLink href={p.href} lang={lang} className="after:absolute after:inset-0 after:content-['']">{p.title}</ProjectLink>
                                    </h3>
                                    <p className="m-0 mb-6 max-w-[600px] text-[16px] leading-[1.6] text-site-ink-2 sm:text-[17px]">
                                        <ProjectText value={p.description[lang]} lang={lang} linkClassName="text-site-accent hover:text-site-ink" />
                                    </p>
                                    {/* The surfaces this one system actually ships — the row used to spend this
                                        line on the stack string, which the arsenal grid repeats below. */}
                                    <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-site-line pt-4">
                                        {p.surfaces.map((s) => (
                                            <ProjectLink key={s.href} href={s.href} lang={lang} className="inline-flex items-center gap-1 text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">
                                                {s.label[lang]} <ArrowUpRight size={14} aria-hidden="true" />
                                            </ProjectLink>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="border-t border-site-line" />
                </section>

                {/* TECHNICAL ARSENAL — grouped, three columns, each group under a 2px ink rule. No top
                    border: the work index already closes on its own rule right above. */}
                <section className="py-16 md:py-20">
                    <div className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-6">
                        <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-site-ink sm:text-[36px] md:col-span-5">{t('home.arsenalLabel')}</h2>
                        <p className="m-0 max-w-[520px] text-[16px] leading-[1.6] text-site-muted md:col-span-7 md:self-end">{t('home.arsenalSub')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {HOME_ARSENAL.map((grp) => (
                            <div key={grp.group.en}>
                                <div className="border-t-2 border-site-ink pt-3 pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-site-ink">{grp.group[lang]}</div>
                                {grp.items.map((it) => (
                                    <div key={it.tool} className="border-b border-site-line py-3">
                                        <div className="text-[15px] font-medium text-site-ink">{it.tool}</div>
                                        <div className="mt-1 text-[14px] leading-[1.5] text-site-muted">{it.did[lang]}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>

                {/* LATEST WRITING — compact rows. Gated with the blog: every row here links to
                    /blog/[slug] and the header to /blog, all of which answer 404 while the flag is off. */}
                {WRITING_ENABLED && (
                <section className="border-t border-site-line py-16 md:py-20">
                    <div className="mb-6 flex items-baseline justify-between gap-6">
                        <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-site-ink sm:text-[36px]">{t('home.writingLabel')}</h2>
                        <Link href={localize('/blog', lang)} className="text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">{t('home.allPosts')}</Link>
                    </div>
                    {recentPosts.length > 0 ? recentPosts.map((post) => (
                        <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group flex items-center gap-4 border-t border-site-line px-2 py-5 transition-colors duration-200 hover:bg-site-card sm:gap-6">
                            {/* No fixed width: mono + tabular-nums keeps the date column aligned across posts. */}
                            <span className="shrink-0 font-mono text-[12px] font-medium tabular-nums text-site-muted">{post.meta.date}</span>
                            <span className="flex-1 text-[15px] font-medium text-site-ink transition-colors duration-200 group-hover:text-site-accent sm:text-[17px]">{post.meta.title}</span>
                            {post.meta.readTime && <span className="shrink-0 text-[13px] text-site-muted">{post.meta.readTime} {t('blog.min')}</span>}
                        </Link>
                    )) : <p className="border-t border-site-line py-6 text-[15px] text-site-muted">{t('blog.empty')}</p>}
                </section>
                )}
            </div>
        </PaperShell>
    );
}
