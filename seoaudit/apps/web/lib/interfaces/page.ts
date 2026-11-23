export interface IPage {
  _id: string;
  siteId: string;
  url: string;
  organizationId: string;
  title?: string;
  statusCode?: number;
  canonical?: string;
  headings: string[];
  metaTags: Array<{ name: string; content: string }>;
  createdAt: Date;
  description?: string;
}
