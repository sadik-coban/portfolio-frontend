export default function DashboardFooter() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-4">

                {/* Sol: Marka ve İsim */}
                <div className="text-center md:text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Sadık Çoban
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Data Science & MLOps Portfolio © {currentYear}
                    </p>
                </div>

                {/* Sağ: Teknolojiler */}
                <div className="flex flex-col items-center gap-2 md:items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                        Visualization Stack
                    </span>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <a
                            href="https://ui.shadcn.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 underline underline-offset-4 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                        >
                            Recharts - shadcn/ui
                        </a>
                        <a
                            href="https://observablehq.com/plot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 underline underline-offset-4 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                        >
                            Observable Plot
                        </a>
                    </div>
                </div>
            </div>

            {/* Lisans Notu */}
            <div className="mt-8 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
                <p className="text-center text-[10px] leading-relaxed text-slate-500 dark:text-slate-500">
                    This dashboard is powered by open-source libraries licensed under
                    <span className="font-semibold mx-1 text-slate-700 dark:text-slate-300">MIT License</span>
                    and
                    <span className="font-semibold mx-1 text-slate-700 dark:text-slate-300">ISC License</span>.
                </p>
            </div>
        </footer>
    );
}