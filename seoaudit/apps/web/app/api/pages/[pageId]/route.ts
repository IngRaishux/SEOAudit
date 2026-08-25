import { NextResponse } from 'next/server';
import connectMongoose from '@/lib/db/mongoose';
import * as pageRepository from '@/lib/repositories/pageRepository';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  try {
    await connectMongoose();
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
