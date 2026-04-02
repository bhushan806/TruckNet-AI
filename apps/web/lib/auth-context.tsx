'use client';

// ── Auth Context ──
// FIX 5: Tokens are now stored in HTTP-only cookies (set by backend).
//         We only store non-sensitive user profile in localStorage as a cache.
//         The cookie is sent automatically on every request via withCredentials: true.

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
    login: () => {},
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // On app mount: check for cached user profile in localStorage.
        // The actual session validity is confirmed by the HTTP-only cookie the browser sends.
        // If cookie is expired, the next API call will return 401 and the interceptor redirects to login.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }

        // Optionally verify session is still valid by calling /api/auth/me
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
        // FIX 5: Only store non-sensitive user profile in localStorage.
        // The JWT is in an HTTP-only cookie set by the backend — do NOT store it in localStorage.
        localStorage.setItem('user', JSON.stringify(userData));

        // Legacy support: if caller still sends token (e.g., mobile flow), store it for
        // the Authorization header fallback in api.ts interceptor.
        if (token) {
            localStorage.setItem('token', token);
        }

        setUser(userData);
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
            setUser(null);
            router.push('/auth/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
