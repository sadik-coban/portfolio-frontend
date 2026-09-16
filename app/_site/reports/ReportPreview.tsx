"use client";

import { useEffect, useState } from 'react';
import NotebookShell, { type ReportKey } from './NotebookShell';
import type { Block, ReportLang } from './report-source';
import { useReportFigures, ReportFigure } from './figures';

type Doc = { blocks: Block[]; words: number; figures: number; generated: string };

// Renders one generated report inside the notebook shell the live report pages use — contents
// rail, read progress, drawer on a phone.
//
// Both languages arrive already rendered from the server, so the toggle is a state flip with
// no refetch — on a phone that is the difference between instant and a spinner. The prose is
// in the HTML either way, so the page reads with JS disabled.
//
// The figures are the exception: they are drawn natively with Plotly from report-data.json,
// fetched once on mount. That file is 469 KB, which belongs in a cacheable request rather than
// inlined into every page's HTML. Until it lands, each figure shows the PNG the pipeline
// generated — so there is never an empty slot where a chart should be.
//
// The site is English-only (I18N_ENABLED is false), so this toggle is local to the page and
// touches nothing global.

export default function ReportPreview({
    kind, active, kicker, title, docs, defaultLang = 'tr', note,
}: {
    kind: 'car-price' | 'text-analysis';
    active: ReportKey;
    kicker: string;
    title: string;
    docs: Record<ReportLang, Doc>;
    defaultLang?: ReportLang;
    note?: string;
}) {
    const [lang, setLang] = useState<ReportLang>(defaultLang);
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const doc = docs[lang];
    const figures = useReportFigures(kind, data, lang);

    useEffect(() => {
        let alive = true;
        fetch(kind === 'car-price' ? '/report-data.json' : '/text_data.json')
            .then((r) => r.text())
            // the export carries Infinity/NaN, which are not valid JSON
            .then((t) => { if (alive) setData(JSON.parse(t.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'))); })
            .catch(() => { /* figures fall back to the generated PNGs */ });
        return () => { alive = false; };
    }, [kind]);

    const T = (tr: string, en: string) => (lang === 'tr' ? tr : en);

    return (
        <NotebookShell active={active} lang={lang} title={title} contentKey={kind + ':' + active + ':' + lang}>
            <div className="mb-7">
                <div className="mb-2 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[#047857]">{kicker}</div>
                <h1 className="text-[28px] font-bold tracking-[-0.041em] text-[#1a1a1a] md:text-[34px]">{title}</h1>
            </div>

            <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#e9e7e2] pb-5">
                <div className="inline-flex rounded-[8px] border border-[#d8d6d0] p-[3px]" role="group" aria-label="Dil / Language">
                    {(['tr', 'en'] as const).map((l) => (
                        <button
                            key={l}
                            type="button"
                            onClick={() => setLang(l)}
                            aria-pressed={lang === l}
                            className={`rounded-[6px] px-3 py-[5px] font-mono text-[12px] uppercase tracking-[0.08em] transition-colors ${
                                lang === l ? 'bg-[#1a1a1a] text-[#f7f6f3]' : 'text-[#5f5f5a] hover:text-[#1a1a1a]'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <span className="font-mono text-[11px] text-[#86857e]">
                    {doc.figures} {T('figür', 'figures')} · {doc.words.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {T('kelime', 'words')}
                    {data ? ` · ${T('etkileşimli', 'interactive')}` : ''}
                </span>

                <span className="ml-auto font-mono text-[11px] text-[#9a9a92]">
                    {T('üretim', 'generated')} {doc.generated}
                </span>
            </div>

            {note && (
                <p className="mb-7 max-w-[70ch] rounded-[10px] border border-[#e4e2dd] bg-[#fdfcf9] px-4 py-3 text-[13.5px] leading-[1.6] text-[#5f5f5a]">
                    {note}
                </p>
            )}

            <div className="max-w-[860px]">
                {doc.blocks.map((b, i) => (
                    b.type === 'figure'
                        ? <ReportFigure key={i} fig={figures[b.slug]} caption={b.caption} fallback={b.fallback} />
                        : <Prose key={i} html={b.html} />
                ))}
            </div>
        </NotebookShell>
    );
}

// The generator owns the words; this only gives them the site's typography.
//
// overflow-wrap:anywhere is what keeps a phone from scrolling sideways. The reports quote file
// paths as inline code, and a path has no break opportunity — worse in Turkish, where a case
// suffix attaches with an apostrophe ("…/extraction_results.jsonl'dan") and the path plus the
// suffix become one unbreakable run. Measured on the text technical report at 393px: that run
// pushed the page to 406px in TR while EN fit. `anywhere` breaks only a run that cannot fit on a
// line of its own, so ordinary words are untouched; unlike `break-word` it also lowers the
// min-content width, which is what actually stops the overflow inside the flex layout. Tables opt
// back out: they already scroll inside their own box, and a figure split mid-number reads worse.
function Prose({ html }: { html: string }) {
    return (
        <div
            className="prose prose-neutral max-w-none [overflow-wrap:anywhere] [&_table]:[overflow-wrap:normal]
                prose-headings:font-semibold prose-headings:tracking-[-0.025em] prose-headings:text-[#1a1a1a]
                prose-h1:hidden
                prose-h2:mt-12 prose-h2:mb-4 prose-h2:scroll-mt-[84px] prose-h2:text-[21px] sm:prose-h2:text-[23px]
                prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[17px]
                prose-p:max-w-[70ch] prose-p:text-[15px] prose-p:leading-[1.7] prose-p:text-[#33332f] sm:prose-p:text-[16px]
                prose-li:max-w-[70ch] prose-li:text-[15px] prose-li:leading-[1.65] prose-li:text-[#33332f]
                prose-strong:font-semibold prose-strong:text-[#1a1a1a]
                prose-a:text-[#047857] prose-a:no-underline hover:prose-a:underline
                prose-blockquote:max-w-[70ch] prose-blockquote:border-l-[3px] prose-blockquote:border-[#059669]
                prose-blockquote:pl-5 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[#5f5f5a]
                prose-hr:border-[#e9e7e2]
                prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-table:text-[14px]
                prose-thead:border-[#e9e7e2]
                prose-th:whitespace-nowrap prose-th:font-mono prose-th:text-[11px] prose-th:font-medium prose-th:uppercase prose-th:tracking-[0.05em] prose-th:text-[#86857e]
                prose-td:text-[#33332f] [&_td]:tabular-nums [&_tbody_tr]:border-[#f0eee9]
                [&_code]:rounded-[5px] [&_code]:bg-[#f3f1ec] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-[#047857]
                [&_code]:before:content-[''] [&_code]:after:content-['']"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
