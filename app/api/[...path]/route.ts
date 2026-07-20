import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Server-side proxy to the car-price backend.
//
// WHY THIS EXISTS
// The frontend used to call the backend directly with NEXT_PUBLIC_API_URL. Any
// NEXT_PUBLIC_* value is INLINED INTO THE CLIENT BUNDLE at build time, so the
// Railway origin was readable by anyone who opened devtools — and every request
// went browser → Railway, exposing the backend to direct traffic and needing CORS.
//
// Now the browser only ever talks to this same-origin route, and the real origin
// lives in a server-only env var the bundle never sees.
//
// ALLOWLIST, NOT A BLIND CATCH-ALL
// A naive `/api/[...path]` proxy would relay ANY path to the backend through this
// domain — including anything the backend adds later that was never meant to be
// public. So only the routes the site actually calls are forwarded; everything
// else 404s here without a network hop.
// ─────────────────────────────────────────────────────────────────────────────

// Proxy target. Server-only: no NEXT_PUBLIC_ prefix, so it is never bundled.
// NEXT_PUBLIC_API_URL is still read as a fallback so an environment that only has
// the old variable keeps working during the migration — remove it once API_URL is
// set everywhere (see the note in .env.local).
const API_ORIGIN = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    .trim()
    .replace(/\/+$/, '');

/** Exact paths and prefixes the site is allowed to reach. Keep in step with lib/services/car-service.ts. */
const ALLOWED = [
    'bi/meta',       // dashboard: filter metadata
    'bi/agg',        // dashboard: aggregates
    'predict',       // predict page
    'snapshots',     // drift page: snapshot list
    'data-drift',    // drift page: KS / Wasserstein
] as const;

const isAllowed = (path: string) => ALLOWED.some((a) => path === a || path.startsWith(a + '/'));

// Live data — never cache this route or let it prerender.
export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, path: string[]) {
    const rel = path.join('/');
    if (!isAllowed(rel)) {
        return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    const search = req.nextUrl.search; // forward the query string verbatim
    const target = `${API_ORIGIN}/api/${rel}${search}`;

    try {
        const upstream = await fetch(target, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            // GET/HEAD must not carry a body.
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
            cache: 'no-store',
            // Railway containers cold-start; give the first request room before failing.
            signal: AbortSignal.timeout(30_000),
        });

        const body = await upstream.text();
        return new NextResponse(body, {
            status: upstream.status,
            headers: {
                'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
                'Cache-Control': 'no-store',
            },
        });
    } catch (e: any) {
        // Never surface the upstream origin in an error — that would undo the point.
        const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
        console.error(`[api proxy] ${req.method} /api/${rel} failed:`, e?.message ?? e);
        return NextResponse.json(
            { detail: timedOut ? 'The prediction service timed out.' : 'The prediction service is unavailable.' },
            { status: timedOut ? 504 : 502 },
        );
    }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await ctx.params).path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await ctx.params).path);
}
