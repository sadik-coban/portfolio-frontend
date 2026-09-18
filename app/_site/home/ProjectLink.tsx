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
