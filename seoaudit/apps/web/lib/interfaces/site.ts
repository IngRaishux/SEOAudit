export interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  description?: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  metaTags?: Array<{ name: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}
