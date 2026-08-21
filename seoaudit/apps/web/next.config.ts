import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@seo-optimizer/crawler"],
  serverExternalPackages: [
    "playwright",
    "cheerio",
    "@google/genai",
    "mongodb",
    "mongoose",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/lib-dynamodb",
  ],
};

export default nextConfig;
