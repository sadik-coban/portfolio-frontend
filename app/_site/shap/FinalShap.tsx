"use client";

import { useState, useEffect } from 'react';
import { Loader2, Info, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

// The 3 model variants' SHAP beeswarm summaries, served as static assets
// (public/shap/*.png from shap_plots.zip). Language-agnostic technical labels.
const MODELS = [
    { key: 'lightgbm', label: 'LightGBM · TF-IDF+SVD', img: '/shap/shap_lightgbm.png', best: true },
    { key: 'catboost_svd', label: 'CatBoost · TF-IDF+SVD', img: '/shap/shap_catboost_svd.png', best: false },
    { key: 'catboost_native', label: 'CatBoost · native', img: '/shap/shap_catboost_native.png', best: false },
];

export default function FinalShap() {
    const { t } = useLang();
    const [selectedKey, setSelectedKey] = useState('lightgbm');
    const [loadingImage, setLoadingImage] = useState(true);
    const [imageError, setImageError] = useState(false);
    const model = MODELS.find((m) => m.key === selectedKey) || MODELS[0];

    // Preload via a JS Image() so onload fires even for a cached image. A bare <img>
    // onLoad can miss a cache hit (the browser finishes before React attaches the
    // handler), leaving the loader stuck on "Analyzing…" until you switch models.
    useEffect(() => {
        setImageError(false);
        setLoadingImage(true);
        const im = new Image();
        im.onload = () => setLoadingImage(false);
        im.onerror = () => { setLoadingImage(false); setImageError(true); };
        im.src = model.img;
        return () => { im.onload = null; im.onerror = null; };
    }, [selectedKey, model.img]);

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
                {/* chart */}
                <div className="lg:col-span-8">
                    <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-5 h-full shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <h3 className="font-semibold text-[#1a1a1a] mb-1">{t('shap.global')}</h3>
                        <p className="text-sm text-[#5f5f5a] mb-4">{t('shap.summaryFor')} · {model.label}</p>
                        <div className="relative w-full min-h-[480px] bg-[#f3f1ec] rounded-[12px] border border-dashed border-[#e4e2dd] flex items-center justify-center overflow-hidden p-4">
                            {loadingImage && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfcf9]/80 z-10 backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-[#047857]" size={36} />
                                    <span className="text-sm text-[#86857e] mt-3">{t('shap.analyzing')}</span>
                                </div>
                            )}
                            {imageError && !loadingImage && (
                                <div className="text-center space-y-2">
                                    <div className="inline-flex p-3 bg-[#ef4444]/10 text-[#ef4444] rounded-full"><Info size={28} /></div>
                                    <h4 className="font-semibold text-[#1a1a1a]">{t('shap.notFound')}</h4>
                                    <p className="text-sm text-[#86857e] max-w-xs mx-auto">{t('shap.notFoundDesc')}</p>
                                </div>
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={model.key}
                                src={model.img}
                                alt={`SHAP summary — ${model.label}`}
                                className={`max-w-full h-auto object-contain transition-opacity duration-500 ${loadingImage ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setLoadingImage(false)}
                                onError={() => { setLoadingImage(false); setImageError(true); }}
                            />
                        </div>
                    </div>
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
