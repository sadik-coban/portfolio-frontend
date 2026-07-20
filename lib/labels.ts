// lib/labels.ts
// ---------------------------------------------------------------------------
// The analysis pipeline is Turkish, the site is English. Every value that comes
// out of a JSON export and lands on screen has to be translated at RENDER time —
// which is what this file is for.
//
// WHY {tr, en} AND NOT A PLAIN TR→EN MAP
// app/_site/i18n-config.ts sets I18N_ENABLED = false, but the comment there is
// explicit that Turkish is fully built and only *deactivated*. A one-directional
// map would silently regress the Turkish site the day that flag is flipped back,
// which is exactly what happened to `fdReason` before this file existed. Same
// shape as site_data.json's own `column_labels`, so the two compose.
//
// WHY NOT AT BUILD TIME
// scripts/build-*.mjs are manual (nothing in package.json runs them), so a
// translation living there could silently not have run — and it would destroy
// the Turkish in the payload. Render-time lookup keeps both languages.
//
// COMPOSING WITH column_labels
// site_data.json ships `column_labels` (raw_column → {tr, en, tab}) for the 40
// scraped columns. That stays the first tier for those; this file is the second
// tier for everything it doesn't cover. FinalReportLab already demonstrates the
// pattern: `const numLabel = (raw) => NUMLBL[raw] || clab(raw)`.
//
// NAMESPACED BY COLUMN, deliberately: the same token means different things in
// different places ("orta" is a severity tier in one table and a price band in
// another), so a single flat dictionary would collide.
// ---------------------------------------------------------------------------

export type Lang = 'en' | 'tr';
export type Label = { tr: string; en: string };
export type LabelMap = Record<string, Label>;

/** Build a {tr,en} map from `tr → en` pairs (the Turkish key is also the tr label). */
const trEn = (pairs: Record<string, string>): LabelMap =>
    Object.fromEntries(Object.entries(pairs).map(([tr, en]) => [tr, { tr, en }]));

// ── vehicle categoricals ────────────────────────────────────────────────────
// Seeded by inverting lib/services/car-service.ts MAPPINGS (the EN→TR table the
// predict form already uses on the wire) rather than retyping it. Note the wire
// values must stay Turkish — these are display-only.

export const fuel = trEn({
    'Benzin': 'Petrol',
    'Dizel': 'Diesel',
    'Hibrit': 'Hybrid',
    'LPG': 'LPG',
    'LPG & Benzin': 'LPG & petrol',
    'Benzin & Elektrik': 'Petrol & electric',
    'Elektrik': 'Electric',
});

export const transmission = trEn({
    'Otomatik': 'Automatic',
    'Düz': 'Manual',
    'Yarı Otomatik': 'Semi-automatic',
});

export const drivetrain = trEn({
    'Arkadan İtiş': 'Rear-wheel drive',
    'Önden Çekiş': 'Front-wheel drive',
    '4WD (Sürekli)': '4WD (permanent)',
    'AWD (Elektronik)': 'AWD (electronic)',
});

export const bodyType = trEn({
    'Station wagon': 'Estate',
    'Hatchback/3': 'Hatchback (3-door)',
    'Hatchback/5': 'Hatchback (5-door)',
    'missing': 'unrecorded',
    // Sedan / Coupe / Cabrio / MPV / SUV read the same in both languages.
});

export const seller = trEn({
    'Galeriden': 'Dealer',
    'Sahibinden': 'Private seller',
    'Yetkili Bayiden': 'Franchised dealer',
});

// ── damage & claim vocabulary ───────────────────────────────────────────────

/** flag_severity.severity_n / .severity_pct keys — these become chart categories. */
export const severity = trEn({
    'hafif': 'light',
    'orta': 'moderate',
    'ağır': 'heavy',
});

/** flag_severity.claim_type_n keys — which claim the listing actually made. */
export const claimType = trEn({
    'blanket temiz ama yapısal hasar': 'General “flawless”',
    'boyasız ama boya var': 'Said “no paint”',
    'değişensiz ama değişen var': 'Said “no changed parts”',
});

/** Matched-phrase chips in the two review queues (crosssource_damage.*_examples.matched). */
export const damageChip = trEn({
    'hatasız': 'flawless',
    'boyasız': 'unpainted',
    'tramersiz': 'no damage record',
    'değişensiz': 'no changed parts',
    'orijinal': 'original',
    'tertemiz': 'spotless',
    'tramer': 'damage record',
    'lokal boya': 'local paint',
    'değişen': 'changed panel',
    'hasar kaydı': 'damage record',
    'boya': 'paint',
});

/** crosssource_fields.review_queue[].field — which column disagreed. */
export const claimField = trEn({
    'yakıt': 'fuel',
    'vites': 'transmission',
    'çekiş': 'drivetrain',
    'kasa': 'body',
    'motor hacmi': 'engine size',
    'yıl': 'year',
    // 'hp' and 'model' already read as English.
});

/** crosssource_fields.counts keys — English tokens, localised for the TR site. */
export const countField: LabelMap = {
    year: { tr: 'yıl', en: 'year' },
    hp: { tr: 'HP', en: 'HP' },
    model: { tr: 'model', en: 'model' },
    fuel: { tr: 'yakıt', en: 'fuel' },
    transmission: { tr: 'vites', en: 'transmission' },
    body: { tr: 'kasa', en: 'body' },
    drivetrain: { tr: 'çekiş', en: 'drivetrain' },
    engine_cc: { tr: 'motor hacmi', en: 'engine cc' },
};

// ── text-analysis specifics ─────────────────────────────────────────────────

/** extras.equipment_coverage[].feature — chart y-axis + the landing-page sentence. */
export const equipment = trEn({
    'Cam / panoramik tavan': 'Sunroof / panoramic roof',
    'Geri görüş kamerası': 'Reversing camera',
    'Park sensörü': 'Parking sensors',
    'Xenon / LED far': 'Xenon / LED headlights',
    'Isıtmalı koltuk': 'Heated seats',
    'Elektrikli / hafızalı ayna': 'Powered / memory mirrors',
    'Deri koltuk / döşeme': 'Leather seats / trim',
    'Navigasyon': 'Navigation',
    'Şerit / kör nokta asistanı': 'Lane / blind-spot assist',
    'Adaptive cruise / hız sabitleyici': 'Adaptive cruise control',
    'Elektrikli bagaj': 'Powered tailgate',
    'Hafızalı koltuk': 'Memory seats',
    'Isıtmalı direksiyon': 'Heated steering wheel',
    // 'Start-stop' and 'CarPlay / Android Auto' are already English.
});

/** hedonic_coefficients.coefficients[].feature — 4 of 14 are Turkish. */
export const coefFeature = trEn({
    'Servis kayıtlı': 'Service history',
    'Yetkili servis': 'Franchised service',
    'Garanti': 'Warranty',
    "Aldatıcı 'temiz' iddiası (gizli hasar)": 'Clean claim vs. declared damage',
});

/** residuals.signals[].signal — where the price model under-predicts. */
export const residualSignal = trEn({
    'M/RS modeli': 'M / RS model',
    'modifiye': 'modified',
    'swap/dönüşüm': 'swap / conversion',
    'nadir/özel': 'rare / special',
});

/** ad_title.hook_pct keys — what the ad title leads with. */
export const hook = trEn({
    'hasarsız-iddia': 'clean claim',
    'donanım': 'equipment',
    'durum/övgü': 'condition / praise',
    'spec(yıl/km/motor)': 'spec (year / km / engine)',
    'aciliyet/promo': 'urgency / promo',
});

/** llm_enrichment — extraction classes, attribute names, and the distilled vocabulary. */
export const llmClass = trEn({
    'Hasar': 'Damage',
    'Bakım': 'Maintenance',
    'Modifiye': 'Modification',
    'Beygir': 'Horsepower',
});

export const llmAttr = trEn({
    'parca': 'part',
    'durum': 'condition',
    'guc_degeri': 'power value',
});

export const llmVocab = trEn({
    'boyalı': 'painted',
    'tramer kayıtlı': 'has a damage record',
    'lokal boyalı': 'locally painted',
    'değişmiş': 'replaced',
    'hatasız / değişensiz': 'flawless / no changed parts',
});

// ── report specifics ────────────────────────────────────────────────────────

/** hedonic_reliability.bootstrap[].terim — regression term names. */
export const hedonicTerm = trEn({
    'yaş': 'age',
    'yaş²': 'age²',
    'yaş×km': 'age×km',
    'km(100K)': 'km (100K)',
    'km²': 'km²',
    'ağır hasar': 'heavy damage',
    'boyalı': 'painted',
    'değişen': 'changed',
    '+100 HP': '+100 HP',
    '+1 litre': '+1 litre',
});

/** hedonic_reliability.vif[][0] — English tokens, localised for the TR site. */
export const vifTerm: LabelMap = {
    age: { tr: 'yaş', en: 'age' },
    km10: { tr: 'km', en: 'km' },
    dmg: { tr: 'ağır hasar', en: 'heavy damage' },
    painted: { tr: 'boyalı', en: 'painted' },
    changed: { tr: 'değişen', en: 'changed' },
    hp100: { tr: '+100 HP', en: '+100 HP' },
    cc_L: { tr: 'motor (L)', en: 'engine (L)' },
};

/** methodology.feature_drop[][1] — why a column was dropped. */
export const featureDropReason = trEn({
    'Sabit varyans': 'Constant variance',
    'Redundant kb/gb': 'Redundant kb/gb twins',
    'Kapsam farkı': 'Coverage difference',
    'Kimlik/sızıntı': 'Identity / leakage',
    'Blok-eksik>%40': 'Block-missing >40%',
    'Spec-eksik~%26': 'Spec-missing ~26%',
    'low/up→val': 'low/up → value',
    'Granüler hasar→agregat': 'Granular damage → aggregate',
    'Ampirik audit(garanti)': 'Empirical audit (warranty)',
});

/**
 * kmeans[].ad — cluster names are COMPOSED (`"Yaşlı & yüksek-km · hasarlı"`), so these are
 * substring fragments applied by `clusterName()` below, not whole-key lookups. The previous
 * per-file copies of this map drifted: /report's still keyed on cluster names the pipeline
 * stopped emitting, so that page fell through to raw Turkish.
 */
export const clusterPart = trEn({
    'Yaşlı & yüksek-km': 'Older, high-km',
    'Genç & düşük-km': 'Newer, low-km',
    'Karışık': 'Mixed',
    ' · büyük motor': ' · bigger engine',
    ' · hasarlı': ' · damaged',
    ' · temiz': ' · clean',
});

/** final_results.ornek_tahminler[].fiyat_bandi */
export const priceBand = trEn({
    'ekonomik': 'Economy',
    'orta': 'Mid',
    'premium': 'Premium',
});

/** model_yil_medyani.metrik_kirilim[][0] — the fallback ladder rungs. */
export const baselineTier = trEn({
    'model+yıl': 'model + year',
    'model': 'model',
    'global': 'global',
});

/** column_labels._tab_meaning ships only the Turkish side. */
export const sourceTab = trEn({
    'Genel Bakış': 'Overview',
    'KısaBilgi': 'QuickInfo',
});

/** Short heatmap-axis overrides; anything unmapped falls back to column_labels. */
export const shortColumn: LabelMap = {
    vehicle_age: { tr: 'yaş', en: 'age' },
    gb_mileage: { tr: 'km', en: 'km' },
    power_hp_val: { tr: 'HP', en: 'HP' },
    engine_cc_val: { tr: 'cc', en: 'cc' },
    count_painted: { tr: 'boyalı', en: 'painted' },
    count_changed: { tr: 'değişen', en: 'changed' },
    count_local_painted: { tr: 'lokal boya', en: 'local paint' },
    is_heavy_damaged: { tr: 'ağır hasar', en: 'heavy dmg' },
    torque_nm: { tr: 'tork (Nm)', en: 'torque (Nm)' },
    gb_year: { tr: 'yıl', en: 'year' },
    price: { tr: 'fiyat', en: 'price' },
    tramer_fee: { tr: 'tramer bedeli', en: 'damage-record value' },
};

/** Physical body panels — shared by the predict form and the BI damage grid. */
export const panel = trEn({
    'Kaput': 'Hood',
    'Tavan': 'Roof',
    'Bagaj': 'Trunk',
    'Sol Ön Çamurluk': 'Front left wing',
    'Sağ Ön Çamurluk': 'Front right wing',
    'Sol Arka Çamurluk': 'Rear left wing',
    'Sağ Arka Çamurluk': 'Rear right wing',
    'Sol Ön Kapı': 'Front left door',
    'Sağ Ön Kapı': 'Front right door',
    'Sol Arka Kapı': 'Rear left door',
    'Sağ Arka Kapı': 'Rear right door',
    'Ön Tampon': 'Front bumper',
    'Arka Tampon': 'Rear bumper',
});

// ── corpus words — GLOSS, never replace ─────────────────────────────────────
/**
 * NMF topic words (register.topics[].top_words) and ad-title words
 * (ad_title.top_words[].word) ARE the analysis output: they are the tokens the
 * model actually found in a Turkish corpus. Translating them away would make the
 * result unreproducible — a reader could not check it against the data.
 *
 * So consumers must render BOTH halves — `gloss(word)` → "orijinaldir (original)".
 * Unmapped words render bare, which is correct: an unglossed word is still the
 * real token.
 */
const CORPUS_GLOSS: Record<string, string> = {
    // topic 1 — equipment / comfort
    elektrikli: 'electric', sensörü: 'sensor', sistemi: 'system', koltuklar: 'seats',
    koltuk: 'seat', hız: 'speed', asistanı: 'assist', direksiyon: 'steering', deri: 'leather',
    // topic 2 — private-seller narrative
    oldukça: 'quite', orijinaldir: 'is original', herhangi: 'any', aracımda: 'on my car',
    uzun: 'long', satıyorum: "I'm selling", süre: 'period', dilerim: 'I wish',
    olmasını: 'to be', hayırlı: 'auspicious', mevcuttur: 'is present',
    // topic 3 — finance / service / paint
    kredi: 'finance', parça: 'part', boya: 'paint', vardır: 'there is', yeni: 'new',
    bakımları: 'servicing', yapılmıştır: 'has been done', değişen: 'changed',
    kaydı: 'record', motor: 'engine', hasar: 'damage', otomatik: 'automatic',
    // ad-title words
    hatasız: 'flawless', boyasız: 'unpainted', değişensiz: 'no changed parts',
    bakımlı: 'well-maintained', vakum: 'soft-close doors', cam: 'glass',
    hayalet: 'head-up display', dan: 'from', den: 'from',
    // tdı / tfsı / sport are model badges — no gloss needed
};

/** Render a corpus token as `word (gloss)`, or bare when we have no gloss for it. */
export function gloss(word: string): string {
    const g = CORPUS_GLOSS[String(word).toLowerCase()];
    return g ? `${word} (${g})` : word;
}

// ── lookup helpers ──────────────────────────────────────────────────────────

/** Look a token up in one map; falls back to the raw token so a miss is visible, not blank. */
export function label(map: LabelMap, token: string | number | undefined | null, lang: Lang): string {
    if (token == null) return '';
    const raw = String(token);
    const e = map[raw];
    return e ? (lang === 'tr' ? e.tr : e.en) : raw;
}

/** Curried form for `.map()` call sites: `const T = labeller(fuel, lang)`. */
export const labeller = (map: LabelMap, lang: Lang) => (token: string | number | undefined | null) => label(map, token, lang);

/**
 * Cluster names are composed of fragments, so this splices rather than looks up.
 * `"Yaşlı & yüksek-km · hasarlı"` → `"Older, high-km · damaged"`.
 */
export function clusterName(name: string, lang: Lang): string {
    if (lang === 'tr' || !name) return name;
    let out = name;
    for (const [tr, e] of Object.entries(clusterPart)) out = out.split(tr).join(e.en);
    return out;
}

/**
 * flag_severity.severity_def is a Turkish sentence, not a token — it was being
 * interpolated raw into the English copy. Rebuilt from `severity` so it stays in
 * step if the tier names ever change.
 */
export function severityDef(lang: Lang): string {
    return lang === 'tr'
        ? 'ağır = pert/ağır-hasar VEYA 3+ değişen panel · orta = 1-2 değişen ya da 3+ boya · hafif = ≤2 boya & 0 değişen'
        : 'heavy = write-off/heavy-damage record OR 3+ replaced panels · moderate = 1–2 replaced or 3+ painted · light = ≤2 painted & 0 replaced';
}
