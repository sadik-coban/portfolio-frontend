"use client";

import { useState, useEffect } from 'react';
import { carService, ModelVersion } from '@/lib/services/car-service';
import { Loader2, Info, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

// Trim stray whitespace + trailing slash so `${BASE}/api/shap/..` never doubles the slash.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');

export default function FinalShap() {
    const { t } = useLang();
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [loadingImage, setLoadingImage] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        carService.getVersions().then((data) => {
            setVersions(data);
            if (data.length > 0) setSelectedVersion(data[0].version_id);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedVersion) { setLoadingImage(true); setImageError(false); }
    }, [selectedVersion]);

    const shapImageUrl = selectedVersion ? `${API_BASE_URL}/api/shap/${selectedVersion}` : '';

    const examples = [
        { icon: ArrowDownRight, color: 'text-[#ef4444] bg-[#ef4444]/10', title: t('shap.exKm'), desc: t('shap.exKmDesc') },
        { icon: ArrowUpRight, color: 'text-[#047857] bg-emerald-500/10', title: t('shap.exHp'), desc: t('shap.exHpDesc') },
        { icon: Info, color: 'text-[#5f5f5a] bg-[#f3f1ec]', title: t('shap.exBrand'), desc: t('shap.exBrandDesc') },
    ];

    return (
        <FinalShell active="shap" kicker={t('shap.kicker')} title={t('shap.title')}>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <p className="text-[#5f5f5a] max-w-2xl">{t('shap.desc')}</p>
                <div className="w-full sm:w-[200px]">
                    <label className="text-xs font-medium text-[#86857e] mb-1 block">{t('pr.version')}</label>
                    <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={versions.length === 0}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                        <SelectContent>
                            {versions.map((v) => (
                                <SelectItem key={v.version_id} value={v.version_id}>
                                    {v.version_id.toUpperCase()} <span className="text-[#86857e] text-xs ml-2">({v.date})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* chart */}
                <div className="lg:col-span-8">
                    <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-5 h-full shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <h3 className="font-semibold text-[#1a1a1a] mb-1">{t('shap.global')}</h3>
                        <p className="text-sm text-[#5f5f5a] mb-4">{t('shap.summaryFor')} ({selectedVersion || '—'})</p>
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
                            {selectedVersion && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={shapImageUrl}
                                    alt="SHAP Summary"
                                    className={`max-w-full h-auto object-contain transition-opacity duration-500 ${loadingImage ? 'opacity-0' : 'opacity-100'}`}
                                    onLoad={() => setLoadingImage(false)}
                                    onError={() => { setLoadingImage(false); setImageError(true); }}
                                />
                            )}
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
