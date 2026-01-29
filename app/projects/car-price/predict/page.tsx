"use client";
import React, { useState, useEffect } from 'react';
import { Calculator, Zap, Award, AlertTriangle, Car, Loader2, RefreshCw, PenLine, ListFilter, ChevronRight } from 'lucide-react';
import { carService } from '@/lib/services/car-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PredictionPage() {
    // --- BASIC STATES ---
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // --- DROPDOWN DATA & LOADING STATES ---
    const [brands, setBrands] = useState<string[]>([]);
    const [series, setSeries] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);

    // New loading states for dependent dropdowns
    const [isLoadingSeries, setIsLoadingSeries] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Model manual entry mode
    const [isCustomModel, setIsCustomModel] = useState(false);

    // --- FORM DATA ---
    const [formData, setFormData] = useState({
        brand: '', series: '', model: '',
        year: 2020, mileage: 50000,
        transmission: 'Automatic', fuel: 'Gasoline', body_type: 'Sedan',
        engine_cc_val: 1598, power_hp_val: 170, torque_nm: 250, cylinder_count: 4,
        kb_drivetrain: 'RWD', segment_clean: 'D Segment',
        gb_warranty_status: 'No Warranty', is_heavy_damaged: 0
    });

    const [damageData, setDamageData] = useState({
        roof_status: 'Original', hood_status: 'Original', trunk_status: 'Original',
        doors_changed: 0, doors_painted: 0, doors_local: 0,
        fenders_changed: 0, fenders_painted: 0, fenders_local: 0
    });

    // --- DATA LOADING ---
    useEffect(() => {
        carService.getBrands().then(setBrands);
    }, []);

    // Load Series when Brand changes
    useEffect(() => {
        setSeries([]); // Clear previous series
        setModels([]); // Clear previous models
        setFormData(prev => ({ ...prev, series: '', model: '' })); // Reset selections

        if (formData.brand) {
            setIsLoadingSeries(true); // Lock Series dropdown
            carService.getSeriesByBrand(formData.brand)
                .then(res => {
                    setSeries(res);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoadingSeries(false)); // Unlock
        }
    }, [formData.brand]);

    // Load Models when Series changes
    useEffect(() => {
        setModels([]); // Clear previous models
        setFormData(prev => ({ ...prev, model: '' })); // Reset model selection

        if (formData.brand && formData.series) {
            setIsLoadingModels(true); // Lock Model dropdown
            carService.getModelsBySeries(formData.brand, formData.series)
                .then(res => {
                    setModels(res);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoadingModels(false)); // Unlock
        }
    }, [formData.series]);


    // --- HANDLERS ---
    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setResultData(null);

        if (!formData.brand || !formData.series || !formData.model) {
            setError("Please complete Brand, Series, and Model selections.");
            setLoading(false);
            return;
        }

        try {
            const payload = { ...formData, damage_details: damageData };
            const res = await carService.predictPrice(payload);
            setResultData(res);
        } catch (err) {
            console.error(err);
            setError("Prediction failed. Check service connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleDamageChange = (key: string, value: string | number) => {
        setDamageData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

            {/* LEFT COLUMN: INPUT FORM */}
            <div className="lg:col-span-8 space-y-8">

                {/* --- BREADCRUMB ---
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-[-20px]">
                    <span>Projects</span>
                    <ChevronRight size={14} />
                    <span className="font-semibold text-slate-900 dark:text-slate-200">Car Price</span>
                    <ChevronRight size={14} />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Prediction</span>
                </div> */}

                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                            <Calculator size={28} />
                        </div>
                        AI Price Estimator
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg leading-relaxed max-w-2xl">
                        Find out the true market value with AI support by entering detailed vehicle features and appraisal status.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">

                    {/* SECTION 1: VEHICLE ID */}
                    <SectionTitle title="Vehicle Identity" icon={Car} />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

                        {/* BRAND */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Brand</Label>
                            <Select value={formData.brand} onValueChange={(val) => setFormData({ ...formData, brand: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 text-base rounded-xl px-4">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* SERIES */}
                        <div className="space-y-2.5 w-full">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Series</Label>
                                {isLoadingSeries && <Loader2 size={14} className="animate-spin text-blue-600" />}
                            </div>
                            <Select
                                value={formData.series}
                                onValueChange={(val) => setFormData({ ...formData, series: val })}
                                disabled={!formData.brand || isLoadingSeries} // Disable while loading
                            >
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 text-base rounded-xl px-4">
                                    <SelectValue placeholder={isLoadingSeries ? "Loading..." : "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {series.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* MODEL */}
                        <div className="space-y-2.5 w-full relative">
                            <div className="flex justify-between items-center h-6">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Model</Label>
                                    {isLoadingModels && <Loader2 size={14} className="animate-spin text-blue-600" />}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCustomModel(!isCustomModel)}
                                    disabled={!formData.series || isLoadingModels}
                                    className="h-7 px-3 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 rounded-lg transition-all disabled:opacity-50"
                                >
                                    {isCustomModel ? (
                                        <><ListFilter size={14} className="mr-1.5" /> Select from List</>
                                    ) : (
                                        <><PenLine size={14} className="mr-1.5" /> Manual Entry</>
                                    )}
                                </Button>
                            </div>

                            {isCustomModel ? (
                                <Input
                                    placeholder="Ex: 320i ED Sport Line"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    disabled={!formData.series || isLoadingModels}
                                    className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 text-base rounded-xl px-4"
                                    autoFocus
                                />
                            ) : (
                                <Select
                                    value={formData.model}
                                    onValueChange={(val) => setFormData({ ...formData, model: val })}
                                    disabled={!formData.series || isLoadingModels}
                                >
                                    <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 text-base rounded-xl px-4">
                                        <SelectValue placeholder={isLoadingModels ? "Loading..." : "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        <SelectItem value="Other" className="font-bold text-blue-600">Not Listed / Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* YEAR */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Year</Label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 text-base rounded-xl px-4"
                            />
                        </div>

                        {/* KM */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Mileage (KM)</Label>
                            <Input
                                type="number"
                                value={formData.mileage}
                                onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                                className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 text-base rounded-xl px-4"
                            />
                        </div>

                        {/* SEGMENT */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Segment</Label>
                            <Select value={formData.segment_clean} onValueChange={(val) => setFormData({ ...formData, segment_clean: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 text-base rounded-xl px-4">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["A Segment", "B Segment", "C Segment", "D Segment", "E Segment", "F Segment", "SUV"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SECTION 2: TECHNICAL DETAILS */}
                    <SectionTitle title="Technical Specifications" icon={Zap} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">

                        {/* FUEL */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Fuel</Label>
                            <Select value={formData.fuel} onValueChange={(val) => setFormData({ ...formData, fuel: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="LPG">LPG</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* TRANSMISSION */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Transmission</Label>
                            <Select value={formData.transmission} onValueChange={(val) => setFormData({ ...formData, transmission: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Automatic">Automatic</SelectItem>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                    <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* BODY TYPE (Yeni Eklendi) */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Body Type</Label>
                            <Select value={formData.body_type} onValueChange={(val) => setFormData({ ...formData, body_type: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sedan">Sedan</SelectItem>
                                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                                    <SelectItem value="Station Wagon">Station Wagon</SelectItem>
                                    <SelectItem value="Coupe">Coupe</SelectItem>
                                    <SelectItem value="Cabrio">Cabrio</SelectItem> {/* Convertible yerine Cabrio */}
                                    <SelectItem value="SUV">SUV</SelectItem>
                                    <SelectItem value="MPV">MPV</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* DRIVETRAIN (Yeni Eklendi) */}
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Drivetrain</Label>
                            <Select value={formData.kb_drivetrain} onValueChange={(val) => setFormData({ ...formData, kb_drivetrain: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FWD">FWD (Front)</SelectItem>
                                    <SelectItem value="RWD">RWD (Rear)</SelectItem>
                                    <SelectItem value="4WD">4WD</SelectItem>
                                    <SelectItem value="AWD">AWD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Power (HP)</Label>
                            <Input type="number" className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base" value={formData.power_hp_val} onChange={(e) => setFormData({ ...formData, power_hp_val: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2.5 w-full">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Engine (cc)</Label>
                            <Input type="number" className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base" value={formData.engine_cc_val} onChange={(e) => setFormData({ ...formData, engine_cc_val: Number(e.target.value) })} />
                        </div>
                    </div>

                    {/* SECTION 3: DAMAGE & BODY CONDITION */}
                    <SectionTitle title="Damage & Body Condition" icon={AlertTriangle} color="text-orange-600 dark:text-orange-500" />
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 md:p-8 rounded-2xl border border-orange-100 dark:border-orange-900/40">

                        {/* ROOF - HOOD - TRUNK */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {['roof_status', 'hood_status', 'trunk_status'].map((field) => (
                                <div key={field} className="space-y-2.5 w-full">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        {field === 'roof_status' ? 'Roof' : field === 'hood_status' ? 'Hood' : 'Trunk'}
                                    </Label>
                                    <Select
                                        value={(damageData as any)[field]}
                                        onValueChange={(val) => handleDamageChange(field, val)}
                                    >
                                        <SelectTrigger className="w-full h-14 bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-800/60 focus:ring-orange-500 rounded-xl px-4 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Original">Original</SelectItem>
                                            <SelectItem value="Painted">Painted</SelectItem>
                                            <SelectItem value="Locally Painted">Locally Painted</SelectItem>
                                            <SelectItem value="Changed">Changed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-orange-200 dark:border-orange-800/40 my-8"></div>

                        {/* DOORS & FENDERS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Doors */}
                            <div>
                                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" /> Door Operations
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {['changed', 'painted', 'local'].map(type => (
                                        <div key={type} className="space-y-2 w-full">
                                            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wide text-center">
                                                {type === 'changed' ? 'Changed' : type === 'painted' ? 'Painted' : 'Local'}
                                            </Label>
                                            <Input
                                                type="number" min={0} max={4}
                                                className="w-full h-14 bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-800/60 text-center font-bold text-xl focus-visible:ring-orange-500 rounded-xl"
                                                value={(damageData as any)[`doors_${type}`]}
                                                onChange={(e) => handleDamageChange(`doors_${type}`, Number(e.target.value))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Fenders */}
                            <div>
                                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" /> Fender Operations
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {['changed', 'painted', 'local'].map(type => (
                                        <div key={type} className="space-y-2 w-full">
                                            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wide text-center">
                                                {type === 'changed' ? 'Changed' : type === 'painted' ? 'Painted' : 'Local'}
                                            </Label>
                                            <Input
                                                type="number" min={0} max={4}
                                                className="w-full h-14 bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-800/60 text-center font-bold text-xl focus-visible:ring-orange-500 rounded-xl"
                                                value={(damageData as any)[`fenders_${type}`]}
                                                onChange={(e) => handleDamageChange(`fenders_${type}`, Number(e.target.value))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WARRANTY & HEAVY DAMAGE */}
                    <div className="flex flex-col md:flex-row gap-6 mt-10">
                        <div className="flex-1 space-y-2.5">
                            <Label className="text-sm font-bold text-slate-600 dark:text-slate-300">Warranty Status</Label>
                            <Select value={formData.gb_warranty_status} onValueChange={(val) => setFormData({ ...formData, gb_warranty_status: val })}>
                                <SelectTrigger className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="No Warranty">No Warranty</SelectItem>
                                    <SelectItem value="Warranty Continues">Warranty Continues</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 flex items-end">
                            <div className={cn(
                                "w-full flex items-center justify-center gap-3 rounded-xl border cursor-pointer transition-all h-14 shadow-sm active:scale-[0.98]",
                                formData.is_heavy_damaged
                                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 ring-1 ring-red-500/20"
                                    : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                            )}
                                onClick={() => setFormData({ ...formData, is_heavy_damaged: formData.is_heavy_damaged ? 0 : 1 })}
                            >
                                <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center transition-colors", formData.is_heavy_damaged ? "bg-red-600 border-red-600" : "bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600")}>
                                    {formData.is_heavy_damaged === 1 && <div className="w-3 h-3 bg-white rounded-full" />}
                                </div>
                                <span className="text-base font-bold select-none">Heavy Damage Record</span>
                            </div>
                        </div>
                    </div>

                    {/* CALCULATE BUTTON */}
                    <Button
                        onClick={handlePredict}
                        disabled={loading}
                        className="w-full mt-12 h-16 text-xl font-black tracking-wide bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {loading ? <><Loader2 className="animate-spin mr-3 w-6 h-6" /> Calculating...</> : <><Zap className="mr-3 w-6 h-6 fill-current" /> CALCULATE VALUE</>}
                    </Button>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: RESULT CARD */}
            <div className="lg:col-span-4">
                <div className="sticky top-6 space-y-6">
                    {/* RESULT CARD */}
                    <div className={cn(
                        "bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-500",
                        resultData ? "opacity-100 translate-y-0" : "opacity-60 translate-y-4 grayscale"
                    )}>
                        {/* Decorative Background */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-3xl mb-6 shadow-inner">
                                <Award size={40} />
                            </div>

                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Estimated Market Value</h3>

                            {resultData ? (
                                <>
                                    <div className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                                        {resultData.price.toLocaleString('en-US')}
                                    </div>
                                    <span className="text-xl text-slate-400 font-medium block mb-8">Turkish Liras</span>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Minimum</span>
                                            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{resultData.price_range?.min?.toLocaleString()}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maximum</span>
                                            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{resultData.price_range?.max?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Risk Indicator */}
                                    <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left relative overflow-hidden">
                                        {/* Risk Background Gradient */}
                                        <div className={cn("absolute top-0 left-0 w-1.5 h-full",
                                            resultData.calculated_risk_score < 100 ? "bg-green-500" :
                                                resultData.calculated_risk_score < 300 ? "bg-yellow-500" : "bg-red-500"
                                        )} />

                                        <div className="flex justify-between items-center mb-3 pl-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                                <AlertTriangle size={14} /> Damage Score
                                            </span>
                                            <span className={cn("text-xs font-black px-2 py-1 rounded-md border",
                                                resultData.calculated_risk_score < 100 ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800" :
                                                    resultData.calculated_risk_score < 300 ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800" :
                                                        "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800"
                                            )}>
                                                {resultData.calculated_risk_score} / 500
                                            </span>
                                        </div>

                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3 pl-3">
                                            <div
                                                className={cn("h-full transition-all duration-1000 rounded-full",
                                                    resultData.calculated_risk_score < 100 ? "bg-green-500" :
                                                        resultData.calculated_risk_score < 300 ? "bg-yellow-500" : "bg-red-500"
                                                )}
                                                style={{ width: `${Math.min((resultData.calculated_risk_score / 500) * 100, 100)}%` }}
                                            />
                                        </div>

                                        <p className="text-xs text-slate-500 leading-relaxed pl-3">
                                            {resultData.calculated_risk_score < 100 ? "Vehicle is in clean condition. Estimated price range is reliable." :
                                                resultData.calculated_risk_score < 300 ? "Moderate damage present. Final price may vary based on buyer." :
                                                    "High damage risk detected. Price range may be wide."}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                    <Car size={32} className="opacity-20" />
                                    <span className="text-sm font-medium">Results will appear here</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Title Component
const SectionTitle = ({ title, icon: Icon, color = "text-slate-900 dark:text-white" }: any) => (
    <h3 className={`text-lg font-bold ${color} mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3`}>
        <Icon size={20} className="text-blue-600" /> {title}
    </h3>
);