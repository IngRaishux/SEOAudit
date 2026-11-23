import connectMongoose from '@/lib/db/mongoose';
import Site from '@/lib/models/Site';
import type { LlmsTxtCapture } from '@seo-optimizer/crawler';

export async function createSite(data: {
  url: string;
  organizationId: string;
  title?: string;
  description?: string;
  metaTags?: Array<{ name: string; content: string }>;
  llmsTxt?: LlmsTxtCapture;
}) {
  await connectMongoose();
  const site = new Site(data);
  const saved = await site.save();
  return saved.toObject();
}

export async function getSiteById(siteId: string) {
  await connectMongoose();
  return Site.findById(siteId)
    .select('_id url organizationId title description crawlStatus metaTags pageCount crawlErrorMessage createdAt updatedAt')
    .lean();
}

export async function listSitesByAccount(
  organizationId: string,
  options: { limit?: number; skip?: number } = {}
) {
  await connectMongoose();
  const { limit = 10, skip = 0 } = options;
  return Site.find({ organizationId })
    .select('_id url organizationId title description crawlStatus metaTags pageCount crawlErrorMessage createdAt updatedAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function countSitesByAccount(organizationId: string) {
  await connectMongoose();
  return Site.countDocuments({ organizationId });
}

export async function updateSite(
  siteId: string,
  data: Partial<{
    title: string;
    description: string;
    crawlStatus: string;
    crawlErrorMessage: string;
    pageCount: number;
    metaTags: Array<{ name: string; content: string }>;
  }>
) {
  await connectMongoose();
  return Site.findByIdAndUpdate(siteId, data, { new: true }).lean();
}

export async function deleteSite(siteId: string) {
  await connectMongoose();
  return Site.findByIdAndDelete(siteId);
}

/** El crawl más reciente completado del mismo origen: cada crawl crea un Site nuevo. */
export async function getLatestCompletedSiteForOrigin(organizationId: string, origin: string) {
  await connectMongoose();
  const sites = await Site.find({ organizationId, crawlStatus: 'completed' })
    .select('_id url organizationId llmsTxt createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return sites.find((site) => {
    try {
      return new URL(site.url).origin === origin;
    } catch {
      return false;
    }
  }) ?? null;
}
