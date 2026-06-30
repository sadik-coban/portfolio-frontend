"use client";

import { useLang } from './i18n';
import PaperShell from './PaperShell';
import { ProjectCard } from './home/ProjectCard';
import { HOME_PROJECTS } from './home/content';
import { site } from './site-config';

export default function FinalProjects({ priceByYear }: { priceByYear: { year: number; price: number }[] }) {
    const { t } = useLang();

    return (
        <PaperShell>
            <header className="py-14 lg:py-16 max-w-2xl">
                <p className="mb-4 font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-[#047857]">{t('home.workLabel')}</p>
                <h1 className="m-0 mb-5 text-[40px] md:text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-[#1a1a1a]">{t('projects.title')}</h1>
                <p className="m-0 text-[18px] leading-[1.6] text-[#5f5f5a]">{t('projects.subtitle')}</p>
            </header>

            <section className="pb-8">
                {HOME_PROJECTS.map((p) => <ProjectCard key={p.title} project={p} priceByYear={priceByYear} />)}
                <div className="flex flex-col gap-3 border-t border-[#e9e7e2] py-7 sm:flex-row sm:items-center sm:justify-between">
                    <p className="m-0 max-w-[440px] text-[15px] leading-[1.6] text-[#86857e]">{t('projects.more')}</p>
                    <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[14px] font-medium text-[#1a1a1a] transition-colors hover:text-[#047857]">GitHub ↗</a>
                </div>
            </section>
        </PaperShell>
    );
}
