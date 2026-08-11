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
//
// ROLE SWITCHING (Admin only):
//   viewingAs — frontend-only view state. NEVER changes JWT or DB role.
//   setViewingAs() — persisted in sessionStorage (survives navigation, not refresh)
//   Admin identity always remains ADMIN in the backend.

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

type ViewingAsRole = 'CUSTOMER' | 'DRIVER' | 'OWNER' | null;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User, token?: string) => void;
    logout: () => Promise<void>;
    // ── Admin Role Switching (frontend-only view state) ──
    viewingAs: ViewingAsRole;
    setViewingAs: (role: ViewingAsRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: async () => { },
    viewingAs: null,
    setViewingAs: async () => { },
});

/** Derive the correct dashboard path based on user role */
function getDashboardPath(role: User['role']): string {
    if (role === 'ADMIN') return '/dashboard/admin';
    if (role === 'DRIVER') return '/dashboard/driver';
    if (role === 'OWNER') return '/dashboard/owner';
    return '/dashboard/customer';
}

/** Derive the dashboard path for a viewing role */
function getViewingDashboardPath(role: ViewingAsRole): string {
    if (role === 'DRIVER') return '/dashboard/driver';
    if (role === 'OWNER') return '/dashboard/owner';
    if (role === 'CUSTOMER') return '/dashboard/customer';
    return '/dashboard/admin';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewingAs, setViewingAsState] = useState<ViewingAsRole>(null);
    const router = useRouter();

    useEffect(() => {
        // Restore viewingAs from sessionStorage (survives navigation, not page refresh)
        const savedViewingAs = sessionStorage.getItem('admin_viewing_as') as ViewingAsRole | null;
        if (savedViewingAs) setViewingAsState(savedViewingAs);

        // On app mount: check for cached user profile in localStorage.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }

        // Only verify session via /auth/me if there's a plausible active session.
        const hasSessionIndicator = document.cookie.includes('is_logged_in=true');
        if (!hasSessionIndicator && !storedUser) {
            setLoading(false);
            return;
        }

        api.get('/auth/me')
            .then(res => {
                const freshUser = res.data?.data?.user;
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                }
            })
            .catch(() => {
                localStorage.removeItem('user');
                document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                setUser(null);
                setViewingAsState(null);
                sessionStorage.removeItem('admin_viewing_as');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (userData: User, token?: string) => {
        localStorage.setItem('user', JSON.stringify(userData));
        const maxAge = token ? 15 * 60 : 60 * 60 * 24;
        document.cookie = `is_logged_in=true; path=/; max-age=${maxAge}`;
        if (token) localStorage.setItem('token', token);
        setUser(userData);
        router.push(getDashboardPath(userData.role));
    };

    const logout = async () => {
        try {
            if (user?.id) localStorage.removeItem(`chat_${user.id}`);
            await api.post('/auth/logout');
        } catch {
            // Even if server call fails, clear local state
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('admin_viewing_as');
            document.cookie = 'is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setUser(null);
            setViewingAsState(null);
            router.push('/');
        }
    };

    /**
     * Admin-only: set the role being previewed in the dashboard.
     * SECURITY:
     *   - Only works when the real user role is ADMIN.
     *   - Does NOT change the JWT, DB role, or any authorization.
     *   - Backend always sees the real ADMIN identity.
     *   - The viewingAs value CANNOT grant any privileges.
     */
    const setViewingAs = async (role: ViewingAsRole) => {
        // SECURITY: only admin can use role switching
        if (user?.role !== 'ADMIN') return;

        setViewingAsState(role);

        if (role) {
            sessionStorage.setItem('admin_viewing_as', role);
        } else {
            sessionStorage.removeItem('admin_viewing_as');
        }

        // Record the role-switch event on the backend for audit
        try {
            await api.post('/admin/view-as-role', { role });
        } catch {
            // Non-fatal — audit logging failure should not block UI
        }

        // Navigate to the appropriate dashboard
        router.push(getViewingDashboardPath(role));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, viewingAs, setViewingAs }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
