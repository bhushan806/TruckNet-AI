'use client';

// ── Auth Context ──
// Tokens are stored in HTTP-only cookies (set by backend).
// We only store non-sensitive user profile in localStorage as a cache.
// The cookie is sent automatically on every request via withCredentials: true.
//
// AUTH FLOW:
//   login()  → set user state + cookie indicator + push to correct dashboard
//   logout() → clear state + redirect to landing page "/"
//   onMount  → verify session via /auth/me; redirect if user already logged in

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'DRIVER' | 'OWNER' | 'ADMIN';
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User, token?: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: async () => { },
});

/** Derive the correct dashboard path based on user role */
function getDashboardPath(role: User['role']): string {
    if (role === 'DRIVER') return '/dashboard/driver';
    if (role === 'OWNER') return '/dashboard/owner';
    return '/dashboard/customer';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // On app mount: check for cached user profile in localStorage.
        // The actual session validity is confirmed by the HTTP-only cookie the browser sends.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }

        // Verify session is still valid by calling /auth/me
        // This handles the case where the cookie expired between visits.
        api.get('/auth/me')
            .then(res => {
                const freshUser = res.data?.data?.user;
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                }
            })
            .catch(() => {
                // Cookie expired or invalid — clear cached user profile
                localStorage.removeItem('user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (userData: User, token?: string) => {
        // Store non-sensitive user profile in localStorage.
        localStorage.setItem('user', JSON.stringify(userData));

        // Always set the indicator cookie for the Next.js middleware.
        // This must happen BEFORE router.push so the middleware sees it.
        const maxAge = token ? 15 * 60 : 60 * 60 * 24; // 15 min if short-lived token, else 24h
        document.cookie = `is_logged_in=true; path=/; max-age=${maxAge}`;

        // Legacy support: if caller sends token, store it for Authorization header fallback.
        if (token) {
            localStorage.setItem('token', token);
        }

        setUser(userData);

        // ── CRITICAL FIX: immediately navigate to the correct dashboard ──
        // This removes the need for manual refresh after login.
        router.push(getDashboardPath(userData.role));
    };

    const logout = async () => {
        try {
            // Clear this user's chat cache before wiping identity
            if (user?.id) {
                localStorage.removeItem(`chat_${user.id}`);
            }

            // Call backend to clear the HTTP-only cookie and revoke refresh token
            await api.post('/auth/logout');
        } catch {
            // Even if the server call fails, clear local state
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            // Clear indicator cookie
            document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setUser(null);
            // ── FIX: go to landing page, not login page ──
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
