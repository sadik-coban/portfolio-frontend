"use client";

import Link from 'next/link';
import { localize, type Lang } from '../i18n';
import { isExternalHref } from './content';

/**
 * One project link, for the two places that render HOME_PROJECTS (the home work index and
 * /projects).
 *
 * Both used to assume every project is a route on this site: next/link plus localize(). A
 * project can also be a published package whose home is someone else's server, and then that
 * assumption produces "/trhttps://cran…" the moment Turkish is switched on, with no target or
 * rel either. So an absolute URL opens in a new tab as a plain anchor, and everything else keeps
 * the routed behaviour it had.
 */
export default function ProjectLink({ href, lang, className, children }: {
    href: string;
    lang: Lang;
    className?: string;
    children: React.ReactNode;
}) {
    if (isExternalHref(href)) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
    }
    return <Link href={localize(href, lang)} className={className}>{children}</Link>;
}

/** `[label](href)` inside a description — the copy sometimes credits a person or a source and
 *  that name should be reachable. Markdown's own syntax, so the string stays readable in
 *  content.ts, and only this one form is understood: no parser, no other markup. */
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * A project description with those links rendered.
 *
 * `relative z-10` on each anchor is what makes it clickable at all: both work rows cover
 * themselves with the title link's ::after overlay so the whole row is one target, and an
 * inline anchor would otherwise sit underneath it.
 */
export function ProjectText({ value, lang }: { value: string; lang: Lang }) {
    const parts: React.ReactNode[] = [];
    let at = 0;
    for (const m of value.matchAll(LINK)) {
        if (m.index > at) parts.push(value.slice(at, m.index));
        parts.push(
            <ProjectLink key={m.index} href={m[2]} lang={lang} className="relative z-10 font-medium text-[#047857] transition-colors hover:text-[#1a1a1a] hover:underline">
                {m[1]}
            </ProjectLink>,
        );
        at = m.index + m[0].length;
    }
    parts.push(value.slice(at));
    return <>{parts}</>;
}
