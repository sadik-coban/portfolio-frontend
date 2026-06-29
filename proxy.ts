import { NextResponse, type NextRequest } from 'next/server';
import { I18N_ENABLED } from '@/app/_site/i18n-config';

// Locale routing at the site root. English is the default and is served UNPREFIXED
// (canonical); Turkish is served under /tr. The physical routes live in app/[lang]/*,
// so we rewrite unprefixed requests to inject "en" (the URL stays clean) and redirect
// any explicit /en back to the unprefixed form. (Next 16 renamed `middleware` to `proxy`.)
export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Expose the original (browser) path so the [lang] layout can build hreflang alternates.
    const headers = new Headers(req.headers);
    headers.set('x-pathname', pathname);

    // Turkish: while enabled, matches the [lang]='tr' route as-is. While DEACTIVATED,
    // redirect any /tr URL to its unprefixed English equivalent.
    if (pathname === '/tr' || pathname.startsWith('/tr/')) {
        if (!I18N_ENABLED) {
            const url = req.nextUrl.clone();
            url.pathname = pathname.slice(3) || '/';
            return NextResponse.redirect(url, 308);
        }
        return NextResponse.next({ request: { headers } });
    }

    // Explicit English prefix → redirect to the canonical unprefixed URL.
    if (pathname === '/en' || pathname.startsWith('/en/')) {
        const url = req.nextUrl.clone();
        url.pathname = pathname.slice(3) || '/';
        return NextResponse.redirect(url, 308);
    }

    // Default (unprefixed) → rewrite to the [lang]='en' route, keeping the URL clean.
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
}

// Run on everything except API routes, Next internals, and any file with an extension
// (favicon.ico, icon0.svg, icon1.png, apple-icon.png, sitemap.xml, robots.txt, …).
export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
