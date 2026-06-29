import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { LanguageProvider, type Lang } from '@/app/_site/i18n';
import { pageSeo } from '@/app/_site/seo';
import { ACTIVE_LOCALES } from '@/app/_site/i18n-config';

export function generateStaticParams() {
    return ACTIVE_LOCALES.map((lang) => ({ lang }));
}

// hreflang alternates for every page in the locale tree. The original (browser)
// path arrives via the x-pathname header set in proxy.ts; we strip any /tr prefix
// to get the shared sub-path, then localeMeta emits en/tr/x-default.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    let sub = (await headers()).get('x-pathname') || '/';
    if (sub === '/tr') sub = '';
    else if (sub.startsWith('/tr/')) sub = sub.slice(3);
    if (sub === '/') sub = '';
    return pageSeo(lang, sub);
}

export default async function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!ACTIVE_LOCALES.includes(lang as Lang)) notFound();
    return <LanguageProvider initialLang={lang as Lang}>{children}</LanguageProvider>;
}
