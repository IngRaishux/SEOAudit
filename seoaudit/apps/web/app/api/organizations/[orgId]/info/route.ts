import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId = session.user.id;

  // If userId is not in session, resolve it from database
  if (!userId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user._id.toString();
    } catch (error) {
      console.error('Error resolving user ID:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await connectMongoose();

    // Get user's memberships
    const memberships = await Membership.find({ userId }).lean();

    // Verify user is member of the requested org
    const userMembership = memberships.find(
      (m) => String(m.organizationId) === orgId
    );

    if (!userMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get organization details
    const org = await Organization.findById(orgId).lean<{ _id: unknown; name: string; slug: string }>();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      organization: {
        id: String(org._id),
        name: org.name,
        slug: org.slug,
      },
      membership: {
        _id: String(userMembership._id),
        organizationId: orgId,
        role: userMembership.role,
      },
      memberships: memberships.map((m) => ({
        _id: String(m._id),
        organizationId: String(m.organizationId),
        role: m.role,
      })),
    });
  } catch (error) {
    console.error('Error fetching organization info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
