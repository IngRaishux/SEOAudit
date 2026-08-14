import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@seo-optimizer/crawler"],
  serverExternalPackages: ["playwright", "cheerio"],
};

export default nextConfig;
