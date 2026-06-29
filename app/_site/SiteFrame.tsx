"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GithubIcon, LinkedinIcon } from '@/components/ui/social-icons';
import { Mail, Menu, X } from 'lucide-react';
import { useLang, LangSwitch, localize } from './i18n';

function Navbar() {
    const { t, lang } = useLang();
    const [open, setOpen] = useState(false);
    const links = [
        { label: t('nav.projects'), href: localize('/projects', lang) },
        { label: t('nav.blog'), href: localize('/blog', lang) },
        { label: t('nav.dashboard'), href: localize('/projects/car-price/dashboard', lang) },
        { label: t('nav.about'), href: localize('/about', lang) },
    ];
    return (
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-[#0a0e14]/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href={localize('/', lang)} onClick={() => setOpen(false)} className="font-semibold tracking-tight text-lg hover:opacity-80 transition-opacity">
                    Sadık Çoban
                </Link>
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                        {links.map((l) => (
                            <Link key={l.label} href={l.href} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <LangSwitch />
                        <ThemeToggle className="cursor-pointer" />
                        <button onClick={() => setOpen((v) => !v)} className="md:hidden p-1 text-slate-600 dark:text-slate-300" aria-label="Menu">
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>
            {open && (
                <div className="md:hidden border-t border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#0a0e14]">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col">
                        {links.map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

function Footer() {
    const { t, lang } = useLang();
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-slate-200 dark:border-white/10 mt-24">
            <div className="max-w-5xl mx-auto px-6 py-14">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    <div className="md:col-span-2 space-y-3">
                        <span className="text-lg font-semibold tracking-tight">Sadık Çoban</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{t('footer.tagline')}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-4">{t('footer.nav')}</h4>
                        <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link href={localize('/', lang)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('footer.home')}</Link></li>
                            <li><Link href={localize('/projects', lang)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('nav.projects')}</Link></li>
                            <li><Link href={localize('/blog', lang)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('nav.blog')}</Link></li>
                            <li><Link href={localize('/about', lang)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('nav.about')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-4">{t('footer.connect')}</h4>
                        <div className="flex gap-3">
                            <a href="https://github.com/sadik-coban" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="h-10 w-10 grid place-items-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                <GithubIcon size={18} />
                            </a>
                            <a href="https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="h-10 w-10 grid place-items-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                <LinkedinIcon size={18} />
                            </a>
                            <a href="mailto:s.c_2004@hotmail.com" aria-label="Email" className="h-10 w-10 grid place-items-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <p className="text-xs text-slate-400">© {year} Sadık Çoban. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
}

export default function SiteFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0e14] text-slate-900 dark:text-slate-100">
            <Navbar />
            <main className="pt-16">{children}</main>
            <Footer />
        </div>
    );
}
