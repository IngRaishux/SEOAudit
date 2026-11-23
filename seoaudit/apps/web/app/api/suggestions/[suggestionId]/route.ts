import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuggestionAccess } from '@/lib/auth/orgAccess';
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

  try {
    const access = await requireSuggestionAccess(suggestionId, 'content.edit');
    if (!access.ok) return access.response;

    const body = await request.json();
    const parsed = suggestionContentSchema.safeParse(body?.content);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid suggestion content', details: parsed.error.flatten() },
        { status: 400 }
      );
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
