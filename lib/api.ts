import axios from 'axios';

// Car Price API client.
//
// Requests go to THIS site's own origin, not to the backend: app/api/[...path]/route.ts
// forwards them server-side, so the backend origin lives in a server-only env var
// (API_URL) and never reaches the browser bundle. This used to read
// NEXT_PUBLIC_API_URL — and Next inlines every NEXT_PUBLIC_* value into client JS at
// build time, so the Railway URL was readable in devtools and callable directly.
//
// An empty baseURL makes axios resolve each path against the current origin, which is
// what we want in the browser. Every consumer (predict / drift / dashboard) is a client
// component; anything that ever needs this server-side must read API_URL and build an
// absolute URL itself, since a relative path has no origin to resolve against there.
export const carApi = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});
