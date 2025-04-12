/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['img.clerk.com'],
  },
  webpack: (config, { isServer }) => {
    // Resolve the instrumentation client module
    config.resolve.alias['private-next-instrumentation-client'] = require.resolve('./src/lib/next-patch.js');
    return config;
  },
};

module.exports = nextConfig; 