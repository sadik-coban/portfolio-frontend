import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Server-only reader for the reports the analysis pipeline generates
// (clean/car_price_report/ and clean/text_analysis/, copied into content/reports/).
//
// The markdown is copied in byte-for-byte, so a re-sync is a plain file copy and the site can
// never disagree with the generator about wording.
//
// The document comes back as a list of blocks rather than one HTML string, because every
// figure the generator emits as a PNG is drawn natively instead (figures.tsx). Splitting here, where the markdown is still text, avoids doing
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
 * Turns the generator's two heading levels into the live report's notebook structure.
 *
 * The live pages (FinalReportLab, FinalTextAnalysis) are chapters and sections: a chapter band —
 * green rule, "01" and the title in mono capitals — then sections with a big title and an
 * execution-count "[01]" in the left gutter, restarting in every chapter. The generator writes
 * `## 1. Title` and `### Title`, the same two-level shape, so h2 becomes the band and h3 the
 * section, and the contents rail can group them the way the live rail does.
 *
 * The number leaves the heading's text for data-n and is drawn by ::before. The text is what the
 * contents rail and the phone title bar read, and neither should say "1. " or "[01]". A decision
 * note's headings carry no number, so its bands are numbered by position.
 *
 * Ids are positional (s-2, s-2-3) rather than slugs: the page swaps language in place, and a slug
 * does not exist in the other language. TR and EN share the heading structure (checked, h2 and h3,
 * all eight documents), so a shared link and the reader's place both survive the toggle. The
 * counter is shared across the chunks one document is rendered in.
 */
const H2_BAND = 'not-prose mb-8 mt-16 flex scroll-mt-[84px] items-center gap-3 border-t-2 border-[#047857]/25 pt-6 font-mono text-[13px] font-normal uppercase leading-snug tracking-[0.16em] text-[#5f5f5a] sm:-ml-14 before:shrink-0 before:text-[12px] before:font-bold before:tracking-normal before:text-[#047857] before:content-[attr(data-n)]';
const H3_SECTION = 'not-prose group relative mb-3 mt-12 scroll-mt-[84px] text-[21px] font-semibold leading-[1.3] tracking-[-0.028em] text-[#1a1a1a] sm:text-[23px] before:mr-3 before:font-mono before:text-[13px] before:font-bold before:tracking-normal before:text-[#047857] before:content-[attr(data-n)] sm:before:absolute sm:before:-left-14 sm:before:top-[7px] sm:before:mr-0 sm:before:w-11 sm:before:text-right sm:before:text-[12px] sm:before:font-normal sm:before:tabular-nums sm:before:text-[#9a9a92] sm:before:transition-colors sm:hover:before:text-[#047857]';

const pad2 = (n: number) => String(n).padStart(2, '0');

const headings = (counter: { h2: number; h3: number }) => () => (tree: HastNode) => {
    const walk = (node: HastNode) => {
        if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
            if (node.tagName === 'h2') {
                counter.h2 += 1;
                counter.h3 = 0;
                const first = node.children?.[0] as (HastNode & { value?: string }) | undefined;
                const hit = first?.type === 'text' ? first.value?.match(/^\s*(\d+)\.\s+/) : null;
                if (hit && first) first.value = first.value!.slice(hit[0].length);
                node.properties = {
                    ...(node.properties || {}), id: `s-${counter.h2}`, dataToc: '2',
                    dataN: pad2(hit ? Number(hit[1]) : counter.h2), className: H2_BAND.split(' '),
                };
            } else {
                counter.h3 += 1;
                node.properties = {
                    ...(node.properties || {}), id: `s-${counter.h2}-${counter.h3}`, dataToc: '3',
                    dataN: `[${pad2(counter.h3)}]`, className: H3_SECTION.split(' '),
                };
            }
        }
        node.children?.forEach(walk);
    };
    walk(tree);
};

/**
 * Blockquotes become the live report's method notes (<Method>): a grey mono box opened by a green
 * "// ". The generator uses blockquotes for exactly that — provenance lines and "Not —" caveats.
 */
// not-prose also strips list markers, and a note can hold a list (the hand-written explanations
// under the large-error examples), so bullets and block spacing are put back here.
const METHOD_NOTE = 'not-prose my-6 rounded-[10px] border border-[#e9e7e2] bg-[#f3f1ec] px-4 py-3 font-mono text-[12px] leading-[1.6] text-[#5f5f5a] [&_a]:text-[#047857] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-[#33332f] [&>*+*]:mt-2.5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-4 [&_li]:marker:text-[#047857]';

const methodNotes = () => (tree: HastNode) => {
    const walk = (node: HastNode) => {
        if (node.type === 'element' && node.tagName === 'blockquote') {
            node.properties = { ...(node.properties || {}), className: METHOD_NOTE.split(' ') };
            const firstP = node.children?.find((c) => c.type === 'element' && c.tagName === 'p');
            firstP?.children?.unshift({
                type: 'element', tagName: 'span', properties: { className: ['text-[#047857]'] },
                children: [{ type: 'text', value: '// ' } as HastNode],
            });
            return;
        }
        node.children?.forEach(walk);
    };
    walk(tree);
};

/**
 * Dresses every table the way the live report's <Table> component does (FinalReportLab.tsx):
 * a rounded, bordered box that scrolls on its own, a beige header band in small mono capitals,
 * mono cells on cream with a hairline between rows, the first column dark and the rest muted.
 *
 * The classes go onto the elements here, on the server, because the tables arrive as markdown —
 * there is no component to hand them to. `not-prose` on the wrapper keeps the typography plugin's
 * own table styles from fighting these.
 *
 * One rule differs, on purpose. <Table> right-aligns every column after the first because its
 * tables were all numbers. The generator's tables also carry text columns (controls, example
 * columns, cluster axes), so alignment follows the markdown instead: the generator writes `---:`
 * for numbers, which gives exactly the old right-aligned, tabular, unbroken look, and `---` for
 * text, which stays left and wraps.
 *
 * The minimum width is <Table>'s formula, so a wide table scrolls on a phone at the same point.
 */
const TABLE_WRAP = 'not-prose my-6 overflow-x-auto rounded-[12px] border border-[#e4e2dd]';
const TABLE = 'w-full border-collapse text-left';
const TABLE_HEAD_ROW = 'bg-[#f1efe9]';
const TABLE_TH = 'px-2 py-[11px] align-bottom font-mono text-[10px] font-normal uppercase tracking-[0.05em] text-[#5f5f5a] first:pl-3.5 last:pr-3.5 sm:first:pl-[18px] sm:last:pr-[18px]';
const TABLE_BODY_ROW = 'border-t border-[#ece9e3] bg-[#fdfcf9]';
const TABLE_TD = 'px-2 py-[11px] align-middle font-mono text-[12px] text-[#5f5f5a] first:pl-3.5 first:text-[#1a1a1a] last:pr-3.5 sm:text-[13px] sm:first:pl-[18px] sm:last:pr-[18px]';
const ALIGN: Record<string, string> = { right: 'text-right whitespace-nowrap tabular-nums', center: 'text-center' };

const tableStyle = () => (tree: HastNode) => {
    const kids = (node: HastNode, tag: string) => (node.children || []).filter((c) => c.type === 'element' && c.tagName === tag);
    const addClass = (node: HastNode, cls: string) => {
        node.properties = { ...(node.properties || {}), className: cls.split(' ') };
    };
    const styleCells = (row: HastNode, tag: 'th' | 'td', base: string) => {
        for (const cell of kids(row, tag)) {
            const align = cell.properties?.align as string | undefined;
            if (cell.properties) delete cell.properties.align;
            addClass(cell, align && ALIGN[align] ? `${base} ${ALIGN[align]}` : base);
        }
    };
    const walk = (node: HastNode) => {
        node.children?.forEach((child, i) => {
            if (child.type !== 'element' || child.tagName !== 'table') return walk(child);
            const head = kids(child, 'thead')[0];
            const headRow = head ? kids(head, 'tr')[0] : undefined;
            const cols = headRow ? kids(headRow, 'th').length : 1;
            addClass(child, TABLE);
            child.properties = { ...child.properties, style: `min-width:${220 + (cols - 1) * 84}px` };
            if (headRow) { addClass(headRow, TABLE_HEAD_ROW); styleCells(headRow, 'th', TABLE_TH); }
            for (const body of kids(child, 'tbody')) {
                for (const row of kids(body, 'tr')) { addClass(row, TABLE_BODY_ROW); styleCells(row, 'td', TABLE_TD); }
            }
            node.children![i] = { type: 'element', tagName: 'div', properties: { className: TABLE_WRAP.split(' ') }, children: [child] };
        });
    };
    walk(tree);
};

const toHtml = async (md: string, counter: { h2: number; h3: number }) => {
    if (!md.trim()) return '';
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)                    // the business notes are table-heavy
        .use(remarkRehype)
        .use(headings(counter))
        .use(methodNotes)
        .use(tableStyle)
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
    const counter = { h2: 0, h3: 0 };
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
