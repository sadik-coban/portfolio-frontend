import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;