'use client';

// ── Phone + OTP Login Page ──
// FIX 7: Replaces email/password with 2-step phone OTP flow.
// Step 1: Enter 10-digit Indian mobile number → send OTP
// Step 2: Enter 6-digit OTP → verify and login

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Truck, Phone, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [otpExpiry, setOtpExpiry] = useState(0); // seconds remaining

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timers
    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setInterval(() => setResendTimer(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(t);
    }, [resendTimer]);

    useEffect(() => {
        if (otpExpiry <= 0) return;
        const t = setInterval(() => setOtpExpiry(prev => {
            if (prev <= 1) {
                setError('OTP expire ho gaya. Dobara bhejne ki koshish karo.');
                return 0;
            }
            return prev - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [otpExpiry]);

    // ── Step 1: Send OTP ──
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            setError('Valid 10-digit Indian phone number enter karo (6-9 se shuru hona chahiye).');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/send-otp', { phone: cleanPhone });
            setPhone(cleanPhone);
            setStep('otp');
            setResendTimer(60);
            setOtpExpiry(10 * 60); // 10 minutes
            // Focus first OTP box
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            setError(err.response?.data?.message || 'OTP nahi bheja ja saka. Dobara try karo.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Handle OTP digit input ──
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return; // only digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance to next box
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5 && newOtp.every(d => d)) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            otpInputRefs.current[5]?.focus();
            handleVerifyOtp(pasted);
        }
    };

    // ── Step 2: Verify OTP ──
    const handleVerifyOtp = async (otpString?: string) => {
        const code = otpString || otp.join('');
        if (code.length < 6) {
            setError('6-digit OTP enter karo.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { phone, otp: code });
            const { user, accessToken } = res.data.data;
            login(user, accessToken);

            if (user.role === 'DRIVER') router.push('/dashboard/driver');
            else if (user.role === 'OWNER') router.push('/dashboard/owner');
            else router.push('/dashboard/customer');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Galat OTP. Dobara try karo.';
            setError(msg);
            // Shake animation
            const form = document.getElementById('otp-form');
            form?.classList.add('animate-shake');
            setTimeout(() => form?.classList.remove('animate-shake'), 600);
            // Clear OTP
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setOtp(['', '', '', '', '', '']);
        setError('');
        await handleSendOtp({ preventDefault: () => {} } as any);
    };

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
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
                    <p className="text-slate-400 text-sm mt-1">Bharat ka smart truck network</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">

                    {step === 'phone' && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-white">Login / Register</h2>
                                <p className="text-slate-400 text-sm mt-1">Apna phone number enter karo</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                {/* Phone input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Mobile Number
                                    </label>
                                    <div className="flex">
                                        <div className="flex items-center px-3 bg-slate-800 border border-slate-700 border-r-0 rounded-l-xl text-slate-300 text-sm font-medium">
                                            🇮🇳 +91
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[6-9][0-9]{9}"
                                            maxLength={10}
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="9876543210"
                                            required
                                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-r-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-base"
                                        />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-1">SMS se OTP aayega 📱</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || phone.length < 10}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            OTP bhej raha hai...
                                        </span>
                                    ) : (
                                        <>
                                            OTP Bhejo
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <span className="text-slate-500 text-xs">Admin? </span>
                                <Link href="/auth/login/email" className="text-blue-400 hover:text-blue-300 text-xs underline transition-colors">
                                    Email se login karo
                                </Link>
                            </div>
                        </>
                    )}

                    {step === 'otp' && (
                        <>
                            <div className="mb-6">
                                <button
                                    onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']); }}
                                    className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors"
                                >
                                    ← Wapas jao
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    <h2 className="text-lg font-semibold text-white">OTP Verify Karo</h2>
                                </div>
                                <p className="text-slate-400 text-sm">
                                    <span className="text-white font-medium">+91 {phone}</span> pe 6-digit OTP bheja gaya hai
                                </p>
                                {otpExpiry > 0 && (
                                    <p className="text-slate-500 text-xs mt-1">
                                        OTP {formatTimer(otpExpiry)} mein expire hoga
                                    </p>
                                )}
                            </div>

                            <div id="otp-form" className="space-y-5">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                {/* 6 OTP digit inputs */}
                                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { otpInputRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className={`w-11 h-12 text-center text-xl font-bold bg-slate-800 border rounded-xl text-white focus:outline-none transition-all
                                                ${digit ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'}
                                                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                                                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleVerifyOtp()}
                                    disabled={loading || otp.some(d => !d)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verify ho raha hai...
                                        </span>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            OTP Verify Karo
                                        </>
                                    )}
                                </button>

                                {/* Resend OTP */}
                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-slate-500 text-sm">
                                            Dobara bhejne ke liye{' '}
                                            <span className="text-slate-300 font-medium">{resendTimer}s</span>{' '}
                                            wait karo
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            className="flex items-center gap-1.5 mx-auto text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Dobara OTP Bhejo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Login karke aap hamare{' '}
                    <Link href="/rules" className="text-slate-500 hover:text-slate-400 underline">Terms & Conditions</Link>
                    {' '}se agree karte hain
                </p>
            </div>
        </div>
    );
}
