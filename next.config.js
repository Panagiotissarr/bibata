/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add these two sections below:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;