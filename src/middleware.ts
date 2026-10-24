import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const isProtected = pathname.startsWith('/app') || pathname.startsWith('/super-admin');

    if (isProtected) {
      const ggUserCookie = request.cookies.get('gg_user')?.value;
      let isAuthenticated = false;

      if (ggUserCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(ggUserCookie));
          if (parsed && typeof parsed === 'object' && parsed.email) {
            isAuthenticated = true;
          }
        } catch {
          isAuthenticated = false;
        }
      }

      if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return await updateSession(request);
  } catch (error) {
    console.error('Root middleware error caught:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, png, jpg, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
