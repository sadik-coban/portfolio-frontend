"use client";
import { useState, useEffect } from 'react';
import { carService, ModelVersion } from '@/lib/services/car-service';
import {
    BrainCircuit,
    Info,
    Loader2,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    HelpCircle
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShapPage() {
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [loadingImage, setLoadingImage] = useState(false);
    const [imageError, setImageError] = useState(false);

    // 1. Fetch Versions
    useEffect(() => {
        carService.getVersions().then(data => {
            setVersions(data);
            if (data.length > 0) {
                // Select the most recent version
                setSelectedVersion(data[0].version_id);
            }
        });
    }, []);

    // 2. Set loading state when version changes
    useEffect(() => {
        if (selectedVersion) {
            setLoadingImage(true);
            setImageError(false);
        }
    }, [selectedVersion]);

    // Image URL
    const shapImageUrl = selectedVersion
        ? `http://localhost:8000/api/shap/${selectedVersion}`
        : '';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

            {/* --- HEADER & BREADCRUMB --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Projects</span>
                        <ChevronRight size={14} />
                        <span className="font-semibold text-slate-900 dark:text-slate-200">Car Price</span>
                        <ChevronRight size={14} />
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Model Explainability</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <BrainCircuit className="text-purple-600" size={32} />
                        SHAP Analysis
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Visualize how the AI model makes price predictions and which features increase or decrease the value.
                    </p>
                </div>

                {/* VERSION SELECTOR */}
                <div className="w-full md:w-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Model Version</label>
                    <Select
                        value={selectedVersion}
                        onValueChange={setSelectedVersion}
                        disabled={versions.length === 0}
                    >
                        <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT SIDE: SHAP CHART --- */}
                <div className="lg:col-span-8">
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle>Global Feature Importance</CardTitle>
                            <CardDescription>
                                Summary plot for the selected model version ({selectedVersion}).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full min-h-[500px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-4">

                                {/* Loading Spinner */}
                                {loadingImage && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 backdrop-blur-sm transition-all">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xl">
                                            <Loader2 className="animate-spin text-purple-600" size={40} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500 mt-4 animate-pulse">Analyzing Chart...</span>
                                    </div>
                                )}

                                {/* Error State */}
                                {imageError && !loadingImage && (
                                    <div className="text-center space-y-3">
                                        <div className="inline-flex p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
                                            <Info size={32} />
                                        </div>
                                        <h3 className="font-bold text-slate-700 dark:text-slate-300">Chart Not Found</h3>
                                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                            A SHAP summary has not been generated for this model version, or the server is unreachable.
                                        </p>
                                    </div>
                                )}

                                {/* Image */}
                                {selectedVersion && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={shapImageUrl}
                                        alt="SHAP Summary"
                                        className={`max-w-full h-auto object-contain transition-opacity duration-700 ${loadingImage ? 'opacity-0' : 'opacity-100'}`}
                                        onLoad={() => setLoadingImage(false)}
                                        onError={() => {
                                            setLoadingImage(false);
                                            setImageError(true);
                                        }}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT SIDE: HOW TO READ? (GUIDE) --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Quick Tip Card */}
                    <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-purple-900 dark:text-purple-100 flex items-center gap-2">
                                <HelpCircle size={18} /> How to Read This Chart?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-purple-800 dark:text-purple-200 space-y-3">
                            <p>
                                This chart ("Beeswarm Plot") shows the impact of each feature on the price.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0" />
                                    <span><strong>Horizontal Axis:</strong> Impact magnitude. Moving right increases price (+), moving left decreases it (-).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                    <span><strong>Red Dots:</strong> Represent a high value for that feature (e.g., High Horsepower).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                    <span><strong>Blue Dots:</strong> Represent a low value for that feature (e.g., Low Mileage).</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Common Examples */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white px-1">Example Scenarios</h3>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg shrink-0">
                                <ArrowDownRight size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Mileage (KM)</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Usually, red dots (High KM) cluster on the left side of the <strong>KM row</strong>. This indicates that high mileage decreases the price.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg shrink-0">
                                <ArrowUpRight size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Engine Power (HP)</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Red dots (High HP) are typically on the right side. A powerful engine drives the price up.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                            {/* Icon Box: Gray color (referencing the chart color) */}
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shrink-0">
                                <Info size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Brand & Model Impact</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Since brand names don't have a numerical magnitude, these dots appear <strong>gray</strong>.
                                    Look at the <strong>position</strong>, not the color: Gray dots on the right represent brands that increase value (Premium), while those on the left decrease it.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}