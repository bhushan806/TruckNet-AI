'use client';

// ── Login Page (Email + Password) ──
// Uses POST /auth/login with email and password.
// After successful login, auth context's login() handles the redirect.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Truck, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const { login, user, loading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // If already logged in, go to dashboard immediately
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'DRIVER') router.replace('/dashboard/driver');
            else if (user.role === 'OWNER') router.replace('/dashboard/owner');
            else router.replace('/dashboard/customer');
        }
    }, [user, loading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/auth/login', { email: email.trim(), password });
            const { user: userData, accessToken } = res.data.data;
            // login() sets state, sets cookie, and redirects to the correct dashboard
            login(userData, accessToken);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Show nothing while checking existing session
    if (loading) return null;

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                        <Truck className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">TruckNet India</h1>
                    <p className="text-slate-400 text-sm mt-1">India's smart truck network</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
                        <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-11 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="btn-login"
                            type="submit"
                            disabled={submitting || !email || !password}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </div>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    By signing in, you agree to our{' '}
                    <Link href="/rules" className="text-slate-500 hover:text-slate-400 underline">
                        Terms & Conditions
                    </Link>
                </p>
            </div>
        </div>
    );
}
