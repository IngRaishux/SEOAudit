import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import * as suggestionRepository from '@/lib/repositories/suggestionRepository';
import { toDynamoSuggestion } from '@/lib/dynamoSuggestion';
import type { SEOSuggestion } from '@/lib/generateSEOSuggestions';

export const runtime = 'nodejs';

const dynamoString = z.object({ S: z.string() });

const suggestionContentSchema = z.object({
  slug: dynamoString,
  account: dynamoString,
  canonicalUrl: dynamoString,
  description: dynamoString,
  keywords: z.object({ SS: z.array(z.string()) }),
  alternateLanguages: z.object({ M: z.record(dynamoString) }),
  title: dynamoString,
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  const { suggestionId } = await params;
  const session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    const parsed = suggestionContentSchema.safeParse(body?.content);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid suggestion content', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectMongoose();
    const suggestion = (await suggestionRepository.getSuggestionById(
      suggestionId
    )) as { organizationId: string } | null;

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const membership = await Membership.findOne({
      userId: session.user.id,
      organizationId: suggestion.organizationId,
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await suggestionRepository.updateSuggestion(suggestionId, {
      description: JSON.stringify(toDynamoSuggestion(parsed.data as SEOSuggestion)),
    });

    return NextResponse.json({ suggestion: updated });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
