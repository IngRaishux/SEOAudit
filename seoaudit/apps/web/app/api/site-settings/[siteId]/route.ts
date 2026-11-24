import { NextResponse } from 'next/server';
import { requireSiteAccess } from '@/lib/auth/orgAccess';
import SiteSettings from '@/lib/models/SiteSettings';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    const access = await requireSiteAccess(siteId, 'site.read');
    if (!access.ok) return access.response;

    // Get or create site settings
    const settings = (await SiteSettings.findOne({ siteId }).lean()) ?? {
      siteId,
      organizationId: access.organizationId,
      crawlFrequency: 'manual',
      maxPages: 1000,
      followRobots: true,
      checkSSL: true,
      trackMetrics: true,
      excludePatterns: [],
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    const access = await requireSiteAccess(siteId, 'content.edit');
    if (!access.ok) return access.response;

    const body = await request.json();
    const {
      crawlFrequency,
      maxPages,
      followRobots,
      checkSSL,
      trackMetrics,
      excludePatterns,
    } = body;

    // Update or create site settings
    const settings = await SiteSettings.findOneAndUpdate(
      { siteId },
      {
        siteId,
        organizationId: access.organizationId,
        crawlFrequency: crawlFrequency || 'manual',
        maxPages: maxPages || 1000,
        followRobots:
          followRobots !== undefined ? followRobots : true,
        checkSSL: checkSSL !== undefined ? checkSSL : true,
        trackMetrics: trackMetrics !== undefined ? trackMetrics : true,
        excludePatterns: excludePatterns || [],
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving site settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
