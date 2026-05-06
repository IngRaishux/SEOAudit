export interface MetaTags {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robots: string | null;
}

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
}

export interface SeoPage {
  url: string;
  siteId: string;
  crawledAt: string;
  statusCode: number;
  meta: MetaTags;
  headings: HeadingStructure;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  images: { src: string; alt: string | null }[];
  loadTimeMs: number;
}

export interface SeoSuggestion {
  pageUrl: string;
  siteId: string;
  generatedAt: string;
  suggestions: {
    priority: 'high' | 'medium' | 'low';
    category: 'meta' | 'content' | 'structure' | 'performance' | 'links';
    issue: string;
    recommendation: string;
  }[];
}
