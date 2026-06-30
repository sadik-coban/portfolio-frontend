"use client";

import { useEffect, useRef, useState } from 'react';

// Thin wrapper around the Plotly *cartesian* partial bundle (loaded lazily,
// client-only) so it works with React 19 without react-plotly.js and never
// bundles into SSR. The cartesian bundle (bar/scatter/heatmap/box/pie, ~460 kB
// gzip) is ~⅓ the full dist — we don't use 3D/geo/mapbox/webgl traces here.
let plotlyPromise: Promise<any> | null = null;
function loadPlotly() {
    if (!plotlyPromise) {
        plotlyPromise = import('plotly.js-cartesian-dist-min').then((m: any) => m.default || m);
    }
    return plotlyPromise;
}

// Background idle loader. Charts that haven't scrolled into view yet queue here
// and mount one-at-a-time during idle time, so the whole page keeps loading on
// its own — before the user scrolls — without a synchronous burst. Each
// Plotly.react blocks the main thread, which naturally defers the next idle
// callback, serialising the heavy work for free.
const idleQueue: Array<() => void> = [];
let idlePumping = false;
function scheduleIdle(cb: () => void) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(cb, { timeout: 1000 });
    } else {
        setTimeout(cb, 250);
    }
}
function pumpIdleQueue() {
    if (idlePumping) return;
    idlePumping = true;
    const step = () => {
        const job = idleQueue.shift();
        if (job) job();
        if (idleQueue.length) scheduleIdle(step);
        else idlePumping = false;
    };
    scheduleIdle(step);
}
function enqueueIdle(job: () => void) {
    idleQueue.push(job);
    pumpIdleQueue();
}

interface PlotlyChartProps {
    data: any[];
    layout?: any;
    config?: any;
    className?: string;
    style?: React.CSSProperties;
    /** Tap-to-activate guard on touch devices so the page scrolls instead of the chart panning. Default true. */
    guard?: boolean;
}

export default function PlotlyChart({ data, layout, config, className, style, guard = true }: PlotlyChartProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [coarse, setCoarse] = useState(false);
    const [active, setActive] = useState(false);
    const [near, setNear] = useState(false);

    // touch devices only (pointer: coarse). Desktop never needs the guard.
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            setCoarse(window.matchMedia('(pointer: coarse)').matches);
        }
    }, []);

    // Defer the Plotly download + render until the chart scrolls near the
    // viewport. On a long report this means only the 2-3 visible charts mount up
    // front instead of all ~22 at once — big drop in initial main-thread work.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') { setNear(true); return; }
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
        }, { rootMargin: '400px 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Keep loading without scrolling: queue this chart to mount during idle time.
    // The observer above still wins for charts scrolled into view first; this
    // fills in the rest ahead of time so they're ready by the time you reach them.
    useEffect(() => {
        if (near) return;
        let cancelled = false;
        enqueueIdle(() => { if (!cancelled) setNear(true); });
        return () => { cancelled = true; };
    }, [near]);

    useEffect(() => {
        if (!near) return;
        let disposed = false;
        let el: HTMLDivElement | null = null;
        let ro: ResizeObserver | null = null;
        let resizeTimer: ReturnType<typeof setTimeout> | null = null;

        loadPlotly().then((Plotly) => {
            if (disposed || !ref.current) return;
            el = ref.current;
            Plotly.react(el, data, layout || {}, {
                displayModeBar: false,
                responsive: true,
                scrollZoom: false, // wheel scrolls the page on desktop, not the chart
                ...config,
            });

            // Re-fit when the *container* resizes — e.g. the sidebar collapse animates
            // the content width. Plotly's `responsive` only reacts to window resize,
            // which a layout-only change never fires, so observe the element directly.
            // Debounced so a long report (~22 charts) doesn't relayout every frame of
            // the 200ms animation; it settles once the width stops changing.
            if (typeof ResizeObserver !== 'undefined') {
                ro = new ResizeObserver(() => {
                    if (resizeTimer) clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        if (!disposed && el && Plotly.Plots?.resize) Plotly.Plots.resize(el);
                    }, 120);
                });
                ro.observe(el);
            }
        });

        return () => {
            disposed = true;
            if (resizeTimer) clearTimeout(resizeTimer);
            if (ro) ro.disconnect();
            if (el) loadPlotly().then((Plotly) => Plotly.purge(el!));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [near, data, layout, config]);

    // tap vs swipe detection on the overlay
    const start = useRef({ x: 0, y: 0, moved: false });
    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY, moved: false };
    };
    const onTouchMove = (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (Math.abs(t.clientX - start.current.x) > 8 || Math.abs(t.clientY - start.current.y) > 8) {
            start.current.moved = true;
        }
    };
    const onTouchEnd = () => {
        if (!start.current.moved) setActive(true); // a real tap → activate interactions
    };

    const showGuard = guard && coarse && !active;

    return (
        <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
            <div ref={ref} style={{ width: '100%', height: '100%' }} />

            {showGuard && (
                <div
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    // pan-y lets the browser scroll the page vertically through the overlay
                    style={{ position: 'absolute', inset: 0, zIndex: 10, touchAction: 'pan-y', background: 'transparent' }}
                >
                    <span
                        style={{
                            position: 'absolute', bottom: 8, right: 8, pointerEvents: 'none',
                            fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10,
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(15,23,42,0.7)', color: '#e2e8f0',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        etkileşim için dokun
                    </span>
                </div>
            )}

            {guard && coarse && active && (
                <button
                    onClick={() => setActive(false)}
                    style={{
                        position: 'absolute', top: 6, right: 6, zIndex: 11,
                        fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10,
                        padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(15,23,42,0.7)', color: '#e2e8f0', backdropFilter: 'blur(4px)',
                    }}
                >
                    ✕ kaydırmaya dön
                </button>
            )}
        </div>
    );
}
