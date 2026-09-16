"use client";

import { useState } from 'react';
import FinalShell from '../FinalShell';
import type { ReportLang } from './report-source';

type Doc = { html: string; words: number; figures: number; generated: string };

// Renders one generated report inside the car-price app shell.
//
// Both languages arrive already rendered from the server, so the toggle is a state flip with
// no refetch — on a phone that is the difference between instant and a spinner. It also means
// the page works with JS disabled: the Turkish copy is in the HTML either way.
//
// The site is English-only (I18N_ENABLED is false), so this toggle is local to the page and
// touches nothing global.

export default function ReportPreview({
    active, kicker, title, docs, defaultLang = 'tr', note,
}: {
    active: 'report-business' | 'report-technical' | 'text-business' | 'text-technical';
    kicker: string;
    title: string;
    docs: Record<ReportLang, Doc>;
    defaultLang?: ReportLang;
    note?: string;
}) {
    const [lang, setLang] = useState<ReportLang>(defaultLang);
    const doc = docs[lang];

    return (
        <FinalShell active={active} kicker={kicker} title={title}>
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
                    {doc.figures} {lang === 'tr' ? 'figür' : 'figures'} · {doc.words.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {lang === 'tr' ? 'kelime' : 'words'}
                </span>

                <span className="ml-auto font-mono text-[11px] text-[#9a9a92]">
                    {lang === 'tr' ? 'üretim' : 'generated'} {doc.generated}
                </span>
            </div>

            {note && (
                <p className="mb-7 max-w-[70ch] rounded-[10px] border border-[#e4e2dd] bg-[#fdfcf9] px-4 py-3 text-[13.5px] leading-[1.6] text-[#5f5f5a]">
                    {note}
                </p>
            )}

            {/* The generator owns the words; this only gives them the site's typography.
                Figures are wide, so they get the full measure while prose stays readable. */}
            <article
                className="prose prose-neutral max-w-none
                    prose-headings:font-semibold prose-headings:tracking-[-0.025em] prose-headings:text-[#1a1a1a]
                    prose-h1:hidden
                    prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-[21px] sm:prose-h2:text-[23px]
                    prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[17px]
                    prose-p:max-w-[70ch] prose-p:text-[15px] prose-p:leading-[1.7] prose-p:text-[#33332f] sm:prose-p:text-[16px]
                    prose-li:max-w-[70ch] prose-li:text-[15px] prose-li:leading-[1.65] prose-li:text-[#33332f]
                    prose-strong:font-semibold prose-strong:text-[#1a1a1a]
                    prose-a:text-[#047857] prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:max-w-[70ch] prose-blockquote:border-l-[3px] prose-blockquote:border-[#059669]
                    prose-blockquote:pl-5 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[#5f5f5a]
                    prose-hr:border-[#e9e7e2]
                    prose-img:my-7 prose-img:w-full prose-img:rounded-[12px] prose-img:border prose-img:border-[#e4e2dd] prose-img:bg-[#fdfcf9]
                    prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-table:text-[14px]
                    prose-thead:border-[#e9e7e2]
                    prose-th:whitespace-nowrap prose-th:font-mono prose-th:text-[11px] prose-th:font-medium prose-th:uppercase prose-th:tracking-[0.05em] prose-th:text-[#86857e]
                    prose-td:text-[#33332f] [&_td]:tabular-nums [&_tbody_tr]:border-[#f0eee9]
                    [&_code]:rounded-[5px] [&_code]:bg-[#f3f1ec] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-[#047857]
                    [&_code]:before:content-[''] [&_code]:after:content-['']"
                dangerouslySetInnerHTML={{ __html: doc.html }}
            />
        </FinalShell>
    );
}
