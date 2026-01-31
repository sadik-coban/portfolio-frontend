import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Typescript kullanıyorsan veri tipini tanımlayalım
interface ProjectProps {
    data: {
        id: string;
        href: string;
        title: string;
        description: string;
        status: string;
        borderAccent: string;
        bgAccent: string;
        textAccent: string;
        features: { icon: any; label: string }[];
    };
}

export function ProjectCard({ data }: ProjectProps) {
    return (
        <Link href={data.href} className="group block h-full">
            <div className={`relative h-full bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden ${data.borderAccent}`}>

                {/* Blur Efekti */}
                <div className={`absolute right-0 top-0 w-96 h-96 ${data.bgAccent} rounded-full blur-[100px] transition-opacity opacity-10 group-hover:opacity-20`} />

                <div className="relative z-10 flex flex-col gap-6 items-start h-full">
                    <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold border tracking-wider ${data.textAccent}`}>
                        {data.status}
                    </span>

                    <div className="flex-grow w-full flex flex-col">
                        <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                            {data.title}
                        </h3>

                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                            {data.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                            {data.features.map((feat) => (
                                <div key={feat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-700">
                                    <feat.icon size={16} className="opacity-70" />
                                    {feat.label}
                                </div>
                            ))}
                        </div>

                        <div className={`flex items-center gap-3 text-base font-bold mt-auto ${data.textAccent.split(' ')[0]}`}>
                            <span>EXPLORE PROJECT</span>
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}