import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALL_PROJECTS } from "@/lib/data";

// 1. Import your Navbar component
// (Adjust the path if your Navbar is in a different folder, e.g., '@/components/layout/Navbar')
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
    title: "Projects | Sadık Çoban",
    description: "Showcase of my data science, machine learning, and AI engineering projects.",
};

export default function ProjectsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black selection:bg-blue-500 selection:text-white">

            {/* 2. Add Navbar at the top */}
            <Navbar />

            <div className="pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">

                    {/* Header Section */}
                    <header className="mb-20">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                            Featured <span className="text-slate-400 dark:text-slate-600">Work.</span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            A selection of projects where I explore the boundaries of AI,
                            Data Science, and Software Engineering. From predictive models to intelligent agents.
                        </p>
                    </header>

                    {/* Projects List */}
                    <div className="flex flex-col gap-12">
                        {ALL_PROJECTS.map((project) => {
                            return (
                                <Link key={project.id} href={project.href} className="group block">
                                    <div className={`relative bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden ${project.borderAccent}`}>

                                        {/* Background Blur Effect */}
                                        <div className={`absolute right-0 top-0 w-96 h-96 ${project.bgAccent} rounded-full blur-[100px] transition-opacity opacity-10 group-hover:opacity-20`} />

                                        <div className="relative z-10 flex flex-col gap-6 items-start">

                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold border tracking-wider ${project.textAccent}`}>
                                                {project.status}
                                            </span>

                                            <div className="flex-grow w-full">
                                                {/* Title */}
                                                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                                                    {project.title}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
                                                    {project.description}
                                                </p>

                                                {/* Features / Tech Stack */}
                                                <div className="flex flex-wrap gap-3 mb-10">
                                                    {project.features.map((feat) => (
                                                        <div key={feat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-700">
                                                            <feat.icon size={16} className="opacity-70" />
                                                            {feat.label}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* CTA Button */}
                                                <div className={`flex items-center gap-3 text-base font-bold ${project.textAccent.split(' ')[0]}`}>
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
                </div>
            </div>
        </div>
    );
}