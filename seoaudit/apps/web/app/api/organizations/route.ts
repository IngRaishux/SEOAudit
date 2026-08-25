import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Organization from '@/lib/models/Organization';
import Membership from '@/lib/models/Membership';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user ID
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
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    await connectMongoose();

    // Create organization
    const org = new Organization({
      name: name.trim(),
      slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      createdByUserId: session.user.id,
    });
    const savedOrg = await org.save();

    // Create membership with owner role
    const membership = new Membership({
      userId: session.user.id,
      organizationId: savedOrg._id,
      role: 'owner',
    });
    await membership.save();

    return NextResponse.json(
      { organization: savedOrg, membership },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
