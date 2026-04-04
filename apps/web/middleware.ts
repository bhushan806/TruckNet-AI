// ── Next.js Edge Middleware ──
// FIX 5: Server-side route protection using the HTTP-only access_token cookie.
// Runs at the Edge (before page render) so protected pages never flicker.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/loads',
    '/tracking',
    '/profile',
    '/find-vehicle',
];

// Paths that should redirect authenticated users away (auth pages)
const AUTH_PATHS = [
    '/auth/login',
    '/auth/register',
];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('is_logged_in')?.value;
    const pathname = request.nextUrl.pathname;

    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    const isAuthPage = AUTH_PATHS.some(path => pathname === path);

    // Redirect unauthenticated users away from protected pages
    if (isProtected && !token) {
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl);
    }

    // Redirect authenticated users away from login/register pages
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard/customer', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Apply to all these paths. The regex avoids static files and API routes.
    matcher: [
        '/dashboard/:path*',
        '/loads/:path*',
        '/tracking/:path*',
        '/profile/:path*',
        '/find-vehicle/:path*',
        '/auth/login',
        '/auth/register',
    ],
};
