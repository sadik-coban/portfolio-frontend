import type { MetadataRoute } from 'next';
import { site } from '@/app/_site/site-config';

// PWA manifest, sourced from site-config.ts.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: site.manifest.name,
        short_name: site.manifest.shortName,
        theme_color: site.manifest.themeColor,
        background_color: site.manifest.backgroundColor,
        display: 'standalone',
        icons: site.manifest.icons,
    };
}
