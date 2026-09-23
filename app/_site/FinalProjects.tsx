"use client";

import { ArrowUpRight } from 'lucide-react';
import { useLang } from './i18n';
import PaperShell from './PaperShell';
import { HOME_PROJECTS } from './home/content';
import ProjectTile from './home/ProjectTile';
import { site } from './site-config';

/** Work index, in the homepage's bento language. Each tile states its own case in full:
 *  what the project is, what it was built with, and the numbers it stands on — quoted from
 *  the project's report in home/content.ts, with the source named there. */
export default function FinalProjects() {
    const { t } = useLang();

    // Eyebrow reads the range off the work itself rather than a hardcoded span.
    const years = HOME_PROJECTS.map((p) => p.year).sort();
    const span = years.length && years[0] !== years[years.length - 1] ? `${years[0]}–${years[years.length - 1]}` : years[0];

    return (
        <PaperShell>
            <div className="font-text">
                <header className="mt-6 rounded-2xl border border-site-line bg-site-card p-7 md:mt-8 md:p-10">
                    <p className="m-0 mb-5 text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">
                        {t('home.workLabel')}{span ? ` · ${span}` : ''}
                    </p>
                    <h1 className="m-0 mb-4 max-w-[760px] font-display text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-site-ink text-balance sm:text-[42px] lg:text-[48px]">
                        {t('projects.h1')}
                    </h1>
                    <p className="m-0 max-w-[600px] text-[16px] leading-[1.6] text-site-ink-2 md:text-[17px]">{t('projects.lede')}</p>
                </header>

                {/* The live system spans the row; the four others pair up beneath it. */}
                <section className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                    {HOME_PROJECTS.map((p, i) => (
                        <ProjectTile key={p.title} p={p} variant="detailed" className={i === 0 ? 'md:col-span-2' : ''} />
                    ))}
                </section>

                <div className="mt-4 mb-16 flex flex-col gap-3 rounded-2xl border border-site-line bg-site-card p-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
                    <p className="m-0 max-w-[480px] text-[15px] leading-[1.6] text-site-muted">{t('projects.more')}</p>
                    <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-site-accent transition-colors duration-200 hover:text-site-ink">
                        GitHub <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                </div>
            </div>
        </PaperShell>
    );
}
