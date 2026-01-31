import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Left: Logo */}
                <Link
                    href="/"
                    className="font-black text-xl text-slate-900 dark:text-white tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    sadikcoban
                </Link>

                {/* Right: Theme Icon*/}
                <ThemeToggle className="cursor-pointer hover:scale-110 transition-transform duration-200" />
            </div>
        </nav>
    );
}