// Turkish and English both ship. The flag stays because the switch it controls — /tr routing,
// the EN/TR control, the tr hreflang alternates and the /tr sitemap entries — is one coherent
// feature: flip it to false and the site is English-only again, with no other edits.
// (Plain module so proxy.ts — edge runtime — can import it.)
export const I18N_ENABLED = true;

export const ACTIVE_LOCALES: ('en' | 'tr')[] = I18N_ENABLED ? ['en', 'tr'] : ['en'];
