import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/', '/login', '/register', '/api/auth', '/api/register'];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Solo sincronizar cookie con org parameter en rutas permitidas
    const response = NextResponse.next();
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

  // Verificar si es ruta protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
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

  const response = NextResponse.next();

  // Sincronizar cookie con org parameter si existe
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org');

  if (orgId) {
    response.cookies.set('selectedOrganization', orgId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto archivos estáticos
    '/((?!_next|\.static|\.well-known|favicon.ico).*)',
  ],
};
