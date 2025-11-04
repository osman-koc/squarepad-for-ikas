import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // Get locale from cookie
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'tr';
  
  console.log('[Middleware] Cookie locale:', locale);
  console.log('[Middleware] URL:', request.url);
  
  // Create intl middleware with dynamic locale
  const handleI18nRouting = createMiddleware({
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    localePrefix: 'never',
    localeDetection: false
  });
  
  const response = handleI18nRouting(request);
  
  // Set the locale header for server components
  response.headers.set('x-locale', locale);
  
  return response;
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - public files (images, etc)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
