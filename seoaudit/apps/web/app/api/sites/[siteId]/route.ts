import { NextResponse } from 'next/server';
import * as siteRepository from '@/lib/repositories/siteRepository';
import { requireSiteAccess } from '@/lib/auth/orgAccess';
import Organization from '@/lib/models/Organization';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    const access = await requireSiteAccess(siteId, 'site.read');
    if (!access.ok) return access.response;

    const site = await siteRepository.getSiteById(siteId);
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const org = await Organization.findById(access.organizationId);

    return NextResponse.json({
      site: {
        ...site,
        organizationName: org?.name || 'Organization',
      },
      role: access.role,
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    const access = await requireSiteAccess(siteId, 'site.delete');
    if (!access.ok) return access.response;

    await Suggestion.deleteMany({ siteId });
    await Page.deleteMany({ siteId });
    await siteRepository.deleteSite(siteId);

    return NextResponse.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}
