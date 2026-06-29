import { MetadataRoute } from 'next';
import { I18N_ENABLED } from '@/app/_site/i18n-config';
import { site } from '@/app/_site/site-config';

// Static blog-post slugs (add new posts here, or wire to getBlogPosts()).
const BLOG_POSTS = ['building-car-price-predictor'];

export default function sitemap(): MetadataRoute.Sitemap {
    const base = site.baseUrl;
    const lastModified = new Date();
    const paths = [...Object.keys(site.pages), ...BLOG_POSTS.map((s) => `/blog/${s}`)];

    return paths.map((path) => {
        const url = path === '/' ? base : `${base}${path}`;
        const trUrl = path === '/' ? `${base}/tr` : `${base}/tr${path}`;
        return {
            url,
            lastModified,
            changeFrequency: (['/', '/projects', '/blog'].includes(path) ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
            priority: path === '/' ? 1 : path.split('/').filter(Boolean).length <= 1 ? 0.8 : 0.6,
            alternates: { languages: I18N_ENABLED ? { en: url, tr: trUrl } : { en: url } },
        };
    });
}
