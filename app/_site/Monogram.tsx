"use client";

import Link from 'next/link';
import { useLang, localize } from './i18n';
import { site } from './site-config';

/** Minimal "sc." wordmark logo. */
export function Monogram({ href = '/' }: { href?: string; showName?: boolean }) {
    const { lang } = useLang();
    return (
        <Link
            href={localize(href, lang)}
            className="text-[18px] font-semibold lowercase tracking-[-0.03em] text-[#1a1a1a] hover:opacity-80 transition-opacity"
            aria-label={`${site.brand} — home`}
        >
            sc<span className="text-[#047857]">.</span>
        </Link>
    );
}
