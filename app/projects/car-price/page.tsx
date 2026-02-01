import Link from "next/link";
import {
    ArrowRight,
    Brain,
    Zap,
    LayoutDashboard,
    CheckCircle2,
    BarChart3,
    ShieldCheck,
    Container,
    Server,
    Database
} from "lucide-react";
import { GithubIcon } from "@/components/ui/social-icons";

export default function CarPriceLandingPage() {
    return (
        // 1. DÜZELTME: overflow-x-hidden eklendi. Bu, yatay taşmayı kesin olarak keser.
        <main className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-black selection:bg-blue-500 selection:text-white">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 px-4 md:px-6 overflow-hidden">
                {/* 2. DÜZELTME: w-[1000px] yerine w-full md:w-[1000px] yapıldı. Mobilde ekran kadar olsun. */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[1000px] h-[300px] md:h-[500px] bg-blue-500/20 dark:bg-blue-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs md:text-sm font-semibold border border-blue-100 dark:border-blue-800 mb-8">
                        <Zap size={14} className="fill-current" />
                        v2.0 Live: Probabilistic Prediction
                    </div>

                    {/* 3. DÜZELTME: Yazı boyutu mobilde küçültüldü (text-4xl) */}
                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                        Beyond Point Predictions: <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                            Confidence Intervals.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
                        Powered by <strong>CatBoost</strong> and <strong>FastAPI</strong>.
                        We don't just guess a price; we calculate the probabilistic range based on
                        <strong> 10,000+ real-world market data points</strong> collected via custom web scrapers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                        <Link
                            href="/projects/car-price/predict"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            Try Range Prediction
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/projects/car-price/blog"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            Read Engineering Case
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- MOCKUP / DEMO PREVIEW --- */}
            <section className="px-4 md:px-6 pb-24">
                <div className="max-w-5xl mx-auto">
                    {/* 4. DÜZELTME: Mobilde padding azaltıldı (p-2) */}
                    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 md:p-4 shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 px-2 opacity-50">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            {/* 5. DÜZELTME: w-64 sabit genişlik yerine flex-1 kullanıldı */}
                            <div className="ml-4 flex-1 md:w-64 h-6 rounded-md bg-slate-200 dark:bg-slate-800" />
                        </div>

                        {/* 6. DÜZELTME: Mobilde padding azaltıldı (p-5 md:p-8) */}
                        <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 p-5 md:p-8 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-500">Model Source</label>
                                    {/* Mobilde text boyutu ve padding ayarı */}
                                    <div className="h-12 w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center px-3 md:px-4 text-sm md:text-base text-blue-700 dark:text-blue-300 font-bold gap-2 overflow-hidden whitespace-nowrap">
                                        <Container size={18} className="flex-shrink-0" />
                                        <span className="truncate">Hugging Face (CatBoost)</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-500">Vehicle</label>
                                    <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center px-3 md:px-4 text-sm md:text-base text-slate-900 dark:text-white font-medium overflow-hidden whitespace-nowrap">
                                        <span className="truncate">Volkswagen Passat 2018 (85k KM)</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                        <LayoutDashboard size={16} />
                                        <span>Analysis Dashboard</span>
                                    </div>
                                    <div className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                                        <CheckCircle2 size={14} />
                                        Drift Monitoring Active
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-4 md:mt-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 blur-2xl opacity-20" />
                                <div className="relative bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-blue-100 dark:border-blue-900 text-center">
                                    <p className="text-slate-500 font-medium mb-2 text-sm">Predicted Price Range (90% CI)</p>
                                    {/* Fiyat boyutu mobilde küçültüldü */}
                                    <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                        ₺1.180k - ₺1.320k
                                    </div>
                                    <div className="text-sm text-slate-400 mb-4">
                                        Inference via FastAPI: 45ms
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                        Quantile Regression
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- METRICS --- */}
            <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                        <div className="p-4 md:p-6">
                            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">96%+</div>
                            <div className="text-slate-600 dark:text-slate-400 font-medium">R² Accuracy Score</div>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">10k+</div>
                            <div className="text-slate-600 dark:text-slate-400 font-medium">Real-World Data Points</div>
                        </div>
                        <div className="p-4 md:p-6 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-4xl md:text-5xl font-bold text-emerald-500 mb-2">
                                84%
                                <ShieldCheck size={32} className="text-emerald-500 opacity-50" />
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 font-medium">Model Confidence Level</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES & STACK --- */}
            <section className="py-20 md:py-24 px-4 md:px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 w-full">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            Production-Grade MLOps
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            A complete end-to-end pipeline. The <strong>CatBoost</strong> model is versioned and stored on <strong>Hugging Face</strong>.
                            Inference is handled by a high-performance <strong>FastAPI</strong> backend.
                        </p>

                        <ul className="space-y-3">
                            {[
                                "Custom Web Scraping Pipeline (Selenium/Bs4)",
                                "MultiQuantile Loss for Interval Prediction",
                                "FastAPI for Real-Time Inference",
                                "Hugging Face for Model Registry",
                                "Interactive Analysis Dashboard",
                                "SHAP Values for Explainability"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium text-sm md:text-base">
                                    <CheckCircle2 size={20} className="text-blue-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/projects/car-price/blog"
                                className="inline-flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                                Read Engineering Case
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="https://github.com/sadik-coban/car-price-prediction-pipeline"
                                target="_blank"
                                className="inline-flex items-center justify-center gap-2 text-slate-500 hover:text-black dark:hover:text-white font-bold transition-colors"
                            >
                                View Code on GitHub
                                <GithubIcon size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* 7. DÜZELTME: Kart grid'inin padding'i mobilde azaltıldı */}
                    <div className="flex-1 w-full p-4 md:p-8 bg-slate-100 dark:bg-slate-800 rounded-3xl grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-105 transition-transform text-center">
                            <Container size={32} className="text-yellow-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">Hugging Face</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-105 transition-transform text-center">
                            <Server size={32} className="text-blue-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">FastAPI</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-105 transition-transform text-center">
                            <LayoutDashboard size={32} className="text-emerald-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">Dashboard</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-105 transition-transform text-center">
                            <Brain size={32} className="text-purple-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">CatBoost</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}