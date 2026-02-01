import { GithubIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { Mail } from "lucide-react";


export default function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">

                {/* Üst Kısım: Grid Yapısı */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* 1. Kolon: Marka ve Slogan */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">sadikcoban.com</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
                            Data Scientist & MLOps Engineer. Bridging the gap between complex data and actionable insights. Building the future with Data & AI.
                        </p>
                    </div>

                    {/* 2. Kolon: Navigasyon */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Navigation</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="/" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="/projects" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                                    Projects
                                </a>
                            </li>
                            <li>
                                <a href="/blog" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                                    Blog
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 3. Kolon: İletişim & Sosyal */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Connect</h4>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com/sadik-coban"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                                aria-label="GitHub"
                            >
                                <GithubIcon size={20} />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-all"
                                aria-label="LinkedIn"
                            >
                                <LinkedinIcon size={20} />
                            </a>
                            <a
                                href="mailto:s.c_2004@hotmail.com"
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                                aria-label="Email"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Alt Çizgi ve Telif */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left">
                        © {currentYear} Sadık Çoban. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        Built with <span className="font-semibold text-slate-600 dark:text-slate-300">Next.js</span> & <span className="font-semibold text-slate-600 dark:text-slate-300">Tailwind</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}