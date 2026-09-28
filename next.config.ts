import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      {
        source: '/linkedin',
        destination: 'https://www.linkedin.com/in/sadikcoban',
        permanent: false,
      },
      // The /projects index is gone: the homepage's work section is the list. Temporary, so the
      // page can come back without browsers holding on to a permanent redirect.
      {
        source: '/projects',
        destination: '/#work',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/sadik-coban',
        permanent: true,
      },
      // /nlp was renamed to /text-analysis, which is now closed (the generator archived its
      // reports). Old permalinks land on the project page rather than a 404 — both locales,
      // since Turkish is served under /tr.
      {
        source: '/projects/car-price/nlp',
        destination: '/projects/car-price',
        permanent: true,
      },
      {
        source: '/tr/projects/car-price/nlp',
        destination: '/tr/projects/car-price',
        permanent: true,
      },
      // The generated decision note holds the plain /report name now. Old /report-v2 links
      // (and anything that indexed them) still land on a report.
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