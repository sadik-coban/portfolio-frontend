"use client";

import { useState, useEffect } from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardFilters } from '@/lib/services/car-service';
import { useLang } from './i18n';

interface Props {
    initialFilters: DashboardFilters;
    allBrands: string[];
    allSeries: string[];
    onApply: (f: DashboardFilters) => void;
    onBrandChange: (brand: string) => void;
    loadingSeries?: boolean;
}

const FIELD = 'h-[38px] w-full rounded-[9px] border border-[#d8d6d0] bg-[#f7f6f3] px-[13px] font-mono text-[13px] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9a9a92] focus:border-[#047857]';
const LABEL = 'block font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#86857e]';

export default function FilterPanel({ initialFilters, allBrands, allSeries, onApply, onBrandChange, loadingSeries = false }: Props) {
    const { t } = useLang();
    const [f, setF] = useState<DashboardFilters>(initialFilters);
    useEffect(() => { setF(initialFilters); }, [initialFilters]);

    const change = (key: string, value: string) => {
        if (key === 'brand') {
            setF((p) => ({ ...p, brand: value, series: 'Tümü' }));
            onBrandChange(value);
        } else {
            setF((p) => ({ ...p, [key]: value }));
        }
    };

    const range = (key: 'year' | 'price' | 'km', label: string) => (
        <div className="col-span-2 lg:col-span-1 space-y-1.5">
            <label className={LABEL}>{label}</label>
            <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder={t('flt.min')} className={FIELD} value={(f as any)[`min_${key}`] || ''} onChange={(e) => change(`min_${key}`, e.target.value)} />
                <input type="number" placeholder={t('flt.max')} className={FIELD} value={(f as any)[`max_${key}`] || ''} onChange={(e) => change(`max_${key}`, e.target.value)} />
            </div>
        </div>
    );

    return (
        <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-[22px] shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
            <div className="mb-[18px] flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a]">
                <SlidersHorizontal size={15} className="text-[#047857]" />
                {t('flt.title')}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                {/* brand */}
                <div className="space-y-1.5">
                    <label className={LABEL}>{t('flt.brand')}</label>
                    <Select value={f.brand} onValueChange={(v) => change('brand', v)}>
                        <SelectTrigger className="h-[38px] bg-[#f7f6f3] border-[#d8d6d0] rounded-[9px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Tümü">{t('flt.all')}</SelectItem>
                            {allBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* series */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <label className={LABEL}>{t('flt.series')}</label>
                        {loadingSeries && <Loader2 size={12} className="animate-spin text-[#047857]" />}
                    </div>
                    <Select value={f.series} onValueChange={(v) => change('series', v)} disabled={!allSeries.length || f.brand === 'Tümü' || loadingSeries}>
                        <SelectTrigger className="h-[38px] bg-[#f7f6f3] border-[#d8d6d0] rounded-[9px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Tümü">{t('flt.all')}</SelectItem>
                            {allSeries.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {range('year', t('flt.year'))}
                {range('price', t('flt.price'))}
                {range('km', t('flt.km'))}

                <button
                    onClick={() => onApply(f)}
                    className="h-[38px] rounded-[9px] bg-[#1a1a1a] px-[26px] text-[14px] font-semibold text-[#f7f6f3] transition-opacity hover:opacity-90"
                >
                    {t('flt.apply')}
                </button>
            </div>
        </div>
    );
}
