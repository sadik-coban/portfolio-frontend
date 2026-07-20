"use client";

import { useState } from 'react';
import { Info, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

// The 3 model variants' SHAP plots, served as static images (public/shap/*.png,
// copied from site_pipeline/full_data/shap_plots/). Two views per model: the grouped
// mean-|SHAP| bar (global importance) and the beeswarm (per-listing value spread).
// Language-agnostic technical labels.
const MODELS = [
    { key: 'lightgbm', label: 'LightGBM · TF-IDF+SVD', bar: '/shap/shap_lightgbm.png', bee: '/shap/beeswarm_lightgbm.png', best: true },
    { key: 'catboost_svd', label: 'CatBoost · TF-IDF+SVD', bar: '/shap/shap_catboost_svd.png', bee: '/shap/beeswarm_catboost_svd.png', best: false },
    { key: 'catboost_native', label: 'CatBoost · native', bar: '/shap/shap_catboost_native.png', bee: '/shap/beeswarm_catboost_native.png', best: false },
];

export default function FinalShap() {
    const { t, lang } = useLang();
    const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);
    const [selectedKey, setSelectedKey] = useState('lightgbm');
    const model = MODELS.find((m) => m.key === selectedKey) || MODELS[0];

    const plots = [
        { src: model.bar, title: L('Özet önem (ortalama |SHAP|)', 'Summary importance (mean |SHAP|)'), sub: L('Her özniteliğin fiyata ortalama katkısı — büyük = güçlü sürücü.', 'Each feature’s average contribution to price — larger = stronger driver.') },
        { src: model.bee, title: L('Beeswarm (değer dağılımı)', 'Beeswarm (value spread)'), sub: L('Her nokta bir ilan; renk = öznitelik değeri (kırmızı yüksek), yatay = fiyat etkisi (sağ = artırıyor).', 'Each dot is a listing; colour = feature value (red high), horizontal = price impact (right = pushes up).') },
    ];

    const examples = [
        { icon: ArrowDownRight, color: 'text-[#ef4444] bg-[#ef4444]/10', title: t('shap.exKm'), desc: t('shap.exKmDesc') },
        { icon: ArrowUpRight, color: 'text-[#047857] bg-emerald-500/10', title: t('shap.exHp'), desc: t('shap.exHpDesc') },
        { icon: Info, color: 'text-[#5f5f5a] bg-[#f3f1ec]', title: t('shap.exBrand'), desc: t('shap.exBrandDesc') },
    ];

    return (
        <FinalShell active="shap" kicker={t('shap.kicker')} title={t('shap.title')}>
            <p className="text-[#5f5f5a] max-w-2xl mb-4">{t('shap.desc')}</p>
            {/* 3-model selector */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-[#86857e] mr-1">Model</span>
                {MODELS.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedKey(m.key)}
                        className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[13px] font-medium transition-colors ${selectedKey === m.key ? 'bg-[#047857] text-white' : 'border border-[#d8d6d0] bg-[#fdfcf9] text-[#5f5f5a] hover:border-[#86857e]'}`}
                    >
                        {m.label}{m.best && <span className={selectedKey === m.key ? 'text-[#a7e8cf]' : 'text-[#047857]'}>★</span>}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* plots — bar + beeswarm */}
                <div className="lg:col-span-8 space-y-6">
                    {plots.map((p) => (
                        <figure key={p.src} className="m-0 rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-5 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                            <figcaption className="mb-1">
                                <h3 className="font-semibold text-[#1a1a1a]">{p.title}</h3>
                                <p className="text-[13px] text-[#5f5f5a]">{p.sub} · {model.label}</p>
                            </figcaption>
                            <div className="mt-3 w-full overflow-hidden rounded-[12px] border border-[#ece9e3] bg-white p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={p.src}
                                    alt={`${p.title} — ${model.label}`}
                                    loading="lazy"
                                    className="mx-auto block h-auto w-full max-w-full object-contain"
                                />
                            </div>
                        </figure>
                    ))}
                    <p className="px-1 font-mono text-[12px] leading-[1.6] text-[#86857e]">
                        {L('SHAP tüm veri üzerinde hesaplandı (örnekleme yok). Grup SHAP = üye SHAP’ların işaretli toplamı, sonra ortalama-mutlak. Metnin (model+seri dışı) katkısı ihmal edilebilir — “metin fiyata ~0 ekler”.', 'SHAP computed on all data (no sampling). Group SHAP = signed sum of member SHAPs, then mean-absolute. Free text (beyond model+series) contributes ~nothing — “text adds ~0 to price”.')}
                    </p>
                </div>

                {/* guide */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="rounded-[14px] border border-[#cfe8dc] bg-[#f1f8f4] p-5">
                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-[#047857]">
                            <HelpCircle size={18} /> {t('shap.howTitle')}
                        </h4>
                        <ul className="space-y-2.5 text-sm text-[#33332f]">
                            {['shap.how1', 'shap.how2', 'shap.how3'].map((k, i) => (
                                <li key={k} className="flex items-start gap-2">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-[#86857e]' : i === 1 ? 'bg-[#ef4444]' : 'bg-[#059669]'}`} />
                                    <span>{t(k)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h3 className="font-semibold text-[#1a1a1a] px-1">{t('shap.examples')}</h3>
                    {examples.map((ex) => (
                        <div key={ex.title} className="rounded-[12px] border border-[#e4e2dd] bg-[#fdfcf9] p-4 flex gap-3 items-start">
                            <div className={`p-2 rounded-lg shrink-0 ${ex.color}`}><ex.icon size={18} /></div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#1a1a1a]">{ex.title}</h4>
                                <p className="text-xs text-[#86857e] mt-1 leading-relaxed">{ex.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </FinalShell>
    );
}
