"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BrainCircuit, Activity, PieChart, Home, Menu, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState } from 'react';

export default function CarSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Menü Linkleri
    const links = [
        { href: "/projects/car-price/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/projects/car-price/predict", label: "Price Prediction", icon: BrainCircuit },
        { href: "/projects/car-price/drift", label: "Drift", icon: Activity },
        { href: "/projects/car-price/shap", label: "SHAP Analysis", icon: PieChart },
        { href: "/projects/car-price/blog", label: "Project Blog", icon: BookOpen },
    ];

    // İçerik Bileşeni (Hem Mobil hem Desktop'ta aynı içeriği kullanmak için)
    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 font-bold text-xl text-slate-900 dark:text-white">
                Car <span className="text-blue-600 ml-1">Analysis</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 mb-6 transition-colors"
                >
                    <Home size={18} /> Back to Home
                </Link>

                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)} // Mobilde linke tıklayınca menüyü kapat
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-r-2 border-blue-600"
                                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            )}
                        >
                            <Icon size={18} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer: Dark Mode Toggle */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-2 text-sm text-slate-500">
                    <span>Theme</span>
                    <ThemeToggle className="cursor-pointer hover:scale-110 transition-transform duration-200" />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* 1. MASAÜSTÜ SIDEBAR (md:flex hidden) */}
            <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white dark:bg-slate-900 dark:border-slate-800 flex-col">
                <SidebarContent />
            </aside>

            {/* 2. MOBİL HEADER (md:hidden) */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between">
                <div className="font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Car Analysis
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu size={24} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                        {/* Sheet başlığı erişilebilirlik için gereklidir ama gizleyebiliriz */}
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </header>
        </>
    );
}