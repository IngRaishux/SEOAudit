import connectMongoose from '@/lib/db/mongoose';
import Site from '@/lib/models/Site';

export async function createSite(data: {
  url: string;
  accountId: string;
  title?: string;
  description?: string;
}) {
  await connectMongoose();
  const site = new Site(data);
  return site.save();
}

export async function getSiteById(siteId: string) {
  await connectMongoose();
  return Site.findById(siteId).lean();
}

export async function listSitesByAccount(
  accountId: string,
  options: { limit?: number; skip?: number } = {}
) {
  await connectMongoose();
  const { limit = 10, skip = 0 } = options;
  return Site.find({ accountId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function countSitesByAccount(accountId: string) {
  await connectMongoose();
  return Site.countDocuments({ accountId });
}

export async function updateSite(
  siteId: string,
  data: Partial<{
    title: string;
    description: string;
    crawlStatus: string;
    crawlErrorMessage: string;
    pageCount: number;
  }>
) {
  await connectMongoose();
  return Site.findByIdAndUpdate(siteId, data, { new: true }).lean();
}

export async function deleteSite(siteId: string) {
  await connectMongoose();
  return Site.findByIdAndDelete(siteId);
}
