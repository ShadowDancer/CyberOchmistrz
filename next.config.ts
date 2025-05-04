import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: { loader: "custom" },
  /* base path is replced in CI */
  basePath: '/'
};

export default nextConfig;
