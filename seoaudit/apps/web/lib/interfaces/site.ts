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
  /** URLs del sitemap antes del tope de páginas; ausente en sitios anteriores al tope. */
  sitemapTotal?: number;
  metaTags?: Array<{ name: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}
