"use client";

import Link from 'next/link';
import { useLang, localize } from '../i18n';
import { AreaFigure, Choropleth } from './AreaFigure';
import type { HomeProject } from './content';

export function ProjectCard({ project, priceByYear }: { project: HomeProject; priceByYear: { year: number; price: number }[] }) {
    const { t, lang } = useLang();
    const isLive = project.kind === 'live';

    // The whole card is one link (matches the blog/journal cards); ↗ is just a hint.
    return (
        <Link
            href={localize(project.href, lang)}
            aria-label={project.title}
            className="group grid grid-cols-1 sm:grid-cols-[248px_1fr] items-center gap-6 sm:gap-8 border-t border-[#e9e7e2] py-7"
        >
            <div className="relative flex h-[150px] items-center justify-center overflow-hidden rounded-[10px] border border-[#e9e7e2] bg-[#f3f1ec] p-3.5">
                <span className="absolute left-3.5 top-3 font-mono text-[10px] font-medium tracking-[0.04em] text-[#86857e]">
                    {project.cover === 'choropleth' ? 'choropleth' : 'live API'}
                </span>
                {project.cover === 'chart' ? <div className="w-full h-full"><AreaFigure data={priceByYear} variant="thumb" /></div> : <Choropleth />}
            </div>

            <div>
                <div className="mb-2.5 flex items-center gap-3">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#86857e]">{project.domain}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isLive ? 'bg-emerald-500/10 text-[#047857]' : 'bg-[#86857e]/12 text-[#5f5f5a]'}`}>
                        <span className={isLive ? 'h-[5px] w-[5px] rounded-full bg-[#059669]' : 'h-[5px] w-[5px] rounded-[1px] bg-[#86857e]'} />
                        {isLive ? t('home.live') : t('home.case')}
                    </span>
                </div>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                    <h3 className="m-0 text-[21px] md:text-[23px] font-semibold tracking-[-0.026em] text-[#1a1a1a] transition-colors group-hover:text-[#047857]">{project.title}</h3>
                    <span aria-hidden="true" className="shrink-0 text-[18px] text-[#047857] transition-colors group-hover:text-[#1a1a1a]">↗</span>
                </div>
                <p className="m-0 mb-3.5 max-w-[640px] text-[15px] leading-[1.6] text-[#5f5f5a]">{project.description[lang]}</p>
                <span className="font-mono text-[12px] font-medium tracking-[0.02em] text-[#565650]">{project.stack}</span>
            </div>
        </Link>
    );
}
