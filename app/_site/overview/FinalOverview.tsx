"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/ui/social-icons';
import FinalShell from '../FinalShell';
import { useLang, localize } from '../i18n';
import * as LBL from '@/lib/labels';

// The overview is data-driven: every metric below is read from the same
// public/site_data.json (+ text_data.json) the report renders from, so the landing
// page can't drift from the analysis behind it. `initialData` is passed by the
// server page; the client fetch is a fallback for the non-SSR path.
type Props = { initialData?: any; initialNlp?: any };

const fmtN = (n: number, loc: string) => Math.round(n).toLocaleString(loc);
const fmtK = (n: number, loc: string) => '₺' + Math.round(n / 1000).toLocaleString(loc) + 'K';
const fmtM = (n: number) => '₺' + (n / 1e6).toFixed(2) + 'M';

export default function FinalOverview({ initialData, initialNlp }: Props) {
    const { t, lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const loc = lang === 'tr' ? 'tr-TR' : 'en-US';

    const d = initialData, nd = initialNlp;
    const meta = d?.meta, dom = d?.domain;
    const fr = dom?.final_results?.model_karsilastirma;
    const win = fr?.lightgbm_tfidf_svd;
    const mym = dom?.model_yil_medyani;
    const base = mym?.taban;
    const tiers: any[] = mym?.metrik_kirilim ?? [];
    const abl = dom?.brand_ablation;
    const pd = dom?.price_dist;

    const lift = base && win ? Math.round((base.MAE - win.MAE) / base.MAE * 100) : 0;
    const residue = meta ? meta.n_raw - meta.n_dedup : 0;
    const keptCols = meta?.n_features ?? 25;

    // nlp evidence — what the structured columns never recorded
    const gapN = nd?.crosssource_damage?.gap_n;
    const convN = nd?.anomalies?.signal_counts?.conversion_text;
    const clashN = nd?.crosssource_fields?.counts
        ? Object.values(nd.crosssource_fields.counts as Record<string, number>).reduce((a, b) => a + b, 0)
        : undefined;
    const topExtra = nd?.extras?.equipment_coverage?.[0];

    const S = {
        card: 'rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9]',
        cap: 'font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#86857e]',
        h2: 'text-[20px] sm:text-[24px] font-semibold tracking-[-0.025em] text-[#1a1a1a]',
        n: 'font-mono text-[12.5px] font-bold text-[#047857]',
        lede: 'max-w-[64ch] text-[15px] text-[#5f5f5a]',
        mono: 'font-mono tabular-nums',
    };

    // compact evidence bar used inside the finding cards
    const Mini = ({ rows }: { rows: { l: string; w: number; c: string; v: string }[] }) => (
        <div className="mt-3 flex flex-col gap-[5px]">
            {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-[7px]">
                    <span className="w-[86px] shrink-0 truncate font-mono text-[9.5px] text-[#86857e]">{r.l}</span>
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-[#eeece7]">
                        <i className="block h-full rounded-[4px]" style={{ width: `${r.w}%`, background: r.c }} />
                    </span>
                    <span className="w-[48px] shrink-0 text-right font-mono text-[9.5px] font-bold tabular-nums text-[#1a1a1a]">{r.v}</span>
                </div>
            ))}
        </div>
    );

    const Node = ({ t: nt, d: nd_, tag, teal }: { t: string; d: string; tag: string; teal?: boolean }) => (
        <div className={`min-w-[152px] max-w-[212px] shrink-0 rounded-[11px] border px-3 py-[10px] ${teal ? 'border-[#cfe8dc] bg-[#eef6f1]' : 'border-[#e4e2dd] bg-[#fbfbf9]'}`}>
            <div className={`font-mono text-[12px] font-semibold ${teal ? 'text-[#065f46]' : 'text-[#1a1a1a]'}`}>{nt}</div>
            <div className="mt-1 text-[11px] leading-[1.45] text-[#5f5f5a]">{nd_}</div>
            <span className="mt-[6px] inline-block rounded-[5px] bg-[#f3f1ec] px-[6px] py-[2px] font-mono text-[9.5px] text-[#86857e]">{tag}</span>
        </div>
    );
    const Arrow = () => <span className="shrink-0 self-center px-[7px] text-[#9a9a92]">→</span>;

    if (!d) {
        return (
            <FinalShell active="overview" kicker={t('ov.badge')} title={L('Ne değerinde?', "What's it worth?")}>
                <p className={S.lede}>{L('Veri yükleniyor…', 'Loading data…')}</p>
            </FinalShell>
        );
    }

    return (
        <FinalShell active="overview" kicker={t('ov.badge')} title={`${t('ov.title1')} ${t('ov.title2')}`}>
            <p className={S.lede}>{t('ov.lead')}</p>

            {/* ── headline metrics ── */}
            {win && (
                <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { v: `${win.MAPE.toFixed(2)}%`, k: L('MAPE · OOF', 'MAPE · OOF'), n: L('ortalama mutlak % hata', 'mean abs. % error'), teal: true },
                        { v: win.R2.toFixed(4), k: L('R² · OOF', 'R² · OOF'), n: L('açıklanan varyans', 'variance explained'), teal: true },
                        { v: fmtK(win.MAE, loc), k: 'MAE', n: `${fmtK(win.MedAE, loc)} ${L('medyan mutlak hata', 'median abs. error')}`, teal: true },
                        { v: fmtN(meta.n_dedup, loc), k: L('ilan', 'listings'), n: L('tekilleştirilmiş · TR plakalı', 'deduped · TR-plated') },
                    ].map((m) => (
                        <div key={m.k + m.v} className={`${S.card} px-4 pb-3 pt-[15px]`}>
                            <div className={`${S.mono} text-[22px] font-bold leading-none tracking-[-0.02em] sm:text-[28px] ${m.teal ? 'text-[#047857]' : 'text-[#1a1a1a]'}`}>{m.v}</div>
                            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.05em] text-[#86857e]">{m.k}</div>
                            <div className="mt-[3px] text-[11.5px] text-[#5f5f5a]">{m.n}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── lift vs the dealer's reflex ── */}
            {base && win && (
                <div className={`${S.card} mt-5 p-4`}>
                    <div className={`${S.cap} mb-3`}>{L('galerinin refleksine karşı tipik hata — MAE (₺)', "typical error vs. the dealer's reflex — MAE (₺)")}</div>
                    {[
                        { l: L('Model+yıl medyanı', 'Model+year median'), sub: L('· taban', '· baseline'), w: 100, c: '#c9c6bf', v: fmtK(base.MAE, loc), b: false },
                        { l: 'LightGBM · TF-IDF+SVD', sub: ' ★', w: (win.MAE / base.MAE) * 100, c: '#047857', v: fmtK(win.MAE, loc), b: true },
                    ].map((r) => (
                        <div key={r.l} className="mb-[9px] flex items-center gap-3 last:mb-0">
                            <div className="w-[150px] shrink-0 font-mono text-[12px] sm:w-[190px]">
                                <span className={r.b ? 'text-[#047857]' : 'text-[#33332f]'}>{r.l}</span>
                                <span className="text-[#86857e]">{r.sub}</span>
                            </div>
                            <div className="h-[14px] min-w-0 flex-1 overflow-hidden rounded-[5px] bg-[#eeece7]">
                                <div className="h-full rounded-[5px]" style={{ width: `${r.w}%`, background: r.c }} />
                            </div>
                            <div className={`${S.mono} w-[78px] shrink-0 text-right text-[12px] font-bold text-[#1a1a1a]`}>{r.v}</div>
                        </div>
                    ))}
                    <p className="mt-3 max-w-[620px] text-[12.5px] leading-[1.55] text-[#5f5f5a]">
                        {L(`Model, galerinin "aynı model, aynı yıl, medyana bak" refleksini %${lift} kısaltıyor. Kapattığı şey model+yılın ötesi: km, hasar, motor.`,
                            `The model cuts a dealer's "same model, same year" reflex by ${lift}%. What it closes is everything beyond model and year: km, damage, engine.`)}
                    </p>
                </div>
            )}

            {/* CTAs sit after the headline, so the hero reads exactly like the design:
                eyebrow → title → lead → metrics → lift, then the actions. */}
            <div className="mt-6 flex flex-wrap gap-3">
                <Link href={localize('/projects/car-price/predict', lang)} className="inline-flex h-[44px] items-center gap-2 rounded-[10px] bg-[#047857] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#065f46]">
                    {t('ov.tryPredict')} <ArrowRight size={17} />
                </Link>
                <Link href={localize('/projects/car-price/report', lang)} className="inline-flex h-[44px] items-center gap-2 rounded-[10px] border border-[#d8d6d0] bg-[#fdfcf9] px-5 text-[14px] font-semibold text-[#5f5f5a] transition-colors hover:border-[#86857e]">
                    {L('Raporu oku', 'Read the report')} <ArrowRight size={16} />
                </Link>
                <a href="https://github.com/sadik-coban/car-price-prediction-pipeline" target="_blank" rel="noopener noreferrer" className="inline-flex h-[44px] items-center gap-2 rounded-[10px] border border-[#d8d6d0] bg-[#fdfcf9] px-5 text-[14px] font-semibold text-[#5f5f5a] transition-colors hover:border-[#86857e]">
                    <GithubIcon size={18} /> {t('ov.viewCode')}
                </a>
            </div>

            {/* ── 01 · how it's served ── */}
            <section className="mt-12 border-t border-[#e9e7e2] pt-9">
                <div className="mb-2 flex items-baseline gap-3">
                    <span className={S.n}>[01]</span><h2 className={S.h2}>{L('Nasıl servis ediliyor', "How it's served")}</h2>
                </div>
                <p className={`${S.lede} mb-5`}>
                    {L('İki hat. Çevrimdışı: ilanlar bir DuckDB dosyasına ve nesne depolamadaki bir model paketine dönüşür. Çevrimiçi: FastAPI o paketi açılışta belleğe alır — ham 30 bin satır arka uçtan hiç çıkmaz.',
                        'Two tracks. Offline, listings become a DuckDB file and a model bundle in object storage. Online, FastAPI loads that bundle into memory at boot — the raw 30K rows never leave the backend.')}
                </p>
                <div className={`${S.card} px-4 pb-5 pt-4`}>
                    <div className={`${S.cap} mb-3 flex items-center gap-2`}><i className="h-2 w-2 rounded-[3px] bg-[#c9c6bf]" />{L('kurulum · çevrimdışı', 'build · offline')}</div>
                    <div className="flex items-stretch overflow-x-auto pb-1.5">
                        <Node t={L('Taranan ilanlar', 'Scraped listings')} d={L('4 dönem · Oca–Haz 2026', '4 snapshots · Jan–Jun 2026')} tag={fmtN(meta.n_raw, loc)} />
                        <Arrow />
                        <Node t="cars.duckdb" d={L('dedup · TR plakalı · salt-okunur', 'dedup · TR-plated · read-only')} tag="Railway Volume" />
                        <Arrow />
                        <Node t={L('LightGBM eğitim', 'LightGBM train')} d={L('TF-IDF+SVD · log1p hedef', 'TF-IDF+SVD · log1p target')} tag="5-fold OOF" />
                        <Arrow />
                        <Node t={L('S3 paketi', 'S3 bundle')} d="serving/…svd.pkl" tag="Railway S3" />
                    </div>

                    <div className="mt-5 border-t border-dashed border-[#ece9e3] pt-5">
                        <div className={`${S.cap} mb-3 flex items-center gap-2`}><i className="h-2 w-2 rounded-[3px] bg-[#047857]" />{L('servis · çevrimiçi · istek akışı', 'serve · online · request flow')}</div>
                        <div className="flex items-stretch overflow-x-auto pb-1.5">
                            <Node teal t={L('Next.js istemci', 'Next.js client')} d="sadikcoban.com" tag="CORS" />
                            <Arrow />
                            <Node teal t="FastAPI v2.1.0" d={L('uvicorn · Railway', 'uvicorn · Railway')} tag="APIRouter" />
                            <Arrow />
                            <Node teal t="lgb_service" d={L('paket bellekte · thread-kilitli', 'bundle in memory · thread-locked')} tag={L('açılışta yüklenir', 'boot-loaded')} />
                            <Arrow />
                            <Node teal t="predict" d={L('expm1(clip) · ±%6.6 bant', 'expm1(clip) · ±6.6% band')} tag="≤15M cap" />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {[['POST', '/api/predict', ''], ['GET', '/api/data-drift', 'KS + Wasserstein'], ['GET', '/api/bi/meta · /agg', ''], ['GET', '/api/snapshots', ''], ['GET', '/docs', 'OpenAPI']].map(([m, p, x]) => (
                            <span key={p} className="rounded-[8px] border border-[#e4e2dd] bg-[#fbfbf9] px-[9px] py-[5px] font-mono text-[11px] text-[#33332f]">
                                <b className={m === 'POST' ? 'text-[#047857]' : 'text-[#0d9aba]'}>{m}</b> {p}{x && <span className="text-[#86857e]"> · {x}</span>}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 max-w-[70ch] text-[12.5px] leading-[1.6] text-[#5f5f5a]">
                        <b className="text-[#33332f]">{L('Paket: ', 'Bundle: ')}</b>
                        <code className="rounded-[4px] bg-[#f3f1ec] px-[5px] font-mono text-[11.5px]">{'{model, tfidf, cat_maps, feat_cols}'}</code>
                        {L(' — 6 kategorik + 8 sayısal + serbest metin model & series → TF-IDF → TruncatedSVD (170 boyut). Eğitim ve servis ayrışamaz: tek pickle kendi ön-işlemesini taşır.',
                            ' — 6 categoricals + 8 numerics + free-text model & series → TF-IDF → TruncatedSVD (170 dims). Train and serve can’t drift apart: one pickle carries its own preprocessing.')}
                    </p>
                </div>
            </section>

            {/* ── 02 · scores ── */}
            {fr && base && (
                <section className="mt-12 border-t border-[#e9e7e2] pt-9">
                    <div className="mb-2 flex items-baseline gap-3">
                        <span className={S.n}>[02]</span><h2 className={S.h2}>{L('Skorlar', 'Scores')}</h2>
                    </div>
                    <p className={`${S.lede} mb-5`}>
                        {L('Üç varyant aynı sızıntısız 5-fold bölünmeyi paylaşıyor; medyan tabanı da aynı fold’larda koşuyor.',
                            'Three variants share one leak-free 5-fold split; the median baseline runs on the same folds.')}
                    </p>
                    <div className={`${S.card} overflow-hidden`}>
                        <div className={`${S.cap} px-4 pt-[13px]`}>{L('model karşılaştırma · 5-fold out-of-fold', 'model comparison · 5-fold out-of-fold')}</div>
                        <div className="overflow-x-auto">
                            <table className="mt-2 w-full border-collapse font-mono text-[12.5px]">
                                <thead>
                                    <tr>{[L('Varyant', 'Variant'), 'MAPE', 'R²', 'MAE ₺', 'MedAE ₺', 'RMSE ₺'].map((h, i) => (
                                        <th key={h} className={`px-3 py-2 font-semibold uppercase tracking-[0.04em] text-[10px] text-[#86857e] ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {[
                                        { k: 'LightGBM · TF-IDF+SVD ★', m: fr.lightgbm_tfidf_svd, win: true },
                                        { k: 'CatBoost · TF-IDF+SVD', m: fr.catboost_tfidf_svd },
                                        { k: 'CatBoost · native', m: fr.catboost_native },
                                        { k: L('Model+yıl medyanı · fallback’li', 'Model+year median · fallback'), m: base, base: true },
                                    ].filter((r) => r.m).map((r) => (
                                        <tr key={r.k} className={r.win ? 'bg-[#eef6f1]' : ''}>
                                            <td className={`border-t border-[#ece9e3] px-3 py-2 text-left ${r.win ? 'font-semibold text-[#065f46]' : r.base ? 'text-[#5f5f5a]' : 'text-[#33332f]'}`}>{r.k}</td>
                                            {[`${r.m.MAPE.toFixed(2)}%`, r.m.R2.toFixed(4), fmtN(r.m.MAE, loc), fmtN(r.m.MedAE, loc), fmtN(r.m.RMSE, loc)].map((v, i) => (
                                                <td key={i} className="border-t border-[#ece9e3] px-3 py-2 text-right tabular-nums">{v}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="m-0 px-4 pb-4 pt-3 text-[12.5px] text-[#5f5f5a]">
                            {L('Metrikler out-of-fold (sızıntısız); final modeller tüm veriyle eğitildi. Servis, nokta fiyatın yanında sabit ', 'Metrics are out-of-fold (leak-free); final models train on all data. Serving returns a point price plus a fixed ')}
                            <b className="font-mono text-[#065f46]">±6.6%</b>{L(' bant döndürür.', ' band.')}
                        </p>
                    </div>
                </section>
            )}

            {/* ── 03 · findings ── */}
            <section className="mt-12 border-t border-[#e9e7e2] pt-9">
                <div className="mb-2 flex items-baseline gap-3">
                    <span className={S.n}>[03]</span><h2 className={S.h2}>{L('Veri gerçekte ne diyor', 'What the data actually says')}</h2>
                </div>
                <p className={`${S.lede} mb-5`}>
                    {L('Fiyatı nasıl okuyacağını değiştiren bulgular — modeli süsleyenler değil.', "Findings that change how you'd read a price, not just decorate the model.")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        abl && {
                            n: '01', t: L('Marka önemli değil', "Brand doesn't matter"),
                            d: L('Marka, model+seri’nin üstüne eklendiğinde hatayı 1₺ oynatıyor. Marka zaten model’in içinde — rozet, sinyal değil.',
                                'Adding brand on top of series+model moves the error by ₺1. Brand is already inside model — a badge, not a price signal.'),
                            rows: [
                                { l: L('yalnız brand', 'brand only'), w: 100, c: '#c9c6bf', v: abl.sadece_brand.MAPE.toFixed(2) },
                                { l: L('seri+model', 'series+model'), w: (abl.seri_model.MAPE / abl.sadece_brand.MAPE) * 100, c: '#047857', v: abl.seri_model.MAPE.toFixed(2) },
                                { l: L('+ brand', '+ brand'), w: (abl.brand_seri_model.MAPE / abl.sadece_brand.MAPE) * 100, c: '#047857', v: abl.brand_seri_model.MAPE.toFixed(2) },
                            ],
                            s: L("Theil's U = 1.00 · model markayı zaten belirliyor", "Theil's U = 1.00 · model already determines brand"),
                        },
                        {
                            n: '02', t: L('km ve yaş taşıyor — ve ayrışıyor', 'km & age drive it — and diverge'),
                            d: L('Yaş −%7.1/yıl, km −%14.6/100k km (korelasyonlu eksenler). Düşük-km yaşlı araç yaş cezasını yemiş ama km cezasını yememiş → sistematik ucuz.',
                                'Age −7.1%/yr, km −14.6%/100k km (correlated axes). A low-km old car paid the age penalty but not the km one → systematically underpriced.'),
                            rows: [
                                { l: L('km · 100k başına', 'km · per 100k'), w: 100, c: '#e08a1e', v: '−14.6%' },
                                { l: L('yaş · yıl başına', 'age · per year'), w: 48.6, c: '#e08a1e', v: '−7.1%' },
                            ],
                            s: L('hedonik R² 0.931 · her %95 GA sıfırı dışlıyor', 'hedonic R² 0.931 · every 95% CI excludes zero'),
                        },
                        tiers.length >= 3 && {
                            n: '03', t: L('Taban nadir araçlarda çöküyor', 'The baseline collapses on rare cars'),
                            d: L('Model+yıl medyanı araçların %97.5’ini fiyatlıyor — ama emsalsiz araç modele, sonra globale iner ve patlar. Model her yerde düz kalıyor.',
                                'The model+year median prices 97.5% of cars — but a car with no comp falls back to model, then global, and blows up. The model stays flat everywhere.'),
                            rows: tiers.slice(0, 3).map((r: any, i: number) => ({
                                l: [L('model+yıl', 'model+year'), L('model fb', 'model fb'), L('global fb', 'global fb')][i],
                                w: (r[4] / tiers[2][4]) * 100,
                                c: ['#047857', '#e08a1e', '#ef4444'][i],
                                v: fmtK(r[4], loc),
                            })),
                            s: L(`%${tiers[0][2]} emsalli · %${(tiers[1][2] + tiers[2][2]).toFixed(2)} düşüp patlıyor`, `${tiers[0][2]}% comped · ${(tiers[1][2] + tiers[2][2]).toFixed(2)}% fall back and blow up`),
                        },
                        {
                            n: '04', t: L('Kirli veri, fiyatlamadan önce çözüldü', 'Dirty data, handled before pricing'),
                            d: L(`${fmtN(meta.n_raw, loc)} snapshot → ${fmtN(meta.n_dedup, loc)} ilan; 15 spec kolonu birlikte boşalıyor (katalog çöküşü); ham "G" segmenti bozuk bir MPV etiketiydi, seriden yeniden türetildi.`,
                                `${fmtN(meta.n_raw, loc)} snapshots → ${fmtN(meta.n_dedup, loc)} listings; 15 spec columns go missing together (catalog collapse); the raw "G" segment was a corrupt MPV mislabel, re-derived from series.`),
                            rows: [
                                { l: L('ham kolon', 'raw columns'), w: 100, c: '#c9c6bf', v: '117' },
                                { l: L('tutulan', 'kept'), w: (keptCols / 117) * 100, c: '#047857', v: String(keptCols) },
                            ],
                            s: L('15 spec kolonu birlikte eksik · birlikte-eksiklik 1.00', '15 spec columns miss together · co-miss 1.00'),
                        },
                        (gapN || convN || clashN) && {
                            n: '05', wide: true, t: L('İlan metni, kolonların hiç kaydetmediğini taşıyor', 'The listing text holds what the columns never recorded'),
                            d: L('Serbest metin, satıcının forma hiç yazmadığı hasarı, motor dönüşümlerini, formla uyuşmayan alanları ve hiç kolonu olmayan donanımı anlatıyor. Fiyatın tek başına taşıyamadığı detay burada — metin bu yüzden kendi başına analiz ediliyor.',
                                'Free text describes damage the seller never entered on the form, engine swaps and conversions, fields that don’t line up with the form, and equipment that has no column at all. That’s the detail a price alone can’t carry — and why the text is analysed on its own terms.'),
                            rows: [
                                gapN && { l: L('yalnız metinde açıklanmış', 'disclosed in text only'), w: 100, c: '#e08a1e', v: fmtN(gapN, loc) },
                                clashN && { l: L('alan çelişkisi', 'field clashes'), w: (clashN / gapN) * 100, c: '#e08a1e', v: `~${fmtN(Math.round(clashN / 100) * 100, loc)}` },
                                convN && { l: L('dönüşüm', 'conversions'), w: (convN / gapN) * 100, c: '#7c5cff', v: fmtN(convN, loc) },
                            ].filter(Boolean),
                            s: topExtra ? L(`ilanların %${topExtra.mention_pct}’inde ${LBL.label(LBL.equipment, topExtra.feature, 'tr').toLowerCase()} geçiyor — hiçbir kolonda yok`,
                                `${LBL.label(LBL.equipment, topExtra.feature, 'en').toLowerCase()} appears in ${topExtra.mention_pct}% of ads — and in zero columns`) : '',
                        },
                    ].filter(Boolean).map((f: any) => (
                        <div key={f.n} className={`${S.card} flex flex-col p-4 ${f.wide ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
                            <div className="font-mono text-[11px] font-semibold text-[#9a9a92]">{f.n}</div>
                            <div className="mt-1.5 text-[14.5px] font-semibold tracking-[-0.01em] text-[#1a1a1a]">{f.t}</div>
                            <div className="mt-2 flex-1 text-[12.5px] leading-[1.5] text-[#5f5f5a]">{f.d}</div>
                            <Mini rows={f.rows} />
                            {f.s && <div className="mt-2.5 border-t border-[#ece9e3] pt-2.5 font-mono text-[11.5px] font-semibold text-[#065f46]">{f.s}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 04 · data & method ── */}
            <section className="mt-12 border-t border-[#e9e7e2] pt-9">
                <div className="mb-2 flex items-baseline gap-3">
                    <span className={S.n}>[04]</span><h2 className={S.h2}>{L('Veri ve yöntem', 'Data & method')}</h2>
                </div>
                <p className={`${S.lede} mb-5`}>
                    {L('Gerçek TR plakalı 2.el ilan detay sayfaları, dört aylık dönem, ilan başına tek kayıt. Tarayıcının getirdiğinin üçte biri aynı ilanın tekrarı.',
                        'Real TR-registered used-car detail pages, four monthly snapshots, one listing per ad. A third of what the scraper returns is the same ad seen again.')}
                </p>

                <div className={`${S.card} mb-4 p-4`}>
                    <div className={`${S.cap} mb-3`}>{L('tarama → tekilleştirme', 'scrape → dedup')}</div>
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-[34px] w-full items-center rounded-[8px] bg-[#c9c6bf] px-3 font-mono text-[12.5px] font-semibold text-white">
                            {fmtN(meta.n_raw, loc)} {L('ham snapshot', 'raw snapshots')}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-[34px] items-center rounded-[8px] bg-[#047857] px-3 font-mono text-[12.5px] font-semibold text-white" style={{ width: `${(meta.n_dedup / meta.n_raw) * 100}%` }}>
                            {fmtN(meta.n_dedup, loc)} {L('ilan', 'listings')}
                        </div>
                        <span className="shrink-0 font-mono text-[11.5px] text-[#5f5f5a]">{L('ad_id başına en son', 'latest per ad_id')}</span>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-[1.55] text-[#5f5f5a]">
                        {L(`Aradaki ${fmtN(residue, loc)} satır aynı ilanın dört dönemde yeniden taranmış hâli — veri değil, tarama artığı. Dedup, ad_id üzerinden ve CV bölünmesinden ÖNCE çalışır; böylece bir tekrar fold'lara yayılıp skoru şişiremez.`,
                            `The ${fmtN(residue, loc)} rows between are the same ad re-scraped across four snapshots — scrape residue, not data. Dedup runs on ad_id before the CV split, so a repeat can't straddle folds and inflate the score.`)}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                        { v: fmtN(meta.n_dedup, loc), k: L('tekil ilan', 'unique listings') },
                        { v: fmtN(meta.n_raw, loc), k: L('ham snapshot', 'raw snapshots') },
                        { v: String(keptCols), k: L('kullanılan değişken', 'features used') },
                        pd && { v: fmtM(pd.median), k: L('medyan fiyat', 'median price') },
                        meta.brands && { v: fmtN(meta.brands.bmw, loc), k: 'BMW' },
                        meta.brands && { v: fmtN(meta.brands.audi, loc), k: 'Audi' },
                    ].filter(Boolean).map((p: any) => (
                        <div key={p.k} className={`${S.card} px-[13px] py-[13px]`}>
                            <div className={`${S.mono} text-[19px] font-bold leading-none text-[#1a1a1a]`}>{p.v}</div>
                            <div className="mt-[7px] font-mono text-[9.5px] uppercase tracking-[0.04em] text-[#86857e]">{p.k}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        L('hedef log1p(fiyat)', 'target log1p(price)'),
                        L('5-fold OOF · sızıntısız', '5-fold OOF · leak-free'),
                        L('bölünmeden önce ad_id dedup', 'dedup on ad_id before split'),
                        pd && L(`P10–P90 ${fmtM(pd.p10)} – ${fmtM(pd.p90)}`, `P10–P90 ${fmtM(pd.p10)} – ${fmtM(pd.p90)}`),
                        L('hedonik + LOFO + SHAP', 'hedonic + LOFO + SHAP'),
                        L('drift KS · PSI · EMD', 'drift KS · PSI · EMD'),
                    ].filter(Boolean).map((c: any) => (
                        <span key={c} className="rounded-[8px] border border-[#e4e2dd] bg-[#fdfcf9] px-[10px] py-[6px] font-mono text-[11.5px] text-[#5f5f5a]">{c}</span>
                    ))}
                </div>
            </section>

            {/* ── 05 · stack + deep dives ── */}
            <section className="mt-12 border-t border-[#e9e7e2] pb-2 pt-9">
                <div className="mb-4 flex items-baseline gap-3">
                    <span className={S.n}>[05]</span><h2 className={S.h2}>{L('Yığın ve derinlemesine', 'Stack & deep dives')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['FastAPI', 'uvicorn', 'LightGBM', 'scikit-learn · TF-IDF+SVD', 'DuckDB', 'boto3 · S3', 'SciPy', 'pandas · NumPy', 'Railway', 'Next.js'].map((s) => (
                        <span key={s} className="rounded-[8px] border border-[#e4e2dd] bg-[#fdfcf9] px-[11px] py-[6px] font-mono text-[12px] text-[#33332f]">{s}</span>
                    ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { href: '/projects/car-price/report', t: L('Analitik Rapor · Lab', 'Analytics Report · Lab'), d: L('tam etkileşimli defter', 'the full interactive notebook') },
                        { href: '/projects/car-price/predict', t: L('Canlı tahmin', 'Live prediction'), d: L('/api/predict’i dene', 'try /api/predict') },
                        { href: '/projects/car-price/dashboard', t: L('Pazar panosu', 'Market dashboard'), d: L('sunucu-taraflı BI + TR haritası', 'server-side BI + TR map') },
                        { href: '/projects/car-price/drift', t: L('Veri kayması', 'Data drift'), d: 'KS + Wasserstein' },
                        { href: '/projects/car-price/shap', t: L('SHAP açıklamaları', 'SHAP explanations'), d: L('öznitelik katkıları', 'feature attributions') },
                        { href: '/projects/car-price/text-analysis', t: L('Metin analizi', 'Text analysis'), d: L('metin ile form nerede ayrışıyor', 'where copy and form diverge') },
                    ].map((l) => (
                        <Link key={l.href} href={localize(l.href, lang)} className={`${S.card} block px-[15px] py-3 transition-colors hover:border-[#cfe8dc]`}>
                            <div className="text-[13px] font-semibold text-[#1a1a1a]">{l.t} →</div>
                            <div className="mt-[3px] text-[11.5px] text-[#5f5f5a]">{l.d}</div>
                        </Link>
                    ))}
                </div>
            </section>
        </FinalShell>
    );
}
