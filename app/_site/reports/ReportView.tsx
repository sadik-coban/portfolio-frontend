"use client";

import { useEffect, useState } from 'react';
import NotebookShell, { type ReportKey } from './NotebookShell';
import type { Block, ReportLang } from './report-source';
import { useReportFigures, ReportFigure } from './figures';
import { useLang } from '../i18n';

type Doc = { blocks: Block[]; words: number; figures: number; generated: string };

// Renders one generated report inside the notebook shell the live report pages use — contents
// rail, read progress, drawer on a phone.
//
// The report follows the site's language: the server renders the document for the locale in
// the route, so the page carries one language's prose and the EN/TR control in the rail moves
// the whole site, report included. The prose is in the HTML, so the page reads with JS off.
//
// The figures are the exception: they are drawn natively with Plotly from report-data.json,
// fetched once on mount. That file is ~350 KB, which belongs in a cacheable request rather than
// inlined into every page's HTML. Until it lands, each figure shows the PNG the pipeline
// generated — so there is never an empty slot where a chart should be.

export default function ReportView({ kind, active, kicker, title, doc, note }: {
    kind: 'car-price' | 'text-analysis';
    active: ReportKey;
    kicker: string;
    title: string;
    doc: Doc;
    note?: string;
}) {
    const lang = useLang().lang as ReportLang;
    const [data, setData] = useState<Record<string, unknown> | null>(null);
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

            {/* The left padding is the live report's section gutter: the "[01]" of each section
                sits in it, and the chapter bands pull back out across it. */}
            <div className="max-w-[860px] sm:pl-14">
                {doc.blocks.map((b, i) => (
                    b.type === 'figure'
                        ? <ReportFigure key={i} fig={figures[b.slug]} caption={b.caption} fallback={b.fallback} />
                        : <Prose key={i} html={b.html} lang={lang} />
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
//
// Headings, method notes and tables are styled where they are rendered (report-source.ts, in the
// live report's look), not here. `lang` is not decoration: the table headers are CSS capitals, and without it a Turkish
// "tekil ilan" capitalises to "TEKIL ILAN" instead of "TEKİL İLAN".
function Prose({ html, lang }: { html: string; lang: ReportLang }) {
    return (
        <div
            lang={lang}
            className="prose prose-neutral max-w-none [overflow-wrap:anywhere] [&_table]:[overflow-wrap:normal]
                prose-h1:hidden
                prose-p:max-w-[680px] prose-p:text-[15px] prose-p:leading-[1.7] prose-p:text-[#33332f] sm:prose-p:text-[16px]
                prose-li:max-w-[680px] prose-li:text-[15px] prose-li:leading-[1.65] prose-li:text-[#33332f]
                prose-strong:font-semibold prose-strong:text-[#1a1a1a]
                prose-a:text-[#047857] prose-a:no-underline hover:prose-a:underline
                prose-hr:border-[#e9e7e2]
                [&_td_code]:[font-size:inherit] [&_td_code]:px-1 [&_blockquote_code]:[font-size:inherit] [&_blockquote_code]:px-1
                [&_code]:rounded-[5px] [&_code]:bg-[#f3f1ec] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-[#047857]
                [&_code]:before:content-[''] [&_code]:after:content-['']"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
