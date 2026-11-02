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
  jsonLd?: Array<{ raw: string; parsed: unknown | null; parseError: string | null }>;
  bodyText?: string;
  footerText?: string;
  textTruncated?: boolean;
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
  const query = Page.find({ siteId })
    .select('_id siteId url organizationId title description statusCode canonical headings metaTags createdAt')
    .sort({ createdAt: -1 })
    .skip(skip);

  // limit <= 0 significa "sin límite" (traer todas las páginas del sitio)
  if (limit > 0) {
    query.limit(limit);
  }

  return query.lean();
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

/** Páginas con las señales que usa la capa GEO (JSON-LD, links, texto). */
export async function listGeoPagesBySite(siteId: string) {
  await connectMongoose();
  return Page.find({ siteId })
    .select('_id url statusCode title description canonical links images metaTags jsonLd bodyText footerText')
    .lean();
}
