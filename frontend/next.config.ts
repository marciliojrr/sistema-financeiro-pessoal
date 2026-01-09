import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Only load bundle analyzer when ANALYZE=true and package is available
let config = nextConfig;
if (process.env.ANALYZE === 'true') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    config = withBundleAnalyzer(nextConfig);
  } catch {
    console.warn('Bundle analyzer not available, skipping...');
  }
}

export default config;
