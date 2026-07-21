import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      {
        source: '/linkedin',
        destination: 'https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/sadik-coban',
        permanent: true,
      },
      // /nlp was renamed to /text-analysis. Keep the old permalinks (and any index
      // entry) alive — both locales, since Turkish is served under /tr.
      {
        source: '/projects/car-price/nlp',
        destination: '/projects/car-price/text-analysis',
        permanent: true,
      },
      {
        source: '/tr/projects/car-price/nlp',
        destination: '/tr/projects/car-price/text-analysis',
        permanent: true,
      },
      // The lab report took over the plain /report name; the archived v1 moved to
      // /report-v1. Old /report-v2 links (and anything that indexed them) follow.
      {
        source: '/projects/car-price/report-v2',
        destination: '/projects/car-price/report',
        permanent: true,
      },
      {
        source: '/tr/projects/car-price/report-v2',
        destination: '/tr/projects/car-price/report',
        permanent: true,
      },
    ];
  },
};


const withMDX = createMDX({
  options: {
    remarkPlugins: [
      // GFM is what turns markdown pipe-tables into <table> — without it the analysis posts'
      // result tables render as literal pipes. Also gives strikethrough and autolinks.
      'remark-gfm',
      'remark-frontmatter', 'remark-mdx-frontmatter'
    ],
    rehypePlugins: [
      [
        'rehype-pretty-code',
        {
          theme: 'one-dark-pro',
          keepBackground: false,
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);