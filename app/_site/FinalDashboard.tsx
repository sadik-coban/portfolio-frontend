"use client";

import { useState, useEffect } from 'react';
import { Loader2, ServerCrash } from 'lucide-react';
import FinalShell from './FinalShell';
import EChartsDashboard from './EChartsDashboard';
import FilterPanel from './FilterPanel';
import { carService, type DashboardFilters } from '@/lib/services/car-service';
import { useLang } from './i18n';

const DEFAULT_FILTERS: DashboardFilters = {
    brand: 'Tümü', series: 'Tümü',
    min_price: '', max_price: '', min_year: '', max_year: '', min_km: '', max_km: '',
};

export default function FinalDashboard() {
    const { t } = useLang();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allBrands, setAllBrands] = useState<string[]>([]);
    const [allSeries, setAllSeries] = useState<string[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        carService.getDashboardData(appliedFilters)
            .then((result) => {
                if (!alive) return;
                setData(result);
                setAllBrands((prev) => (prev.length === 0 ? result.brands || [] : prev));
                if (appliedFilters.brand === 'Tümü') setAllSeries(result.seriesList || []);
            })
            .catch(() => alive && setError(t('dash.error')))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    const handleBrandChange = async (brand: string) => {
        if (!brand || brand === 'Tümü') { setAllSeries([]); return; }
        setLoadingSeries(true);
        try { setAllSeries(await carService.getSeriesByBrand(brand)); }
        catch { /* ignore */ }
        finally { setLoadingSeries(false); }
    };

    return (
        <FinalShell active="dashboard" kicker={t('dash.kicker')} title={t('dash.title')}>
            <FilterPanel
                initialFilters={appliedFilters}
                allBrands={allBrands}
                allSeries={allSeries}
                onApply={setAppliedFilters}
                onBrandChange={handleBrandChange}
                loadingSeries={loadingSeries}
            />

            {error && (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-[#86857e]">
                    <ServerCrash size={40} className="text-rose-500" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {!error && loading && !data && (
                <div className="flex items-center justify-center py-24 text-[#86857e]">
                    <Loader2 className="animate-spin" size={28} />
                </div>
            )}

            {!error && data && (
                <div className={`mt-4 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <EChartsDashboard data={data} />
                </div>
            )}
        </FinalShell>
    );
}
