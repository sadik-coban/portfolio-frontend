"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, LayoutDashboard, BarChart3, BrainCircuit, Activity, PieChart, NotebookText, BookOpen, ArrowLeft, Menu, X } from 'lucide-react';
import { useLang, LangSwitch, localize } from './i18n';
import { Monogram } from './Monogram';
import { AppPageHeader } from './AppPageHeader';

type ActiveKey = 'overview' | 'dashboard' | 'eda' | 'predict' | 'drift' | 'shap' | 'report' | 'journal';

export default function FinalShell({
    active, title, kicker, meta, children,
}: {
    active: ActiveKey;
    title: string;
    kicker: string;
    meta?: string;
    children: React.ReactNode;
}) {
    const { t, lang } = useLang();
    const [open, setOpen] = useState(false);

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const nav = [
        { key: 'overview', label: t('sb.overview'), icon: Rocket, href: '/projects/car-price' },
        { key: 'dashboard', label: t('sb.dashboard'), icon: LayoutDashboard, href: '/projects/car-price/dashboard' },
        { key: 'eda', label: t('sb.eda'), icon: BarChart3, href: '/projects/car-price/eda' },
        { key: 'predict', label: t('sb.predict'), icon: BrainCircuit, href: '/projects/car-price/predict' },
        { key: 'drift', label: t('sb.drift'), icon: Activity, href: '/projects/car-price/drift' },
        { key: 'shap', label: t('sb.shap'), icon: PieChart, href: '/projects/car-price/shap' },
        { key: 'report', label: t('sb.report'), icon: NotebookText, href: '/projects/car-price/report' },
        { key: 'journal', label: t('sb.journal'), icon: BookOpen, href: '/projects/car-price/journal' },
    ];

    const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
        <nav className="flex flex-col gap-1 overflow-y-auto min-h-0">
            {nav.map((n) => {
                const on = n.key === active;
                return (
                    <Link
                        key={n.key}
                        href={localize(n.href, lang)}
                        onClick={onNavigate}
                        aria-current={on ? 'page' : undefined}
                        className={`flex items-center gap-[11px] rounded-[8px] px-[10px] py-[9px] text-[14px] transition-colors ${on
                            ? 'bg-[#e7f3ec] font-semibold text-[#047857]'
                            : 'font-medium text-[#5f5f5a] hover:bg-[#f1efe9]'}`}
                    >
                        <n.icon size={17} className={on ? 'text-[#047857]' : 'text-[#86857e]'} strokeWidth={2} />
                        {n.label}
                    </Link>
                );
            })}
        </nav>
    );

    const activeLabel = nav.find((n) => n.key === active)?.label ?? '';

    return (
        <div className="relative min-h-screen bg-[#f7f6f3] text-[#1a1a1a]">
            {/* Mobile top bar */}
            <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#e9e7e2] bg-[#fdfcf9]/95 backdrop-blur px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setOpen(true)}
                        className="flex items-center justify-center h-9 w-9 -ml-1 rounded-lg text-[#5f5f5a] hover:bg-[#f3f1ec] transition-colors"
                        aria-label={t('sb.menu')}
                    >
                        <Menu size={20} />
                    </button>
                    <span className="truncate text-sm font-medium text-[#1a1a1a]">{activeLabel}</span>
                </div>
                <Monogram />
            </header>

            {/* Mobile drawer */}
            {open && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
                    <aside className="absolute inset-y-0 left-0 flex w-[78%] max-w-[300px] flex-col border-r border-[#e9e7e2] bg-[#fdfcf9] px-6 py-7 shadow-xl">
                        <div className="flex items-center justify-between mb-1">
                            <Monogram />
                            <button
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-center h-9 w-9 -mr-1 rounded-lg text-[#5f5f5a] hover:bg-[#f3f1ec] transition-colors"
                                aria-label={t('sb.close')}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <Link href={localize('/', lang)} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 text-xs text-[#86857e] hover:text-[#1a1a1a] transition-colors mb-8">
                            <ArrowLeft size={12} /> {t('footer.home')}
                        </Link>
                        <NavList onNavigate={() => setOpen(false)} />
                        <div className="mt-auto pt-6">
                            <LangSwitch />
                        </div>
                    </aside>
                </div>
            )}

            <div className="relative z-10 flex">
                {/* Desktop sidebar */}
                <aside className="hidden md:flex flex-col w-[232px] shrink-0 fixed inset-y-0 border-r border-[#e9e7e2] bg-[#fdfcf9] px-[18px] py-[26px]">
                    <div className="px-[10px]"><Monogram /></div>
                    <Link href={localize('/', lang)} className="mb-[30px] mt-2 inline-flex items-center gap-1.5 px-[10px] text-[13px] font-medium text-[#86857e] hover:text-[#5f5f5a] transition-colors">
                        <ArrowLeft size={14} /> {t('footer.home')}
                    </Link>
                    <NavList />
                    <div className="mt-auto flex flex-col items-start gap-4 px-[10px]">
                        <LangSwitch />
                        <span className="font-mono text-[11px] font-medium text-[#a8a7a0]">{t('sb.version')}</span>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 md:ml-[232px] px-5 md:px-12 py-8 md:pt-[42px] md:pb-16 max-w-[1180px]">
                    <AppPageHeader eyebrow={kicker} title={title} meta={meta} />
                    {children}
                </main>
            </div>
        </div>
    );
}
