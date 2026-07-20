"use client";

import Link from 'next/link';
import { useLang, localize } from './i18n';
import PaperShell from './PaperShell';
import { HOME_PROJECTS } from './home/content';
import { site } from './site-config';

type Bi = { en: string; tr: string };

/** Work index. Each row states its own case: what the project is, what it was built with,
 *  and the three numbers it stands on — read from public/site_data.json server-side, so
 *  the index can't quote figures the analysis behind it no longer reports. */
export default function FinalProjects({ stats }: { stats: Record<string, Bi> }) {
    const { t, lang } = useLang();

    // Eyebrow reads the range off the work itself rather than a hardcoded span.
    const years = HOME_PROJECTS.map((p) => p.year).sort();
    const span = years.length && years[0] !== years[years.length - 1] ? `${years[0]}–${years[years.length - 1]}` : years[0];

    return (
        <PaperShell>
            <header className="pt-14 pb-8 md:pt-[72px]">
                <p className="mb-5 font-mono text-[12px] font-medium uppercase tracking-[0.208em] text-[#047857] md:mb-6">
                    {t('home.workLabel')}{span ? ` · ${span}` : ''}
                </p>
                <h1 className="m-0 mb-5 max-w-[820px] text-[36px] font-bold leading-[1.04] tracking-[-0.04em] text-[#1a1a1a] text-balance sm:text-[46px] lg:text-[60px] lg:leading-[1.02] lg:tracking-[-0.05em]">
                    {t('projects.h1')}
                </h1>
                <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-[#5f5f5a] md:text-[19px]">{t('projects.lede')}</p>
            </header>

            <section className="pb-8">
                {HOME_PROJECTS.map((p, i) => {
                    const live = p.kind === 'live';
                    return (
                        <Link
                            key={p.title}
                            href={localize(p.href, lang)}
                            className="group block border-t border-[#e9e7e2] py-9 pl-2 pr-3 transition-colors hover:bg-[#fdfcf9] md:py-11 md:pr-6"
                        >
                            {/* index · domain · state · year */}
                            <div className="mb-5 flex flex-wrap items-center gap-x-3.5 gap-y-2">
                                <span className="font-mono text-[15px] font-semibold tabular-nums text-[#c4c2bb]">{String(i + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.136em] text-[#047857]">{p.domain}</span>
                                <span className={`inline-flex items-center gap-1.5 rounded-[6px] border px-[9px] py-[3px] font-mono text-[10px] font-medium tracking-[0.05em] ${live ? 'border-[#05966966] bg-[#0596691a] text-[#047857]' : 'border-[#d8d6d0] text-[#565650]'}`}>
                                    <span className="relative h-[5px] w-[5px] shrink-0" aria-hidden="true">
                                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-[#059669] motion-safe:animate-[pulseDot_2.4s_ease-in-out_infinite]' : 'rounded-[1px] bg-[#86857e]'}`} />
                                        <span className={`absolute inset-0 ${live ? 'rounded-full bg-[#059669]' : 'rounded-[1px] bg-[#86857e]'}`} />
                                    </span>
                                    {t(live ? 'home.live' : 'home.case')}
                                </span>
                                {/* ml-auto only once the line has room for it — below sm the year
                                    would wrap to its own line and hang right, orphaned from the meta. */}
                                <span className="font-mono text-[12px] tabular-nums text-[#86857e] sm:ml-auto">{p.year}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-12">
                                <div>
                                    <h2 className="m-0 mb-4 text-[26px] font-semibold leading-[1.08] tracking-[-0.042em] text-[#1a1a1a] sm:text-[32px] lg:text-[38px]">{p.title}</h2>
                                    <p className="m-0 mb-5 max-w-[560px] text-[16px] leading-[1.65] text-[#5f5f5a] sm:text-[17px]">{p.description[lang]}</p>
                                    <div className="flex flex-wrap gap-[7px]">
                                        {p.tags.map((tag) => (
                                            <span key={tag} className="rounded-[6px] border border-[#e4e2dd] bg-[#fdfcf9] px-2.5 py-1 font-mono text-[11px] font-medium text-[#565650]">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Metric stack — a column beside the copy on desktop, a block under it below lg.
                                    It stays a vertical list at every width: three across would leave the
                                    longest labels ("cross-validated R²") wrapping mid-token on a phone, and a
                                    two-column grid strands the third metric alone on a ragged second row. */}
                                <div className="border-t border-[#e9e7e2] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                                    {p.metrics.map((m) => {
                                        const value = m.stat ? stats[m.stat]?.[lang] : m.value;
                                        if (!value) return null;
                                        return (
                                            <div key={m.label.en} className="border-b border-[#f0eee9] py-2.5">
                                                <div className={`font-mono text-[19px] font-medium tabular-nums tracking-[-0.026em] ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{value}</div>
                                                <div className="mt-[3px] font-mono text-[10px] uppercase tracking-[0.03em] text-[#86857e]">{m.label[lang]}</div>
                                            </div>
                                        );
                                    })}
                                    <span className="mt-4 inline-block whitespace-nowrap text-[13px] font-medium text-[#047857]">
                                        {t('home.viewProject')} <span className="inline-block transition-transform group-hover:translate-x-0.5">↗</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                <div className="flex flex-col gap-3 border-t border-[#e9e7e2] py-7 sm:flex-row sm:items-center sm:justify-between">
                    <p className="m-0 max-w-[440px] text-[15px] leading-[1.6] text-[#86857e]">{t('projects.more')}</p>
                    <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[14px] font-medium text-[#1a1a1a] transition-colors hover:text-[#047857]">GitHub ↗</a>
                </div>
            </section>
        </PaperShell>
    );
}
