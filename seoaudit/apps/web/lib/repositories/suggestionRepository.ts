import connectMongoose from '@/lib/db/mongoose';
import Suggestion from '@/lib/models/Suggestion';

export async function createSuggestion(data: {
  pageId: string;
  siteId: string;
  organizationId: string;
  type: 'seo' | 'performance' | 'accessibility' | 'best_practice';
  title: string;
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  notes?: string;
}) {
  await connectMongoose();
  const suggestion = new Suggestion(data);
  return suggestion.save();
}

export async function createSuggestions(
  suggestions: Parameters<typeof createSuggestion>[0][]
) {
  await connectMongoose();
  return Suggestion.insertMany(suggestions);
}

export async function getSuggestionById(suggestionId: string) {
  await connectMongoose();
  return Suggestion.findById(suggestionId)
    .populate('pageId')
    .populate('siteId')
    .lean();
}

export async function listSuggestionsByPage(
  pageId: string,
  options: { limit?: number; skip?: number } = {}
) {
  await connectMongoose();
  const { limit = 50, skip = 0 } = options;
  return Suggestion.find({ pageId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function listSuggestionsBySite(
  siteId: string,
  options: { limit?: number; skip?: number } = {}
) {
  await connectMongoose();
  const { limit = 100, skip = 0 } = options;
  return Suggestion.find({ siteId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function countSuggestionsByPage(pageId: string) {
  await connectMongoose();
  return Suggestion.countDocuments({ pageId });
}

export async function countUnresolvedBySite(siteId: string) {
  await connectMongoose();
  return Suggestion.countDocuments({ siteId, isResolved: false });
}

export async function updateSuggestion(
  suggestionId: string,
  data: Partial<{
    isResolved: boolean;
    resolvedAt: Date;
    notes: string;
  }>
) {
  await connectMongoose();
  return Suggestion.findByIdAndUpdate(suggestionId, data, { new: true }).lean();
}

export async function deleteSuggestion(suggestionId: string) {
  await connectMongoose();
  return Suggestion.findByIdAndDelete(suggestionId);
}

export async function deleteSuggestionsByPage(pageId: string) {
  await connectMongoose();
  return Suggestion.deleteMany({ pageId });
}

export async function deleteSuggestionsBySite(siteId: string) {
  await connectMongoose();
  return Suggestion.deleteMany({ siteId });
}
