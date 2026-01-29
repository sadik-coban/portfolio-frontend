"use client";

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import {
    TrendingUp,
    ArrowRight,
    LayoutDashboard,
    BrainCircuit,
    Activity,
    Code2,
    Database,
    Cloud,
    Mail,
    BookOpen,
    Calendar
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/social-icons';

// Gelen verinin tipi (Basitçe any diyebiliriz veya tip tanımlayabiliriz)
interface PortfolioProps {
    recentPosts: any[];
}

export default function PortfolioHome({ recentPosts }: PortfolioProps) {

    // --- SMOOTH SCROLL FONKSİYONU ---
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
        e.preventDefault(); // URL'e # eklenmesini engelle
        const element = document.getElementById(id);
        if (element) {
            // Navbar yüksekliğini (80px) hesaba katarak kaydır
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const projects = [
        {
            id: 'car-price',
            title: 'Car Price Prediction & MLOps',
            description: 'End-to-end machine learning system using CatBoost and MultiQuantile loss. This project is not just a model; it covers a complete MLOps cycle including data collection, cleaning, modeling, and real-time monitoring (Drift Detection). Users can examine the model\'s confidence intervals and Shapley values via the dashboard.',
            color: 'bg-blue-600',
            textAccent: 'text-blue-600 dark:text-blue-400',
            bgAccent: 'bg-blue-50 dark:bg-blue-900/20',
            borderAccent: 'group-hover:border-blue-500/50',
            href: '/projects/car-price/dashboard',
            status: 'Live Demo',
            features: [
                { label: 'Analytics Dashboard', icon: LayoutDashboard },
                { label: 'Price Prediction', icon: BrainCircuit },
                { label: 'Drift Monitoring', icon: Activity },
                { label: 'SHAP Explainability', icon: Code2 }
            ]
        }
    ];

    const techStack = [
        {
            category: "Machine Learning & AI",
            icon: BrainCircuit,
            skills: ["Python", "Scikit-Learn", "CatBoost"]
        },
        {
            category: "Data Engineering & MLOps",
            icon: Database,
            skills: ["PostgreSQL", "Docker", "FastAPI", "Hugging Face"]
        },
        {
            category: "Frontend & Visualization",
            icon: Code2,
            skills: ["React", "Next.js 15", "TypeScript", "Tailwind", "Recharts", "Apache ECharts"]
        },
        {
            category: "DevOps & Tools",
            icon: Cloud,
            skills: ["Vercel", "Linux"]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <Navbar />

            {/* --- HERO SECTION --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold mb-6 border border-slate-200 dark:border-slate-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Available for new projects
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
                        Building Intelligent <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500">
                            Data Solutions
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                        Data Scientist & MLOps Engineer bridging the gap between <span className="text-slate-900 dark:text-white font-bold">Data Science</span> and <span className="text-slate-900 dark:text-white font-bold">Production</span>.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        {/* Smooth Scroll Button */}
                        <a
                            href="#projects"
                            onClick={(e) => handleScroll(e, 'projects')}
                            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-blue-500/10 cursor-pointer"
                        >
                            View Projects
                        </a>
                        <a href="https://github.com/sadik-coban" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
                            <GithubIcon size={24} /> GitHub
                        </a>
                    </div>
                </div>
            </header>

            {/* --- TECH STACK SECTION --- */}
            <section className="py-20 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Technical Arsenal</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Technologies I Use</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {techStack.map((stack, idx) => (
                            <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-900 dark:text-white mb-3">
                                    <stack.icon size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{stack.category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {stack.skills.map(skill => (
                                        <span key={skill} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PROJECTS SECTION --- */}
            <section id="projects" className="py-24 px-6 max-w-6xl mx-auto scroll-mt-20">
                <div className="mb-16">
                    <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Portfolio</h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Featured Projects</h3>
                </div>

                <div className="flex flex-col gap-12">
                    {projects.map((project) => {
                        return (
                            <Link key={project.id} href={project.href} className="group block">
                                <div className={`relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden ${project.borderAccent}`}>
                                    <div className={`absolute right-0 top-0 w-96 h-96 ${project.bgAccent} rounded-full blur-[100px] transition-opacity opacity-20 group-hover:opacity-40`} />
                                    <div className="relative z-10 flex flex-col gap-6 items-start">
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${project.textAccent} border-current opacity-80 w-fit`}>
                                            {project.status}
                                        </span>
                                        <div className="flex-grow w-full">
                                            <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
                                                {project.description}
                                            </p>
                                            <div className="flex flex-wrap gap-3 mb-8">
                                                {project.features.map((feat) => (
                                                    <div key={feat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-100 dark:border-slate-700">
                                                        <feat.icon size={14} />
                                                        {feat.label}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={`flex items-center gap-2 text-base font-bold ${project.textAccent}`}>
                                                <span>EXPLORE PROJECT</span>
                                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* --- BLOG SECTION --- */}
            <section id="blog" className="py-24 px-6 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Knowledge Base</h2>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Latest Writings</h3>
                        </div>
                        <Link href="/blog" className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-bold transition-colors cursor-pointer">
                            View all posts <ArrowRight size={18} />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {recentPosts.length > 0 ? (
                            recentPosts.map((post) => (
                                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col h-full cursor-pointer">
                                    <article className="flex flex-col h-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Calendar size={14} />
                                                {post.meta.date}
                                            </div>
                                            {post.meta.project && (
                                                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                    {post.meta.project}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                            {post.meta.title}
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                                            {post.meta.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-purple-600 transition-colors mt-auto">
                                            <BookOpen size={16} /> Read Article
                                        </div>
                                    </article>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No blog posts available yet.
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-purple-600 font-bold">
                            View all posts <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">sadikc.dev</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Building the future with Data & AI.</p>
                    </div>
                    <div className="flex gap-6">
                        <a href="https://github.com/sadik-coban" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                            <GithubIcon size={24} />
                        </a>
                        <a href="https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                            <LinkedinIcon size={24} />
                        </a>
                        <a href="mailto:s.c_2004@hotmail.com" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                            <Mail size={24} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}