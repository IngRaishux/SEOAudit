import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import Site from '@/lib/models/Site';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve accountId if missing
  if (!session.user.accountId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email: session.user.email });

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await connectMongoose();
      const membership = await Membership.findOne({ userId: user._id.toString() });

      if (membership) {
        session.user.id = user._id.toString();
        session.user.accountId = membership.organizationId.toString();
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch (error) {
      console.error('Error resolving accountId:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Verify ownership
  if (session.user.accountId !== orgId) {
    return NextResponse.json(
      { error: 'You can only modify your own organization' },
      { status: 403 }
    );
  }

  // Check if user is owner
  await connectMongoose();
  const membership = await Membership.findOne({
    userId: session.user.id,
    organizationId: orgId,
  });

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only organization owners can update the organization' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const org = await Organization.findByIdAndUpdate(
      orgId,
      { name: name.trim() },
      { new: true }
    );

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoose();

    // Get user ID if missing
    let userId = session.user.id;
    if (!userId) {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user._id.toString();
    }

    // Check if user is owner of the organization
    const membership = await Membership.findOne({
      userId,
      organizationId: orgId,
    });

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owner can delete it' },
        { status: 403 }
      );
    }

    // Delete all suggestions, pages, and sites associated with this organization
    await Suggestion.deleteMany({ organizationId: orgId });
    await Page.deleteMany({ organizationId: orgId });
    await Site.deleteMany({ organizationId: orgId });

    // Delete all memberships for this organization
    await Membership.deleteMany({ organizationId: orgId });

    // Delete the organization itself
    await Organization.findByIdAndDelete(orgId);

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
