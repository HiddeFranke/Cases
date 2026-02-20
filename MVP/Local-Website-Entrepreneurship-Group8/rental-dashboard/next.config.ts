import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['axios', 'cheerio', 'playwright'],
};

export default nextConfig;
