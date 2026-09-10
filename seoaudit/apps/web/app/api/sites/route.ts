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

export async function GET(request: Request) {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If accountId is not in session, resolve it from database using email
  if (!session.user.accountId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Find user by email
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

  if (!session.user.accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const skip = parseInt(url.searchParams.get('skip') || '0');

  try {
    const sites = await siteRepository.listSitesByAccount(session.user.accountId, {
      limit,
      skip,
    });

    const total = await siteRepository.countSitesByAccount(session.user.accountId);

    return NextResponse.json({
      sites,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
