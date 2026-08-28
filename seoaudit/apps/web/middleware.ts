import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Sincronizar cookie con org parameter si existe
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org');

  if (orgId) {
    response.cookies.set('selectedOrganization', orgId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}
