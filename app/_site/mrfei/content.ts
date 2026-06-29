// Case-study content for the modified Retail Food Environment Index (mRFEI).
// Figures are illustrative of the methodology (no proprietary dataset shipped).
import type { Lang } from '../i18n';

type Bi = Record<Lang, string>;

export const MRFEI_META = {
    domain: 'Statistical · Geospatial',
    title: 'Retail Food Environment Index',
    stack: 'pandas · scipy · GeoPandas · scikit-learn',
    lead: {
        en: 'A statistical and geospatial study of food-access inequality. The defining decision was methodological restraint — rigorous 95% confidence intervals, and a deliberate choice not to force a machine-learning model where it wasn’t warranted.',
        tr: 'Gıdaya erişim eşitsizliğinin istatistiksel ve mekânsal incelemesi. Belirleyici karar yöntemsel özdenetimdi — titiz %95 güven aralıkları ve gereksiz yere bir makine öğrenmesi modeli zorlamama tercihi.',
    } as Bi,
};

export const MRFEI_METRICS: { value: string; label: Bi; accent?: boolean }[] = [
    { value: '95% CI', label: { en: 'Inference methodology', tr: 'Çıkarım metodolojisi' }, accent: true },
    { value: '½ mile', label: { en: 'Tract buffer (1 mi rural)', tr: 'Mahalle tampon alanı (kırsal 1 mi)' } },
    { value: '0–100', label: { en: 'Index range', tr: 'İndeks aralığı' } },
    { value: 'no ML', label: { en: 'Where unwarranted', tr: 'Gereksiz olduğu yerde' } },
];

export interface Section { id: string; title: Bi; body: Bi }

export const MRFEI_SECTIONS: Section[] = [
    {
        id: 'question',
        title: { en: 'The question', tr: 'Soru' },
        body: {
            en: 'Does a neighbourhood actually let its residents buy fresh food? “Food deserts” are usually discussed anecdotally; the mRFEI turns the question into a measurable ratio so that access inequality can be compared across thousands of census tracts on the same scale.',
            tr: 'Bir mahalle gerçekten sakinlerine taze gıda alma imkânı sunuyor mu? “Gıda çölleri” genelde anekdotlarla konuşulur; mRFEI bu soruyu ölçülebilir bir orana çevirir, böylece erişim eşitsizliği binlerce mahallede aynı ölçekte karşılaştırılabilir.',
        },
    },
    {
        id: 'method',
        title: { en: 'How the index is built', tr: 'İndeks nasıl kuruluyor' },
        body: {
            en: 'For every census tract, retailers within a ½-mile buffer (1 mile in rural tracts) are classified as healthy (supermarkets, supercenters, large grocers, produce markets) or less-healthy (fast food, convenience stores, small grocers). The mRFEI is the share of healthy outlets among all food outlets. A value of 0 means no healthy retailer is reachable — the strongest food-desert signal.',
            tr: 'Her mahalle için ½-millik tampon alanı (kırsalda 1 mil) içindeki perakendeciler sağlıklı (süpermarket, hipermarket, büyük market, manav) veya az-sağlıklı (fast food, büfe, küçük market) olarak sınıflanır. mRFEI, tüm gıda noktaları içinde sağlıklı olanların payıdır. 0 değeri, ulaşılabilir hiçbir sağlıklı perakendeci olmadığı anlamına gelir — en güçlü gıda-çölü sinyali.',
        },
    },
    {
        id: 'restraint',
        title: { en: 'Restraint over prediction', tr: 'Tahmin yerine özdenetim' },
        body: {
            en: 'The dataset begged for a flashy model, but the honest deliverable was inference, not prediction. Each area-type estimate ships with a 95% confidence interval from a non-parametric bootstrap, so a difference is only called real when the intervals don’t overlap. Forcing a black-box regressor here would have added accuracy theatre without answering the actual policy question.',
            tr: 'Veri seti gösterişli bir model için elverişliydi, ama dürüst çıktı tahmin değil çıkarımdı. Her alan-tipi tahmini, parametrik olmayan bir bootstrap’tan gelen %95 güven aralığıyla sunulur; bir fark, ancak aralıklar örtüşmediğinde gerçek sayılır. Burada bir kara-kutu regresör zorlamak, asıl politika sorusunu yanıtlamadan “doğruluk tiyatrosu” eklerdi.',
        },
    },
    {
        id: 'findings',
        title: { en: 'What the map shows', tr: 'Haritanın gösterdiği' },
        body: {
            en: 'Access falls off sharply outside dense urban cores. A large mass of tracts score 0, and the gap between urban and rural means is statistically clear — the rural interval sits entirely below the urban one. The geography of low access tracks lower-income tracts more than population density alone.',
            tr: 'Erişim, yoğun kentsel çekirdeklerin dışında keskin biçimde düşüyor. Mahallelerin büyük bir kısmı 0 alıyor ve kentsel ile kırsal ortalamalar arasındaki fark istatistiksel olarak net — kırsal aralık tamamen kentselin altında kalıyor. Düşük erişimin coğrafyası, tek başına nüfus yoğunluğundan çok düşük gelirli mahallelerle örtüşüyor.',
        },
    },
];

// --- illustrative chart data ---
export const MRFEI_DIST = {
    labels: ['0', '1–5', '6–10', '11–15', '16–20', '21–25', '26+'],
    counts: [3120, 1860, 2240, 1680, 1020, 540, 280],
};

export const MRFEI_AREA = {
    types: ['Urban', 'Suburban', 'Rural'],
    mean: [12.4, 9.1, 4.7],
    ciLow: [11.6, 8.2, 3.6],
    ciHigh: [13.2, 10.0, 5.8],
};
