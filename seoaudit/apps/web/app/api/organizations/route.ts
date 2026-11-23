import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/orgAccess';
import { createOrganizationWithOwner } from '@/lib/org/createOrganization';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const { organization, membership } = await createOrganizationWithOwner(name, user.userId);

    return NextResponse.json(
      { organization, membership },
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
