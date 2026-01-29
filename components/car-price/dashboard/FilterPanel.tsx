"use client";
import React, { useState, useEffect } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Type importunu kendi projenizdeki yola göre ayarlayın
import { DashboardFilters } from '@/lib/services/car-service';

interface FilterPanelProps {
    initialFilters: DashboardFilters; // Başlangıç değerleri
    allBrands: string[];
    allSeries: string[];
    onApply: (filters: DashboardFilters) => void; // Parent'a veriyi gönderen fonk.
    onBrandChange: (brand: string) => void;
    loadingSeries?: boolean;
}

export default function FilterPanel({
    initialFilters,
    allBrands,
    allSeries,
    onApply,
    onBrandChange,
    loadingSeries = false
}: FilterPanelProps) {

    // ÇÖZÜM: State'i buraya, alt bileşene taşıdık.
    // Artık inputlara yazılanlar sadece bu bileşeni render eder.
    const [localFilters, setLocalFilters] = useState<DashboardFilters>(initialFilters);

    // Eğer parent'tan gelen initialFilters değişirse (örn: sayfa sıfırlanırsa) senkronize et
    useEffect(() => {
        setLocalFilters(initialFilters);
    }, [initialFilters]);

    const handleChange = (key: string, value: string) => {
        if (key === 'brand') {
            // Marka değiştiğinde seriyi sıfırla ve local state'i güncelle
            setLocalFilters((prev) => ({ ...prev, brand: value, series: 'Tümü' }));
            // Parent'a haber ver ki yeni serileri çekebilsin
            onBrandChange(value);
        } else {
            // Diğer inputlar (text, number) sadece local state'i günceller
            setLocalFilters((prev) => ({ ...prev, [key]: value }));
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-5 text-slate-900 dark:text-white font-bold text-lg">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                    <Filter size={20} />
                </div>
                Filter Options
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                {/* BRAND SELECT */}
                <div className="lg:col-span-3 space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</Label>
                    <Select
                        value={localFilters.brand}
                        onValueChange={(val) => handleChange('brand', val)}
                    >
                        <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500">
                            <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Tümü" className="font-semibold">All Brands</SelectItem>
                            {allBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* SERIES SELECT */}
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Series</Label>
                        {loadingSeries && <Loader2 size={12} className="animate-spin text-blue-600" />}
                    </div>
                    <Select
                        value={localFilters.series}
                        onValueChange={(val) => handleChange('series', val)}
                        disabled={!allSeries.length || localFilters.brand === 'Tümü' || loadingSeries}
                    >
                        <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500">
                            <SelectValue placeholder={loadingSeries ? "Loading..." : "Select Series"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Tümü" className="font-semibold">All Series</SelectItem>
                            {allSeries.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* INPUTS (Year, Price, KM) */}
                <div className="lg:col-span-4 grid grid-cols-3 gap-4">
                    {['Year', 'Price', 'KM'].map((label) => (
                        <div key={label} className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block truncate">{label}</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    className="h-11 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                                    // TypeScript hatası almamak için any cast veya keyof kullanabilirsiniz
                                    value={(localFilters as any)[`min_${label.toLowerCase()}`] || ''}
                                    onChange={(e) => handleChange(`min_${label.toLowerCase()}`, e.target.value)}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    className="h-11 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                                    value={(localFilters as any)[`max_${label.toLowerCase()}`] || ''}
                                    onChange={(e) => handleChange(`max_${label.toLowerCase()}`, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* APPLY BUTTON */}
                <div className="lg:col-span-2">
                    <Button
                        onClick={() => onApply(localFilters)}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        Apply Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}