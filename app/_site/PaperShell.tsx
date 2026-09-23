"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useLang, LangSwitch, localize } from './i18n';
import { Monogram } from './Monogram';
import { site } from './site-config';
import { WRITING_ENABLED } from './writing-config';
import { siteFontVars } from './design/fonts';

// `writing: true` marks an entry that only exists while WRITING_ENABLED is on.
const NAV = [
    { key: 'nav.projects', href: '/projects' },
    { key: 'nav.blog', href: '/blog', writing: true },
    { key: 'nav.about', href: '/about' },
].filter((n) => WRITING_ENABLED || !n.writing);

// LangSwitch ships the paper palette in its own classes; the trailing ! lets the frame's
// tokens win without a second variant of the component.
const LANG_SWITCH_SITE = 'font-text border-site-line! text-site-muted! hover:bg-site-card! hover:text-site-ink!';

const EXTERNAL = [
    { label: 'GitHub', href: site.social.github },
    { label: 'LinkedIn', href: site.social.linkedin },
    { label: 'Email', href: `mailto:${site.social.email}` },
];

/**
 * Site frame — nav (wordmark + links + lang) and footer, each a bento tile, light only.
 * Palette and type come from the --site-* tokens and design/fonts.ts
 * (design-system/sadik-coban/MASTER.md). Only the chrome takes the new type: the pages
 * inside keep inheriting their own, so /about and /projects change frame, not content.
 */
export default function PaperShell({ children }: { children: React.ReactNode }) {
    const { t, lang } = useLang();
    const pathname = usePathname() || '/';
    const [open, setOpen] = useState(false);
    const year = new Date().getFullYear();
    const isActive = (href: string) => {
        const h = localize(href, lang);
        return pathname === h || pathname.startsWith(`${h}/`);
    };

    return (
        <div className={`site-frame ${siteFontVars} min-h-screen bg-site-bg text-site-ink`}>
            <div className="mx-auto max-w-[1192px] px-4 sm:px-6">
                <nav className="mt-4 flex h-14 items-center justify-between rounded-2xl border border-site-line bg-site-card px-5 font-text md:mt-6 md:px-6">
                    <Monogram tone="site" />
                    <div className="flex items-center gap-4 text-[14px] font-medium md:gap-5">
                        <div className="hidden items-center gap-1 md:flex">
                            {NAV.map((n) => {
                                const active = isActive(n.href);
                                return (
                                    <Link
                                        key={n.key}
                                        href={localize(n.href, lang)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`rounded-full px-3 py-1.5 transition-colors duration-200 ${active ? 'bg-site-bg text-site-ink' : 'text-site-muted hover:bg-site-bg hover:text-site-ink'}`}
                                    >
                                        {t(n.key)}
                                    </Link>
                                );
                            })}
                        </div>
                        <LangSwitch className={LANG_SWITCH_SITE} />
                        {/* 44px tap target around a 20px icon; the -12px margins cancel the padding
                            back out, so the icon keeps its exact position and the nav its height. */}
                        <button
                            onClick={() => setOpen((v) => !v)}
                            className="-my-3 -mr-3 flex h-11 w-11 cursor-pointer items-center justify-center text-site-muted transition-colors duration-200 hover:text-site-ink md:hidden"
                            aria-label={t('sb.menu')}
                            aria-expanded={open}
                        >
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </nav>

                {open && (
                    <div className="mt-2 flex flex-col rounded-2xl border border-site-line bg-site-card px-5 py-2 font-text md:hidden">
                        {NAV.map((n) => (
                            <Link
                                key={n.key}
                                href={localize(n.href, lang)}
                                onClick={() => setOpen(false)}
                                aria-current={isActive(n.href) ? 'page' : undefined}
                                className="flex min-h-11 items-center text-[15px] font-medium text-site-muted transition-colors duration-200 hover:text-site-ink aria-[current=page]:text-site-ink"
                            >
                                {t(n.key)}
                            </Link>
                        ))}
                    </div>
                )}

                {children}

                <footer className="mb-6 rounded-2xl border border-site-line bg-site-card p-7 font-text md:p-10">
                    <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-12 md:gap-6">
                        <div className="col-span-2 md:col-span-6">
                            <Monogram tone="site" />
                            <p className="mt-3 max-w-[320px] text-[14px] leading-[1.6] text-site-muted">{t('footer.tagline')}</p>
                        </div>
                        <div className="md:col-span-3">
                            <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{t('footer.nav')}</h4>
                            <ul className="space-y-2.5 text-[14px] font-medium text-site-ink-2">
                                <li><Link href={localize('/', lang)} className="transition-colors duration-200 hover:text-site-accent">{t('footer.home')}</Link></li>
                                {NAV.map((n) => (
                                    <li key={n.key}><Link href={localize(n.href, lang)} className="transition-colors duration-200 hover:text-site-accent">{t(n.key)}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:col-span-3">
                            <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-site-muted">{t('footer.connect')}</h4>
                            <ul className="space-y-2.5 text-[14px] font-medium text-site-ink-2">
                                {EXTERNAL.map((e) => (
                                    <li key={e.label}>
                                        <a
                                            href={e.href}
                                            {...(e.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                                            className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-site-accent"
                                        >
                                            {e.label} <ArrowUpRight size={14} aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse items-start justify-between gap-2 border-t border-site-line pt-6 text-[12px] text-site-muted sm:flex-row sm:items-center">
                        <span className="font-medium">© {year} {site.brand}. {t('footer.rights')}</span>
                        <span>Built with Next.js &amp; Tailwind</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
