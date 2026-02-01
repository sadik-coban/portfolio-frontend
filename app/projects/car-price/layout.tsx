import CarSidebar from '@/components/car-price/CarSidebar';
import DashboardFooter from '@/components/car-price/dashboard/DashboardFooter';
import type { Metadata } from 'next'
export const metadata: Metadata = {
    title: 'Car Price Prediction Project',
    description: 'A machine learning model to predict car prices using XGBoost and Python. View the source code and demo.',
}

export default function CarPriceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <CarSidebar />

            {/* SAĞ TARAFA KAPSAYICI (WRAPPER) EKLEDİK
                - md:ml-64: Sidebar genişliği kadar sağdan başlar.
                - flex flex-col: İçerik ve Footer'ı alt alta dizer.
                - min-h-screen: Sayfa boyunu garanti eder.
            */}
            <div className="flex-1 flex flex-col md:ml-64 transition-all min-h-screen">

                {/* MAIN (ANA İÇERİK)
                   - flex-1: Boş alanın tamamını kaplar, böylece içerik az olsa bile 
                     Footer en alta yapışır (Sticky Footer mantığı).
                */}
                <main className="flex-1 p-6 pt-20 md:pt-6">
                    {children}
                </main>

                {/* FOOTER
                   - px-6 pb-6: Main ile aynı hizalama boşlukları.
                */}
                <div className="px-6 pb-6">
                    <DashboardFooter />
                </div>
            </div>
        </div>
    );
}