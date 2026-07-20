"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, LayoutDashboard, BrainCircuit, Activity, PieChart, NotebookText, MessageSquareText, BookOpen, ArrowLeft, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLang, LangSwitch, localize } from './i18n';
import { Monogram } from './Monogram';
import { AppPageHeader } from './AppPageHeader';
import { SIDEBAR_COLLAPSE_ENABLED } from './features';
import { useSidebarCollapse } from './SidebarCollapse';

type ActiveKey = 'overview' | 'dashboard' | 'eda' | 'predict' | 'drift' | 'shap' | 'report' | 'report-v2' | 'text-analysis' | 'journal';

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

    // Desktop-only icon-collapse for the sidebar — gated behind SIDEBAR_COLLAPSE_ENABLED
    // (flip the flag off to ship without it). The preference is seeded from a cookie
    // on the server (see car-price/layout.tsx) so the first paint already has the
    // right width — no flash / replayed animation on refresh. Mobile always shows
    // full labels.
    const { collapsed, toggle: toggleCollapsed } = useSidebarCollapse();

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const nav = [
        { key: 'overview', label: t('sb.overview'), icon: Rocket, href: '/projects/car-price' },
        { key: 'dashboard', label: t('sb.dashboard'), icon: LayoutDashboard, href: '/projects/car-price/dashboard' },
        // EDA tab DEACTIVATED 2026-07-07 (per request): hidden from the sidebar but the
        // route + component are kept (app/[lang]/projects/car-price/eda + app/_charts/EChartsEdaPlots).
        // To re-enable, restore this entry + re-import BarChart3.
        // { key: 'eda', label: t('sb.eda'), icon: BarChart3, href: '/projects/car-price/eda' },
        { key: 'predict', label: t('sb.predict'), icon: BrainCircuit, href: '/projects/car-price/predict' },
        { key: 'drift', label: t('sb.drift'), icon: Activity, href: '/projects/car-price/drift' },
        { key: 'shap', label: t('sb.shap'), icon: PieChart, href: '/projects/car-price/shap' },
        // Old report tab DEACTIVATED (per request): hidden from the sidebar, but the route +
        // component are kept (app/[lang]/projects/car-price/report + app/_site/report/*) — it
        // still resolves by direct URL, nothing was deleted. The lab report below took its
        // place and is now simply "Report".
        // { key: 'report', label: t('sb.report'), icon: NotebookText, href: '/projects/car-price/report' },
        { key: 'report-v2', label: t('sb.report'), icon: NotebookText, href: '/projects/car-price/report-v2' },
        { key: 'text-analysis', label: t('sb.textAnalysis'), icon: MessageSquareText, href: '/projects/car-price/text-analysis' },
        { key: 'journal', label: t('sb.journal'), icon: BookOpen, href: '/projects/car-price/journal' },
    ];

    // Every row is [40px icon slot][label]. The icon slot is a fixed width, so the
    // icon never shifts as the rail animates between widths — only the label fades
    // (and is clipped by the sidebar's overflow-hidden). In a 72px collapsed rail
    // with px-[16px], the 40px slot is exactly centered.
    // `flat` (mobile drawer): icon + gap + label, left-aligned at the content edge so
    // the brand and icons share one edge. Otherwise (desktop): a fixed 40px icon slot
    // that keeps icons static through the collapse while the label fades.
    const NavList = ({ onNavigate, mini = false, flat = false }: { onNavigate?: () => void; mini?: boolean; flat?: boolean }) => (
        <nav className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden min-h-0">
            {nav.map((n) => {
                const on = n.key === active;
                return (
                    <Link
                        key={n.key}
                        href={localize(n.href, lang)}
                        onClick={onNavigate}
                        aria-current={on ? 'page' : undefined}
                        title={mini ? n.label : undefined}
                        className={`flex items-center rounded-[8px] py-[9px] text-[14px] transition-colors ${flat ? 'gap-[11px] px-[10px]' : ''} ${on
                            ? 'bg-[#e7f3ec] font-semibold text-[#047857]'
                            : 'font-medium text-[#5f5f5a] hover:bg-[#f1efe9]'}`}
                    >
                        {flat ? (
                            <n.icon size={17} className={on ? 'text-[#047857]' : 'text-[#86857e]'} strokeWidth={2} />
                        ) : (
                            <span className="flex w-[40px] shrink-0 items-center justify-center">
                                <n.icon size={17} className={on ? 'text-[#047857]' : 'text-[#86857e]'} strokeWidth={2} />
                            </span>
                        )}
                        {flat
                            ? n.label
                            : <span className={`whitespace-nowrap transition-opacity duration-200 ${mini ? 'opacity-0' : 'opacity-100'}`}>{n.label}</span>}
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
                            <div className="px-[10px]"><Monogram /></div>
                            <button
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-center h-9 w-9 -mr-1 rounded-lg text-[#5f5f5a] hover:bg-[#f3f1ec] transition-colors"
                                aria-label={t('sb.close')}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <Link
                            href={localize('/projects', lang)}
                            onClick={() => setOpen(false)}
                            className="mb-4 flex items-center gap-[11px] rounded-[8px] px-[10px] py-[9px] text-[13px] font-medium text-[#86857e] transition-colors hover:bg-[#f1efe9] hover:text-[#5f5f5a]"
                        >
                            <ArrowLeft size={16} className="shrink-0" /> {t('nav.projects')}
                        </Link>
                        <NavList onNavigate={() => setOpen(false)} flat />
                        <div className="mt-auto pt-6">
                            <LangSwitch />
                        </div>
                    </aside>
                </div>
            )}

            <div className="relative z-10 flex">
                {/* Desktop sidebar — collapses to a 72px icon rail. Only the width
                    animates; the horizontal padding stays constant (px-[16px]) and every
                    icon lives in a fixed 40px slot, so nothing shifts horizontally while
                    the rail resizes. Labels just fade (and are clipped by overflow-hidden). */}
                <aside className={`hidden md:flex flex-col shrink-0 fixed inset-y-0 overflow-hidden border-r border-[#e9e7e2] bg-[#fdfcf9] px-[16px] py-[26px] transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[232px]'}`}>
                    {/* Brand mark in the same 40px slot → stays put as the rail animates. */}
                    <div className={collapsed ? 'flex w-[40px] shrink-0 items-center justify-center' : 'pl-3'}><Monogram /></div>

                    {/* Up one level → projects list. Same row shape as the nav, so it
                        animates identically (no special-casing of the "Projects" button). */}
                    <Link
                        href={localize('/projects', lang)}
                        title={collapsed ? t('nav.projects') : undefined}
                        aria-label={t('nav.projects')}
                        className="mt-3 flex items-center rounded-[8px] py-[9px] text-[13px] font-medium text-[#86857e] transition-colors hover:bg-[#f1efe9] hover:text-[#5f5f5a]"
                    >
                        <span className="flex w-[40px] shrink-0 items-center justify-center"><ArrowLeft size={16} /></span>
                        <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{t('nav.projects')}</span>
                    </Link>

                    {/* Hairline that frames the header zone — fades in only while collapsed. */}
                    <div className={`mx-auto my-2 h-px w-8 bg-[#e9e7e2] transition-opacity duration-200 ${collapsed ? 'opacity-100' : 'opacity-0'}`} />

                    <NavList mini={collapsed} />

                    <div className="mt-auto flex flex-col gap-3">
                        {!collapsed && <LangSwitch />}
                        {SIDEBAR_COLLAPSE_ENABLED && (
                            <button
                                onClick={toggleCollapsed}
                                aria-label={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
                                title={collapsed ? 'Genişlet' : 'Daralt'}
                                className="flex h-9 w-[40px] items-center justify-center rounded-lg text-[#86857e] hover:bg-[#f1efe9] hover:text-[#5f5f5a] transition-colors"
                            >
                                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                            </button>
                        )}
                    </div>
                </aside>

                <main className={`flex-1 min-w-0 px-5 md:px-12 py-8 md:pt-[42px] md:pb-16 max-w-[1180px] transition-[margin] duration-200 ${collapsed ? 'md:ml-[72px]' : 'md:ml-[232px]'}`}>
                    <AppPageHeader eyebrow={kicker} title={title} meta={meta} />
                    {children}
                </main>
            </div>
        </div>
    );
}
