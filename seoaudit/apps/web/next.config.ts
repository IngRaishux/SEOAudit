import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@seo-optimizer/crawler"],
  serverExternalPackages: ["playwright", "cheerio", "@google/genai"],
};

export default nextConfig;
