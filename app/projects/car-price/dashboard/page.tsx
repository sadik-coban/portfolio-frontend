"use client";
import { useState, useEffect } from 'react';
import { carService, DashboardFilters } from '@/lib/services/car-service';
import FilterPanel from '@/components/car-price/dashboard/FilterPanel';
import KPIGrid from '@/components/car-price/dashboard/KPIGrid';
import ChartsSection from '@/components/car-price/dashboard/ChartsSection';
import { ChevronRight, Loader2, ServerCrash, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Veri State'leri
    const [allBrands, setAllBrands] = useState<string[]>([]);
    const [allSeries, setAllSeries] = useState<string[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(false);

    // ÇÖZÜM: tempFilters burada ARTIK YOK.
    // Sadece geçerli olan filtreleri tutuyoruz.
    const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({
        brand: 'Tümü', series: 'Tümü',
        min_price: '', max_price: '',
        min_year: '', max_year: '',
        min_km: '', max_km: ''
    });

    // 1. Ana Veri Yükleme
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await carService.getDashboardData(appliedFilters);
                setData(result);

                // Markalar sadece ilk yüklemede dolsun
                setAllBrands(prev => prev.length === 0 ? result.brands : prev);

                if (appliedFilters.brand === 'Tümü') {
                    setAllSeries(result.seriesList || []);
                }
            } catch (err) {
                console.error("Dashboard veri yükleme hatası:", err);
                setError("Sunucuyla bağlantı kurulamadı.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [appliedFilters]); // Sadece appliedFilters değişince çalışır

    // Seri yükleme (Sadece dropdown güncellenir, tüm filtreler değil)
    const handleBrandChange = async (selectedBrand: string) => {
        setLoadingSeries(true);
        try {
            const series = await carService.getSeriesByBrand(selectedBrand);
            setAllSeries(series);
        } catch (error) {
            console.error("Seri yükleme hatası:", error);
        } finally {
            setLoadingSeries(false);
        }
    };

    // Filtre Uygulama Fonksiyonu
    const handleApplyFilters = (newFilters: DashboardFilters) => {
        // Bu tetiklendiğinde useEffect çalışacak ve veriler yenilenecek
        setAppliedFilters(newFilters);
    };

    // --- HATA EKRANI (Aynı kalabilir) ---
    if (error) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center">
                {/* Hata içeriği aynı */}
                <p>{error}</p>
                <Button onClick={() => window.location.reload()}>Yenile</Button>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Kısımları (Aynı) */}
            <div>
                <h1 className="text-3xl font-black">Market Overview</h1>
            </div>

            {/* Filtre Paneli */}
            <FilterPanel
                initialFilters={appliedFilters} // Başlangıç değeri
                onApply={handleApplyFilters}   // Local state'i alıp buraya getiren fonk.
                allBrands={allBrands}
                allSeries={allSeries}
                onBrandChange={handleBrandChange}
                loadingSeries={loadingSeries}
            />

            {/* Veri Gösterimi */}
            {data && (
                <>
                    <KPIGrid data={data} />
                    <ChartsSection data={data} />
                </>
            )}
        </div>
    );
}