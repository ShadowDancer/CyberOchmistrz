import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public'
})



const nextConfig: NextConfig = withPWA({
  output: 'export',
  images: { unoptimized: true },
  /* base path is replced in CI */
  basePath: ''
});

module.exports = nextConfig;