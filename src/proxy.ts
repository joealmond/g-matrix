import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: import('next/server').NextRequest) {
  return handleI18nRouting(request);
}
 
export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ['/', '/(hu|en)/:path*', '/((?!_next|api|.*\\..*).*)']
};
