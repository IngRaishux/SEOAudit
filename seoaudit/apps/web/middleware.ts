import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  LANDING_LANGUAGE_HEADER,
  LANGUAGE_COOKIE,
  landingLanguageForPath,
} from '@/lib/i18n/language';
import type { Language } from '@/lib/i18n/ui';

// Landings por idioma: públicas y comparadas por igualdad exacta (/en no debe cubrir /enterprise)
const LANDING_ROUTES = ['/', '/en'];

// Rutas públicas por prefijo que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register', '/api/auth', '/api/register'];

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard',
  '/sites',
  '/crawler',
  '/organizations',
  '/settings',
  '/organization-settings',
  '/api/sites',
  '/api/crawl',
  '/api/organizations',
  '/api/user',
  '/api/suggestions',
  '/api/pages',
];

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function continueRequest(request: NextRequest, landingLanguage: Language | null) {
  // El header de idioma solo lo pone el middleware: se descarta el que mande el cliente
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(LANDING_LANGUAGE_HEADER);
  if (landingLanguage) requestHeaders.set(LANDING_LANGUAGE_HEADER, landingLanguage);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Quien llega por /en sigue en inglés al registrarse o entrar al panel
  if (landingLanguage) {
    response.cookies.set(LANGUAGE_COOKIE, landingLanguage, {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      sameSite: 'lax',
    });
  }

  // Sincronizar cookie con org parameter si existe
  const orgId = request.nextUrl.searchParams.get('org');
  if (orgId) {
    response.cookies.set('selectedOrganization', orgId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const landingLanguage = landingLanguageForPath(pathname);

  const isPublicRoute =
    landingLanguage !== null ||
    LANDING_ROUTES.includes(pathname) ||
    PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!isPublicRoute && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    // Obtener token JWT para validar sesión
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    // Si no hay token (no autenticado), redirigir a login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return continueRequest(request, landingLanguage);
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto archivos estáticos
    '/((?!_next|\.static|\.well-known|favicon.ico).*)',
  ],
};
