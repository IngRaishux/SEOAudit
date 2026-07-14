"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CrawlResult, PageSeo } from "@seo-optimizer/crawler";

const STORAGE_KEY = "crawlResult";

interface CrawlContextValue {
  crawl: CrawlResult | null;
  setCrawl: (result: CrawlResult | null) => void;
  getPageByUrl: (url: string) => PageSeo | undefined;
}

const CrawlContext = createContext<CrawlContextValue | null>(null);

export function CrawlProvider({ children }: { children: ReactNode }) {
  const [crawl, setCrawlState] = useState<CrawlResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setCrawlState(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setCrawl = useCallback((result: CrawlResult | null) => {
    setCrawlState(result);
    if (result) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getPageByUrl = useCallback(
    (url: string) => crawl?.pages.find((p) => p.url === url),
    [crawl]
  );

  return (
    <CrawlContext.Provider value={{ crawl, setCrawl, getPageByUrl }}>
      {children}
    </CrawlContext.Provider>
  );
}

export function useCrawl() {
  const ctx = useContext(CrawlContext);
  if (!ctx) {
    throw new Error("useCrawl debe usarse dentro de <CrawlProvider>");
  }
  return ctx;
}
