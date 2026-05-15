/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Standalone build: Node.js sunucusu dahil edilir
  experimental: {
    serverComponentsExternalPackages: ['fast-xml-parser', 'cheerio', 'xlsx'],
  },
  images: {
    unoptimized: true // Electron'da next/image optimizasyonu çalışmaz
  },
};

module.exports = nextConfig;
