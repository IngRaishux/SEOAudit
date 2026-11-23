import { NextResponse } from 'next/server';
import { requireSiteAccess } from '@/lib/auth/orgAccess';
import * as suggestionRepository from '@/lib/repositories/suggestionRepository';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    // La organización sale del sitio, no de la sesión
    const access = await requireSiteAccess(String(siteId), 'content.edit');
    if (!access.ok) return access.response;

    const suggestion = await suggestionRepository.createSuggestion({
      pageId,
      siteId,
      organizationId: access.organizationId,
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
