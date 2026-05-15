/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['fast-xml-parser', 'cheerio', 'xlsx'],
  },
};

module.exports = nextConfig;
