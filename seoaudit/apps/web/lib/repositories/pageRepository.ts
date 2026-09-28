import connectMongoose from '@/lib/db/mongoose';
import Page from '@/lib/models/Page';

export async function createPage(data: {
  siteId: string;
  url: string;
  organizationId: string;
  title?: string;
  description?: string;
  statusCode?: number;
  contentLength?: number;
  contentType?: string;
  canonical?: string;
  headings?: string[];
  links?: Array<{ url: string; text?: string; isExternal?: boolean }>;
  metaTags?: Array<{ name: string; content: string }>;
  images?: Array<{ url: string; alt?: string }>;
}) {
  await connectMongoose();
  const page = new Page(data);
  return page.save();
}

export async function createPages(pages: Parameters<typeof createPage>[0][]) {
  await connectMongoose();
  return Page.insertMany(pages);
}

export async function getPageById(pageId: string) {
  await connectMongoose();
  return Page.findById(pageId).populate('siteId').lean();
}

export async function listPagesBySite(
  siteId: string,
  options: { limit?: number; skip?: number } = {}
) {
  await connectMongoose();
  const { limit = 100, skip = 0 } = options;
  return Page.find({ siteId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function countPagesBySite(siteId: string) {
  await connectMongoose();
  return Page.countDocuments({ siteId });
}

export async function updatePage(
  pageId: string,
  data: Partial<{
    title: string;
    description: string;
    statusCode: number;
    contentLength: number;
    canonical: string;
  }>
) {
  await connectMongoose();
  return Page.findByIdAndUpdate(pageId, data, { new: true }).lean();
}

export async function deletePage(pageId: string) {
  await connectMongoose();
  return Page.findByIdAndDelete(pageId);
}

export async function deletePagesBySite(siteId: string) {
  await connectMongoose();
  return Page.deleteMany({ siteId });
}
