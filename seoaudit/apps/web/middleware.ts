import { auth } from '@/lib/auth/auth';

export const middleware = auth;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sites/:path*',
    '/sugerence/:path*',
    '/api/crawl/:path*',
    '/api/sites/:path*',
    '/api/suggestions/:path*',
  ],
};
