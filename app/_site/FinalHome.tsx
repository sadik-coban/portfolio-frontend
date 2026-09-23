"use client";

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { HOME_RIBBON, HOME_PROJECTS, HOME_ARSENAL } from './home/content';
import ProjectTile from './home/ProjectTile';
import { site } from './site-config';
import { WRITING_ENABLED } from './writing-config';

// Bento homepage (design-system/sadik-coban/MASTER.md): modular tiles on a 12-column grid.
// Intro tiles instead of a full-width statement, five project tiles each carrying a figure
// drawn from the project's own numbers, and the toolset as chips. Nav and footer: PaperShell.

// Where each project sits, in HOME_PROJECTS order. Top row: the live system wide, the LLM
// study narrow; bottom row: three even tiles. At md (two columns) the feature spans both.
const SPANS = ['md:col-span-2 lg:col-span-7', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'];

const TILE = 'rounded-2xl border border-site-line bg-site-card';

export default function FinalHome({ recentPosts }: { recentPosts: any[] }) {
    const { t, lang } = useLang();
    const status = HOME_RIBBON.find((r) => r.live);
    const facts = HOME_RIBBON.filter((r) => !r.live);
    const external = [
        { label: 'GitHub', href: site.social.github },
        { label: 'LinkedIn', href: site.social.linkedin },
        { label: 'Email', href: `mailto:${site.social.email}` },
    ];

    return (
        <PaperShell>
            <div className="font-text">
                {/* INTRO — one identity tile, and a column of two small ones beside it */}
                <section className="grid grid-cols-1 gap-4 pt-6 md:pt-8 lg:grid-cols-12">
                    <div className={`${TILE} flex flex-col p-7 md:p-10 lg:col-span-8`}>
                        <p className="m-0 mb-5 text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{t('home.heroEyebrow')}</p>
                        {/* The setup is muted and the payoff carries full ink, so the words that make the
                            argument are the darkest on the tile. --site-muted is 7:1 on the card. */}
                        <h1 className="m-0 mb-5 max-w-[720px] font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-site-ink text-balance sm:text-[44px] lg:text-[52px]">
                            <span className="text-site-muted">{t('home.heroH1Lead')}</span> {t('home.heroH1Payoff')}
                        </h1>
                        <p className="m-0 max-w-[560px] text-[16px] leading-[1.6] text-site-ink-2 md:text-[17px]">{t('home.heroSub')}</p>
                        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 whitespace-nowrap md:mt-auto md:pt-8">
                            <Link href="#work" className="inline-flex h-11 items-center gap-2 rounded-xl bg-site-primary px-5 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90">
                                {t('home.viewWork')}
                            </Link>
                            <Link href={localize('/about', lang)} className="text-[14px] font-medium text-site-ink transition-colors duration-200 hover:text-site-accent">{t('home.getInTouch')}</Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
                        {status && (
                            <div className={`${TILE} flex flex-col justify-between gap-6 p-6`}>
                                <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{status.label[lang]}</div>
                                <div className="flex items-center gap-3">
                                    <span className="relative h-2.5 w-2.5 shrink-0" aria-hidden="true">
                                        <span className="absolute inset-0 rounded-full bg-site-live motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]" />
                                        <span className="absolute inset-0 rounded-full bg-site-live" />
                                    </span>
                                    <span className="font-display text-[24px] font-semibold tracking-[-0.02em] text-site-ink">{status.value[lang]}</span>
                                </div>
                            </div>
                        )}
                        <div className={`${TILE} flex flex-col gap-5 p-6`}>
                            <dl className="m-0 grid grid-cols-2 gap-4">
                                {facts.map((r) => (
                                    <div key={r.label.en}>
                                        <dt className="text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{r.label[lang]}</dt>
                                        <dd className="m-0 mt-1 text-[15px] font-medium text-site-ink">{r.value[lang]}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-auto flex flex-wrap gap-2">
                                {external.map((e) => (
                                    <a
                                        key={e.label}
                                        href={e.href}
                                        {...(e.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                                        className="inline-flex h-9 items-center gap-1 rounded-full border border-site-line px-3.5 text-[13px] font-medium text-site-ink-2 transition-colors duration-200 hover:border-site-ink/30 hover:text-site-ink"
                                    >
                                        {e.label} <ArrowUpRight size={13} aria-hidden="true" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* WORK — five tiles; the anchor lands here, not on the intro */}
                <section id="work" className="scroll-mt-6 pt-14">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.025em] text-site-ink sm:text-[32px]">{t('home.workLabel')}</h2>
                        <Link href={localize('/projects', lang)} className="inline-flex items-center gap-1 text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">
                            {t('home.work.viewAll')} <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
                        {HOME_PROJECTS.map((p, i) => (
                            <ProjectTile key={p.title} p={p} variant={i === 0 ? 'feature' : 'standard'} className={SPANS[i] ?? 'lg:col-span-4'} />
                        ))}
                    </div>
                </section>

                {/* TOOLSET — three compact tiles of chips */}
                <section className="pt-14 pb-16">
                    <h2 className="m-0 mb-5 font-display text-[28px] font-semibold tracking-[-0.025em] text-site-ink sm:text-[32px]">{t('home.arsenalLabel')}</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {HOME_ARSENAL.map((grp) => (
                            <div key={grp.group.en} className={`${TILE} p-6`}>
                                <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{grp.group[lang]}</div>
                                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                                    {grp.tools.map((tool) => (
                                        <li key={tool} className="rounded-full bg-site-bg px-3 py-1.5 text-[13px] font-medium text-site-ink">{tool}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* LATEST WRITING — gated with the blog: every row links to /blog/[slug] and the
                    header to /blog, all of which answer 404 while the flag is off. */}
                {WRITING_ENABLED && (
                <section className="pb-16">
                    <div className="mb-5 flex items-end justify-between gap-6">
                        <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.025em] text-site-ink sm:text-[32px]">{t('home.writingLabel')}</h2>
                        <Link href={localize('/blog', lang)} className="text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">{t('home.allPosts')}</Link>
                    </div>
                    <div className={`${TILE} divide-y divide-site-line overflow-hidden`}>
                        {recentPosts.length > 0 ? recentPosts.map((post) => (
                            <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group flex items-center gap-4 px-6 py-5 transition-colors duration-200 hover:bg-site-bg sm:gap-6">
                                <span className="shrink-0 font-mono text-[12px] font-medium tabular-nums text-site-muted">{post.meta.date}</span>
                                <span className="flex-1 text-[15px] font-medium text-site-ink transition-colors duration-200 group-hover:text-site-accent sm:text-[17px]">{post.meta.title}</span>
                                {post.meta.readTime && <span className="shrink-0 text-[13px] text-site-muted">{post.meta.readTime} {t('blog.min')}</span>}
                            </Link>
                        )) : <p className="m-0 px-6 py-6 text-[15px] text-site-muted">{t('blog.empty')}</p>}
                    </div>
                </section>
                )}
            </div>
        </PaperShell>
    );
}
