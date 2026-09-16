import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Server-only reader for the reports the analysis pipeline generates
// (clean/car_price_report/ and clean/text_analysis/, synced by scripts/sync-reports).
//
// The markdown is copied in byte-for-byte, so a re-sync is a plain file copy and the site can
// never disagree with the generator about wording.
//
// The document comes back as a list of blocks rather than one HTML string, because every
// figure the generator emits as a PNG is drawn natively instead — the site already had all 32
// of those charts in Plotly. Splitting here, where the markdown is still text, avoids doing
// DOM surgery on rendered HTML in the browser. It is safe because the generator always puts a
// figure alone on its line (verified across all eight documents).

export type ReportKind = 'car-price' | 'text-analysis';
export type ReportVariant = 'business' | 'technical';
export type ReportLang = 'tr' | 'en';

export type Block =
    | { type: 'html'; html: string }
    | { type: 'figure'; slug: string; caption: string; fallback: string };

const DIR = path.join(process.cwd(), 'content', 'reports');
const FIGURE_LINE = /^!\[([^\]]*)\]\(figures\/(?:tr|en)-([a-z0-9-]+)\.png\)\s*$/;

type HastNode = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };

/**
 * Gives every section heading a positional id (s-1, s-2, …) and marks it for the contents list.
 *
 * Positional rather than slugged from the text, on purpose: the page swaps language in place,
 * and a slug like "ne-kadar-degerinde" does not exist in the English document, so a link copied
 * in Turkish would break the moment you switch. The generator emits the two languages with an
 * identical heading structure (checked: h2 counts match in all eight documents), so section 3 is
 * #s-3 in both — a shared link and the reader's place both survive the toggle.
 *
 * The counter is shared across the chunks one document is rendered in; ids stay unique per page.
 */
const sectionIds = (counter: { n: number }) => () => (tree: HastNode) => {
    const walk = (node: HastNode) => {
        if (node.type === 'element' && node.tagName === 'h2') {
            node.properties = { ...(node.properties || {}), id: `s-${++counter.n}`, dataToc: '' };
        }
        node.children?.forEach(walk);
    };
    walk(tree);
};

const toHtml = async (md: string, counter: { n: number }) => {
    if (!md.trim()) return '';
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)                    // the business notes are table-heavy
        .use(remarkRehype)
        .use(sectionIds(counter))
        .use(rehypeStringify)
        .process(md);
    return String(file);
};

export const getReport = cache(async (
    kind: ReportKind,
    variant: ReportVariant,
    lang: ReportLang,
): Promise<{ blocks: Block[]; words: number; figures: number; generated: string }> => {
    const file = path.join(DIR, kind, `${variant}.${lang}.md`);
    const [raw, stat] = await Promise.all([fs.readFile(file, 'utf8'), fs.stat(file)]);

    const routeBase = kind === 'car-price' ? '/projects/car-price/report-preview' : '/projects/car-price/text-preview';

    const blocks: Block[] = [];
    let buffer: string[] = [];
    const counter = { n: 0 };
    const flush = async () => {
        const html = await toHtml(buffer.join('\n'), counter);
        if (html) blocks.push({ type: 'html', html });
        buffer = [];
    };

    for (const line of raw.split('\n')) {
        const hit = line.match(FIGURE_LINE);
        if (hit) {
            await flush();
            blocks.push({
                type: 'figure',
                caption: hit[1],
                slug: hit[2],
                // Kept so a slug the registry does not know still shows something real.
                fallback: `/report-figures/${kind}/${lang}-${hit[2]}.png`,
            });
        } else {
            // The two documents cross-reference each other as sibling files — right on disk,
            // a dead link on the site. Both the target and the label are rewritten: "technical.tr.md"
            // is a filename, not something a reader clicks. The language suffix is dropped
            // because the page carries its own TR/EN toggle.
            const label = {
                business: lang === 'tr' ? 'karar notu' : 'decision note',
                technical: lang === 'tr' ? 'teknik rapor' : 'technical report',
            };
            buffer.push(line.replace(
                /\[(?:business|technical)\.(?:tr|en)\.md\]\((business|technical)\.(?:tr|en)\.md\)/g,
                (_m, doc: 'business' | 'technical') => `[${label[doc]}](${routeBase}/${doc})`,
            ));
        }
    }
    await flush();

    return {
        blocks,
        words: raw.split(/\s+/).filter(Boolean).length,
        figures: blocks.filter((b) => b.type === 'figure').length,
        generated: stat.mtime.toISOString().slice(0, 10),
    };
});
