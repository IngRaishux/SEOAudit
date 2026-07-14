"use client";

import { useEffect } from "react";
import type { CrawlResult } from "@seo-optimizer/crawler";
import { useCrawl } from "@/lib/CrawlContext";

export function HydrateCrawl({ data }: { data: CrawlResult }) {
  const { setCrawl } = useCrawl();

  useEffect(() => {
    setCrawl(data);
  }, [data, setCrawl]);

  return null;
}
