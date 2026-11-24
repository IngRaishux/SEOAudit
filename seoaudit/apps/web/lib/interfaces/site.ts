export interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  description?: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  crawlTruncated?: boolean;
  sitemapUrlCount?: number;
  metaTags?: Array<{ name: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}
