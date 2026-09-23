"use client";

import Link from 'next/link';
import { useLang, localize } from './i18n';
import { site } from './site-config';

/** Minimal "sc." wordmark logo. `tone="site"` draws it in the site frame's palette;
 *  the default stays paper ink + green, which the project shells still use. */
export function Monogram({ href = '/', tone = 'paper' }: { href?: string; showName?: boolean; tone?: 'paper' | 'site' }) {
    const { lang } = useLang();
    const site_ = tone === 'site';
    return (
        <Link
            href={localize(href, lang)}
            className={`text-[18px] font-semibold lowercase tracking-[-0.03em] hover:opacity-80 transition-opacity ${site_ ? 'font-display text-site-ink' : 'text-[#1a1a1a]'}`}
            aria-label={`${site.brand} — home`}
        >
            sc<span className={site_ ? 'text-site-accent' : 'text-[#047857]'}>.</span>
        </Link>
    );
}
