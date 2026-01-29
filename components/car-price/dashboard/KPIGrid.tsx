import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Activity, Car } from 'lucide-react';

// Tekil Kart Bileşeni
const KPICard = ({ title, value, icon: Icon, isBrand = false }: any) => (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {title}
            </CardTitle>
            {Icon && <Icon className="text-slate-400" size={16} />}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${isBrand ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                {value}
            </div>
        </CardContent>
    </Card>
);

export default function KPIGrid({ data }: { data: any }) {
    const getBrandStats = () => {
        if (!data || !data.boxplotData) return [];
        return Object.entries(data.boxplotData)
            .map(([brand, prices]: [string, any]) => {
                if (!prices.length) return { brand, avg: 0 };
                const sum = prices.reduce((a: number, b: number) => a + b, 0);
                return { brand, avg: sum / prices.length };
            })
            .sort((a, b) => b.avg - a.avg);
    };

    const brandStats = getBrandStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <KPICard
                title="Total Listings"
                value={data.kpi?.total}
                icon={LayoutDashboard}
            />
            <KPICard
                title="General Avg. Price"
                value={`₺${(data.kpi?.avgPrice / 1e6).toFixed(2)}M`}
                icon={Activity}
            />
            {brandStats.map((stat) => (
                <KPICard
                    key={stat.brand}
                    title={`${stat.brand} Ort.`}
                    value={`₺${(stat.avg / 1e6).toFixed(2)}M`}
                    icon={Car}
                    isBrand={true}
                />
            ))}
        </div>
    );
}