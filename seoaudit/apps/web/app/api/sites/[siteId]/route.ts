import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import * as siteRepository from '@/lib/repositories/siteRepository';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve user ID from session or email
  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    session.user.id = user._id.toString();
  }

  try {
    // Get site by ID
    await connectMongoose();
    const site = (await siteRepository.getSiteById(siteId)) as any;

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Validate that user is member of the site's organization
    const membership = await Membership.findOne({
      userId: session.user.id,
      organizationId: site.organizationId,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get organization name
    const org = await Organization.findById(site.organizationId);

    return NextResponse.json({
      site: {
        ...site,
        organizationName: org?.name || 'Organization',
      },
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
