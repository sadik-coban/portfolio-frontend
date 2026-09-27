"use client";

import { useLang } from '../i18n';
import { AreaFigure, Choropleth } from './AreaFigure';
import type { HomeProject } from './content';
import ProjectLink, { ProjectText } from './ProjectLink';

/**
 * One homepage work card, in the July layout: a 248px cover beside the text, the whole card one
 * click target. The target is the title link's ::after overlay rather than a wrapping <a> — a
 * description that credits someone (MFF's author) carries its own link, and anchors can't nest.
 *
 * The cover draws only what the project has data for: the car-price card gets the same age curve
 * as the hero, a package gets a typographic cover. A figure on a project with no dataset behind
 * it would be decoration posing as evidence.
 */
export function ProjectCard({ project, curve, xLabel }: {
    project: HomeProject;
    curve: { x: number; price: number }[];
    xLabel: (x: number) => string;
}) {
    const { t, lang } = useLang();
    const live = project.kind === 'live';
    const badge = t(live ? 'home.live' : project.kind === 'package' ? 'home.package' : 'home.case');
    const coverLabel = project.cover === 'choropleth' ? 'choropleth' : project.cover === 'package' ? 'CRAN' : 'live API';

    return (
        <article className="group relative grid grid-cols-1 items-center gap-6 border-t border-[#e9e7e2] py-7 sm:grid-cols-[248px_1fr] sm:gap-8">
            <div className="relative flex h-[150px] items-center justify-center overflow-hidden rounded-[10px] border border-[#e9e7e2] bg-[#f3f1ec] p-3.5 transition-colors duration-200 group-hover:border-[#d8d6d0]">
                <span className="absolute left-3.5 top-3 font-mono text-[10px] font-medium tracking-[0.04em] text-[#6b6a63]">{coverLabel}</span>
                {project.cover === 'chart' && curve.length > 1 ? (
                    <div className="h-full w-full pt-4"><AreaFigure data={curve} variant="thumb" xLabel={xLabel} /></div>
                ) : project.cover === 'package' ? (
                    <div className="text-center" aria-hidden="true">
                        <div className="font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] text-[#1a1a1a]">R</div>
                        <div className="mt-2 font-mono text-[11px] tracking-[0.06em] text-[#6b6a63]">{project.metric}</div>
                    </div>
                ) : project.cover === 'choropleth' ? <Choropleth /> : null}
            </div>

            <div>
                <div className="mb-2.5 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#6b6a63]">{project.domain}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${live ? 'bg-emerald-500/10 text-[#047857]' : 'bg-[#86857e]/12 text-[#5f5f5a]'}`}>
                        <span className={live ? 'h-[5px] w-[5px] rounded-full bg-[#059669]' : 'h-[5px] w-[5px] rounded-[1px] bg-[#86857e]'} />
                        {badge}
                    </span>
                </div>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                    <h3 className="m-0 text-[21px] font-semibold tracking-[-0.026em] text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#047857] md:text-[23px]">
                        <ProjectLink href={project.href} lang={lang} className="after:absolute after:inset-0 after:content-['']">{project.title}</ProjectLink>
                    </h3>
                    <span aria-hidden="true" className="shrink-0 text-[18px] text-[#047857] transition-colors duration-200 group-hover:text-[#1a1a1a]">↗</span>
                </div>
                <p className="m-0 mb-3.5 max-w-[640px] text-[15px] leading-[1.6] text-[#5f5f5a]"><ProjectText value={project.description[lang]} lang={lang} /></p>
                <span className="font-mono text-[12px] font-medium tracking-[0.02em] text-[#565650]">{project.stack}</span>
            </div>
        </article>
    );
}
