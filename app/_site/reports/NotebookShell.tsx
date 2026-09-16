"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, ArrowLeft, Briefcase, FlaskConical } from 'lucide-react';
import { Monogram } from '../Monogram';

// The notebook shell the live report pages use — a sticky contents rail with a read-progress
// bar on desktop, a title bar plus drawer on a phone — rebuilt for the generated-report previews.
//
// Modelled on FinalReportLab's shell rather than imported from it: the report and text-analysis
// pages each carry their own TocNav and the two copies have drifted apart, so unifying them
// would quietly change one of the published pages. This keeps the preview's change inside the
// preview.
//
// One addition over the live shell: a Reports switcher above the contents. The preview pages
// used to sit inside the app shell, whose sidebar is how you moved between the four of them on
// a phone. Dropping that for a contents list alone would have removed the only way across
// without going back to the project.

type TocItem = { id: string; title: string };
type Lang = 'tr' | 'en';

const REPORTS = [
    { key: 'report-business', href: '/projects/car-price/report-preview/business', tr: 'Karar notu', en: 'Decision note', icon: Briefcase },
    { key: 'report-technical', href: '/projects/car-price/report-preview/technical', tr: 'Teknik rapor', en: 'Technical report', icon: FlaskConical },
    { key: 'text-business', href: '/projects/car-price/text-preview/business', tr: 'Metin · karar', en: 'Text · decision', icon: Briefcase },
    { key: 'text-technical', href: '/projects/car-price/text-preview/technical', tr: 'Metin · teknik', en: 'Text · technical', icon: FlaskConical },
] as const;

export type ReportKey = (typeof REPORTS)[number]['key'];

export default function NotebookShell({
    active, lang, title, contentKey, children,
}: {
    active: ReportKey;
    lang: Lang;
    title: string;
    /** Changes whenever the rendered document changes (language switch), so contents rebuild. */
    contentKey: string;
    children: React.ReactNode;
}) {
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const [toc, setToc] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState('');
    const [drawer, setDrawer] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    // Written straight to the DOM node — scrolling must not re-render 25 Plotly charts.
    const progressRef = useRef<HTMLDivElement>(null);
    // A section chosen from the contents list. Near the end of a page the browser cannot scroll
    // a short final section's heading up to the top, so the position alone would name the
    // section above it — a click has to be honoured explicitly.
    const pinRef = useRef<{ id: string; t: number } | null>(null);

    const goTo = (id: string) => {
        setDrawer(false);
        const el = document.getElementById(id);
        if (!el) return;
        pinRef.current = { id, t: performance.now() };
        setActiveId(id);
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        history.replaceState(null, '', '#' + id);
    };

    // Build the contents from the headings the server marked, then wire scroll-spy + progress.
    // Re-runs on a language switch, because the headings are replaced wholesale.
    //
    // The spy deliberately does NOT use an IntersectionObserver on the heading nodes, which is
    // what the live report pages do. Those pages render their sections as JSX; these render the
    // generator's HTML through dangerouslySetInnerHTML, and React rewrites that content during
    // hydration. Measured: all 10 observed headings were detached from the document within 0.3s,
    // so the observer sat watching dead nodes and never fired again — the contents list never
    // highlighted anything. Reading the live DOM on each animation frame cannot depend on which
    // node instance happens to be mounted.
    useEffect(() => {
        const root = mainRef.current;
        if (!root) return;

        const live = () => Array.from(root.querySelectorAll<HTMLElement>('[data-toc]'));
        setToc(live().map((el) => ({ id: el.id, title: (el.textContent || '').trim() })));

        // A heading becomes current once it has scrolled up past this line — just below the
        // mobile title bar, the same 84px the headings keep as scroll margin.
        const LINE = 96;
        let current = '';
        let hashTimer: ReturnType<typeof setTimeout> | null = null;

        let raf = 0;
        const paint = () => {
            raf = 0;
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
            if (progressRef.current) progressRef.current.style.width = (p * 100).toFixed(1) + '%';

            const heads = live();
            if (!heads.length) return;

            // Mid-page, a section is current once its heading has scrolled up past the line.
            // At the very bottom the page cannot scroll further, so the last one or two headings
            // may never reach it; there the line drops to mid-screen. Measured on the text
            // technical report: at max scroll §6 sits at 97px and §7 at 627px of 900 — §6 is what
            // is being read, and a pure "bottom means last section" rule got that wrong.
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            const line = atBottom ? window.innerHeight / 2 : LINE;
            let id = '';
            for (const el of heads) {
                if (el.getBoundingClientRect().top <= line) id = el.id;
                else break;
            }

            // Honour a click from the contents list: through the smooth scroll, and afterwards
            // for as long as the reader stays parked at the bottom on the section they chose.
            // Scrolling away releases it and position takes over again.
            const pin = pinRef.current;
            if (pin) {
                const moving = performance.now() - pin.t < 1200;
                if (moving || (atBottom && pin.id === heads[heads.length - 1].id)) id = pin.id;
                else pinRef.current = null;
            }

            // setState only on a change: scrolling must not re-render the charts every frame.
            if (id === current) return;
            current = id;
            setActiveId(id);
            if (hashTimer) clearTimeout(hashTimer);
            hashTimer = setTimeout(() => {
                const want = id ? '#' + id : window.location.pathname + window.location.search;
                if (id ? window.location.hash !== want : !!window.location.hash) history.replaceState(null, '', want);
            }, 120);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        // Figures mount after the data arrives and push every heading down; recompute when they do.
        window.addEventListener('resize', onScroll);

        // Arriving with a #s-n in the URL: land on it once the contents exist.
        if (window.location.hash) {
            const target = document.getElementById(window.location.hash.slice(1));
            if (target) target.scrollIntoView({ block: 'start' });
        }

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (raf) cancelAnimationFrame(raf);
            if (hashTimer) clearTimeout(hashTimer);
        };
    }, [contentKey]);

    const back = (
        <Link href="/projects/car-price" className="mb-4 flex items-center gap-2 font-mono text-[12px] text-[#86857e] transition-colors hover:text-[#5f5f5a]">
            <ArrowLeft size={14} /> {L('Proje', 'Project')}
        </Link>
    );

    const nav = (
        <>

            <div className="mb-5">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#86857e]">{L('Raporlar', 'Reports')}</div>
                <ul className="space-y-0.5">
                    {REPORTS.map((r) => {
                        const on = r.key === active;
                        return (
                            <li key={r.key}>
                                <Link
                                    href={r.href}
                                    onClick={() => setDrawer(false)}
                                    aria-current={on ? 'page' : undefined}
                                    className={`flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[13px] leading-snug transition-colors ${on ? 'bg-[#e7f3ec] font-semibold text-[#047857]' : 'text-[#5f5f5a] hover:bg-[#f1efe9] hover:text-[#1a1a1a]'}`}
                                >
                                    <r.icon size={14} className={on ? 'text-[#047857]' : 'text-[#9a9a92]'} />
                                    {L(r.tr, r.en)}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <TocNav toc={toc} activeId={activeId} onGo={goTo} label={L('İçindekiler', 'Contents')} />
        </>
    );

    const activeTitle = toc.find((x) => x.id === activeId)?.title ?? title;

    return (
        <div className="min-h-screen bg-[#f7f6f3] text-[#1a1a1a]">
            {/* mobile title bar */}
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e9e7e2] bg-[#fdfcf9]/95 px-4 py-3 backdrop-blur md:hidden">
                <button onClick={() => setDrawer(true)} aria-label={L('İçindekiler', 'Contents')} className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]">
                    <Menu size={20} />
                </button>
                <span className="min-w-0 truncate font-mono text-[12px] text-[#5f5f5a]">{activeTitle}</span>
                <span className="ml-auto shrink-0"><Monogram /></span>
            </header>

            {/* mobile drawer — Radix Dialog: focus-trap, esc, scroll-lock */}
            <Dialog.Root open={drawer} onOpenChange={setDrawer}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 md:hidden" />
                    <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[300px] flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fdfcf9] p-5 shadow-xl focus:outline-none md:hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#86857e]">{title}</Dialog.Title>
                            <Dialog.Close asChild>
                                <button aria-label={L('Kapat', 'Close')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><X size={18} /></button>
                            </Dialog.Close>
                        </div>
                        {back}
                        {nav}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="mx-auto flex w-full max-w-[1280px]">
                {/* desktop contents rail */}
                <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fbfbf9] px-5 py-8 md:flex">
                    <div className="mb-4"><Monogram /></div>
                    {back}
                    <div className="mb-5 h-[3px] w-full overflow-hidden rounded-full bg-[#ece9e3]">
                        <div ref={progressRef} className="h-full rounded-full bg-[#047857]" style={{ width: '0%' }} />
                    </div>
                    {nav}
                </aside>

                <main ref={mainRef} className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12 lg:px-14">
                    {children}
                </main>
            </div>
        </div>
    );
}

// Contents list. Real <a href="#s-n"> anchors, so they are shareable and work with JS off;
// the click handler adds the smooth scroll, drawer close and hash update.
function TocNav({ toc, activeId, onGo, label }: { toc: TocItem[]; activeId: string; onGo: (id: string) => void; label: string }) {
    if (!toc.length) return null;
    const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); onGo(id); };
    return (
        <nav className="flex-1 text-[13px]" aria-label={label}>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#86857e]">{label}</div>
            <ul className="space-y-0.5">
                {toc.map((it) => {
                    const on = it.id === activeId;
                    return (
                        <li key={it.id}>
                            <a
                                href={'#' + it.id}
                                onClick={(e) => go(e, it.id)}
                                aria-current={on ? 'true' : undefined}
                                className={`block w-full rounded-[6px] px-2.5 py-1.5 text-left leading-snug transition-colors ${on ? 'bg-[#e7f3ec] font-semibold text-[#047857]' : 'text-[#5f5f5a] hover:bg-[#f1efe9] hover:text-[#1a1a1a]'}`}
                            >
                                {it.title}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
