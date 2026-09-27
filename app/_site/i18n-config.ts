// Turkish is switched off for now; the translations stay in the code. The switch this controls —
// /tr routing, the EN/TR control, the tr hreflang alternates and the /tr sitemap entries — is one
// coherent feature: set it to true and all of Turkish comes back, with no other edits. While it
// is off, /tr URLs redirect temporarily (307) to English — see proxy.ts.
// (Plain module so proxy.ts — edge runtime — can import it.)
export const I18N_ENABLED = false;

export const ACTIVE_LOCALES: ('en' | 'tr')[] = I18N_ENABLED ? ['en', 'tr'] : ['en'];
