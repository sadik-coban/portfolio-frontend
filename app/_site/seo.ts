import type { Metadata } from 'next';
import { I18N_ENABLED } from './i18n-config';
import { site } from './site-config';

/**
 * Per-page Metadata: `title` + `description` come from `site.pages` (keyed by the
 * locale-stripped path), plus canonical + hreflang alternates. English is canonical-
 * unprefixed at the root; Turkish lives under /tr while I18N_ENABLED. Unknown paths
 * (e.g. blog posts) fall back to the root defaults and let the page's own
 * generateMetadata win. Edit page titles/descriptions in site-config.ts.
 */
export function pageSeo(lang: string, sub: string): Metadata {
    const en = sub || '/';
    const page = site.pages[en] as { title: Bi; description: Bi } | undefined;
    const tr = lang === 'tr';
    const alternates: Metadata['alternates'] = I18N_ENABLED
        ? { canonical: tr ? `/tr${sub}` : en, languages: { en, tr: `/tr${sub}`, 'x-default': en } }
        : { canonical: en, languages: { en, 'x-default': en } };
    // The root layout declares one Open Graph locale for the whole site; a Turkish page has to
    // correct it, or the preview a Turkish link produces announces itself as English.
    const openGraph = { locale: tr ? 'tr_TR' : 'en_US' };
    // Only claim a title/description for known pages. For unknown paths (e.g. blog
    // posts) we omit them so the page's own metadata + the root brand template win.
    if (!page) return { alternates, openGraph };
    const title = tr ? page.title.tr : page.title.en;
    const description = tr ? page.description.tr : page.description.en;
    return { title, description, alternates, openGraph: { ...openGraph, title, description } };
}

type Bi = { en: string; tr: string };

export type LangParams = { params: Promise<{ lang: string }> };
