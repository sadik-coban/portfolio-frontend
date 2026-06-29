"use client";

import { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, AlertTriangle, CheckCircle2, Loader2, ServerCrash, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { carService, ModelVersion } from '@/lib/services/car-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinalShell from '../FinalShell';
import { useLang } from '../i18n';

export default function FinalDrift() {
    const { t } = useLang();
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(true);
    const [versionError, setVersionError] = useState<string | null>(null);
    const [referenceVer, setReferenceVer] = useState('');
    const [currentVer, setCurrentVer] = useState('');
    const [driftResults, setDriftResults] = useState<any[] | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const fetchVersions = async () => {
        setLoadingVersions(true); setVersionError(null);
        try {
            const data = await carService.getVersions();
            if (data.length > 0) {
                setVersions(data);
                setReferenceVer(data.length > 1 ? data[1].version_id : data[0].version_id);
                setCurrentVer(data[0].version_id);
            } else setVersionError(t('dr.errVersions'));
        } catch { setVersionError(t('dr.errVersions')); }
        finally { setLoadingVersions(false); }
    };
    useEffect(() => { fetchVersions(); /* eslint-disable-next-line */ }, []);

    const runAnalysis = async () => {
        if (!referenceVer || !currentVer) return;
        if (referenceVer === currentVer) { setAnalysisError(t('dr.errSame')); return; }
        setAnalyzing(true); setDriftResults(null); setAnalysisError(null);
        try {
            setDriftResults(await carService.getDriftAnalysis(referenceVer, currentVer));
        } catch { setAnalysisError(t('dr.errFail')); }
        finally { setAnalyzing(false); }
    };

    const needlePos = (item: any) =>
        item.normalized_emd !== undefined ? Math.min(item.normalized_emd * 200, 98) : item.drift_detected ? 85 : 15;

    const verItem = (v: ModelVersion) => (
        <SelectItem key={v.version_id} value={v.version_id}>
            {v.version_id.toUpperCase()} <span className="text-slate-400 text-xs ml-2">({v.date})</span>
        </SelectItem>
    );

    return (
        <FinalShell active="drift" kicker={t('dr.desc')} title={t('dr.title')}>
            {loadingVersions ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                    <Loader2 className="animate-spin text-emerald-600" size={36} />
                    <p className="text-sm">{t('dr.loadingVersions')}</p>
                </div>
            ) : versionError ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                    <ServerCrash size={48} className="text-rose-500" />
                    <p className="text-slate-500 max-w-md">{versionError}</p>
                    <button onClick={fetchVersions} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e4e2dd] text-sm text-[#5f5f5a] hover:border-[#047857]/50 transition-colors">
                        <RefreshCcw size={15} /> {t('dr.retry')}
                    </button>
                </div>
            ) : (
                <>
                    {/* control panel */}
                    <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                        <div className="flex flex-col lg:flex-row items-end gap-5">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#0d9aba]" /> {t('dr.ref')}</label>
                                <Select value={referenceVer} onValueChange={setReferenceVer}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                                    <SelectContent>{versions.map(verItem)}</SelectContent>
                                </Select>
                            </div>
                            <div className="hidden lg:flex pb-3 text-slate-300 dark:text-slate-600"><ArrowRight size={28} strokeWidth={1.5} /></div>
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> {t('dr.curr')}</label>
                                <Select value={currentVer} onValueChange={setCurrentVer}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder={t('pr.select')} /></SelectTrigger>
                                    <SelectContent>{versions.map(verItem)}</SelectContent>
                                </Select>
                            </div>
                            <button onClick={runAnalysis} disabled={analyzing} className="w-full lg:w-auto h-11 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors">
                                {analyzing ? <><Loader2 className="animate-spin" size={16} /> {t('dr.analyzing')}</> : <><GitCompare size={16} /> {t('dr.compare')}</>}
                            </button>
                        </div>
                        {analysisError && (
                            <div className="mt-4 p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-lg flex items-center gap-2">
                                <AlertTriangle size={16} /> {analysisError}
                            </div>
                        )}
                    </div>

                    {/* results */}
                    {driftResults && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {driftResults.map((item: any) => {
                                const isDrift = item.drift_detected;
                                return (
                                    <div key={item.feature} className={`rounded-[14px] border bg-[#fdfcf9] p-5 shadow-[0_1px_3px_rgba(40,40,30,0.05)] ${isDrift ? 'border-[#ef4444]/45' : 'border-[#e4e2dd]'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold capitalize">{item.feature}</h3>
                                                <div className="text-xs text-slate-500 mt-1">KS p: <span className={item.p_value < 0.05 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>{item.p_value === 0 ? '< 0.001' : item.p_value.toFixed(5)}</span></div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${isDrift ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                                {isDrift ? <><AlertTriangle size={12} /> {t('dr.drift')}</> : <><CheckCircle2 size={12} /> {t('dr.stable')}</>}
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase mb-1.5">
                                                <span>{t('dr.stability')}</span>
                                                <span className={isDrift ? 'text-rose-500' : 'text-emerald-500'}>{item.emd_score?.toFixed(2)}</span>
                                            </div>
                                            <div className="relative h-2.5 w-full rounded-full overflow-hidden flex border border-[#e4e2dd]">
                                                <div className="h-full bg-[#059669]/35 w-[30%]" /><div className="h-full bg-[#e9e7e2] w-[20%]" /><div className="h-full bg-[#ef4444]/20 w-[20%]" /><div className="h-full bg-[#ef4444]/45 w-[30%]" />
                                                <div className="absolute top-0 bottom-0 w-1 bg-[#1a1a1a] z-10 transition-all duration-700" style={{ left: `${needlePos(item)}%` }} />
                                            </div>
                                        </div>
                                        <div className="h-36 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={item.chart_data}>
                                                    <defs>
                                                        <linearGradient id={`r${item.feature}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9aba" stopOpacity={0.4} /><stop offset="95%" stopColor="#0d9aba" stopOpacity={0} /></linearGradient>
                                                        <linearGradient id={`c${item.feature}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e08a1e" stopOpacity={0.4} /><stop offset="95%" stopColor="#e08a1e" stopOpacity={0} /></linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcd9d2" opacity={0.8} />
                                                    <XAxis dataKey="bin" hide />
                                                    <Tooltip contentStyle={{ background: '#fdfcf9', border: '1px solid #e4e2dd', borderRadius: 10, fontSize: 12, color: '#1a1a1a', boxShadow: '0 4px 14px rgba(40,40,30,0.10)' }} formatter={(v: any) => v.toFixed(4)} />
                                                    <Area type="monotone" dataKey="ref_density" stroke="#0d9aba" strokeWidth={2} fill={`url(#r${item.feature})`} />
                                                    <Area type="monotone" dataKey="curr_density" stroke="#e08a1e" strokeWidth={2} fill={`url(#c${item.feature})`} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-center gap-5 mt-3 text-[10px] font-medium uppercase text-slate-400 tracking-wider">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0d9aba]" /> {t('dr.oldData')}</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {t('dr.newData')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </FinalShell>
    );
}
