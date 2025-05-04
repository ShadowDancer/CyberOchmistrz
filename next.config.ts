import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  /* base path is replced in CI */
  basePath: ''
};

export default nextConfig;
