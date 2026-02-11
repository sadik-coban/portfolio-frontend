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
    ];
  },
};


const withMDX = createMDX({
  options: {
    remarkPlugins: [

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