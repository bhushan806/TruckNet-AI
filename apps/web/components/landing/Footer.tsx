'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, PhoneCall, Headphones, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="relative bg-[#070C16] border-t border-slate-800 text-slate-400 text-sm overflow-hidden z-20">
            {/* Top Customer Trust Bar (Replaces developer jargon with real customer value) */}
            <div className="border-b border-slate-800/80 bg-[#0B1120]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-white font-semibold">{t('footer_status')}</span>
                        <span className="text-slate-600 hidden sm:inline">|</span>
                        <span className="text-slate-300 hidden sm:inline">{t('footer_coverage')}</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-300">
                        <div className="flex items-center gap-1.5 text-[#00E5C3]">
                            <Headphones className="h-3.5 w-3.5" />
                            <span>{t('footer_helpline')}</span>
                        </div>
                        <span className="text-slate-600 hidden sm:inline">|</span>
                        <span className="text-slate-400 hidden sm:inline">{t('footer_support_sub')}</span>
                    </div>
                </div>
            </div>

            {/* Main Footer Links */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
                    
                    {/* Brand Column (2 cols on lg) */}
                    <div className="lg:col-span-2 flex flex-col items-start pr-0 lg:pr-8">
                        <Link href="/" className="flex items-center gap-2.5 group mb-4">
                            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00E5C3] shadow-[0_0_15px_rgba(0,229,195,0.2)]">
                                <Truck className="h-5 w-5" />
                            </div>
                            <span className="font-extrabold text-xl text-white font-space tracking-tight">
                                TruckNet <span className="text-[#00E5C3]">India</span>
                            </span>
                        </Link>

                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                            {t('footer_desc')}
                        </p>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <ShieldCheck className="h-4 w-4 text-[#00E5C3]" />
                            <span>{t('footer_verified')}</span>
                        </div>
                    </div>

                    {/* Column 1: Services */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Our Services
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link href="/auth/register?role=CUSTOMER" className="hover:text-white transition-colors">
                                    Book a Full Truck
                                </Link>
                            </li>
                            <li>
                                <Link href="/find-vehicle" className="hover:text-white transition-colors">
                                    Track Your Shipment
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/register?role=DRIVER" className="hover:text-white transition-colors">
                                    Join as Truck Driver
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/register?role=OWNER" className="hover:text-white transition-colors">
                                    Register Your Fleet
                                </Link>
                            </li>
                            <li>
                                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                                    How It Works
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link href="/find-vehicle" className="hover:text-white transition-colors">
                                    Find Available Trucks
                                </Link>
                            </li>
                            <li>
                                <Link href="/rules" className="hover:text-white transition-colors">
                                    Highway Rules & Safety
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/login" className="hover:text-white transition-colors">
                                    Customer Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/register" className="hover:text-white transition-colors">
                                    Create Free Account
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Trust & Safety */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Trust & Safety
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <span className="text-slate-300">Verified Vehicle RC & Fitness</span>
                            </li>
                            <li>
                                <span className="text-slate-300">Safe Payment Protection</span>
                            </li>
                            <li>
                                <span className="text-slate-300">Live GPS Location Sharing</span>
                            </li>
                            <li>
                                <span className="text-slate-300">24/7 Roadside Assistance</span>
                            </li>
                            <li>
                                <Link href="/rules" className="hover:text-white transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <p>
                        © {new Date().getFullYear()} TruckNet India Technologies Pvt. Ltd. All rights reserved.
                    </p>

                    <div className="flex items-center gap-1.5 text-slate-300">
                        <span>{t('footer_made_with')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
