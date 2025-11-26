import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for public routes
  const publicPaths = ['/', '/sign-in', '/sign-up', '/join'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/join/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('jira-session');

  // If no session and trying to access protected route, redirect to sign-in
  if (!session) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
