"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PaperShell from '../PaperShell';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme } from '../../_charts/types';
import { useLang, localize } from '../i18n';
import { MRFEI_META, MRFEI_METRICS, MRFEI_SECTIONS, MRFEI_DIST, MRFEI_AREA } from './content';

// Bigger county-style intensity grid (illustrative). Center-weighted access.
const COLS = 14, ROWS = 8;
const MAP_GRID: number[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
        const dx = (c - COLS / 2) / (COLS / 2);
        const dy = (r - ROWS / 2) / (ROWS / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        const v = Math.max(0, 1 - d) * 5 + (Math.sin(c * 1.3) + Math.cos(r * 1.7)) * 0.6;
        return Math.max(0, Math.min(5, Math.round(v)));
    }),
);
const OPACITY = [0.05, 0.18, 0.32, 0.5, 0.68, 0.9];

export default function FinalMrfei() {
    const { t, lang } = useLang();
    const theme = useMemo(() => makeHybridTheme(false), []);

    const base = (over: any = {}) => ({
        margin: { t: 10, r: 14, b: 40, l: 48 },
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        font: { family: theme.fontSans, size: 11, color: theme.muted },
        showlegend: false,
        hoverlabel: { bgcolor: '#fdfcf9', font: { color: '#1a1a1a' } },
        xaxis: { gridcolor: theme.grid, zeroline: false, linecolor: theme.grid },
        yaxis: { gridcolor: theme.grid, zeroline: false, linecolor: theme.grid },
        ...over,
    });
    const config = { displayModeBar: false, responsive: true };

    const distData = [{ type: 'bar', x: MRFEI_DIST.labels, y: MRFEI_DIST.counts, marker: { color: MRFEI_DIST.labels.map((l) => (l === '0' ? '#b91c1c' : theme.accent)) }, hovertemplate: 'mRFEI %{x}: %{y} tracts<extra></extra>' }];
    const areaData = [{
        type: 'bar', x: MRFEI_AREA.types, y: MRFEI_AREA.mean, marker: { color: theme.accent },
        error_y: { type: 'data', symmetric: false, array: MRFEI_AREA.ciHigh.map((h, i) => h - MRFEI_AREA.mean[i]), arrayminus: MRFEI_AREA.mean.map((m, i) => m - MRFEI_AREA.ciLow[i]), color: '#1a1a1a', thickness: 1.5, width: 6 },
        text: MRFEI_AREA.mean.map((m) => m.toFixed(1)), textposition: 'outside',
        hovertemplate: '%{x}: %{y} mRFEI<extra></extra>',
    }];

    const Figure = ({ children, caption, tag }: any) => (
        <figure className="m-0 rounded-xl border border-[#e9e7e2] bg-[#fdfcf9] p-5">
            <figcaption className="mb-3.5 flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">{caption}</span>
                <span className="font-mono text-[11px] font-medium tracking-[0.05em] text-[#86857e]">{tag}</span>
            </figcaption>
            {children}
        </figure>
    );

    return (
        <PaperShell>
            <article className="py-14 lg:py-16">
                <Link href={localize('/projects', lang)} className="inline-flex items-center gap-2 text-[14px] font-medium text-[#5f5f5a] hover:text-[#047857] transition-colors mb-8">
                    <ArrowLeft size={16} /> {t('projects.title')}
                </Link>

                {/* header */}
                <header className="max-w-3xl">
                    <div className="mb-3 flex items-center gap-3">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#86857e]">{MRFEI_META.domain}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#86857e]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5f5f5a]">
                            <span className="h-[5px] w-[5px] rounded-[1px] bg-[#86857e]" /> {t('home.case')}
                        </span>
                    </div>
                    <h1 className="m-0 mb-5 text-[40px] md:text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-[#1a1a1a]">
                        {MRFEI_META.title} <span className="text-[#a8a7a0]">(mRFEI)</span>
                    </h1>
                    <p className="m-0 text-[18px] leading-[1.6] text-[#5f5f5a]">{MRFEI_META.lead[lang]}</p>
                </header>

                {/* metrics */}
                <section className="mt-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[#e9e7e2]">
                        {MRFEI_METRICS.map((m, i) => (
                            <div key={m.label.en} className={`pt-[22px] pb-4 pr-6 border-[#e9e7e2] ${i % 2 === 0 ? 'pl-0' : 'pl-6'} ${i % 4 === 0 ? 'md:pl-0' : 'md:pl-6'} ${i % 2 !== 0 ? 'border-l' : ''} ${i % 4 !== 0 ? 'md:border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}>
                                <div className={`font-mono text-[24px] md:text-[28px] font-medium tracking-[-0.035em] tabular-nums ${m.accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.value}</div>
                                <div className="mt-1.5 text-[13px] text-[#86857e]">{m.label[lang]}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* map figure */}
                <section className="mt-12">
                    <Figure caption={lang === 'tr' ? 'Mahalleye göre sağlıklı gıda erişimi' : 'Healthy-food access by tract'} tag="ILLUSTRATIVE">
                        <div className="overflow-x-auto">
                            <svg viewBox={`0 0 ${COLS * 30} ${ROWS * 30}`} className="w-full max-w-[680px]" role="img" aria-label="mRFEI choropleth">
                                {MAP_GRID.flatMap((row, r) => row.map((lvl, c) => (
                                    <rect key={`${r}-${c}`} x={c * 30 + 2} y={r * 30 + 2} width={26} height={26} rx={3} fill={lvl === 0 ? '#d6cfc5' : '#059669'} fillOpacity={lvl === 0 ? 0.5 : OPACITY[lvl]} />
                                )))}
                            </svg>
                        </div>
                        <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-[#86857e]">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px]" style={{ background: '#d6cfc5' }} /> 0 · {lang === 'tr' ? 'gıda çölü' : 'food desert'}</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] bg-[#059669] opacity-30" /> {lang === 'tr' ? 'düşük' : 'low'}</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[2px] bg-[#059669]" /> {lang === 'tr' ? 'yüksek erişim' : 'high access'}</span>
                        </div>
                    </Figure>
                </section>

                {/* sections + charts */}
                <Prose title={MRFEI_SECTIONS[0].title[lang]} body={MRFEI_SECTIONS[0].body[lang]} />

                <Prose title={MRFEI_SECTIONS[1].title[lang]} body={MRFEI_SECTIONS[1].body[lang]}>
                    <div className="mt-5 rounded-lg border border-[#e9e7e2] bg-[#f3f1ec] p-4 font-mono text-[13px] text-[#33332f]">
                        mRFEI = healthy / (healthy + less-healthy) × 100
                    </div>
                </Prose>

                <section className="mt-8">
                    <Figure caption={lang === 'tr' ? 'mRFEI dağılımı (mahalle sayısı)' : 'mRFEI distribution (tracts)'} tag="ILLUSTRATIVE">
                        <div style={{ height: 300 }}><PlotlyChart data={distData} layout={base()} config={config} /></div>
                    </Figure>
                </section>

                <Prose title={MRFEI_SECTIONS[2].title[lang]} body={MRFEI_SECTIONS[2].body[lang]} />

                <section className="mt-8">
                    <Figure caption={lang === 'tr' ? 'Alan tipine göre ortalama mRFEI · %95 GA' : 'Mean mRFEI by area type · 95% CI'} tag="ILLUSTRATIVE">
                        <div style={{ height: 300 }}><PlotlyChart data={areaData} layout={base({ margin: { t: 20, r: 14, b: 36, l: 40 } })} config={config} /></div>
                    </Figure>
                </section>

                <Prose title={MRFEI_SECTIONS[3].title[lang]} body={MRFEI_SECTIONS[3].body[lang]} />

                {/* stack + links */}
                <section className="mt-12 border-t border-[#e9e7e2] pt-8 flex flex-wrap items-center justify-between gap-4">
                    <span className="font-mono text-[13px] font-medium text-[#565650]">{MRFEI_META.stack}</span>
                    <div className="flex gap-5 text-[14px] font-medium">
                        <a href="https://github.com/sadik-coban" target="_blank" rel="noopener noreferrer" className="text-[#5f5f5a] hover:text-[#1a1a1a] transition-colors">GitHub ↗</a>
                        <Link href={localize('/projects', lang)} className="text-[#047857] hover:text-[#1a1a1a] transition-colors">{t('home.work.viewAll')} →</Link>
                    </div>
                </section>
            </article>
        </PaperShell>
    );
}

function Prose({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
    return (
        <section className="mt-10 max-w-2xl">
            <h2 className="m-0 mb-3 text-[24px] font-semibold tracking-[-0.02em] text-[#1a1a1a]">{title}</h2>
            <p className="m-0 text-[17px] leading-[1.65] text-[#5f5f5a]">{body}</p>
            {children}
        </section>
    );
}
