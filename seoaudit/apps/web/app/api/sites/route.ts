import { NextResponse } from 'next/server';
import * as siteRepository from '@/lib/repositories/siteRepository';
import { requireOrgAccess } from '@/lib/auth/orgAccess';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await requireOrgAccess(url.searchParams.get('org'), 'site.read');
  if (!access.ok) return access.response;

  const limit = parseInt(url.searchParams.get('limit') || '10');
  const skip = parseInt(url.searchParams.get('skip') || '0');

  try {
    const sites = await siteRepository.listSitesByAccount(access.organizationId, {
      limit,
      skip,
    });

    const total = await siteRepository.countSitesByAccount(access.organizationId);

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
