"use client";

import { ArrowUpRight } from 'lucide-react';
import { useLang } from '../i18n';
import { type HomeProject, localized } from './content';
import ProjectLink, { ProjectText } from './ProjectLink';
import { MiniFigure } from './MiniFigure';

/**
 * One project as a bento tile — shared by the homepage (feature / standard) and /projects
 * (detailed: full description, topic chips, the three-number metric stack and the year).
 *
 * A tile with an href is one click target: the title link's ::after covers the tile, the
 * surface links sit above it on z-10, and the ring on focus is drawn around the whole tile.
 * A tile without one has nothing published yet — no overlay, no hover lift, and a "coming
 * soon" badge in place of a link that would lead nowhere.
 */
export default function ProjectTile({ p, variant = 'standard', className = '' }: {
    p: HomeProject;
    variant?: 'feature' | 'standard' | 'detailed';
    className?: string;
}) {
    const { t, lang } = useLang();
    const linked = Boolean(p.href);
    const live = p.kind === 'live';
    const detailed = variant === 'detailed';
    const kindLabel = t(live ? 'home.live' : p.kind === 'package' ? 'home.package' : 'home.study');

    return (
        <article
            className={`group relative flex flex-col rounded-2xl border border-site-line bg-site-card p-6 md:p-7 has-[.tile-link:focus-visible]:ring-2 has-[.tile-link:focus-visible]:ring-site-accent ${linked ? 'transition-[box-shadow,border-color] duration-200 hover:border-site-ink/20 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]' : ''} ${className}`}
        >
            {/* Badges get their own row: beside a long domain label they wrapped one at a time,
                leaving "coming soon" stranded on a line of its own. */}
            <header className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] ${live ? 'border-site-live/40 text-site-ink' : 'border-site-line text-site-muted'}`}>
                    <span className="relative h-1.5 w-1.5 shrink-0" aria-hidden="true">
                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-site-live motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]' : 'rounded-[1px] bg-site-muted'}`} />
                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-site-live' : 'rounded-[1px] bg-site-muted'}`} />
                    </span>
                    {kindLabel}
                </span>
                {!linked && (
                    <span className="inline-flex items-center rounded-full border border-dashed border-site-muted/50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-site-ink-2">
                        {t('home.soon')}
                    </span>
                )}
            </header>

            <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-site-muted">{p.domain}</div>
            <h3 className={`m-0 mb-2.5 font-display font-semibold leading-[1.12] tracking-[-0.025em] text-site-ink ${variant === 'feature' || detailed ? 'text-[26px] md:text-[32px]' : 'text-[22px] md:text-[24px]'}`}>
                {p.href ? (
                    <ProjectLink
                        href={p.href}
                        lang={lang}
                        className="tile-link transition-colors duration-200 group-hover:text-site-accent focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                    >
                        {p.title}
                    </ProjectLink>
                ) : p.title}
            </h3>
            <p className={`m-0 text-[15px] leading-[1.6] text-site-ink-2 ${detailed ? 'max-w-[640px] md:text-[16px]' : ''}`}>
                <ProjectText value={(detailed ? p.description : p.summary)[lang]} lang={lang} linkClassName="text-site-accent hover:text-site-ink" />
            </p>

            {detailed && p.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-site-bg px-2.5 py-1 text-[12px] font-medium text-site-ink-2">{tag}</span>
                    ))}
                </div>
            )}

            {/* Figure — or, for a study with no final numbers, a plain statement that there are
                none yet. A placeholder chart would read as a result. */}
            <div className={p.figure ? 'mt-6' : 'mt-6 flex flex-1 flex-col'}>
                {p.figure ? (
                    <MiniFigure figure={p.figure} lang={lang} schematic={t('home.schematic')} />
                ) : (
                    <div className="flex min-h-[132px] flex-1 items-center justify-center rounded-xl border border-dashed border-site-line bg-site-bg/60 px-4 text-center text-[13px] leading-[1.5] text-site-muted">
                        {t('home.resultsSoon')}
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-6">
                {detailed && p.metrics.length > 0 ? (
                    <dl className="m-0 grid grid-cols-1 gap-3 border-t border-site-line pt-5 sm:grid-cols-3">
                        {p.metrics.map((m) => (
                            <div key={m.label.en}>
                                <dt className="sr-only">{m.label[lang]}</dt>
                                <dd className={`m-0 font-mono text-[20px] font-medium tabular-nums tracking-[-0.02em] ${m.accent ? 'text-site-ink' : 'text-site-ink-2'}`}>{localized(m.value, lang)}</dd>
                                <dd aria-hidden="true" className="m-0 mt-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-site-muted">{m.label[lang]}</dd>
                            </div>
                        ))}
                    </dl>
                ) : !detailed && p.metric && p.metricLabel ? (
                    <div className="border-t border-site-line pt-5">
                        <div className="font-mono text-[28px] font-medium tabular-nums leading-none tracking-[-0.03em] text-site-ink">{localized(p.metric, lang)}</div>
                        <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-site-muted">{p.metricLabel[lang]}</div>
                    </div>
                ) : null}

                {p.surfaces.length > 0 && (
                    <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {p.surfaces.map((s) => (
                            <ProjectLink key={s.href} href={s.href} lang={lang} className="inline-flex items-center gap-1 text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">
                                {s.label[lang]} <ArrowUpRight size={14} aria-hidden="true" />
                            </ProjectLink>
                        ))}
                    </div>
                )}

                {detailed && (
                    <div className="mt-5 font-mono text-[12px] tabular-nums text-site-muted">{p.year} · {p.stack}</div>
                )}
            </footer>
        </article>
    );
}
