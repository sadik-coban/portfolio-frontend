import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';

// Server-only reader for the merged text-analysis data that backs
// /projects/car-price/text-analysis (built by scripts/build-text-data.mjs from
// site_pipeline/text_nlp/*). Read at build time and wrapped in React cache().
// (fs/path keep this out of any client bundle.)
export const getTextData = cache(async (): Promise<any> => {
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'text_data.json'), 'utf8');
    return JSON.parse(raw.replace(/-?Infinity/g, 'null').replace(/\bNaN\b/g, 'null'));
});
