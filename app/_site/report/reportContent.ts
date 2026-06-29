// Faithful summary of car_price_eda_and_training_pipeline.ipynb — real numbers
// extracted from the notebook outputs, plus the method narrative per phase.

export type Bi = { en: string; tr: string };

export interface Phase {
    id: string;
    n: string;
    chart?: 'priceDist' | 'corr' | 'cramers' | 'damage' | 'ablation' | 'outliers' | 'lofo' | 'folds';
    title: Bi;
    body: Bi;
}

// --- real result data from the notebook ---
export const LOFO: { f: string; v: number }[] = [
    { f: 'gb_mileage', v: 58186 }, { f: 'gb_year', v: 45288 }, { f: 'model', v: 13083 },
    { f: 'is_heavy_damaged', v: 6505 }, { f: 'power_hp_val', v: 5652 }, { f: 'series', v: 5304 },
    { f: 'count_changed', v: 1791 }, { f: 'engine_cc_val', v: 907 }, { f: 'gb_mtv_yearly', v: 760 },
    { f: 'kb_body_type', v: 572 }, { f: 'brand', v: 526 }, { f: 'kb_drivetrain', v: 383 },
    { f: 'count_painted', v: 132 }, { f: 'gb_transmission', v: 75 },
    { f: 'count_local_painted', v: -63 }, { f: 'gb_fuel', v: -109 }, { f: 'expert_risk_score', v: -346 },
];

export const ABLATION: { c: string; v: number }[] = [
    { c: 'gb_year + kb_body_type', v: 190653 },
    { c: 'gb_year + gb_body_type', v: 190997 },
    { c: 'vehicle_age + gb_body_type', v: 191737 },
    { c: 'vehicle_age + kb_body_type', v: 191833 },
];

export const OUTLIERS: { m: string; v: number }[] = [
    { m: 'Z-Score (|Z|>3)', v: 197 },
    { m: 'Isolation Forest', v: 696 },
    { m: 'Combined (union)', v: 843 },
];

export const CRAMERS: { p: string; v: number }[] = [
    { p: 'kb_body_type & gb_body_type', v: 1.000 },
    { p: 'brand & series', v: 0.999 },
    { p: 'brand & model', v: 0.977 },
    { p: 'model & gb_segment', v: 0.965 },
    { p: 'series & model', v: 0.941 },
    { p: 'series & gb_segment', v: 0.915 },
    { p: 'brand & kb_drivetrain', v: 0.855 },
];

export const FOLDS = [142988, 137344, 138810, 137884, 135478];
export const FINAL = { cvRmse: '138,501', cvStd: '2,493', r2: '0.9825', mae: '103,333' };

// Headline takeaways, drawn from the real numbers above.
export const FINDINGS: Bi[] = [
    {
        en: 'Mileage (+58k ₺) and model year (+45k ₺) are by far the strongest price drivers — LOFO ranks every other feature well below them.',
        tr: 'Kilometre (+58k ₺) ve model yılı (+45k ₺) açık ara en güçlü fiyat belirleyicileri — LOFO diğer tüm öznitelikleri bunların belirgin altına yerleştirir.',
    },
    {
        en: '843 anomalous listings (the union of |Z|>3 residuals and a 5% Isolation Forest) are removed before the final fit.',
        tr: '843 anormal ilan (|Z|>3 artıkları ile %5 Isolation Forest birleşimi) son eğitimden önce çıkarılır.',
    },
    {
        en: 'The refined CatBoost reaches R² 0.9825, MAE 103,333 ₺ and 138,501 ₺ CV RMSE (±2,493) across 5 folds.',
        tr: 'Rafine CatBoost, 5 katta R² 0,9825, MAE 103.333 ₺ ve 138.501 ₺ CV RMSE (±2.493) değerine ulaşır.',
    },
    {
        en: 'The deployed model swaps the loss for MultiQuantile (0.05 / 0.5 / 0.95) to return a price interval rather than a single point.',
        tr: 'Yayınlanan model, tek nokta yerine fiyat aralığı döndürmek için kaybı MultiQuantile (0,05 / 0,5 / 0,95) ile değiştirir.',
    },
];

export const PHASES: Phase[] = [
    {
        id: 'setup', n: '00',
        title: { en: 'Setup & Data Loading', tr: 'Kurulum & Veri Yükleme' },
        body: {
            en: 'The pipeline loads ~14k scraped used-car listings, configures CatBoost for GPU training, and fixes the random seed for reproducibility. The target is the listing price in Turkish Lira.',
            tr: 'Hat, ~14 bin kazınmış ikinci el ilanı yükler, CatBoost’u GPU eğitimi için yapılandırır ve tekrarlanabilirlik için rastgele tohumu sabitler. Hedef değişken, TL cinsinden ilan fiyatıdır.',
        },
    },
    {
        id: 'eda', n: '01', chart: 'priceDist',
        title: { en: 'EDA & Variance Analysis', tr: 'EDA & Varyans Analizi' },
        body: {
            en: 'Exploratory analysis starts with a crosstab heatmap of kb_body_type vs gb_body_type and a quasi-constant scan with DropConstantFeatures (tol=0.99). Columns that barely vary (kb_condition, gb_usage_type, gb_is_first_owner) carry no signal and are dropped.',
            tr: 'Keşifsel analiz, kb_body_type ile gb_body_type için bir çapraz tablo ısı haritası ve DropConstantFeatures (tol=0.99) ile yarı-sabit sütun taramasıyla başlar. Neredeyse hiç değişmeyen sütunlar (kb_condition, gb_usage_type, gb_is_first_owner) sinyal taşımadığından elenir.',
        },
    },
    {
        id: 'corr', n: '02', chart: 'corr',
        title: { en: 'Numerical Correlations', tr: 'Sayısal Korelasyonlar' },
        body: {
            en: 'A Pearson heatmap maps the numerical relationships. Year correlates strongly positively with price (≈ +0.77) and mileage strongly negatively (≈ −0.63). Horsepower and torque are highly collinear (r ≈ 0.76), so only one needs to stay.',
            tr: 'Pearson ısı haritası sayısal ilişkileri çıkarır. Yıl fiyatla güçlü pozitif (≈ +0,77), kilometre güçlü negatif (≈ −0,63) korelelidir. Beygir ve tork yüksek eşdoğrusaldır (r ≈ 0,76); biri kalması yeterli.',
        },
    },
    {
        id: 'impute', n: '03',
        title: { en: 'Duplicate Removal & Group Imputation', tr: 'Yinelenen Sütunlar & Grup Bazlı Doldurma' },
        body: {
            en: 'Scraped pairs like kb_year vs gb_year hold identical data — perfect multicollinearity, so one of each pair is removed. Missing technical values are filled by hierarchical median imputation: Series & Year → Series → Brand & Year → Brand → overall median. Zero-CC / zero-HP anomalies are repaired with upper-boundary means.',
            tr: 'kb_year ile gb_year gibi kazınmış çiftler aynı veriyi tutar — tam eşdoğrusallık; her çiftten biri kaldırılır. Eksik teknik değerler hiyerarşik medyan doldurmayla tamamlanır: Seri & Yıl → Seri → Marka & Yıl → Marka → genel medyan. Sıfır-CC / sıfır-HP anomalileri üst sınır ortalamalarıyla onarılır.',
        },
    },
    {
        id: 'feature', n: '04', chart: 'damage',
        title: { en: 'Domain Feature Engineering', tr: 'Alan Bazlı Öznitelik Mühendisliği' },
        body: {
            en: 'A documented preprocess_damage_score function aggregates the expertise columns (changed / painted / locally-painted parts, heavy-damage flag) into a single expert_risk_score, and vehicle_age is derived from the model year. Heavy-damaged cars sell for visibly less — the model learns this penalty.',
            tr: 'Belgelenmiş bir preprocess_damage_score fonksiyonu, ekspertiz sütunlarını (değişen / boyalı / lokal boyalı parçalar, ağır hasar bayrağı) tek bir expert_risk_score’a indirger; vehicle_age model yılından türetilir. Ağır hasarlı araçlar görünür şekilde daha ucuza satılır — model bu cezayı öğrenir.',
        },
    },
    {
        id: 'cramers', n: '05', chart: 'cramers',
        title: { en: 'Categorical Associations (Cramér’s V)', tr: 'Kategorik İlişkiler (Cramér’s V)' },
        body: {
            en: 'Cramér’s V quantifies how strongly categorical features predict each other. brand & series (0.999) and the two body-type columns (1.000) are almost redundant, while knowing the model almost perfectly determines brand and segment. This guides which hierarchy level to keep.',
            tr: 'Cramér’s V, kategorik özniteliklerin birbirini ne kadar güçlü öngördüğünü ölçer. marka & seri (0,999) ve iki kasa-tipi sütunu (1,000) neredeyse gereksizdir; modeli bilmek markayı ve segmenti neredeyse tam belirler. Bu, hangi hiyerarşi seviyesinin tutulacağını yönlendirir.',
        },
    },
    {
        id: 'baseline', n: '06', chart: 'ablation',
        title: { en: 'Baseline CV & Hierarchy Ablation', tr: 'Temel CV & Hiyerarşi Ablasyonu' },
        body: {
            en: 'A 5-fold GPU CatBoost baseline trains on log-price with model passed as a text feature. A 2×2 ablation compares year encodings (gb_year vs vehicle_age) against body-type columns. gb_year + kb_body_type wins narrowly at ~190.7k CV RMSE.',
            tr: '5 katlı GPU CatBoost temeli, model bir metin özniteliği olarak verilerek log-fiyat üzerinde eğitilir. 2×2 ablasyon, yıl kodlamalarını (gb_year vs vehicle_age) kasa-tipi sütunlarına karşı karşılaştırır. gb_year + kb_body_type, ~190,7k CV RMSE ile kıl payı kazanır.',
        },
    },
    {
        id: 'outliers', n: '07', chart: 'outliers',
        title: { en: 'Outlier Analysis', tr: 'Aykırı Değer Analizi' },
        body: {
            en: 'Anomalies are flagged two ways: |Z| > 3 on the baseline CatBoost residuals (197 rows) and an Isolation Forest at 5% contamination (696 rows). Their union — 843 listings — is removed before the final fit so mispriced or mislabeled ads don’t skew the model.',
            tr: 'Anomaliler iki yolla işaretlenir: temel CatBoost artıkları üzerinde |Z| > 3 (197 satır) ve %5 kirlilikte Isolation Forest (696 satır). Birleşimleri — 843 ilan — son eğitimden önce çıkarılır; böylece yanlış fiyatlanmış/etiketlenmiş ilanlar modeli saptırmaz.',
        },
    },
    {
        id: 'lofo', n: '08', chart: 'lofo',
        title: { en: 'LOFO Feature Selection', tr: 'LOFO Öznitelik Seçimi' },
        body: {
            en: 'A custom Leave-One-Feature-Out routine retrains the model without each feature and measures the CV-RMSE increase (positive = important). Mileage (+58k) and year (+45k) dominate, followed by model, heavy-damage and horsepower. A few features (expert_risk_score, gb_fuel) score negative — they are noise and get dropped.',
            tr: 'Özel bir Leave-One-Feature-Out yordamı, modeli her öznitelik olmadan yeniden eğitir ve CV-RMSE artışını ölçer (pozitif = önemli). Kilometre (+58k) ve yıl (+45k) baskındır; ardından model, ağır hasar ve beygir gelir. Birkaç öznitelik (expert_risk_score, gb_fuel) negatif çıkar — gürültüdür ve elenir.',
        },
    },
    {
        id: 'final', n: '09', chart: 'folds',
        title: { en: 'Final Refined Model', tr: 'Final Rafine Model' },
        body: {
            en: 'The final CatBoost (1500 iterations) trains on the outlier-cleaned data with the LOFO-selected features. Across 5 folds it reaches 138,501 ₺ CV RMSE (±2,493), R² 0.9825 and MAE 103,333 ₺. The deployed model swaps the loss for MultiQuantile (0.05 / 0.5 / 0.95) to predict a price interval instead of a point.',
            tr: 'Final CatBoost (1500 iterasyon), aykırıdan temizlenmiş veri üzerinde LOFO ile seçilen özniteliklerle eğitilir. 5 katta 138.501 ₺ CV RMSE (±2.493), R² 0,9825 ve MAE 103.333 ₺’ye ulaşır. Yayınlanan model, tek nokta yerine fiyat aralığı tahmin etmek için kaybı MultiQuantile (0,05 / 0,5 / 0,95) ile değiştirir.',
        },
    },
];
