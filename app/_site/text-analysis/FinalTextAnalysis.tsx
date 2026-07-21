"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, ArrowLeft } from 'lucide-react';
import PlotlyChart from '@/components/charts/PlotlyChart';
import { makeHybridTheme } from '../../_charts/types';
import { useLang, localize } from '../i18n';
import { Monogram } from '../Monogram';
import * as LBL from '@/lib/labels';

// Text analysis, written as a notebook report in the same shell as the report: its own
// TOC rail + scroll-spy + read progress instead of the car-price sidebar, and the [n]
// execution-count section motif. Driven entirely by public/text_data.json (merged from
// site_pipeline/text_nlp/* by scripts/build-text-data.mjs) — no figure is typed by hand.
//
// Framing carried from PIPELINE_TEXT.md: the text doesn't add explained variance to
// price, so the page argues what it IS for — claim consistency, equipment inference,
// anomaly triage. A contradiction = the seller's OWN self-contradiction (NOT fraud), an
// anomaly = a review candidate (not evidence), NMF themes carry no price claim.
//
// Two things are deliberately absent. The R² comparison (structural R² / text ΔR²) is
// gone: quoting a near-zero delta made the page open on what the text fails to do. And
// the semantic-search section went with its payload (concept lenses + anchor listings),
// because live free-text search is a separate, deferred layer and a precomputed dropdown
// demoed a capability the site does not serve. Sections renumbered 01–09 accordingly.

export default function FinalTextAnalysis({ initialData }: { initialData?: any } = {}) {
    const { lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const theme = useMemo(() => makeHybridTheme(), []);
    const [d, setD] = useState<any>(initialData ?? null);
    const [err, setErr] = useState(false);
    // Notebook shell state: TOC (built from the rendered sections), scroll-spy active id, read progress, mobile drawer.
    const [toc, setToc] = useState<{ id: string; title: string; chapter: string; chapterId: string }[]>([]);
    const [activeId, setActiveId] = useState('');
    const [drawer, setDrawer] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const goTo = (id: string) => {
        setDrawer(false);
        const el = document.getElementById(id);
        if (!el) return;
        for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p.tagName === 'DETAILS') (p as HTMLDetailsElement).open = true;
        window.dispatchEvent(new Event('resize')); // let Plotly re-measure charts mounted at zero width
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        history.replaceState(null, '', '#' + id);
    };

    useEffect(() => {
        if (initialData) return; // seeded from the server (static SSR) — skip the fetch
        fetch('/text_data.json').then((r) => r.json()).then(setD).catch(() => setErr(true));
    }, [initialData]);

    // After the body renders: build the TOC from [data-section]/[data-chapter], wire a
    // scroll-spy (top-most visible section → active item, hash mirrored) and a read-progress bar.
    useEffect(() => {
        if (!d) return;
        const root = mainRef.current;
        if (!root) return;
        const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-section],[data-chapter]'));
        const items: { id: string; title: string; chapter: string; chapterId: string }[] = [];
        let chapter = '', chapterId = '';
        nodes.forEach((el, i) => {
            if (!el.id) el.id = 'sec-' + i;
            const title = el.getAttribute('data-title') || '';
            if (el.hasAttribute('data-chapter')) { chapter = title; chapterId = el.id; return; }
            items.push({ id: el.id, title, chapter, chapterId });
        });
        setToc(items);
        let hashTimer: ReturnType<typeof setTimeout> | null = null;
        const io = new IntersectionObserver((entries) => {
            const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (!vis[0]) return;
            const id = vis[0].target.id;
            setActiveId(id);
            if (hashTimer) clearTimeout(hashTimer);
            hashTimer = setTimeout(() => { if (window.location.hash !== '#' + id) history.replaceState(null, '', '#' + id); }, 120);
        }, { rootMargin: '-84px 0px -66% 0px', threshold: 0 });
        items.forEach((it) => { const el = document.getElementById(it.id); if (el) io.observe(el); });
        // Progress written straight to the bar's DOM node (ref, not state) so scrolling
        // never re-renders the chart tree.
        let raf = 0;
        const paint = () => {
            raf = 0;
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
            if (progressRef.current) progressRef.current.style.width = (p * 100).toFixed(1) + '%';
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); if (hashTimer) clearTimeout(hashTimer); };
    }, [d, lang]);

    // Deep-link into a collapsed <details>, and open every one before printing.
    useEffect(() => {
        if (!d) return;
        // The semantic-search section was removed; its old permalink lands on the section
        // that now explains what the text is actually mined for.
        const HASH_ALIAS: Record<string, string> = {
            'semantic-search-concept-similar-listing': 'information-extraction-data-completion',
            'search': 'information-extraction-data-completion',
        };
        const reveal = () => {
            const raw = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
            if (!raw) return;
            const id = document.getElementById(raw) ? raw : (HASH_ALIAS[raw] ?? raw);
            const el = document.getElementById(id);
            if (!el) return;
            for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p.tagName === 'DETAILS') (p as HTMLDetailsElement).open = true;
            el.scrollIntoView({ block: 'start' });
        };
        const openAll = () => document.querySelectorAll('details').forEach((n) => { (n as HTMLDetailsElement).open = true; });
        const t = setTimeout(reveal, 0);
        window.addEventListener('hashchange', reveal);
        window.addEventListener('beforeprint', openAll);
        return () => { clearTimeout(t); window.removeEventListener('hashchange', reveal); window.removeEventListener('beforeprint', openAll); };
    }, [d]);

    // Heavy notebook body — memoized so scroll-driven shell re-renders (progress via ref,
    // activeId, drawer) reuse the SAME element and never re-run Plotly on the charts.
    const body = useMemo(() => {
        if (!d) return null;
        const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
        const loc = lang === 'tr' ? 'tr-TR' : 'en-US';
        const green = theme.accent, amber = '#e08a1e', red = '#b91c1c';
        const fmtN = (n: number) => Math.round(n).toLocaleString(loc);
        const fmtM = (n: number) => '₺' + (n / 1e6).toFixed(2) + 'M';
        const pct = (n: number, digits = 1) => (lang === 'tr' ? '%' + Number(n).toFixed(digits) : Number(n).toFixed(digits) + '%');
        const sgn = (n: number, digits = 1) => (n >= 0 ? '+' : '') + pct(n, digits);
        const fmtP = (p: number) => (p == null ? '' : p < 0.001 ? '<0.001' : p.toFixed(3));
        const dec = (n: number) => (lang === 'tr' ? String(n).replace('.', ',') : String(n));
        const ci = (a: number[]) => (a && a.length === 2 ? `${a[0].toFixed(1)}…${a[1].toFixed(1)}` : '—');
        // Data values arrive Turkish; every one that reaches the screen goes through lib/labels.
        const sevT = LBL.labeller(LBL.severity, lang);
        const claimT = LBL.labeller(LBL.claimType, lang);
        const chipT = LBL.labeller(LBL.damageChip, lang);
        const fieldT = LBL.labeller(LBL.claimField, lang);
        const countT = LBL.labeller(LBL.countField, lang);
        const equipT = LBL.labeller(LBL.equipment, lang);
        const coefT = LBL.labeller(LBL.coefFeature, lang);
        const residT = LBL.labeller(LBL.residualSignal, lang);
        const hookT = LBL.labeller(LBL.hook, lang);
        const sellerT = LBL.labeller(LBL.seller, lang);
        const llmClassT = LBL.labeller(LBL.llmClass, lang);
        const llmAttrT = LBL.labeller(LBL.llmAttr, lang);
        const llmVocabT = LBL.labeller(LBL.llmVocab, lang);
        const fuelT = LBL.labeller(LBL.fuel, lang);
        const transT = LBL.labeller(LBL.transmission, lang);
        const bodyT = LBL.labeller(LBL.bodyType, lang);
        // review_queue cells hold whichever vocabulary that row's field uses.
        const cellT = (v: any) => { const s = String(v ?? ''); return fuelT(transT(bodyT(s))); };
        const config = { displayModeBar: false as const, responsive: true, scrollZoom: false, doubleClick: false as const };
        const base = (over: any = {}) => {
            const { xaxis = {}, yaxis = {}, ...rest } = over;
            return {
                margin: { t: 12, r: 16, b: 28, l: 8 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { family: theme.fontSans, size: 11, color: theme.muted }, showlegend: false, dragmode: false as const,
                hoverlabel: { bgcolor: theme.surface, bordercolor: '#e4e2dd', font: { color: theme.text, family: theme.fontSans, size: 12 } },
                xaxis: { fixedrange: true, automargin: true, gridcolor: theme.grid, zeroline: false, linecolor: theme.grid, tickfont: { size: 10, color: theme.muted }, ...xaxis },
                yaxis: { fixedrange: true, automargin: true, gridcolor: theme.grid, zeroline: false, linecolor: theme.grid, tickfont: { size: 10, color: theme.muted }, ...yaxis },
                ...rest,
            };
        };

        // ── data handles ────────────────────────────────────────────────────────
        const meta = d.meta, cd = d.crosssource_damage, an = d.anomalies, reg = d.register, ex = d.extras;
        const hc = d.hedonic_coefficients, sev = d.flag_severity, hp = d.honesty_premium, st = d.seller_style, at = d.ad_title;
        const dmg = d.damage, fields = d.crosssource_fields, resid = d.residuals, llm = d.llm_enrichment;
        const q = cd?.quadrants || {};
        // Headline equipment rate — the coverage list is emitted sorted desc, so [0] is the top.
        const topEq = (ex?.equipment_coverage || [])[0] || null;
        const strict = hp?.flags?.dishonest_strict;
        const titleClean = hp?.flags?.title_clean_despite_damage;
        const dishonest = cd?.dishonest_examples || [];
        const gapEx = cd?.gap_examples || [];

        // Word chips for the two review queues. The pipeline stopped shipping raw listing
        // text (privacy pass, 2026-07-16) and now ships only the matched phrases, so the
        // queue shows what the detector caught rather than the seller's prose.
        const chips = (words: string[] | undefined, tone: 'clean' | 'dmg') => {
            const w = words || [];
            if (!w.length) return <span className="font-mono text-[11px] text-[#b8b6ae]">—</span>;
            return (
                <span className="flex flex-wrap justify-end gap-1">
                    {w.slice(0, 4).map((x) => (
                        <span key={x} className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${tone === 'clean' ? 'bg-[#e7f3ec] text-[#047857]' : 'bg-[#fdf7ec] text-[#b0872e]'}`}>{chipT(x)}</span>
                    ))}
                </span>
            );
        };

        // §01 — three views of the same 163 listings, because one bar hid the whole story.
        // (a) how bad the damage is, (b) how many panels, (c) what the ad actually claimed.
        // painted_dist / changed_dist / claim_type_n all shipped in the data already but
        // were never rendered; between them they show that the median flagged car is two
        // painted panels and nothing replaced, while a real minority is not that at all.
        const sevOrder = ['hafif', 'orta', 'ağır'].filter((k) => sev?.severity_n?.[k] != null);
        const sevData = sevOrder.length ? [{
            type: 'bar', x: sevOrder.map(sevT), y: sevOrder.map((k) => sev.severity_n[k]),
            marker: { color: [green, amber, red] },
            text: sevOrder.map((k) => `${sev.severity_n[k]} · ${sev.severity_pct?.[k] != null ? pct(sev.severity_pct[k]) : ''}`),
            textposition: 'outside', cliponaxis: false,
            hovertemplate: '%{x}: %{y}<extra></extra>',
        }] : null;

        // (b) panel counts — painted vs replaced, grouped over the same 0…6+ buckets.
        const distKeys = sev?.painted_dist ? Object.keys(sev.painted_dist) : [];
        const panelData = distKeys.length ? [
            { type: 'bar', name: L('boyalı', 'painted'), x: distKeys, y: distKeys.map((k) => sev.painted_dist[k] ?? 0), marker: { color: amber }, hovertemplate: L('%{y} ilan · %{x} boyalı panel', '%{y} listings · %{x} painted panels') + '<extra></extra>' },
            { type: 'bar', name: L('değişen', 'replaced'), x: distKeys, y: distKeys.map((k) => sev.changed_dist?.[k] ?? 0), marker: { color: red }, hovertemplate: L('%{y} ilan · %{x} değişen panel', '%{y} listings · %{x} replaced panels') + '<extra></extra>' },
        ] : null;

        // (c) what was claimed — the blanket "flawless" arm vs the two specific claims.
        // The arms overlap (a listing can match more than one), so this sums above n_flag.
        const claimRows = sev?.claim_type_n
            ? Object.entries(sev.claim_type_n as Record<string, number>).sort((a, b) => a[1] - b[1])
            : [];
        const claimData = claimRows.length ? [{
            type: 'bar', orientation: 'h',
            y: claimRows.map(([k]) => claimT(k)), x: claimRows.map(([, v]) => v),
            marker: { color: claimRows.map(([k]) => (k.startsWith('blanket') ? green : amber)) },
            text: claimRows.map(([, v]) => String(v)), textposition: 'outside', cliponaxis: false,
            hovertemplate: '%{y}: %{x}<extra></extra>',
        }] : null;

        // §02 equipment coverage (mention %)
        const eq = (ex?.equipment_coverage || []).slice().sort((a: any, b: any) => a.mention_pct - b.mention_pct);
        const eqData = eq.length ? [{ type: 'bar', orientation: 'h', y: eq.map((r: any) => equipT(r.feature)), x: eq.map((r: any) => r.mention_pct), marker: { color: green }, text: eq.map((r: any) => pct(r.mention_pct)), textposition: 'outside', hovertemplate: '%{y}: %{x:.1f}% · %{customdata} ' + L('ilan', 'listings') + '<extra></extra>', customdata: eq.map((r: any) => fmtN(r.n)) }] : null;

        // §04 hedonic coefficients (controlled %, sorted)
        const coefs = (hc?.coefficients || []).slice().sort((a: any, b: any) => a.controlled_pct - b.controlled_pct);
        const coefData = coefs.length ? [{ type: 'bar', orientation: 'h', y: coefs.map((c: any) => coefT(c.feature)), x: coefs.map((c: any) => c.controlled_pct), marker: { color: coefs.map((c: any) => (!c.sig ? '#b8b6ae' : c.controlled_pct >= 0 ? green : red)) }, error_x: { type: 'data', symmetric: false, array: coefs.map((c: any) => (c.ci95 ? c.ci95[1] - c.controlled_pct : 0)), arrayminus: coefs.map((c: any) => (c.ci95 ? c.controlled_pct - c.ci95[0] : 0)), color: '#b8b6ae', thickness: 1.2, width: 4 }, hovertemplate: '%{y}: %{x:+.1f}%<extra></extra>' }] : null;
        const coefRows = (hc?.coefficients || []).slice().sort((a: any, b: any) => b.controlled_pct - a.controlled_pct);

        // §08 residual robust signals. Defensive .filter(robust): the build script already
        // strips non-robust ones (PIPELINE_TEXT §6 forbids showing them), guard here too.
        const residSig = (resid?.signals || []).filter((s: any) => s.robust).slice().sort((a: any, b: any) => a.lift - b.lift);
        const residData = residSig.length ? [{ type: 'bar', orientation: 'h', y: residSig.map((s: any) => residT(s.signal)), x: residSig.map((s: any) => s.lift), marker: { color: green }, text: residSig.map((s: any) => `${s.lift.toFixed(2)}× · n${s.n_in_top5pct}`), textposition: 'outside', hovertemplate: '%{y}: %{x:.2f}× lift<extra></extra>' }] : null;

        // §09 field-contradiction counts. `km` was dropped upstream (odometer readings can't be
        // separated from service/purchase/swap km by pattern-matching) — it simply isn't in the data.
        const fcCounts: Record<string, number> = fields?.counts || {};
        const FIELD_LBL: Record<string, string> = { year: L('yıl', 'year'), hp: 'HP', model: L('model', 'model'), fuel: L('yakıt', 'fuel'), transmission: L('vites', 'transmission'), body: L('kasa', 'body'), drivetrain: L('çekiş', 'drivetrain'), engine_cc: 'cc' };
        const fcRows = Object.entries(fcCounts).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
        const fcData = fcRows.length ? [{ type: 'bar', orientation: 'h', y: fcRows.map(([k]) => countT(k)), x: fcRows.map(([, v]) => v), marker: { color: amber }, text: fcRows.map(([, v]) => String(v)), textposition: 'outside', hovertemplate: '%{y}: %{x} ' + L('çelişki', 'conflicts') + '<extra></extra>' }] : null;

        const reviewQ = fields?.review_queue || [];
        const HOOK_LBL: Record<string, string> = { 'hasarsız-iddia': L('hasarsız-iddia', 'clean-claim'), 'donanım': L('donanım', 'equipment'), 'durum/övgü': L('durum/övgü', 'condition/praise'), 'spec(yıl/km/motor)': L('spec (yıl/km/motor)', 'spec (year/km/engine)'), 'aciliyet/promo': L('aciliyet/promo', 'urgency/promo') };

        // Continuous section counter — the source dashboard numbers §01…§09 straight through,
        // so chapters group without resetting it.
        let sn = 0;
        const N = () => String(++sn).padStart(2, '0');

        return (
            <div className="max-w-[860px]">
                {/* Opening. States what the text is mined FOR — the price-accuracy comparison
                    is deliberately not the headline (see the file header). */}
                <p className="mb-6 max-w-[760px] text-[16px] leading-[1.7] text-[#33332f]">
                    {L(`${fmtN(meta.n)} ilan açıklamasının analizi. Serbest metin, yapısal alanların göremediği yerde çalışıyor: ilan metniyle ilan formunun birbirini tutmadığı yerler, yapısal şemada hiç sütunu olmayan donanım, ve fiyat modelinin yanıldığı ilanların triyajı.`,
                        `An analysis of ${fmtN(meta.n)} listing descriptions. Free text does its work where the structured fields can't see: places where the ad copy and the ad form don't line up, equipment that has no column at all, and triage of the listings the price model gets wrong.`)}
                </p>

                {/* KPI strip: what the text actually surfaces, one figure per section below. */}
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat k={L('Metin “temiz” diyor', 'Text says clean')} v={fmtN(cd.dishonest_n)} sub={L('ama formda hasar kayıtlı', 'but the form records damage')} accent />
                    <Stat k={L('Veri-eksik kuyruğu', 'Data-gap queue')} v={fmtN(cd.gap_n)} sub={L('metinde hasar, sayaç boş', 'damage in text, empty counter')} />
                    {topEq && <Stat k={L('Donanım çıkarımı', 'Equipment inferred')} v={pct(topEq.mention_pct)} sub={clipText(equipT(topEq.feature), 26)} />}
                    <Stat k={L('Üçlü anomali', 'Triple anomaly')} v={String(an.intersections.triple)} sub={L('inceleme adayı', 'review candidate')} />
                </div>

                <div className="mb-4 rounded-[14px] border border-[#cfe8dc] bg-[#f1f8f4] p-5">
                    <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#047857]">{L('Tez — neden “fiyat değil”', 'Thesis — why “not price”')}</div>
                    <p className="max-w-[760px] text-[15px] leading-[1.7] text-[#22332b]">
                        {L('Metin sinyalleri fiyat modeline eklendiğinde açıklanan varyansı artırmıyor — yaş, kilometre, motor ve hasar sayaçları o işi zaten yapıyor, açıklama da büyük ölçüde aynı şeyleri farklı kelimelerle söylüyor. Metnin karşılığı başka yerde: yapısal alanların hiç kaydetmediği şeyler. Modifiye ve dönüşümler, satıcının kendi beyanıyla çelişmesi, hiç sütunu olmayan donanım, ve “bu ilan neden bu fiyatta?” diye bakılması gereken kayıtlar — hepsi yalnızca metinde var.',
                            'Adding the text signals to the price model does not increase the variance explained — age, mileage, engine and the damage counters already do that work, and the description mostly restates them in prose. Text pays off somewhere else: in what the structured fields never record. Modifications and conversions, a seller contradicting their own declaration, equipment with no column at all, and the listings worth asking “why is this priced like that?” — all of it lives only in the text.')}
                    </p>
                </div>

                {/* ═══ 00 — what the text is mined for ═══════════════════════════════ */}
                <GroupHeading id="claims" n="00" title={L('Beyan, çıkarım ve anomali', 'Claims, extraction and anomaly')} />

                <Section id="claim-consistency" n={N()} title={L('Metin “temiz” diyor, form başka söylüyor', 'The text says clean, the form says otherwise')}
                    sub={L('çapraz-kaynak · ilan metni ↔ ilan formu', 'cross-source · ad copy ↔ ad form')}
                    lead={L('İlan metnindeki “temiz” ifadesi, satıcının aynı ilanda kendi doldurduğu hasar sayaçlarıyla karşılaştırılır. Sayaçlar satıcının kendi beyanı — yani burada gizlenen bir şey yok; vitrin metniyle form birbirini tutmuyor. Çoğu ilanda satıcı “düzgün onarılmış, temiz duruyor” demek istiyor; ama bir kısmı spesifik bir şey iddia ediyor ve kendi formu onu yalanlıyor. Aşağıdaki üç grafik bu ayrımı gösteriyor.',
                        'The word “clean” in the ad copy is compared against the damage counters the seller filled in on the same listing. Those counters are the seller’s own declaration — so nothing here is concealed; the shop window and the form simply don’t line up. In most of these the seller means “tidily repaired, presents clean”. In a minority they claimed something specific that their own form contradicts. The three figures below separate the two.')}>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {[
                            { k: L('Metin temiz · Formda hasar', 'Text clean · Form shows damage'), o: q.text_clean__struct_dmg_FLAG, flag: true },
                            { k: L('Metin hasar · Formda temiz', 'Text damage · Form shows clean'), o: q.text_dmg__struct_clean_GAP, gap: true },
                            { k: L('İkisi de temiz', 'Both say clean'), o: q.text_clean__struct_clean },
                            { k: L('İkisi de hasar', 'Both say damage'), o: q.text_dmg__struct_dmg },
                            { k: L('Metinde iddia yok', 'No text claim'), o: q.no_text_claim },
                        ].filter((c) => c.o).map((c) => (
                            <div key={c.k} className={`rounded-[12px] border p-4 ${c.flag || c.gap ? 'border-[#ecd9b0] bg-[#fdf7ec]' : 'border-[#e4e2dd] bg-[#fdfcf9]'}`}>
                                <div className="mb-1.5 font-mono text-[10px] uppercase leading-snug tracking-[0.04em] text-[#86857e]">{c.k}</div>
                                <div className={`font-mono text-[18px] font-bold tabular-nums ${c.flag || c.gap ? 'text-[#b0872e]' : 'text-[#1a1a1a]'}`}>{fmtN(c.o.n)}</div>
                                {c.o.median_price != null && <div className="mt-1 font-mono text-[11px] text-[#86857e]">{L('medyan', 'median')} {fmtM(c.o.median_price)}</div>}
                            </div>
                        ))}
                    </div>
                    {/* The shape of those 163 listings, in three views. A single severity bar
                        averaged away both the reassuring part (median 2 painted, 0 replaced)
                        and the part that isn't (a specific claim, or a write-off record). */}
                    {sev && (
                        <Sub title={L('Peki bu 163 ilan ne kadar “temiz değil”?', 'So how far from clean are those 163?')}
                            lead={L('Tek bir çubuk bunu gösteremiyordu: hem rahatlatan kısmı (medyan araç 2 panel boyalı, hiç değişen yok) hem de rahatlatmayan kısmı (spesifik iddia edenler, pert kayıtlılar) ortalamanın içinde kayboluyordu.',
                                'One bar couldn’t show this: it averaged away both the reassuring half (the median car has two painted panels and nothing replaced) and the half that isn’t reassuring (a specific claim, or a write-off record).')}>
                            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Stat k={L('Medyan boyalı panel', 'Median painted panels')} v={String(sev.median_painted)} sub={L(`ortalama ${dec(sev.mean_painted)}`, `mean ${dec(sev.mean_painted)}`)} />
                                <Stat k={L('Medyan değişen panel', 'Median replaced panels')} v={String(sev.median_changed)} sub={L(`ortalama ${dec(sev.mean_changed)}`, `mean ${dec(sev.mean_changed)}`)} accent />
                                <Stat k={L('Hiç değişen paneli yok', 'No replaced panel')} v={pct(100 - sev.any_changed_pct)} sub={L('sadece boya', 'paint only')} />
                                <Stat k={L('Pert / ağır hasar kaydı', 'Write-off record')} v={String(Math.round((sev.heavy_pct / 100) * sev.n_flag))} sub={L(`${fmtN(sev.n_flag)} ilandan`, `of ${fmtN(sev.n_flag)}`)} />
                            </div>

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {sevData && (
                                    <Fig title={L('Hasarın ağırlığı', 'How heavy the damage is')}>
                                        <Chart h={230}><PlotlyChart data={sevData} layout={base({ margin: { t: 28, r: 16, b: 28, l: 8 } })} config={config} guard={false} /></Chart>
                                    </Fig>
                                )}
                                {panelData && (
                                    <Fig title={L('Kaç panel — boyalı vs değişen', 'How many panels — painted vs replaced')}>
                                        <Chart h={230}><PlotlyChart data={panelData} layout={base({ barmode: 'group', showlegend: true, legend: { orientation: 'h', y: 1.14, x: 0, font: { size: 10 } }, margin: { t: 30, r: 16, b: 30, l: 8 }, xaxis: { title: { text: L('panel sayısı', 'panel count'), font: { size: 10 } } } })} config={config} guard={false} /></Chart>
                                    </Fig>
                                )}
                            </div>

                            {claimData && (
                                <Fig className="mt-3" title={L('İlan aslında ne iddia etmişti?', 'What the ad actually claimed')}>
                                    <Chart h={190}><PlotlyChart data={claimData} layout={base({ margin: { t: 8, r: 44, b: 24, l: 8 } })} config={config} guard={false} /></Chart>
                                </Fig>
                            )}
                            <Method className="mt-2">{L(`${LBL.severityDef(lang)}. Yeşil çubuk genel bir kelime (“hatasız”, “tertemiz”) — burada satıcının “düzgün onarılmış, temiz duruyor” demesi makul. Amber çubuklar spesifik: “boyasız” ya da “değişensiz” yazıp kendi formunda boya/değişen kaydı olanlar. Arm’lar örtüşebilir, o yüzden toplam ${fmtN(sev.n_flag)}’ü aşar.`,
                                `${LBL.severityDef(lang)}. The green bar is a general word (“flawless”, “spotless”) — there, “tidily repaired, presents clean” is a fair reading. The amber bars are specific: the ad said “no paint” or “no changed parts” while the seller’s own form records one. The arms can overlap, so they sum above ${fmtN(sev.n_flag)}.`)}</Method>
                        </Sub>
                    )}

                    {strict && (
                        <div className="mt-4 rounded-[12px] border border-[#cfe8dc] bg-[#f1f8f4] p-4">
                            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]">{L('Fiyatı zaten olduğu gibi', 'Priced like what it is')}</div>
                            <p className="text-[13px] leading-[1.6] text-[#22332b]">{L(`Bu ${fmtN(strict.n_flag)} ilan piyasadan ${sgn(strict.raw_pct, 1)} DAHA UCUZ — yani hasar fiyata zaten yansımış. Araç özellikleri + gerçek hasar sabitlenince kalan fark ${sgn(strict.ols_C_plus_series?.controlled_pct ?? 0, 1)}: OLS merdiveninde gürültü içinde (p=${fmtP(strict.ols_C_plus_series?.p)}), LGBM sağlamlık kolunda ${sgn(strict.lgbm_oof_resid?.controlled_pct ?? 0, 1)} ve güven aralığı sıfırın kılpayı dışında (${ci(strict.lgbm_oof_resid?.ci95)}). Sistematik bir aldatmanın prim getirmesi beklenirdi; bu grup prim almıyor. (İlişki ölçümü — nedensellik değil.)`,
                                `These ${fmtN(strict.n_flag)} listings are ${sgn(strict.raw_pct, 1)} CHEAPER than the market — the damage is already in the price. Holding vehicle specs and actual damage fixed, what's left is ${sgn(strict.ols_C_plus_series?.controlled_pct ?? 0, 1)}: within noise in the OLS ladder (p=${fmtP(strict.ols_C_plus_series?.p)}), while the LGBM robustness arm puts it at ${sgn(strict.lgbm_oof_resid?.controlled_pct ?? 0, 1)} with a CI barely off zero (${ci(strict.lgbm_oof_resid?.ci95)}). A systematic con would be expected to earn a premium; this group doesn't. (An association, not causation.)`)}</p>
                        </div>
                    )}
                    {titleClean && (
                        <div className="mt-3 rounded-[12px] border border-[#cfe8dc] bg-[#f1f8f4] p-4">
                            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#047857]">{L('Aynı durum başlıklarda', 'The same thing in the titles')}</div>
                            <p className="text-[13px] leading-[1.6] text-[#22332b]">{L(`${fmtN(titleClean.n_flag)} ilanın başlığı “temiz” diyor ama yapısal hasar var. Ham fark ${sgn(titleClean.raw_pct, 1)}; hasar + seri kontrol edilince kontrollü prim ${sgn(titleClean.ols_C_plus_series?.controlled_pct ?? titleClean.ols_B_plus_damage?.controlled_pct ?? 0, 1)} (≈0). Aynı sonuç: başlıktaki “temiz” de fiyata prim getirmiyor.`,
                                `${fmtN(titleClean.n_flag)} listings have a “clean” title but structural damage. Raw gap ${sgn(titleClean.raw_pct, 1)}; controlling for damage + series the premium is ${sgn(titleClean.ols_C_plus_series?.controlled_pct ?? titleClean.ols_B_plus_damage?.controlled_pct ?? 0, 1)} (≈0). Same result: a “clean” title earns no premium either.`)}</p>
                    </div>
                    )}

                    {dishonest.length > 0 && (
                        <Sub title={L('Örnekler — metin “temiz”, formda kayıt var', 'Examples — text says clean, the form has a record')}
                            lead={L('“Metindeki ifade” = dedektörün metinde bulduğu kelimeler; ham ilan metni yayımlanmıyor. Boya/Değişen sütunu satıcının kendi formundaki sayaç.', 'The “phrase in text” column holds the words the detector found; raw listing prose is not published. Paint/Replaced is the counter from the seller’s own form.')}>
                            <Table head={[L('Model', 'Model'), L('Fiyat', 'Price'), L('Boya/Değişen', 'Paint/Replaced'), L('Metindeki ifade', 'Phrase in text')]}
                                rows={dishonest.slice(0, 8).map((r: any) => [r.model, fmtM(r.price), `${r.struct_painted ?? 0} / ${r.struct_changed ?? 0}`, chips(r.matched?.temiz, 'clean')])} />
                        </Sub>
                    )}

                    {gapEx.length > 0 && (
                        <Sub title={L('Ters yön — metinde hasar var, form boş', 'The other direction — damage in the text, blank form')}
                            lead={L(`Ters yön: ${fmtN(cd.gap_n)} ilanda metin hasardan söz ediyor ama yapısal sayaç sıfır. Burada metin dürüst, eksik olan form — satıcı alanı doldurmamış. Metnin yapısal veriyi TAMAMLADIĞI yer.`, `The reverse direction: in ${fmtN(cd.gap_n)} listings the text mentions damage while the structural counter is zero. Here the text is the honest half — it’s the form the seller left blank. This is where text COMPLETES the structured data.`)}>
                            <Table head={[L('Model', 'Model'), L('Fiyat', 'Price'), L('Boya/Değişen', 'Paint/Changed'), L('Metindeki ifade', 'Phrase in text')]}
                                rows={gapEx.slice(0, 8).map((r: any) => [r.model, fmtM(r.price), `${r.struct_painted ?? 0} / ${r.struct_changed ?? 0}`, chips(r.matched?.hasar, 'dmg')])} />
                        </Sub>
                    )}

                    {llm && (
                        <Sub title={L(`Kapsam nasıl artırıldı — ${llm.tool} · ${llm.model}`, `How coverage was raised — ${llm.tool} · ${llm.model}`)}
                            lead={L(`İlan metinleri bir kez, çevrimdışı olarak ${llm.tool} ile yapılandırılmış çıkarıma sokuldu (çıkarım modeli ${llm.model}): ${fmtN(llm.n_listings)} ilan · ${fmtN(llm.n_extractions)} çıkarım (ilan başına ort. ${llm.per_listing_avg.toFixed(1)}). Her çıkarım metne hizalı bir karakter aralığı taşıyor (${llm.alignment}) — model yalnız metinde fiilen geçen ifadeyi işaretler, serbest üretim yok.`,
                                `Listing texts were run once, offline, through ${llm.tool} for structured extraction (extraction model ${llm.model}): ${fmtN(llm.n_listings)} listings · ${fmtN(llm.n_extractions)} extractions (avg ${llm.per_listing_avg.toFixed(1)} per listing). Every extraction carries a character interval aligned to the text (${llm.alignment}) — the model only marks phrases that literally occur, no free generation.`)}>
                            <Table head={[L('Sınıf', 'Class'), L('Çıkarım', 'Extractions'), L('Nitelik', 'Attributes'), L('Örnek', 'Example')]}
                                rows={(llm.classes || []).map((c: any) => [llmClassT(c.klass), fmtN(c.n), (c.attrs || []).map(llmAttrT).join(' · '), <span key={c.klass} className="text-right font-mono text-[11px] leading-snug text-[#5f5f5a]">“{c.example_in}” → {c.example_out}</span>])} />
                            <div className="mt-3 rounded-[12px] border border-[#ecd9b0] bg-[#fdf7ec] p-4">
                                <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#b0872e]">{L('⚠ Rolü SADECE kapsam artırmak', '⚠ Its role is coverage ONLY')}</div>
                                <p className="text-[13px] leading-[1.6] text-[#3a3428]">{L(`LLM’in durum vokabüleri (${(llm.vocab || []).map(llmVocabT).join(' · ')}) regex dedektörlerine damıtıldı ve kalıcı regresyon testlerinde yer-gerçeği olarak kullanılıyor. LLM bir fiyat özniteliği DEĞİL ve üretimde koşmuyor — koşan regex’tir; LLM metni bir kez okudu, sözlüğü alındı. Kapsam ${fmtN(llm.n_intersect)}/${fmtN(llm.n_analysis)} = ${pct(llm.coverage_pct)} olduğu için bu KISMİ bir yer-gerçeği: ölçülen precision “regex hatası” değil, uyum oranıdır.`,
                                    `The LLM’s condition vocabulary (${(llm.vocab || []).join(' · ')}) was distilled into the regex detectors and is used as ground truth in permanent regression tests. The LLM is NOT a price feature and does not run in production — the regex does; the LLM read the text once and we took its vocabulary. Because coverage is ${fmtN(llm.n_intersect)}/${fmtN(llm.n_analysis)} = ${pct(llm.coverage_pct)}, this is PARTIAL ground truth: the measured precision is an agreement rate, not a “regex error” rate.`)}</p>
                            </div>
                            <Method className="mt-3">{L('Döngüsellik kaydı: regex sözlüğü LLM çıktısından damıtıldığı için regex’i aynı LLM etiketlerine karşı ölçmek kısmen döngüseldir (uyumu şişirir). Kapsam testi bir REGRESYON testi olarak okunmalı (“değişiklik kapsamı bozdu mu?”), bağımsız doğruluk kanıtı olarak değil. Bu yüzden yukarıdaki örneklerin doğruluk denetiminde LLM bilerek kullanılmadı; sayaçlar elle okundu.', 'Circularity note: because the regex vocabulary was distilled from the LLM output, measuring the regex against those same LLM labels is partly circular (it inflates agreement). The coverage test should be read as a REGRESSION test (“did this change break coverage?”), not as independent proof of accuracy. That is why the LLM was deliberately not used to audit the examples above — those counters were read by hand.')}</Method>
                        </Sub>
                    )}

                    <Method className="mt-3">{L(`Naif eşleşme ${fmtN(cd.dishonest_total_raw)} idi; ~${fmtN(cd.dishonest_benign_n)}’si elendi — bakım işleri (“vites değişti”), yalnız lokal rötuş, “şu hariç” diye kısmen açıklayanlar, ve “motoru hatasız” gibi kapsamı daraltılmış ifadeler. Geriye ${fmtN(cd.dishonest_n)} kaldı; yani iyi niyetli okumaların ÇOĞU zaten uygulandı. Sayaçlar satıcı beyanı — bu bir gizleme iddiası değil, alıcıya “formu da oku” demenin yolu.`, `The naive match was ${fmtN(cd.dishonest_total_raw)}; about ${fmtN(cd.dishonest_benign_n)} were dropped — maintenance work (“gearbox replaced”), local touch-up only, partial disclosures (“except for X”), and scoped phrasing like “flawless engine”. That leaves ${fmtN(cd.dishonest_n)}: MOST of the charitable readings were already applied. The counters are seller-declared, so this isn’t an accusation of concealment — it’s a way of telling the buyer to read the form too.`)}</Method>
                </Section>

                {eqData && (
                    <Section id="information-extraction-data-completion" n={N()} title={L('Bilgi çıkarımı → veri tamamlama', 'Information extraction → data completion')}
                        sub={L('yapısal şemada olmayan donanım', 'equipment absent from the structured schema')}
                        lead={L('Yapısal alanlarda olmayan donanım (cam tavan, ısıtmalı koltuk, xenon…), serbest metinden çıkarılır (regex + normalize) — bu alanlar için metin TEK kaynak. Arama/filtreleme için değerli, fiyat iddiası taşımaz.', 'Equipment absent from structured fields (sunroof, heated seats, xenon…) is inferred from free text (regex + normalize) — for these, text is the ONLY source. Useful for search/filtering, carries no price claim.')}>
                        <Fig title={L('Donanım anılma oranı (%)', 'Equipment mention rate (%)')}><Chart h={Math.max(260, eq.length * 26)}><PlotlyChart data={eqData} layout={base({ margin: { t: 8, r: 46, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        <Method className="mt-3">{L(`Regex + normalize, olumsuzlama güvenli (“cam tavan yok” sayılmaz). Anlam-yakınlığıyla arama (${ex?.embed_model?.split('/').pop() || 'e5'} embedding) ayrı bir katman olarak hazır ama bu raporda yok: canlı serbest-metin arama sunucu tarafı gerektiriyor, ertelendi.`, `Regex + normalize, negation-safe (“no sunroof” doesn’t count). Meaning-similarity search (${ex?.embed_model?.split('/').pop() || 'e5'} embeddings) is built as a separate layer but isn’t in this report: live free-text search needs a server side, and it is deferred.`)}</Method>
                    </Section>
                )}

                <Section id="anomaly-queue" n={N()} title={L('Anomali kuyruğu', 'Anomaly queue')}
                    sub={L('üçlü-concordance · triyaj', 'triple concordance · triage')}
                    lead={L('İki bağımsız sinyal kesişince inceleme adayı: fiyat modeli POZİTİF artık (beklenenden pahalı) ∧ metin-dönüşüm/modifiye ∧ metin-hp ≫ alan-hp (üçlü-concordance). Anomali = inceleme adayı, KANIT değil.', 'Review candidates where two independent signals cross: a POSITIVE price residual (pricier than expected) ∧ text conversion/mod ∧ text-hp ≫ field-hp (triple concordance). An anomaly = a review candidate, NOT evidence.')}>
                    {an?.intersections && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {[
                                { k: L('artık ∧ metin', 'resid ∧ text'), v: an.intersections.resid_and_text },
                                { k: L('artık ∧ hp', 'resid ∧ hp'), v: an.intersections.resid_and_hp },
                                { k: L('üçlü', 'triple'), v: an.intersections.triple, hot: true },
                            ].filter((x) => x.v != null).map((x) => (
                                <span key={x.k} className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${x.hot ? 'border-[#e6b8b8] bg-[#fdf3f3] text-[#b91c1c]' : 'border-[#e9e7e2] bg-[#f3f1ec] text-[#5f5f5a]'}`}>{x.k} · <b>{x.v}</b></span>
                            ))}
                        </div>
                    )}
                    {(an?.anomalies || []).length > 0 && (
                        <Table head={[L('Model', 'Model'), L('Yaş', 'Age'), L('Alan HP', 'Field HP'), L('Metin HP', 'Text HP'), L('Fiyat', 'Price'), L('Artık', 'Resid')]}
                            rows={an.anomalies.slice(0, 5).map((r: any) => [r.model, String(r.age), fmtN(r.field_hp), fmtN(r.text_hp), fmtM(r.price), sgn(r.resid_pct)])} />
                    )}
                    {reviewQ.length > 0 && (
                        <Sub title={L('Alan çelişki kuyruğu — örnekler (metin ↔ yapısal)', 'Field-contradiction queue — examples (text ↔ structured)')}>
                            <Table head={[L('Model', 'Model'), L('Alan', 'Field'), L('Metin', 'Text'), L('Yapısal', 'Structured')]}
                                rows={reviewQ.slice(0, 8).map((r: any) => [clipText(r.model, 34), fieldT(r.field), cellT(r.text), cellT(r.structured)])} />
                        </Sub>
                    )}
                    <Method className="mt-3">{L(`Üçlü = pozitif residual-outlier ∧ dönüşüm-fiili ∧ hp-çelişkisi (çapraz-kaynak). Kuyrukta ${fmtN(reviewQ.length)} kayıt var; sayılar her run’da hesaplanır (hardcoded yok). İnsan doğrulaması için triyaj — otomatik karar/nüfus istatistiği değil.`, `Triple = positive residual-outlier ∧ conversion verb ∧ hp-contradiction (cross-source). The queue holds ${fmtN(reviewQ.length)} records; counts are computed every run (nothing hardcoded). Triage for human review — not an automatic decision or a population statistic.`)}</Method>
                </Section>

                {coefData && (
                    <Section id="controlled-coefficients" n={N()} title={L('Kontrollü katsayı tablosu', 'Controlled coefficient table')}
                        sub={L('hedonik log-OLS · HC3 + bootstrap', 'hedonic log-OLS · HC3 + bootstrap')}
                        lead={L(`Her metin sinyalinin *kontrollü* fiyat ilişkisi (tek hedonik log-OLS, zengin kontrol seti, eşzamanlı). % = exp(β)−1, %95 GA (HC3) + ${hc.bootstrap_B ? fmtN(hc.bootstrap_B) + '× bootstrap' : 'bootstrap'} %95. Renksiz = anlamsız (p≥0.05). Kontrollü ≠ ham: ham prim yanıltıcı. n=${fmtN(hc.n)}, R² ${hc.model_r2?.toFixed(3)}.`,
                            `Each text signal's *controlled* price association (a single hedonic log-OLS, rich control set, simultaneous). % = exp(β)−1, 95% CI (HC3) + ${hc.bootstrap_B ? fmtN(hc.bootstrap_B) + '× bootstrap' : 'bootstrap'} 95%. Grey = not significant (p≥0.05). Controlled ≠ raw: the raw premium misleads. n=${fmtN(hc.n)}, R² ${hc.model_r2?.toFixed(3)}.`)}>
                        <Fig title={L('Kontrollü % etki (± %95 GA)', 'Controlled % effect (± 95% CI)')}><Chart h={Math.max(300, coefs.length * 26)}><PlotlyChart data={coefData} layout={base({ margin: { t: 8, r: 16, b: 28, l: 8 }, xaxis: { zeroline: true, zerolinecolor: theme.muted, ticksuffix: '%' } })} config={config} guard={false} /></Chart></Fig>
                        {coefRows.length > 0 && (
                            <Table className="mt-4" head={[L('Sinyal', 'Signal'), L('Ham %', 'Raw %'), L('Kontrollü %', 'Ctrl %'), L('HC3 %95', 'HC3 95%'), L('boot %95', 'boot 95%'), 'p', 'n']}
                                rows={coefRows.map((c: any) => [coefT(c.feature), sgn(c.raw_pct, 1), (c.sig ? sgn(c.controlled_pct, 1) : sgn(c.controlled_pct, 1) + ' ·'), ci(c.ci95), ci(c.boot_ci), fmtP(c.p), fmtN(c.n)])} />
                        )}
                        <Method className="mt-3">{L('exp(β)−1, HC3 robust SE, tüm sinyaller AYNI kontrol setinde eşzamanlı. boot≈HC3 → kararlı. Ham ≫ kontrollü ise sinyal segment/model proxy’siydi. İLİŞKİ ölçümü — nedensellik/deploy değil; fiyat TAHMİN gücü ayrı soru (ΔR²~0). “·” = p≥0.05 (anlamsız).', 'exp(β)−1, HC3 robust SE, all signals estimated simultaneously in one control set. boot≈HC3 → stable. When raw ≫ controlled the signal was a segment/model proxy. An ASSOCIATION — not causation/deployment; predictive power is a separate question (ΔR²~0). “·” = p≥0.05 (not significant).')}</Method>
                    </Section>
                )}

                {reg?.topics?.length > 0 && (
                    <Section id="listing-language-nmf" n="+" title={L('İlan dili genel görünümü (NMF)', 'Listing-language overview (NMF)')}
                        sub={L('betimleyici · fiyat arketipi değil', 'descriptive · not a price archetype')}
                        lead={L(`${reg.k} NMF teması — satıcı ÜSLUP haritası, fiyat arketipi DEĞİL. Temalar ~%${Math.floor((reg.cramers_v_seller || 0) * 100)} oranında satıcı tipini yeniden türetiyor (Cramér’s V ${reg.cramers_v_seller?.toFixed(3)}); yeni fiyat bilgisi taşımıyor.`,
                            `${reg.k} NMF themes — a seller REGISTER map, not a price archetype. The themes re-derive seller type at ~${Math.floor((reg.cramers_v_seller || 0) * 100)}% (Cramér’s V ${reg.cramers_v_seller?.toFixed(3)}); they carry no new price information.`)}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {reg.topics.map((tp: any) => (
                                <div key={tp.topic} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
                                    <div className="mb-2 flex items-baseline justify-between">
                                        <span className="font-mono text-[12px] font-semibold text-[#047857]">{L('Tema', 'Topic')} {tp.topic}</span>
                                        <span className="font-mono text-[11px] text-[#86857e]">{pct(tp.share_pct)}</span>
                                    </div>
                                    <div className="mb-2 flex flex-wrap gap-1">
                                        {(tp.top_words || []).slice(0, 6).map((w: string) => (
                                            <span key={w} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{LBL.gloss(w)}</span>
                                        ))}
                                    </div>
                                    {tp.dominant_seller && <div className="font-mono text-[10px] text-[#86857e]">{sellerT(tp.dominant_seller)} · {pct(tp.dominant_seller_pct, 0)}</div>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ═══ 01 — the surface of the text ═══════════════════════════════════ */}
                <GroupHeading id="surface" n="01" title={L('Metnin yüzeyi — kim nasıl yazıyor, model nerede yanılıyor', 'The surface of the text — who writes how, where the model errs')} />

                {st?.by_seller?.length > 0 && (
                    <Section id="seller-register" n={N()} title={L('Satıcı üslubu / iletişim', 'Seller register / communication')}
                        sub={L('betimleyici', 'descriptive')}
                        lead={L('Satıcı tipi başına yazım metrikleri: BÜYÜK-harf oranı, emoji ortalaması, açıklama uzunluğu, telefon-bırakma oranı. Betimleyici — üslup farkı, kalite iddiası değil.', 'Writing metrics per seller type: CAPS ratio, average emoji, description length, phone-drop rate. Descriptive — a register difference, not a quality claim.')}>
                        <Table head={[L('Satıcı', 'Seller'), L('İlan', 'Listings'), L('BÜYÜK harf %', 'CAPS %'), L('Emoji ort.', 'Emoji avg'), L('Ünlem ort.', 'Excl avg'), L('Açıklama uzun.', 'Desc len'), L('Telefon %', 'Phone %')]}
                            rows={st.by_seller.map((s: any) => [sellerT(s.seller), fmtN(s.n), pct(s.title_caps_pct), s.emoji_avg?.toFixed(2), s.excl_avg?.toFixed(2), fmtN(s.desc_len_median), pct(s.phone_pct)])} />
                    </Section>
                )}

                {at && (
                    <Section id="ad-title-mining" n={N()} title={L('İlan başlığı madenciliği', 'Ad-title mining')}
                        sub={L('kanca dağılımı · başlık iddiaları', 'hook distribution · title claims')}
                        lead={L('İlan başlıklarında hangi “kanca” ne sıklıkla kullanılıyor + başlıkta “temiz” diyen ve yıl tutmayan ilan sayıları. Başlıktaki “temiz” iddiasının da kontrollü primi ~0.', 'Which “hook” appears in ad titles and how often + counts for “clean” titles and mismatched years. The title’s “clean” claim also carries a ~0 controlled premium.')}>
                        {at.hook_pct && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {Object.entries(at.hook_pct).sort((a: any, b: any) => b[1] - a[1]).map(([k, v]: any) => (
                                    <span key={k} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2.5 py-1 font-mono text-[11px] text-[#5f5f5a]">{hookT(k)} · <b className="text-[#047857]">{pct(v, 0)}</b></span>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Stat k={L('Ort. kelime', 'Avg words')} v={String(at.avg_words)} />
                            <Stat k={L('Başlıkta “temiz”', 'Title says clean')} v={fmtN(at.title_trust_flag_n)} />
                            <Stat k={L('Yıl uyumsuzluğu', 'Year mismatch')} v={fmtN(at.title_year_mismatch_n)} />
                            <Stat k={L('“Temiz” kontrollü', '“Clean” ctrl')} v={sgn(at.title_clean_controlled_pct, 1)} accent />
                        </div>
                        {at.top_words?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {at.top_words.slice(0, 12).map((w: any) => (
                                    <span key={w.word} className="rounded-full border border-[#e9e7e2] bg-[#f3f1ec] px-2 py-0.5 font-mono text-[10px] text-[#5f5f5a]">{LBL.gloss(w.word)} <span className="text-[#86857e]">{fmtN(w.n)}</span></span>
                                ))}
                            </div>
                        )}
                    </Section>
                )}

                {dmg?.has_damage && dmg?.clean_claim && (
                    <Section id="damage-status" n={N()} title={L('Hasar durumu (3 grup)', 'Damage status (3 groups)')}
                        sub={L('betimleyici · çıplak medyan yanıltıcı', 'descriptive · the bare median misleads')}
                        lead={L('Hasar-beyanı / temiz-beyan / bahsetmeyen üç grubun ilan sayısı + medyan fiyatı. BETİMLEYİCİ: çıplak medyan kıyası yanıltıcıdır (temiz-beyan araçlar zaten daha genç/düşük-km).', 'Listing count + median price for three groups: damage-claim / clean-claim / no-mention. DESCRIPTIVE: the bare median comparison misleads (clean-claim cars are already younger/lower-km).')}>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { k: L('Hasar-beyan', 'Damage-claim'), o: dmg.has_damage },
                                { k: L('Temiz-beyan', 'Clean-claim'), o: dmg.clean_claim, accent: true },
                                { k: L('Beyan yok', 'No claim'), o: dmg.no_mention },
                            ].filter((c) => c.o).map((c) => (
                                <Stat key={c.k} k={c.k} v={fmtM(c.o.median_price)} sub={`${fmtN(c.o.n)} ${L('ilan', 'listings')}`} accent={c.accent} />
                            ))}
                        </div>
                        {dmg.clean_claim_controlled_pct != null && (
                            <Method className="mt-3">{L(`Araç özellikleri + objektif hasar sayaçları kontrol edilince temiz-beyanın kontrollü primi yalnız ${sgn(dmg.clean_claim_controlled_pct, 1)} — büyük-n yüzünden “anlamlı” ama pratikte küçük. Ham fark (₺${((dmg.clean_claim.median_price - dmg.has_damage.median_price) / 1e6).toFixed(2)}M) yanıltıcı.`, `Once vehicle specs + objective damage counters are controlled, the clean-claim premium is only ${sgn(dmg.clean_claim_controlled_pct, 1)} — “significant” due to large-n but small in practice. The raw gap (₺${((dmg.clean_claim.median_price - dmg.has_damage.median_price) / 1e6).toFixed(2)}M) misleads.`)}</Method>
                        )}
                    </Section>
                )}

                {residData && (
                    <Section id="residual-signals" n={N()} title={L('Residual sinyalleri (triyaj)', 'Residual signals (triage)')}
                        sub={L('top-%5 under-predict · robust filtreli', 'top-5% under-predict · robust-filtered')}
                        lead={L('Fiyat modelinin en çok yanıldığı yer: top-%5 UNDER-predict (beklenenden pahalı) içinde öne çıkan metin sinyalleri. Mispricing İDDİASI değil — modelin nerede yanıldığının triyajı.', 'Where the price model errs most: text signals concentrated in the top-5% UNDER-predicted (pricier than expected). Not a mispricing CLAIM — triage of where the model errs.')}>
                        <Fig title={L('Under-predict sinyalleri (top-%5’te yoğunlaşma · lift)', 'Under-predict signals (concentration in the top-5% · lift)')}><Chart h={Math.max(200, residSig.length * 40)}><PlotlyChart data={residData} layout={base({ margin: { t: 8, r: 62, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        <Method className="mt-2">{L(`Lift = sinyalin top-%5 under-predict içindeki yoğunluğu / geneldeki oranı (robust: n≥30, lift≥1.2, p<0.05). n_top5% = ${fmtN(resid.n_top5pct)}. Robust olmayan sinyaller (ör. “yüksek beygir”, lift≈1.0) yayımlanmıyor. Modifiye/dönüşüm/M-RS modelleri modelin beklediğinden pahalı — inceleme adayı, kanıt değil.`, `Lift = the signal’s density in the top-5% under-predicted / its overall rate (robust: n≥30, lift≥1.2, p<0.05). n_top5% = ${fmtN(resid.n_top5pct)}. Non-robust signals (e.g. “high horsepower”, lift≈1.0) are not published. Modified/conversion/M-RS models are pricier than the model expects — a review candidate, not evidence.`)}</Method>
                    </Section>
                )}

                {fcData && (
                    <Section id="cross-source-fields" n={N()} title={L('Çapraz-kaynak alan çelişkileri', 'Cross-source field contradictions')}
                        sub={L('metin ↔ yapısal alan · sayılar', 'text ↔ structured field · counts')}
                        lead={L('Metindeki değer ile yapısal alanın çeliştiği ilan sayıları — alana göre. Çoğu satıcı-hatası ya da swap/dönüşüm işareti. İnceleme kuyruğu, kanıt değil.', 'How many listings have a value in the text that contradicts the structured field, by field. Most are seller errors or a swap/conversion signal. A review queue, not evidence.')}>
                        <Fig title={L('Alan çelişki sayısı (metin ↔ yapısal, alana göre)', 'Field-contradiction count (text ↔ structured, by field)')}><Chart h={Math.max(240, fcRows.length * 30)}><PlotlyChart data={fcData} layout={base({ margin: { t: 8, r: 40, b: 24, l: 8 } })} config={config} guard={false} /></Chart></Fig>
                        <Method className="mt-3">{L('Kilometre bu listeden çıkarıldı: metindeki km, odometre değeri mi yoksa servis/satın-alma/swap/politika km’si mi — desen eşlemeyle ayrılamıyor, dolayısıyla güvenilmez bir çelişki sinyaliydi.', 'Mileage was dropped from this list: a km figure in the text can’t be separated by pattern-matching into odometer vs service/purchase/swap/policy mileage, which made it an unreliable contradiction signal.')}</Method>
                    </Section>
                )}

            </div>
        );
    }, [d, lang, theme]);

    if (err) return <p className="p-6 text-[15px] text-[#86857e]">{L('NLP verisi yüklenemedi.', 'Could not load NLP data.')}</p>;
    if (!d) return (
        <div className="space-y-4 p-6 animate-pulse">
            <div className="h-8 w-1/2 rounded bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
            <div className="h-40 rounded-[14px] bg-[#f3f1ec]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fbfbf9] text-[#1a1a1a]">
            {/* mobile top bar (< md) */}
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e9e7e2] bg-[#fbfbf9]/95 px-4 py-3 backdrop-blur md:hidden">
                <button onClick={() => setDrawer(true)} aria-label={L('İçindekiler', 'Contents')} className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><Menu size={20} /></button>
                <span className="truncate font-mono text-[12px] text-[#5f5f5a]">{toc.find((x) => x.id === activeId)?.title ?? L('Metin & NLP', 'Text & NLP')}</span>
                <span className="ml-auto"><Monogram /></span>
            </header>

            {/* mobile drawer — Radix Dialog (focus-trap · esc · scroll-lock) */}
            <Dialog.Root open={drawer} onOpenChange={setDrawer}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 md:hidden" />
                    <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[300px] flex-col border-r border-[#e9e7e2] bg-[#fdfcf9] p-5 shadow-xl focus:outline-none md:hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#86857e]">{L('İçindekiler', 'Contents')}</Dialog.Title>
                            <Dialog.Close asChild><button aria-label={L('Kapat', 'Close')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f5f5a] hover:bg-[#f1efe9]"><X size={18} /></button></Dialog.Close>
                        </div>
                        <a href={localize('/projects/car-price', lang)} className="mb-3 flex items-center gap-2 font-mono text-[12px] text-[#86857e] hover:text-[#5f5f5a]"><ArrowLeft size={14} /> {L('Proje', 'Project')}</a>
                        <TocNav toc={toc} activeId={activeId} onGo={goTo} />
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="mx-auto flex w-full max-w-[1280px]">
                {/* desktop TOC rail */}
                <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[#e9e7e2] bg-[#fbfbf9] px-5 py-8 md:flex">
                    <div className="mb-4 flex items-center justify-between">
                        <Monogram />
                        <a href={localize('/projects/car-price/report', lang)} title={L('Analitik rapor', 'Analytics report')} className="font-mono text-[10px] text-[#86857e] transition-colors hover:text-[#047857]">/report</a>
                    </div>
                    <a href={localize('/projects/car-price', lang)} className="mb-4 flex items-center gap-2 font-mono text-[12px] text-[#86857e] transition-colors hover:text-[#5f5f5a]"><ArrowLeft size={14} /> {L('Proje', 'Project')}</a>
                    <div className="mb-5 h-[3px] w-full overflow-hidden rounded-full bg-[#ece9e3]"><div ref={progressRef} className="h-full rounded-full bg-[#047857]" style={{ width: '0%' }} /></div>
                    <TocNav toc={toc} activeId={activeId} onGo={goTo} />
                </aside>

                <main ref={mainRef} className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12 lg:px-14">
                    {body}
                </main>
            </div>
        </div>
    );
}

// ---------- notebook TOC nav (shared by the desktop rail + the mobile drawer) ----------
function TocNav({ toc, activeId, onGo }: { toc: { id: string; title: string; chapter: string; chapterId: string }[]; activeId: string; onGo: (id: string) => void }) {
    const chapters: { name: string; id: string; items: { id: string; title: string }[] }[] = [];
    toc.forEach((it) => {
        let ch = chapters.find((c) => c.name === it.chapter);
        if (!ch) { ch = { name: it.chapter, id: it.chapterId, items: [] }; chapters.push(ch); }
        ch.items.push({ id: it.id, title: it.title });
    });
    if (!chapters.length) return null;
    chapters.forEach((c) => { c.items = c.items.filter((it) => it.title !== c.name); });
    const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); onGo(id); };
    return (
        <nav className="flex-1 overflow-y-auto text-[13px]">
            {chapters.map((ch) => (
                <div key={ch.name} className="mb-4">
                    {ch.name && <a href={'#' + ch.id} onClick={(e) => go(e, ch.id)} className="mb-1.5 block font-mono text-[10px] uppercase leading-snug tracking-[0.12em] text-[#86857e] transition-colors hover:text-[#047857]">{ch.name}</a>}
                    <ul className="space-y-0.5">
                        {ch.items.map((it) => {
                            const on = it.id === activeId;
                            return (
                                <li key={it.id}>
                                    <a href={'#' + it.id} onClick={(e) => go(e, it.id)} aria-current={on ? 'true' : undefined}
                                        className={`block w-full rounded-[6px] px-2.5 py-1.5 text-left leading-snug transition-colors ${on ? 'bg-[#e7f3ec] font-semibold text-[#047857]' : 'text-[#5f5f5a] hover:bg-[#f1efe9] hover:text-[#1a1a1a]'}`}>
                                        {it.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

// ---------- presentational helpers (same API as the report's) ----------
function clipText(s: any, n: number): string {
    if (typeof s !== 'string') return '';
    const t = s.trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
}

function slugify(s: string): string {
    return s
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[’'`]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function GroupHeading({ id, n, title }: { id?: string; n: string; title: string }) {
    return (
        <div id={id ?? slugify(title)} data-chapter data-title={title}
            className="mb-8 mt-16 flex items-center gap-3 scroll-mt-[84px] border-t-2 border-[#047857]/25 pt-6 first:mt-0">
            <span className="font-mono text-[12px] font-bold text-[#047857]">{n}</span>
            <h2 className="font-mono text-[13px] uppercase tracking-[0.16em] text-[#5f5f5a]">{title}</h2>
        </div>
    );
}

function Section({ id, n, title, sub, lead, children }: { id?: string; n: string; title: string; sub?: string; lead?: string; children: React.ReactNode }) {
    return (
        <section id={id ?? slugify(title)} data-section data-title={title} className="group relative mb-12 scroll-mt-[84px] sm:pl-14">
            {/* execution-count gutter — mono [n], absolute on desktop */}
            <div className="mb-3 flex items-baseline gap-3">
                <span className="hidden font-mono text-[12px] tabular-nums text-[#9a9a92] transition-colors group-hover:text-[#047857] sm:absolute sm:left-0 sm:top-1.5 sm:block sm:w-11 sm:text-right">[{n}]</span>
                <span className="font-mono text-[13px] font-bold text-[#047857] sm:hidden">[{n}]</span>
                <div>
                    <h2 className="text-[21px] font-semibold tracking-[-0.028em] text-[#1a1a1a] sm:text-[23px]">{title}</h2>
                    {sub && <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.07em] text-[#86857e]">{sub}</div>}
                </div>
            </div>
            {lead && <p className="mb-6 max-w-[680px] text-[15px] leading-[1.7] text-[#33332f] sm:text-[16px]">{lead}</p>}
            {children}
        </section>
    );
}

function Sub({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
    return (
        <div className="mb-9 mt-7 border-t border-[#ece9e3] pt-7">
            <h3 className="mb-2 text-[17px] font-semibold tracking-[-0.02em] text-[#1a1a1a]">{title}</h3>
            {lead && <p className="mb-4 max-w-[680px] text-[14px] leading-[1.65] text-[#5f5f5a] sm:text-[15px]">{lead}</p>}
            {children}
        </div>
    );
}

function Fig({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <figure className={`m-0 rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-3 shadow-[0_1px_3px_rgba(40,40,30,0.05)] sm:p-4 ${className}`}>
            <figcaption className="mb-2 px-1 text-[13px] font-semibold text-[#1a1a1a]">{title}</figcaption>
            {children}
        </figure>
    );
}

function Chart({ h, children }: { h: number; children: React.ReactNode }) {
    return <div style={{ height: h, minHeight: 200, width: '100%' }}>{children}</div>;
}

function Stat({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: boolean }) {
    return (
        <div className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4">
            <div className="mb-1.5 font-mono text-[10px] uppercase leading-snug tracking-[0.05em] text-[#86857e]">{k}</div>
            <div className={`font-mono text-[18px] font-bold tabular-nums sm:text-[20px] ${accent ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{v}</div>
            {sub && <div className="mt-1 font-mono text-[11px] leading-snug text-[#86857e]">{sub}</div>}
        </div>
    );
}

function Method({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-[10px] border border-[#e9e7e2] bg-[#f3f1ec] px-4 py-3 font-mono text-[12px] leading-[1.6] text-[#5f5f5a] ${className}`}>
            <span className="text-[#047857]">{`// `}</span>{children}
        </div>
    );
}

function Table({ head, rows, className = '' }: { head: string[]; rows: React.ReactNode[][]; className?: string }) {
    const cols = `1.6fr repeat(${head.length - 1}, minmax(56px, 1fr))`;
    const minWidth = 240 + (head.length - 1) * 84;
    return (
        <div className={`overflow-x-auto rounded-[12px] border border-[#e4e2dd] ${className}`}>
            <div style={{ minWidth }}>
                <div className="grid bg-[#f1efe9] px-3.5 py-[11px] font-mono text-[10px] uppercase tracking-[0.05em] text-[#5f5f5a] sm:px-[18px]" style={{ gridTemplateColumns: cols }}>
                    {head.map((h, i) => <span key={h} className={i === 0 ? '' : 'text-right'}>{h}</span>)}
                </div>
                {rows.map((r, ri) => (
                    <div key={ri} className="grid items-center border-t border-[#ece9e3] bg-[#fdfcf9] px-3.5 py-[11px] sm:px-[18px]" style={{ gridTemplateColumns: cols }}>
                        {r.map((cell, ci) => <span key={ci} className={`font-mono text-[12px] sm:text-[13px] ${ci === 0 ? 'pr-2 text-[#1a1a1a]' : 'text-right tabular-nums text-[#5f5f5a]'}`}>{cell}</span>)}
                    </div>
                ))}
            </div>
        </div>
    );
}
