/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET || 'shop-dashboard-secret-change-me'
  }
};

export default nextConfig;
