import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import * as suggestionRepository from '@/lib/repositories/suggestionRepository';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If accountId is not in session, resolve it from database using email
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

  if (!session.user.accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      pageId,
      siteId,
      type = 'seo',
      severity = 'medium',
      content,
    } = body;

    if (!pageId || !siteId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: pageId, siteId, content' },
        { status: 400 }
      );
    }

    // Validate type and severity enums
    const validTypes = ['seo', 'performance', 'accessibility', 'best_practice'];
    const validSeverities = ['critical', 'high', 'medium', 'low'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    await connectMongoose();
    const suggestion = await suggestionRepository.createSuggestion({
      pageId,
      siteId,
      organizationId: session.user.accountId,
      type: type as 'seo' | 'performance' | 'accessibility' | 'best_practice',
      severity: severity as 'critical' | 'high' | 'medium' | 'low',
      title: `Auto-generated ${type} suggestion`,
      description: JSON.stringify(content),
    });

    return NextResponse.json({ suggestion, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
