"use client";

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Container, Server, LayoutDashboard, Brain } from 'lucide-react';
import { GithubIcon } from '@/components/ui/social-icons';
import FinalShell from '../FinalShell';
import { useLang, localize } from '../i18n';

export default function FinalOverview() {
    const { t, lang } = useLang();
    const metrics = [
        { value: '96%+', label: t('ov.m1') },
        { value: '10k+', label: t('ov.m2') },
        { value: '84%', label: t('ov.m3') },
    ];
    const features = ['ov.f1', 'ov.f2', 'ov.f3', 'ov.f4', 'ov.f5', 'ov.f6'];
    const stack = [
        { icon: Container, label: 'Hugging Face' },
        { icon: Server, label: 'FastAPI' },
        { icon: LayoutDashboard, label: 'Dashboard' },
        { icon: Brain, label: 'CatBoost' },
    ];

    return (
        <FinalShell active="overview" kicker={t('ov.badge')} title={`${t('ov.title1')} ${t('ov.title2')}`}>
            <p className="text-lg text-[#5f5f5a] max-w-2xl leading-relaxed">{t('ov.lead')}</p>

            <div className="mt-8 flex flex-wrap gap-3">
                <Link href={localize('/projects/car-price/predict', lang)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#047857] text-white font-medium hover:bg-[#065f46] transition-colors">
                    {t('ov.tryPredict')} <ArrowRight size={18} />
                </Link>
                <a href="https://github.com/sadik-coban/car-price-prediction-pipeline" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#e4e2dd] font-medium text-[#5f5f5a] hover:border-[#047857]/50 transition-colors">
                    <GithubIcon size={18} /> {t('ov.viewCode')}
                </a>
            </div>

            {/* metrics */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map((m) => (
                    <div key={m.label} className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 text-center">
                        <div className="font-mono text-4xl font-bold tabular-nums text-[#047857] mb-1">{m.value}</div>
                        <div className="text-sm text-[#5f5f5a]">{m.label}</div>
                    </div>
                ))}
            </div>

            {/* features + stack */}
            <div className="mt-12 grid lg:grid-cols-2 gap-10 items-start">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-3">{t('ov.featTitle')}</h2>
                    <p className="text-[#5f5f5a] leading-relaxed mb-6">{t('ov.featDesc')}</p>
                    <ul className="space-y-3">
                        {features.map((f) => (
                            <li key={f} className="flex items-center gap-3 text-sm text-[#33332f]">
                                <CheckCircle2 size={18} className="text-[#059669] shrink-0" />
                                {t(f)}
                            </li>
                        ))}
                    </ul>
                    <Link href={localize('/projects/car-price/journal', lang)} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#047857] hover:underline">
                        {t('ov.readCase')} <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {stack.map((s) => (
                        <div key={s.label} className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-[#047857] grid place-items-center">
                                <s.icon size={22} />
                            </div>
                            <span className="font-medium text-sm">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </FinalShell>
    );
}
