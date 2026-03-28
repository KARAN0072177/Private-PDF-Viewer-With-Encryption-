import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const path = request.nextUrl.pathname;

  // 🔐 Basic security headers (safe for everything)
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 🔥 IMPORTANT FIX:
  // Do NOT apply restrictive headers to PDFs (allows iframe)
  if (!path.endsWith('.pdf')) {
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // 🚫 Disable caching for API routes
  if (path.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  // 🔐 HSTS (HTTPS enforcement)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};