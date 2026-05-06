export interface DynamoSiteItem {
  PK: string;        // SITE#<siteId>
  SK: string;        // METADATA
  siteId: string;
  domain: string;
  sitemapUrl: string;
  lastCrawledAt: string;
  totalPages: number;
  createdAt: string;
}

export interface DynamoPageItem {
  PK: string;        // SITE#<siteId>
  SK: string;        // PAGE#<encodedUrl>
  siteId: string;
  url: string;
  crawledAt: string;
  statusCode: number;
  metaTitle: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  loadTimeMs: number;
  issueCount: number;
  GSI1PK: string;    // SITE#<siteId>#STATUS#<statusCode>
  GSI1SK: string;    // <crawledAt>
}

export interface DynamoSuggestionItem {
  PK: string;        // SITE#<siteId>
  SK: string;        // SUGGESTION#<encodedUrl>
  siteId: string;
  pageUrl: string;
  generatedAt: string;
  suggestions: string; // JSON serializado
}
