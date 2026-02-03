import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define Public Routes (paths that don't require auth)
    // - /login, /signup
    // - /api (APIs handle their own auth)
    // - /_next (static assets)
    // - /favicon.ico, /images, etc. (static files)
    // - /bills/[id]/view (Public Bill View)
    // - /reports/[id]/view (Public Report View)

    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        // Check for public view pages using regex or pattern matching
        // Matches /bills/anything/view or /reports/anything/view
        /^\/bills\/[^/]+\/view$/.test(pathname) ||
        /^\/reports\/[^/]+\/view$/.test(pathname);

    // 2. Check for Token (refreshToken isHttpOnly, so we check that)
    // The previous implementation stored 'token' (access token) in localStorage (which middleware can't see)
    // BUT we also set 'refreshToken' and 'token' in cookies in the login route.
    // Let's check for 'refreshToken' as the true session indicator.

    // Note: In login route I set:
    // response.cookies.set('refreshToken', ...);
    // response.cookies.set('token', ...); <-- access token

    const hasSession = request.cookies.has('refreshToken');

    // 3. Logic
    if (!isPublicRoute && !hasSession) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url);
        // Optional: Add ?from=pathname to redirect back after login
        return NextResponse.redirect(loginUrl);
    }

    if ((pathname === '/login' || pathname === '/signup') && hasSession) {
        // If already logged in, redirect to dashboard
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
