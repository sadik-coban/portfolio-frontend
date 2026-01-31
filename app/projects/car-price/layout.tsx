import CarSidebar from '@/components/car-price/CarSidebar';
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

            {/* pt-16 md:pt-6 eklendi: Mobilde header altında kalmasın diye padding */}
            <main className="flex-1 p-6 pt-20 md:pt-6 md:ml-64 transition-all">
                {children}
            </main>
        </div>
    );
}