'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Truck, LogOut, Menu, X, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function Navbar() {
    const { user, loading, logout } = useAuth();
    const { t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const navLinks = [
        { label: t('find_vehicle'), href: '/find-vehicle' },
        { label: t('road_rules'), href: '/rules' },
        { label: t('for_business'), href: '/#for-business' },
        { label: t('how_it_works'), href: '/#how-it-works' },
    ];

    const mobileMenuVariants: Variants = {
        closed: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.25, ease: 'easeOut' }
        },
        open: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut',
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const linkItemVariants: Variants = {
        closed: { opacity: 0, x: -16 },
        open: { opacity: 1, x: 0 }
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-[#0B1120]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.7)]'
                    : 'bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
                
                {/* Left: Brand + Live Status Indicator */}
                <div className="flex items-center gap-3.5">
                    <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-900/40 border border-teal-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,195,0.2)] group-hover:border-teal-400 group-hover:scale-105 transition-all duration-200">
                            <Truck className="h-5 w-5 text-[#00E5C3]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-lg tracking-tight text-white font-space flex items-center gap-1.5">
                                TruckNet <span className="text-[#00E5C3]">India</span>
                            </span>
                            <span className="text-[10px] tracking-wider text-slate-400 uppercase hidden sm:inline-block">
                                {t('smart_network')}
                            </span>
                        </div>
                    </Link>

                    {/* Live Status Pill */}
                    <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-medium text-emerald-400">
                            {t('available_247')}
                        </span>
                        <span className="text-[10px] text-slate-300 border-l border-slate-700 pl-1.5">
                            {t('trucks_online')}
                        </span>
                    </div>
                </div>

                {/* Center: Desktop Nav Links with Animated Underline */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                    {user ? (
                        <>
                            {user.role === 'DRIVER' && (
                                <Link href="/dashboard/driver" className="px-3.5 py-2 text-sm font-medium text-[#00E5C3] hover:text-white transition-colors">
                                    Driver Console
                                </Link>
                            )}
                            {user.role === 'OWNER' && (
                                <>
                                    <Link href="/dashboard/owner" className="px-3.5 py-2 text-sm font-medium text-[#00E5C3] hover:text-white transition-colors">
                                        Fleet Manager
                                    </Link>
                                    <Link href="/dashboard/owner/loads" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        Find Loads
                                    </Link>
                                    <Link href="/dashboard/owner/analytics" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        Analytics
                                    </Link>
                                </>
                            )}
                            {user.role === 'CUSTOMER' && (
                                <>
                                    <Link href="/dashboard/customer" className="px-3.5 py-2 text-sm font-medium text-[#00E5C3] hover:text-white transition-colors">
                                        Dashboard
                                    </Link>
                                    <Link href="/find-vehicle" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        Track Loads
                                    </Link>
                                </>
                            )}
                            <Link href="/rules" className="px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                {t('road_rules')}
                            </Link>
                        </>
                    ) : (
                        navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="relative px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors group"
                                >
                                    <span>{link.label}</span>
                                    <span
                                        className={`absolute bottom-0 left-3 right-3 h-[2px] bg-[#00E5C3] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left ${
                                            isActive ? 'scale-x-100' : ''
                                        }`}
                                    />
                                </Link>
                            );
                        })
                    )}
                </nav>

                {/* Right: Actions + Language Switcher (Desktop & Mobile) */}
                <div className="flex items-center gap-2 sm:gap-3">
                    
                    {/* Desktop Language Switcher */}
                    <div className="hidden sm:block">
                        <LanguageSwitcher variant="header" />
                    </div>

                    {loading ? (
                        <div className="h-9 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                                {user.name} ({user.role})
                            </span>
                            <button
                                onClick={logout}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-all"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t('logout')}</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Ghost Log In */}
                            <Link
                                href="/auth/login"
                                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-200 hover:text-white border border-slate-700/80 hover:border-teal-500/50 bg-slate-900/50 hover:bg-slate-800/80 rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,229,195,0.15)]"
                            >
                                {t('login')}
                            </Link>

                            {/* Solid High-Contrast Get Started (Always visible, responsive size) */}
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0B1120] bg-[#00E5C3] hover:bg-[#05f0cd] rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(0,229,195,0.35)] hover:shadow-[0_0_25px_rgba(0,229,195,0.55)] hover:scale-[1.03] active:scale-[0.97]"
                            >
                                <span>{t('get_started')}</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Link>
                        </>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Full-Screen Slide-in Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={mobileMenuVariants}
                        className="md:hidden fixed inset-x-0 top-18 bottom-0 z-40 bg-[#0B1120]/98 backdrop-blur-2xl border-t border-slate-800 flex flex-col justify-between p-6 overflow-y-auto"
                    >
                        <div className="flex flex-col gap-5">
                            
                            {/* Mobile Language Switcher (Prominent at top) */}
                            <LanguageSwitcher variant="mobile" />

                            {/* Live Mobile Status Bar */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-400">
                                        {t('available_247')}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-300">
                                    {t('trucks_online')}
                                </span>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex flex-col gap-2">
                                {navLinks.map((link) => (
                                    <motion.div key={link.label} variants={linkItemVariants}>
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-between p-3.5 rounded-xl text-base font-medium text-slate-200 hover:text-white hover:bg-slate-900/90 border border-transparent hover:border-slate-800 transition-colors"
                                        >
                                            <span>{link.label}</span>
                                            <ArrowRight className="h-4 w-4 text-slate-500" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </nav>
                        </div>

                        {/* Mobile Auth Actions */}
                        <div className="pt-6 border-t border-slate-800 flex flex-col gap-3">
                            {user ? (
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="w-full py-3.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{t('logout')} ({user.name})</span>
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-3.5 px-4 text-center rounded-xl border border-slate-700 bg-slate-900 text-white font-medium text-sm hover:border-teal-400 transition-colors"
                                    >
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-3.5 px-4 text-center rounded-xl bg-[#00E5C3] text-[#0B1120] font-bold text-sm shadow-[0_0_20px_rgba(0,229,195,0.4)]"
                                    >
                                        {t('book_truck')}
                                    </Link>
                                </>
                            )}
                            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 text-center">
                                <ShieldCheck className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                                <span>{t('verified_safety')}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
