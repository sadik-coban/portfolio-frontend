import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Server-only reader for the reports the analysis pipeline generates
// (clean/car_price_report/ and clean/text_analysis/, via scripts/sync-reports.mjs).
//
// The markdown is copied in byte-for-byte, so a re-sync is a plain file copy and the site can
// never disagree with the generator about wording. The one thing rewritten here is the image
// prefix: the pipeline writes `figures/tr-05-….png` because its markdown sits next to a
// figures/ folder, and on the site those same files are served from /report-figures/<report>/.
// Rewriting at render time rather than at sync time is what keeps the copy verbatim.

export type ReportKind = 'car-price' | 'text-analysis';
export type ReportVariant = 'business' | 'technical';
export type ReportLang = 'tr' | 'en';

const DIR = path.join(process.cwd(), 'content', 'reports');

export const getReportHtml = cache(async (
    kind: ReportKind,
    variant: ReportVariant,
    lang: ReportLang,
): Promise<{ html: string; words: number; figures: number }> => {
    const raw = await fs.readFile(path.join(DIR, kind, `${variant}.${lang}.md`), 'utf8');

    const routeBase = kind === 'car-price' ? '/projects/car-price/report-preview' : '/projects/car-price/text-preview';

    const md = raw
        // Point the figures at /public. Only the generator's own relative prefix is touched.
        .replace(/\]\(figures\//g, `](/report-figures/${kind}/`)
        // The two documents cross-reference each other as sibling files, which is right on disk
        // and a dead link on the site. Send them to the matching route instead; the language
        // suffix is dropped because the page carries its own TR/EN toggle.
        .replace(/\]\((business|technical)\.(tr|en)\.md\)/g, `](${routeBase}/$1)`);

    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)                                  // the business notes are table-heavy
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(md);

    return {
        html: String(file),
        words: md.split(/\s+/).filter(Boolean).length,
        figures: (md.match(/!\[/g) || []).length,
    };
});

/** What the pipeline last wrote, so the page can say how fresh it is. */
export const getReportMeta = cache(async (kind: ReportKind, variant: ReportVariant, lang: ReportLang) => {
    const stat = await fs.stat(path.join(DIR, kind, `${variant}.${lang}.md`));
    return { generated: stat.mtime.toISOString().slice(0, 10) };
});
