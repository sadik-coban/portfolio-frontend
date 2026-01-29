"use client";
import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, FileDiff, AlertTriangle, CheckCircle2, Loader2, Info, ServerCrash, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { carService, ModelVersion } from '@/lib/services/car-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DriftPage() {
    // Version States
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(true); // Is page initially loading?
    const [versionError, setVersionError] = useState<string | null>(null); // Version fetch error

    // Selection States
    const [referenceVer, setReferenceVer] = useState<string>('');
    const [currentVer, setCurrentVer] = useState<string>('');

    // Analysis States
    const [driftResults, setDriftResults] = useState<any[] | null>(null);
    const [analyzing, setAnalyzing] = useState(false); // Is analyzing?
    const [analysisError, setAnalysisError] = useState<string | null>(null); // Analysis error

    // 1. Fetch Versions Function
    const fetchVersions = async () => {
        setLoadingVersions(true);
        setVersionError(null);
        try {
            const data = await carService.getVersions();
            if (data.length > 0) {
                setVersions(data);
                // Default: Reference = v2 (or oldest), Current = v1 (Newest)
                // Logic: Usually the newest model (index 0) is compared with the previous model (index 1).
                setReferenceVer(data.length > 1 ? data[1].version_id : data[0].version_id);
                setCurrentVer(data[0].version_id);
            } else {
                setVersionError("No model versions found in the system.");
            }
        } catch (err) {
            console.error("Version error:", err);
            setVersionError("Failed to fetch model versions from server. Backend service might be down.");
        } finally {
            setLoadingVersions(false);
        }
    };

    // Fetch on page load
    useEffect(() => {
        fetchVersions();
    }, []);

    // 2. Start Analysis
    const runAnalysis = async () => {
        if (!referenceVer || !currentVer) return;
        if (referenceVer === currentVer) {
            setAnalysisError("You must select different versions for comparison.");
            return;
        }

        setAnalyzing(true);
        setDriftResults(null);
        setAnalysisError(null);

        try {
            const results = await carService.getDriftAnalysis(referenceVer, currentVer);
            setDriftResults(results);
        } catch (err) {
            console.error(err);
            setAnalysisError("An error occurred during analysis. Datasets might be missing or server is not responding.");
        } finally {
            setAnalyzing(false);
        }
    };

    // Calculate Needle Position
    const calculateNeedlePosition = (item: any) => {
        if (item.normalized_emd !== undefined) {
            return Math.min(item.normalized_emd * 200, 98);
        }
        return item.drift_detected ? 85 : 15;
    };

    // --- CASE 1: Versions Loading ---
    if (loadingVersions) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-slate-500 animate-pulse">
                <Loader2 className="animate-spin text-purple-600" size={48} />
                <p className="text-lg font-medium">Loading Drift Page...</p>
            </div>
        );
    }

    // --- CASE 2: Version Fetch Error (No Backend) ---
    if (versionError) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-500">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 shadow-sm">
                    <ServerCrash size={64} />
                </div>
                <div className="space-y-2 max-w-md">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Connection Error
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {versionError}
                    </p>
                </div>
                <Button
                    onClick={fetchVersions}
                    variant="outline"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                    <RefreshCcw size={16} /> Retry
                </Button>
            </div>
        );
    }

    // --- CASE 3: Normal Flow ---
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/30">
                        <FileDiff size={28} />
                    </div>
                    Data Drift Analysis
                </h1>

                <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg leading-relaxed max-w-3xl">
                    Analyze training data distribution differences (Drift) between two model versions using statistical tests.
                </p>
            </div>

            {/* CONTROL PANEL */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-end gap-6">

                        {/* REFERENCE VERSION */}
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" /> Reference (Old)
                            </label>
                            <Select value={referenceVer} onValueChange={setReferenceVer}>
                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map(v => (
                                        <SelectItem key={v.version_id} value={v.version_id}>
                                            {v.version_id.toUpperCase()} <span className="text-slate-400 text-xs ml-2">({v.date})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="hidden lg:flex pb-3 text-slate-300">
                            <ArrowRight size={32} strokeWidth={1.5} />
                        </div>

                        {/* CURRENT VERSION */}
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" /> Current (New)
                            </label>
                            <Select value={currentVer} onValueChange={setCurrentVer}>
                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map(v => (
                                        <SelectItem key={v.version_id} value={v.version_id}>
                                            {v.version_id.toUpperCase()} <span className="text-slate-400 text-xs ml-2">({v.date})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ANALYZE BUTTON */}
                        <Button
                            onClick={runAnalysis}
                            disabled={analyzing || !referenceVer || !currentVer}
                            className="w-full lg:w-auto h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/25"
                        >
                            {analyzing ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><GitCompare className="mr-2" /> Compare</>}
                        </Button>
                    </div>

                    {analysisError && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                            <AlertTriangle size={16} /> {analysisError}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* RESULTS GRID */}
            {driftResults && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {driftResults.map((item: any) => {
                        const needlePos = calculateNeedlePosition(item);
                        const isDrift = item.drift_detected;

                        return (
                            <Card
                                key={item.feature}
                                className={cn(
                                    "border-2 overflow-hidden transition-all duration-300 hover:shadow-lg bg-white dark:bg-slate-900",
                                    isDrift ? "border-red-500/40 dark:border-red-500/30" : "border-green-500/40 dark:border-green-500/30"
                                )}
                            >
                                <CardContent className="p-5">

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize">{item.feature}</h3>
                                            <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                                                KS p-value:
                                                <span className={item.p_value < 0.05 ? "text-red-600 font-bold bg-red-50 px-1 rounded" : "text-green-600 font-bold"}>
                                                    {item.p_value === 0 ? "< 0.001" : item.p_value.toFixed(5)}
                                                </span>
                                            </div>
                                        </div>

                                        <Badge variant={isDrift ? "destructive" : "default"} className={cn(
                                            "uppercase tracking-wider font-bold",
                                            !isDrift && "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                        )}>
                                            {isDrift ? <><AlertTriangle size={12} className="mr-1" /> DRIFT</> : <><CheckCircle2 size={12} className="mr-1" /> STABLE</>}
                                        </Badge>
                                    </div>

                                    {/* Drift Score Bar (Needle) */}
                                    <div className="mb-6 relative group">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                            <span>Stability Score (EMD)</span>
                                            <span className={isDrift ? "text-red-500" : "text-green-500"}>
                                                {item.emd_score.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                                            <div className="h-full bg-emerald-500/30 w-[30%]" />
                                            <div className="h-full bg-yellow-500/30 w-[20%]" />
                                            <div className="h-full bg-orange-500/30 w-[20%]" />
                                            <div className="h-full bg-red-500/30 w-[30%]" />

                                            {/* Needle */}
                                            <div
                                                className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 transition-all duration-1000 ease-out"
                                                style={{ left: `${needlePos}%` }}
                                            />
                                        </div>

                                        {/* Tooltip for Needle */}
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                            Normalized Deviation: {item.normalized_emd?.toFixed(2)}σ
                                        </div>
                                    </div>

                                    {/* KDE Chart */}
                                    <div className="h-40 w-full bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800/50 pt-2 pr-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={item.chart_data}>
                                                <defs>
                                                    <linearGradient id={`gradRef${item.feature}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id={`gradCurr${item.feature}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                                <XAxis dataKey="bin" hide />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                                                    itemStyle={{ padding: 0 }}
                                                    formatter={(val: any) => val.toFixed(4)}
                                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                                />
                                                <Area type="monotone" dataKey="ref_density" stroke="#3b82f6" strokeWidth={2} fill={`url(#gradRef${item.feature})`} name="Old Data" />
                                                <Area type="monotone" dataKey="curr_density" stroke="#f97316" strokeWidth={2} fill={`url(#gradCurr${item.feature})`} name="New Data" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Old (Ref)</span>
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> New (Curr)</span>
                                    </div>

                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}