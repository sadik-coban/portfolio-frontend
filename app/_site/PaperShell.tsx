"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useLang, LangSwitch, localize } from './i18n';
import { Monogram } from './Monogram';
import { site } from './site-config';

const NAV = [
    { key: 'nav.projects', href: '/projects' },
    { key: 'nav.blog', href: '/blog' },
    { key: 'nav.about', href: '/about' },
];

/** Editorial paper chrome — nav (monogram + links + lang) and footer, light only. */
export default function PaperShell({ children }: { children: React.ReactNode }) {
    const { t, lang } = useLang();
    const [open, setOpen] = useState(false);
    const year = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-[#f7f6f3] text-[#1a1a1a]">
            <div className="mx-auto max-w-[1192px] px-6">
                <nav className="flex items-center justify-between border-b border-[#e9e7e2] py-[22px]">
                    <Monogram />
                    <div className="flex items-center gap-5 md:gap-[30px] text-[14px] font-medium text-[#5f5f5a]">
                        <div className="hidden md:flex items-center gap-[30px]">
                            {NAV.map((n) => (
                                <Link key={n.key} href={localize(n.href, lang)} className="transition-colors hover:text-[#1a1a1a]">{t(n.key)}</Link>
                            ))}
                        </div>
                        <LangSwitch />
                        {/* 44px tap target around a 20px icon; the -12px margins cancel the padding
                            back out, so the icon keeps its exact position and the nav its height. */}
                        <button onClick={() => setOpen((v) => !v)} className="md:hidden -my-3 -mr-3 flex h-11 w-11 items-center justify-center text-[#5f5f5a]" aria-label="Menu">
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </nav>

                {open && (
                    <div className="md:hidden flex flex-col border-b border-[#e9e7e2] py-2">
                        {NAV.map((n) => (
                            <Link key={n.key} href={localize(n.href, lang)} onClick={() => setOpen(false)} className="py-2.5 text-[15px] font-medium text-[#5f5f5a] hover:text-[#047857] transition-colors">{t(n.key)}</Link>
                        ))}
                    </div>
                )}

                {children}

                <footer className="border-t border-[#e9e7e2] pt-12 pb-8">
                    <div className="mb-10 grid grid-cols-2 sm:grid-cols-[1.7fr_1fr_1fr] gap-8 sm:gap-10">
                        {/* brand */}
                        <div className="col-span-2 sm:col-span-1">
                            <Monogram />
                            <p className="mt-3 max-w-[280px] text-[14px] leading-[1.6] text-[#86857e]">{t('footer.tagline')}</p>
                        </div>
                        {/* nav */}
                        <div>
                            <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[#86857e]">{t('footer.nav')}</h4>
                            <ul className="space-y-2.5 text-[14px] font-medium text-[#5f5f5a]">
                                <li><Link href={localize('/', lang)} className="transition-colors hover:text-[#047857]">{t('footer.home')}</Link></li>
                                {NAV.map((n) => (
                                    <li key={n.key}><Link href={localize(n.href, lang)} className="transition-colors hover:text-[#047857]">{t(n.key)}</Link></li>
                                ))}
                            </ul>
                        </div>
                        {/* connect */}
                        <div>
                            <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[#86857e]">{t('footer.connect')}</h4>
                            <ul className="space-y-2.5 text-[14px] font-medium text-[#5f5f5a]">
                                <li><a href={site.social.github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#047857]">GitHub ↗</a></li>
                                <li><a href={site.social.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#047857]">LinkedIn ↗</a></li>
                                <li><a href={`mailto:${site.social.email}`} className="transition-colors hover:text-[#047857]">Email ↗</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-[#e9e7e2] pt-6">
                        <span className="font-mono text-[12px] font-medium text-[#565650]">© {year} {site.brand}. {t('footer.rights')}</span>
                        <span className="font-mono text-[12px] text-[#9a9a92]">Built with Next.js &amp; Tailwind</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
