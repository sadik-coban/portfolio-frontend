"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { Monogram } from '../Monogram';
import { localize, LangSwitch } from '../i18n';

// The notebook shell the generated reports use — a sticky contents rail with a read-progress
// bar on desktop, a title bar plus drawer on a phone.
//
// Modelled on FinalReportLab's shell rather than imported from it: the hand-written report and
// text-analysis pages each carry their own TocNav and the two copies have drifted apart, so
// unifying them would quietly change a published page. Both of those pages are closed now, but
// their source is kept, so the copies stay apart. The look is the live one, class for class:
// same ground, same rail, contents grouped under chapter labels.
//
// One addition over that shell: links to the sibling reports. These pages do not use FinalShell,
// whose sidebar is how you move between the project's pages, so without them the only way from
// one report to another would be back out through the project. They sit on the floor of the rail:
// TocNav is flex-1 and scrolls inside its own window, so a block after it stays on screen however
// long the contents runs — the same place FinalShell parks its own secondary controls.

/** A chapter band (level 2, h2) or a section inside one (level 3, h3); see report-source.ts. */
type TocItem = { id: string; title: string; level: 2 | 3; n: string };
type Lang = 'tr' | 'en';

const REPORTS = [
    { key: 'report-business', href: '/projects/car-price/report', tr: 'Karar notu', en: 'Decision note' },
    { key: 'report-technical', href: '/projects/car-price/report/technical', tr: 'Teknik rapor', en: 'Technical report' },
    { key: 'report-shap', href: '/projects/car-price/shap', tr: 'SHAP', en: 'SHAP' },
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
    // The reader's place while the page is still settling after a load: a heading and an offset
    // from it (see the effect below). Null once the reader takes over.
    const holdRef = useRef<{ id: string; d: number } | null>(null);

    const goTo = (id: string) => {
        setDrawer(false);
        const el = document.getElementById(id);
        if (!el) return;
        holdRef.current = null;
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
        setToc(live().map((el) => ({
            id: el.id,
            title: (el.textContent || '').trim(),
            level: el.dataset.toc === '3' ? 3 : 2,
            n: el.dataset.n || '',
        })));

        // A heading becomes current once it has scrolled up past this line — just below the
        // mobile title bar, the same 84px the headings keep as scroll margin.
        const LINE = 96;
        let current = '';
        let hashTimer: ReturnType<typeof setTimeout> | null = null;
        let saveTimer: ReturnType<typeof setTimeout> | null = null;

        // A reload used to land the reader in the wrong section — on #s-4 it ended up in §3.2. The
        // page is still short when the browser lands: the figures above are PNGs that have not
        // loaded yet, and the Plotly charts that replace them arrive with report-data.json, each a
        // different height. Every change above the reader moved the text under them, and the spy
        // then wrote the section they had been pushed into into the URL, so the next reload started
        // from there. So the place is held as a heading plus an offset from it, not as a pixel:
        // the section in the URL, the offset in sessionStorage (only a reload or back/forward uses
        // it; a shared #s-n link lands on the heading). It is re-applied whenever the document
        // changes height, until the reader scrolls, clicks or types; meanwhile the URL stays put.
        // The browser's own pixel restore is off on this page — it would fight the hold.
        const KEY = 'report-place:' + window.location.pathname;
        const topOf = (id: string) => {
            const el = id ? document.getElementById(id) : null;
            if (!el) return 0;
            return el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
        };
        const savePlace = (id: string) => {
            try { sessionStorage.setItem(KEY, JSON.stringify({ id, d: Math.round(window.scrollY - topOf(id)) })); } catch { /* storage off: a reload lands on the heading */ }
        };
        const hashId = decodeURIComponent(window.location.hash.slice(1));
        holdRef.current = null;
        if (hashId && document.getElementById(hashId)) {
            let d = 0;
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
            if (nav?.type === 'reload' || nav?.type === 'back_forward') {
                try {
                    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
                    if (s?.id === hashId && typeof s.d === 'number') d = s.d;
                } catch { /* no saved offset: land on the heading */ }
            }
            holdRef.current = { id: hashId, d };
        }
        const hold = () => {
            const h = holdRef.current;
            if (h) window.scrollTo(0, topOf(h.id) + h.d);
        };
        const release = () => { holdRef.current = null; };
        const INPUT = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
        const prevRestoration = history.scrollRestoration;
        history.scrollRestoration = 'manual';

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
            if (holdRef.current) {
                // still settling after a load: the section is the one being held, whatever the
                // layout shift of this frame says, and the place is not saved mid-shift
                id = holdRef.current.id;
            } else {
                if (pin) {
                    const moving = performance.now() - pin.t < 1200;
                    if (moving || (atBottom && pin.id === heads[heads.length - 1].id)) id = pin.id;
                    else pinRef.current = null;
                }
                if (saveTimer) clearTimeout(saveTimer);
                const placeId = id;
                saveTimer = setTimeout(() => savePlace(placeId), 150);
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
        // Arriving with a #s-n in the URL: land on it (plus the saved offset on a reload) once the
        // contents exist, before the first paint names a section.
        hold();
        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        // Figures mount after the data arrives and push every heading down; recompute when they do.
        window.addEventListener('resize', onScroll);
        // Any change in the document's height (a PNG loading, a chart replacing it) re-applies the
        // held place. A ResizeObserver runs after layout and before paint, so the correction never
        // shows as a jump.
        const ro = new ResizeObserver(() => { hold(); onScroll(); });
        ro.observe(root);
        INPUT.forEach((t) => window.addEventListener(t, release, { passive: true }));

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            INPUT.forEach((t) => window.removeEventListener(t, release));
            ro.disconnect();
            history.scrollRestoration = prevRestoration;
            if (raf) cancelAnimationFrame(raf);
            if (hashTimer) clearTimeout(hashTimer);
            if (saveTimer) clearTimeout(saveTimer);
        };
    }, [contentKey]);

    const back = (
        <Link href={localize('/projects/car-price', lang)} className="mb-4 flex items-center gap-2 font-mono text-[12px] text-[#86857e] transition-colors hover:text-[#5f5f5a]">
            <ArrowLeft size={14} /> {L('Proje', 'Project')}
        </Link>
    );

    // The siblings, minus the one being read — a reader already on the technical report does not
    // need it listed back at them. Report pages carry no project sidebar, so this is the only
    // sideways move they have; that is why the slim shape trims it rather than dropping it.
    const siblings = REPORTS.filter((r) => r.key !== active);

    const otherReports = (
        <div className="mt-auto shrink-0 border-t border-[#ece9e3] pt-4">
            <div className="mb-1.5 font-mono text-[10px] uppercase leading-snug tracking-[0.12em] text-[#86857e]">{L('Diğer raporlar', 'Other reports')}</div>
            <ul className="space-y-0.5 text-[13px]">
                {siblings.map((r) => (
                    <li key={r.key}>
                        <Link
                            href={localize(r.href, lang)}
                            onClick={() => setDrawer(false)}
                            className="block w-full rounded-[6px] px-2.5 py-1.5 text-left leading-snug text-[#5f5f5a] transition-colors hover:bg-[#f1efe9] hover:text-[#1a1a1a]"
                        >
                            {L(r.tr, r.en)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    const nav = (
        <>
            <TocNav toc={toc} activeId={activeId} onGo={goTo} label={L('İçindekiler', 'Contents')} />
            {otherReports}
        </>
    );

    const activeTitle = toc.find((x) => x.id === activeId)?.title ?? title;

    return (
        // lang: the chapter labels are CSS capitals, and Turkish "i" only capitalises to "İ" under tr.
        <div lang={lang} className="min-h-screen bg-[#fbfbf9] text-[#1a1a1a]">
            {/* mobile title bar */}
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e9e7e2] bg-[#fbfbf9]/95 px-4 py-3 backdrop-blur md:hidden">
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
                    <Dialog.Content lang={lang} aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[300px] flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fdfcf9] p-5 shadow-xl focus:outline-none md:hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#86857e]">{L('İçindekiler', 'Contents')}</Dialog.Title>
                            <div className="flex items-center gap-2"><LangSwitch />
                            <Dialog.Close asChild>
                                <button aria-label={L('Kapat', 'Close')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><X size={18} /></button>
                            </Dialog.Close></div>
                        </div>
                    {back}
                        {nav}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="mx-auto flex w-full max-w-[1280px]">
                {/* desktop contents rail */}
                <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fbfbf9] px-5 py-8 md:flex">
                    {/* the site language, reachable from the report itself — these pages are outside FinalShell */}
                    <div className="mb-4 flex items-center justify-between gap-2"><Monogram /><LangSwitch /></div>
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

// Contents list, grouped the way the live rail groups it: each chapter band is a small mono
// label, its sections are the items beneath. Real <a href="#s-n"> anchors, so they are shareable
// and work with JS off; the click handler adds the smooth scroll, drawer close and hash update.
//
// Two differences from the live TocNav, both because a generated chapter can have no sections:
// the chapter label carries its number (the band on the page does too, and the reports cite
// "§8"), and it turns green while the reader is in the chapter's own text — otherwise a chapter
// without sections would never show as current.
function TocNav({ toc, activeId, onGo, label }: { toc: TocItem[]; activeId: string; onGo: (id: string) => void; label: string }) {
    if (!toc.length) return null;
    const chapters: { head?: TocItem; items: TocItem[] }[] = [];
    for (const it of toc) {
        if (it.level === 2 || !chapters.length) chapters.push({ head: it.level === 2 ? it : undefined, items: [] });
        if (it.level === 3) chapters[chapters.length - 1].items.push(it);
    }
    const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); onGo(id); };
    return (
        <nav className="flex-1 overflow-y-auto text-[13px]" aria-label={label}>
            {chapters.map((ch, ci) => {
                const headOn = !!ch.head && ch.head.id === activeId;
                return (
                    <div key={ch.head?.id ?? ci} className="mb-4">
                        {ch.head && (
                            <a
                                href={'#' + ch.head.id}
                                onClick={(e) => go(e, ch.head!.id)}
                                aria-current={headOn ? 'true' : undefined}
                                className={`mb-1.5 block font-mono text-[10px] uppercase leading-snug tracking-[0.12em] transition-colors hover:text-[#047857] ${headOn ? 'text-[#047857]' : 'text-[#86857e]'}`}
                            >
                                <span className="mr-1.5 tracking-normal">{ch.head.n}</span>{ch.head.title}
                            </a>
                        )}
                        {ch.items.length > 0 && (
                            <ul className="space-y-0.5">
                                {ch.items.map((it) => {
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
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
