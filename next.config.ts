import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  /* base path is replced in CI */
  basePath: ''
};

export default nextConfig;
