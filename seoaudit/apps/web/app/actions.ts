'use server';

import { cookies } from 'next/headers';

export async function setSelectedOrganization(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set('selectedOrganization', orgId, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function getSelectedOrganization(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('selectedOrganization')?.value || null;
}
