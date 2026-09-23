"use client";

import type { Lang } from '../i18n';
import type { ProjectFigure } from './content';
import { CAR_PRICE_MAPE, OPENAQ_RULES, OPENAQ_ZERO_RULES, MRFEI_REGIONS, MRFEI_STATE, type Bar } from './figures';

// The project tiles' mini figures. Bars and the region strip are HTML rather than SVG so their
// text stays at a fixed, legible size at every tile width — an SVG viewBox would scale the
// labels with the tile. Each figure is one role="img" with a complete aria-label; the drawn
// parts under it are aria-hidden, so a screen reader hears the numbers once, in order.

type Bi = Record<Lang, string>;

const num = (v: number, lang: Lang, digits: number) =>
    v.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
// Turkish writes the percent sign first: %6,50.
const pct = (v: number, lang: Lang, digits = 2) => (lang === 'tr' ? `%${num(v, lang, digits)}` : `${num(v, lang, digits)}%`);

function Caption({ children }: { children: React.ReactNode }) {
    return <p className="m-0 mt-3 text-[12px] leading-[1.45] text-site-muted">{children}</p>;
}

function Bars({ bars, lang, format, label }: { bars: Bar[]; lang: Lang; format: (v: number) => string; label: string }) {
    const max = Math.max(...bars.map((b) => b.value));
    return (
        <div role="img" aria-label={label} className="space-y-2.5">
            {bars.map((b) => (
                <div key={b.label.en} aria-hidden="true">
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
                        <span className={`min-w-0 truncate ${b.highlight ? 'font-medium text-site-ink' : 'text-site-muted'}`}>
                            {b.label[lang]}{b.mark ? ` ${b.mark}` : ''}
                        </span>
                        <span className={`shrink-0 font-mono tabular-nums ${b.highlight ? 'text-site-ink' : 'text-site-muted'}`}>{format(b.value)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-site-bg">
                        <div
                            className={`h-full rounded-full ${b.highlight ? 'bg-site-accent' : 'bg-site-ink/25'}`}
                            style={{ width: `${(b.value / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CarPrice({ lang }: { lang: Lang }) {
    const f = (v: number) => pct(v, lang);
    const label: Bi = {
        en: `Out-of-fold MAPE by model: ${CAR_PRICE_MAPE.map((b) => `${b.label.en} ${f(b.value)}${b.mark ? ' (winner by MAPE)' : ''}${b.highlight ? " (the report's model)" : ''}`).join(', ')}.`,
        tr: `Modele göre out-of-fold MAPE: ${CAR_PRICE_MAPE.map((b) => `${b.label.tr} ${pct(b.value, 'tr')}${b.mark ? ' (MAPE’ye göre kazanan)' : ''}${b.highlight ? ' (raporun modeli)' : ''}`).join(', ')}.`,
    };
    return (
        <>
            <Bars bars={CAR_PRICE_MAPE} lang={lang} format={f} label={label[lang]} />
            <Caption>{lang === 'tr' ? 'Out-of-fold MAPE · düşük daha iyi · ★ MAPE kuralının kazananı, pratikte berabere' : 'Out-of-fold MAPE · lower is better · ★ wins the MAPE rule, a practical tie'}</Caption>
        </>
    );
}

function OpenAQ({ lang }: { lang: Lang }) {
    const f = (v: number) => num(v, lang, 0);
    const zeros = OPENAQ_ZERO_RULES.map((z) => `${z[lang]} 0`).join(' · ');
    const label: Bi = {
        en: `Series flagged per pathology rule: ${OPENAQ_RULES.map((b) => `${b.label.en} ${b.value}`).join(', ')}; ${zeros}.`,
        tr: `Patoloji kuralı başına işaretlenen seri: ${OPENAQ_RULES.map((b) => `${b.label.tr} ${b.value}`).join(', ')}; ${OPENAQ_ZERO_RULES.map((z) => `${z.tr} 0`).join(', ')}.`,
    };
    return (
        <>
            <Bars bars={OPENAQ_RULES} lang={lang} format={f} label={label[lang]} />
            <Caption>{lang === 'tr' ? `Kural başına işaretlenen seri · ${zeros}` : `Series flagged per rule · ${zeros}`}</Caption>
        </>
    );
}

// Median tract score per region on a 13–28 axis (the data runs 14.3–27.3), the statewide
// share as a reference line. Regions below the state share carry the accent; equal medians
// stack instead of overlapping.
const LO = 13;
const HI = 28;
const at = (v: number) => `${((v - LO) / (HI - LO)) * 100}%`;

function Mrfei({ lang }: { lang: Lang }) {
    const seen = new Map<number, number>();
    const dots = MRFEI_REGIONS.map((r) => {
        const k = seen.get(r.median) ?? 0;
        seen.set(r.median, k + 1);
        return { ...r, k };
    });
    const lo = MRFEI_REGIONS[0];
    const hi = MRFEI_REGIONS[MRFEI_REGIONS.length - 1];
    const label: Bi = {
        en: `Median tract score by planning region, against the statewide ${pct(MRFEI_STATE, 'en')}: ${MRFEI_REGIONS.map((r) => `${r.region} ${num(r.median, 'en', 1)}`).join(', ')}.`,
        tr: `Planlama bölgesine göre medyan tract puanı, eyalet geneli ${pct(MRFEI_STATE, 'tr')} ile birlikte: ${MRFEI_REGIONS.map((r) => `${r.region} ${num(r.median, 'tr', 1)}`).join(', ')}.`,
    };
    return (
        <>
            <div role="img" aria-label={label[lang]}>
                <div aria-hidden="true" className="relative h-16">
                    <div className="absolute inset-x-0 bottom-[9px] h-px bg-site-line" />
                    <div className="absolute bottom-0 top-0 w-px bg-site-ink/40" style={{ left: at(MRFEI_STATE) }} />
                    <span className="absolute top-0 ml-1.5 whitespace-nowrap font-mono text-[11px] text-site-ink-2" style={{ left: at(MRFEI_STATE) }}>
                        {lang === 'tr' ? 'eyalet' : 'state'} {pct(MRFEI_STATE, lang)}
                    </span>
                    {dots.map((d) => (
                        <span
                            key={d.region}
                            className={`absolute h-2 w-2 -translate-x-1/2 rounded-full ring-[1.5px] ring-site-card ${d.median < MRFEI_STATE ? 'bg-site-accent' : 'bg-site-ink/30'}`}
                            style={{ left: at(d.median), bottom: `${5 + d.k * 10}px` }}
                        />
                    ))}
                </div>
                <div aria-hidden="true" className="mt-1.5 flex flex-wrap justify-between gap-x-3 font-mono text-[11px] text-site-muted">
                    <span>{lo.region} {num(lo.median, lang, 1)}</span>
                    <span>{hi.region} {num(hi.median, lang, 1)}</span>
                </div>
            </div>
            <Caption>{lang === 'tr' ? 'Bölgelerin medyan tract puanı · mavi = eyalet payının altında' : 'Median tract score by region · blue = below the state share'}</Caption>
        </>
    );
}

// MFF has no dataset to draw — it is a package. So this is a schematic of what the method does
// (points pulled towards fuzzy cluster centres, with soft membership halos), labelled as one.
// The points come from a fixed-seed generator so server and client render the same picture.
const CENTRES = [
    { x: 64, y: 58 },
    { x: 168, y: 44 },
    { x: 136, y: 104 },
];
const POINTS = (() => {
    let s = 20260923;
    const rand = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const gauss = () => (rand() + rand() + rand() - 1.5) * 1.6;
    return CENTRES.flatMap((c) => Array.from({ length: 11 }, () => ({ x: c.x + gauss() * 16, y: c.y + gauss() * 12 })));
})();

function MffSchematic({ lang, schematic }: { lang: Lang; schematic: string }) {
    return (
        <>
            <svg
                viewBox="0 0 232 140"
                className="block h-[132px] w-full"
                role="img"
                aria-label={lang === 'tr' ? 'Şematik: taban öğrenici tahminleri üzerinde bulanık kümeler. Veri değil, yöntemin çizimi.' : 'Schematic: fuzzy clusters over base-learner predictions. An illustration of the method, not data.'}
            >
                <defs>
                    <radialGradient id="mff-halo">
                        <stop offset="0%" stopColor="var(--site-accent)" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="var(--site-accent)" stopOpacity="0" />
                    </radialGradient>
                </defs>
                {CENTRES.map((c) => <circle key={`h${c.x}`} cx={c.x} cy={c.y} r={46} fill="url(#mff-halo)" />)}
                {POINTS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="var(--site-ink)" fillOpacity={0.45} />)}
                {CENTRES.map((c) => (
                    <g key={`c${c.x}`} stroke="var(--site-accent)" strokeWidth={1.6}>
                        <line x1={c.x - 5} y1={c.y} x2={c.x + 5} y2={c.y} />
                        <line x1={c.x} y1={c.y - 5} x2={c.x} y2={c.y + 5} />
                    </g>
                ))}
            </svg>
            <Caption>{schematic}</Caption>
        </>
    );
}

export function MiniFigure({ figure, lang, schematic }: { figure: ProjectFigure; lang: Lang; schematic: string }) {
    switch (figure) {
        case 'carPrice': return <CarPrice lang={lang} />;
        case 'openaq': return <OpenAQ lang={lang} />;
        case 'mrfei': return <Mrfei lang={lang} />;
        case 'mff': return <MffSchematic lang={lang} schematic={schematic} />;
    }
}
