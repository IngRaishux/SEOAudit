import { NextResponse } from 'next/server';
import { requirePageAccess } from '@/lib/auth/orgAccess';
import * as pageRepository from '@/lib/repositories/pageRepository';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  try {
    const access = await requirePageAccess(pageId, 'site.read');
    if (!access.ok) return access.response;

    const page = await pageRepository.getPageById(pageId);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
