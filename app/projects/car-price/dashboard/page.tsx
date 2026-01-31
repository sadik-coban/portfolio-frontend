"use client";
import { useState, useEffect } from 'react';
import { carService, DashboardFilters } from '@/lib/services/car-service';
import FilterPanel from '@/components/car-price/dashboard/FilterPanel';
import KPIGrid from '@/components/car-price/dashboard/KPIGrid';
import ChartsSection from '@/components/car-price/dashboard/ChartsSection';
import { Loader2, ServerCrash, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data States
    const [allBrands, setAllBrands] = useState<string[]>([]);
    const [allSeries, setAllSeries] = useState<string[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(false);

    // Filter State
    const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({
        brand: 'Tümü', series: 'Tümü',
        min_price: '', max_price: '',
        min_year: '', max_year: '',
        min_km: '', max_km: ''
    });

    // 1. Main Data Loading
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await carService.getDashboardData(appliedFilters);
                setData(result);

                // Populate brands only on initial load
                setAllBrands(prev => prev.length === 0 ? result.brands : prev);

                if (appliedFilters.brand === 'Tümü') {
                    setAllSeries(result.seriesList || []);
                }
            } catch (err) {
                console.error("Dashboard data loading error:", err);
                setError("Failed to connect to the server. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [appliedFilters]);

    // Series Loading (Updates dropdown options only)
    const handleBrandChange = async (selectedBrand: string) => {
        setLoadingSeries(true);
        try {
            const series = await carService.getSeriesByBrand(selectedBrand);
            setAllSeries(series);
        } catch (error) {
            console.error("Series loading error:", error);
        } finally {
            setLoadingSeries(false);
        }
    };

    // Apply Filters Handler
    const handleApplyFilters = (newFilters: DashboardFilters) => {
        setAppliedFilters(newFilters);
    };

    // --- ERROR STATE UI ---
    if (error) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <ServerCrash className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Connection Error
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {error}
                    </p>
                </div>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <RefreshCcw size={16} />
                    Retry Connection
                </Button>
            </div>
        );
    }

    // --- LOADING STATE UI ---
    if (loading && !data) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={56} />
                    <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full"></div>
                </div>
                <p className="text-lg font-medium text-slate-600 dark:text-slate-300 animate-pulse">
                    Loading Dashboard...
                </p>
            </div>
        );
    }

    // --- MAIN CONTENT UI ---
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    Market Overview
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    Real-time analysis of vehicle pricing trends and market distribution.
                </p>
            </div>

            {/* Filter Panel */}
            <div className="sticky top-4 z-30">
                <FilterPanel
                    initialFilters={appliedFilters}
                    onApply={handleApplyFilters}
                    allBrands={allBrands}
                    allSeries={allSeries}
                    onBrandChange={handleBrandChange}
                    loadingSeries={loadingSeries}
                />
            </div>

            {/* Data Visualization */}
            {data && (
                <div className="space-y-8">
                    <section>
                        <KPIGrid data={data} />
                    </section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <ChartsSection data={data} />
                    </section>
                </div>
            )}
        </div>
    );
}