import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';

// Server-only reader for the analytics data that backs the lab report. The file is
// read + sanitized at build time (the export carries `Infinity`/`NaN`, which is
// invalid JSON, so a direct `import` fails — we sanitize the raw text like the
// client does, then parse). Wrapped in React `cache()` so it's read once per render.
// (fs/path keep this out of any client bundle — importing it from a client component
// would fail the build, which is the intended guard.)
export const getSiteData = cache(async (): Promise<any> => {
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'site_data.json'), 'utf8');
    const data = JSON.parse(raw.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'));
    // SHAP now lives on its own /shap page (bar + beeswarm images), not the report.
    // Drop the shap subtree (lives at domain.shap) so it isn't serialized into the
    // report's HTML payload (dead weight + stray "Grup SHAP…" methodology text +
    // shap_plots png paths in the bot-readable source).
    if (data.domain) delete data.domain.shap;
    return data;
});
