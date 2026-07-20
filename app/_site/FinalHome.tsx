"use client";

import Link from 'next/link';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { HOME_RIBBON, HOME_PROJECTS, HOME_ARSENAL } from './home/content';
import { site } from './site-config';

// Editorial homepage: a full-width statement instead of a hero chart, an identity ribbon
// instead of scattered KPIs, and a numbered work index instead of chart-cover cards — each
// project row carries its own headline metric. Nav and footer come from PaperShell.
export default function FinalHome({ recentPosts }: { recentPosts: any[] }) {
    const { t, lang } = useLang();

    // The ribbon used to carry a computed "Work · N projects" cell, and the section header
    // printed the same count again below it. With a focused body of work those counters only
    // ever advertised how few entries there are, so the page states what the work IS instead.
    return (
        <PaperShell>
            {/* HERO — statement only, no figure */}
            <section className="pt-16 pb-10 md:pt-24 md:pb-12">
                <p className="mb-7 font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-[#047857]">{t('home.heroEyebrow')}</p>
                {/* The setup is muted and the payoff carries full ink — the emphasis used to run the
                    other way, which put the four words that make the argument at 2.2:1 contrast.
                    #86857e clears the 3:1 large-text floor and is already the palette's meta grey. */}
                <h1 className="m-0 mb-7 max-w-[960px] text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-[#1a1a1a] text-balance sm:text-[62px] lg:text-[80px] lg:leading-[0.98] lg:tracking-[-0.045em]">
                    <span className="text-[#86857e]">{t('home.heroH1Lead')}</span> {t('home.heroH1Payoff')}
                </h1>
                <div className="grid max-w-[1000px] grid-cols-1 items-end gap-7 md:grid-cols-[1fr_auto] md:gap-12">
                    <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-[#5f5f5a] md:text-[20px]">{t('home.heroSub')}</p>
                    {/* The deployed model leads: it is the one asset a reader can test rather than take
                        on trust. Four nowrap items never fit one mobile line, so the row wraps. */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 whitespace-nowrap">
                        <Link href={localize('/projects/car-price/predict', lang)} className="inline-flex h-[44px] items-center rounded-[9px] bg-[#1a1a1a] px-[22px] text-[14px] font-semibold text-[#f7f6f3] transition-opacity hover:opacity-90">{t('home.tryModel')}</Link>
                        <Link href="#work" className="text-[14px] font-medium text-[#1a1a1a]">{t('home.viewWork')}</Link>
                        <Link href={localize('/about', lang)} className="text-[14px] font-medium text-[#1a1a1a]">{t('home.getInTouch')}</Link>
                        <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#5f5f5a] transition-colors hover:text-[#1a1a1a]">GitHub ↗</a>
                    </div>
                </div>
            </section>

            {/* IDENTITY RIBBON — one cohesive line, even weight.
                The separators are the container's own background showing through a 1px grid gap,
                not per-cell borders: a border-l picked by array index paints a stray vertical bar
                on the left edge of every wrapped row, which is exactly what mobile used to show. */}
            <div className="grid grid-cols-1 gap-px border-y border-[#e9e7e2] bg-[#e9e7e2] sm:grid-cols-3">
                {HOME_RIBBON.map((r) => (
                    <div key={r.label.en} className="flex items-center gap-[9px] bg-[#f7f6f3] px-4 py-3.5 md:px-[22px] md:py-4">
                        {'live' in r && r.live && (
                            <span className="relative h-[7px] w-[7px] shrink-0" aria-hidden="true">
                                <span className="absolute inset-0 rounded-full bg-[#059669] motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]" />
                                <span className="absolute inset-0 rounded-full bg-[#059669]" />
                            </span>
                        )}
                        <div>
                            <div className="mb-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a9a92]">{r.label[lang]}</div>
                            <div className={`text-[14px] font-medium ${'accent' in r && r.accent ? 'text-[#047857]' : 'text-[#33332f]'}`}>{r.value[lang]}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SELECTED WORK — the anchor lives here, not on the ribbon above: "View work" should
                land on the work, not on a strip of metadata. */}
            <section id="work" className="scroll-mt-8 pb-10 pt-14">
                <h2 className="m-0 mb-2 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.workLabel')}</h2>

                {HOME_PROJECTS.map((p, i) => {
                    const live = p.kind === 'live';
                    return (
                        <div
                            key={p.title}
                            className="group relative grid grid-cols-1 gap-4 border-t border-[#e9e7e2] py-8 pl-2 pr-2 transition-colors hover:bg-[#fdfcf9] sm:grid-cols-[104px_1fr] sm:items-stretch sm:gap-9 sm:py-9 sm:pr-5"
                        >
                            {/* Rail: a left column from sm up (index, badge, metric pinned to the bottom).
                                Below sm there is no room for a 104px column — the badge alone is wider —
                                so it lays itself out as one header line instead: index · badge · metric right. */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:h-full sm:flex-col sm:flex-nowrap sm:items-start sm:gap-0">
                                <div className="text-[26px] font-semibold leading-[0.9] tracking-[-0.043em] text-[#e0ddd6] sm:mb-5 sm:text-[46px]">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <span className={`inline-flex w-max items-center gap-1.5 rounded-[6px] border px-2 py-[3px] font-mono text-[10px] font-medium tracking-[0.05em] ${live ? 'border-[#05966966] bg-[#0596691a] text-[#047857]' : 'border-[#d8d6d0] text-[#565650]'}`}>
                                    <span className="relative h-[5px] w-[5px] shrink-0" aria-hidden="true">
                                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-[#059669] motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]' : 'rounded-[1px] bg-[#86857e]'}`} />
                                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-[#059669]' : 'rounded-[1px] bg-[#86857e]'}`} />
                                    </span>
                                    {t(live ? 'home.live' : 'home.case')}
                                </span>
                                <div className="ml-auto text-right sm:ml-0 sm:mt-auto sm:pt-5 sm:text-left">
                                    <div className="font-mono text-[17px] font-medium tabular-nums tracking-[-0.025em] text-[#1a1a1a] sm:text-[20px]">{p.metric}</div>
                                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.03em] text-[#86857e] sm:mt-1">{p.metricLabel[lang]}</div>
                                </div>
                            </div>

                            {/* Body. The title is the row's real link and its ::after overlay makes the
                                whole row clickable — the row can't be one big <a> any more, because the
                                per-surface links below would then be anchors nested inside an anchor. */}
                            <div>
                                <div className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#047857]">{p.domain}</div>
                                <h3 className="m-0 mb-3.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.038em] text-[#1a1a1a] sm:text-[34px]">
                                    <Link href={localize(p.href, lang)} className="after:absolute after:inset-0 after:content-['']">{p.title}</Link>
                                </h3>
                                <p className="m-0 mb-[22px] max-w-[600px] text-[16px] leading-[1.6] text-[#5f5f5a] sm:text-[17px]">{p.description[lang]}</p>
                                {/* The surfaces this one system actually ships — the row used to spend this
                                    line on the stack string, which the arsenal grid repeats 200px below. */}
                                <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#ece9e3] pt-[18px]">
                                    {p.surfaces.map((s) => (
                                        <Link key={s.href} href={localize(s.href, lang)} className="text-[13px] font-medium text-[#047857] transition-colors hover:text-[#1a1a1a]">
                                            {s.label[lang]} <span aria-hidden="true">↗</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div className="border-t border-[#e9e7e2]" />
            </section>

            {/* TECHNICAL ARSENAL — grouped, three columns */}
            <section className="border-t border-[#e9e7e2] py-14">
                <h2 className="m-0 mb-2 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.arsenalLabel')}</h2>
                <p className="m-0 mb-8 max-w-[560px] text-[16px] text-[#86857e]">{t('home.arsenalSub')}</p>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-9">
                    {HOME_ARSENAL.map((grp) => (
                        <div key={grp.group.en}>
                            <div className="mb-4 flex items-center gap-[9px] border-b border-[#e4e2dd] pb-3">
                                <span className="h-1.5 w-1.5 rounded-[2px] bg-[#047857]" aria-hidden="true" />
                                <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1a1a1a]">{grp.group[lang]}</span>
                            </div>
                            {grp.items.map((it) => (
                                <div key={it.tool} className="border-b border-[#f0eee9] py-[11px]">
                                    <div className="font-mono text-[13px] font-medium text-[#047857]">{it.tool}</div>
                                    <div className="mt-[3px] text-[13px] leading-[1.45] text-[#86857e]">{it.did[lang]}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {/* LATEST WRITING — compact rows */}
            <section className="border-t border-[#e9e7e2] py-14">
                <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-[#5f5f5a]">{t('home.writingLabel')}</h2>
                    <Link href={localize('/blog', lang)} className="text-[14px] font-medium text-[#1a1a1a] transition-colors hover:text-[#047857]">{t('home.allPosts')}</Link>
                </div>
                {recentPosts.length > 0 ? recentPosts.map((post) => (
                    <Link key={post.slug} href={localize(`/blog/${post.slug}`, lang)} className="group flex items-center gap-4 rounded-[8px] border-t border-[#e9e7e2] px-2 py-[18px] transition-colors hover:bg-[#fdfcf9] sm:gap-6">
                        {/* No fixed width: an ISO date is 72px in Geist Mono at 12px, so w-[64px] overflowed
                            into the gap. Mono + tabular-nums keeps the column aligned across posts anyway. */}
                        <span className="shrink-0 font-mono text-[12px] font-medium tabular-nums text-[#565650]">{post.meta.date}</span>
                        <span className="flex-1 text-[15px] font-medium text-[#1a1a1a] transition-colors group-hover:text-[#047857] sm:text-[17px]">{post.meta.title}</span>
                        {post.meta.readTime && <span className="shrink-0 font-mono text-[13px] text-[#86857e]">{post.meta.readTime} min</span>}
                    </Link>
                )) : <p className="border-t border-[#e9e7e2] py-6 text-[15px] text-[#86857e]">{t('blog.empty')}</p>}
            </section>
        </PaperShell>
    );
}
