// Turkish is fully built and translated, but currently DEACTIVATED — the site runs
// English-only. Flip I18N_ENABLED to true to re-enable: the /tr routes, the EN/TR
// language switch, the tr hreflang alternates, and the /tr sitemap entries all come
// back with no other changes. (Plain module so proxy.ts — edge runtime — can import it.)
export const I18N_ENABLED = false;

export const ACTIVE_LOCALES: ('en' | 'tr')[] = I18N_ENABLED ? ['en', 'tr'] : ['en'];
