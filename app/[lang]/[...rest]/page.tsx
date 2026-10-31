import { notFound } from 'next/navigation';

// Unknown paths under a locale (proxy.ts rewrites /foo to /en/foo). Matching no route, they would
// get Next's bare 404, drawn outside the root layout because that layout lives in [lang]: no
// <html lang>, no site metadata. Throwing here draws the same 404 inside the layout instead.
export default function UnknownPage() {
    notFound();
}
