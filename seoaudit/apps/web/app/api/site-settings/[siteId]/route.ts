import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Site from '@/lib/models/Site';
import SiteSettings from '@/lib/models/SiteSettings';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const session = await getServerSession(handler);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoose();

    // Get site to find organization
    const site = await Site.findById(siteId).lean();
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify user is member of the organization
    const membership = await Membership.findOne({
      userId: session.user.id,
      organizationId: site.organizationId,
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get or create site settings
    let settings = await SiteSettings.findOne({ siteId }).lean();

    if (!settings) {
      settings = {
        siteId,
        organizationId: site.organizationId,
        crawlFrequency: 'manual',
        maxPages: 1000,
        followRobots: true,
        checkSSL: true,
        trackMetrics: true,
        excludePatterns: [],
      };
    }

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
  const session = await getServerSession(handler);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      crawlFrequency,
      maxPages,
      followRobots,
      checkSSL,
      trackMetrics,
      excludePatterns,
    } = body;

    await connectMongoose();

    // Get site to find organization
    const site = await Site.findById(siteId);
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify user is member of the organization
    const membership = await Membership.findOne({
      userId: session.user.id,
      organizationId: site.organizationId,
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update or create site settings
    const settings = await SiteSettings.findOneAndUpdate(
      { siteId },
      {
        siteId,
        organizationId: site.organizationId,
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
