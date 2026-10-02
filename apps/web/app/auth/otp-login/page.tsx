'use client';

// ── OTP Login/Register Page ──
// Two-step flow:
//   Step 1: Enter phone number → "Send OTP"
//   Step 2: Enter 6-digit OTP (+ name/role if new user) → "Verify"
//
// Uses POST /auth/otp/send and POST /auth/otp/verify.
// On success, auth context login() handles redirect (same as email flow).

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Truck, ArrowRight, Phone, Shield, User, ChevronDown } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function OtpLoginPage() {
    const { login } = useAuth();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'CUSTOMER' | 'DRIVER' | 'OWNER'>('CUSTOMER');
    const [isNewUser, setIsNewUser] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError('Please enter a valid 10-digit Indian phone number.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/auth/otp/send', { phone });
            setSuccessMsg('OTP sent to your phone!');
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = { phone, otp };
            // Include name and role for new user registration
            if (isNewUser) {
                if (!name.trim()) {
                    setError('Please enter your name.');
                    setSubmitting(false);
                    return;
                }
                payload.name = name.trim();
                payload.role = role;
            }

            const res = await api.post('/auth/otp/verify', payload);
            const { user: userData } = res.data.data;
            login(userData);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
            // If the server says name/role are required, show the new user fields
            if (msg.includes('Name and role are required')) {
                setIsNewUser(true);
                setError('Looks like you\'re new! Please enter your name and select your role.');
            } else {
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

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
                    <p className="text-slate-400 text-sm mt-1">Login with your phone number</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white">
                            {step === 'phone' ? 'Enter Phone Number' : 'Verify OTP'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {step === 'phone'
                                ? 'We\'ll send you a one-time password'
                                : `OTP sent to +91 ${phone}`}
                        </p>
                    </div>

                    {step === 'phone' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                                    <input
                                        id="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="9876543210"
                                        required
                                        maxLength={10}
                                        className="w-full pl-[4.5rem] pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                id="btn-send-otp"
                                type="submit"
                                disabled={submitting || phone.length !== 10}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending OTP...
                                    </span>
                                ) : (
                                    <>
                                        Send OTP
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-xl">
                                    {successMsg}
                                </div>
                            )}

                            {/* OTP Input */}
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                                    Enter OTP
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        required
                                        maxLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm tracking-[0.3em] text-center font-mono text-lg"
                                    />
                                </div>
                            </div>

                            {/* New User Fields (shown when server says name/role required) */}
                            {isNewUser && (
                                <>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Your full name"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                                            I am a
                                        </label>
                                        <div className="relative">
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                            <select
                                                id="role"
                                                value={role}
                                                onChange={e => setRole(e.target.value as any)}
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                                            >
                                                <option value="CUSTOMER">Customer (Book Trucks)</option>
                                                <option value="DRIVER">Driver (Find Loads)</option>
                                                <option value="OWNER">Vehicle Owner (Manage Fleet)</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                id="btn-verify-otp"
                                type="submit"
                                disabled={submitting || otp.length !== 6}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    <>
                                        Verify & Sign In
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            {/* Resend / Change Number */}
                            <div className="flex justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setOtp(''); setError(''); setSuccessMsg(''); }}
                                    className="text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Change number
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setError('');
                                        try {
                                            await api.post('/auth/otp/send', { phone });
                                            setSuccessMsg('New OTP sent!');
                                        } catch (err: any) {
                                            setError(err.response?.data?.message || 'Failed to resend OTP.');
                                        }
                                    }}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Link to email login */}
                    <div className="mt-5 text-center text-sm text-slate-500">
                        Prefer email?{' '}
                        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Sign in with password
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
