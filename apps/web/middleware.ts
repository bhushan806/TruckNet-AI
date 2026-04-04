// ── Next.js Edge Middleware ──
// Server-side route protection using the HTTP-only access_token cookie.
// Runs at the Edge (before page render) so protected pages never flicker.
//
// AUTH FLOW:
//   Unauthenticated + protected route → redirect to "/" (landing page)
//   Authenticated + auth page          → redirect to "/dashboard/customer"

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/loads',
    '/tracking',
    '/profile',
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

    // Redirect unauthenticated users away from protected pages → LANDING PAGE
    if (isProtected && !token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect authenticated users away from login/register pages → DASHBOARD
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
        '/auth/login',
        '/auth/register',
    ],
};
