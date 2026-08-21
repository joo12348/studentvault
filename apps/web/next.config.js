/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@studentvault/shared-types"],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
