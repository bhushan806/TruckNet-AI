'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Shield, Sparkles } from 'lucide-react';
import { HeroVisual3D } from './HeroVisual3D';
import { DemoModal } from './DemoModal';
import { useLanguage } from '@/lib/language-context';

const TRUST_LOGOS = [
    { name: 'Tata Motors Fleets', corridor: 'Delhi-Mumbai Express' },
    { name: 'Ashok Leyland Logistics', corridor: 'Western Route' },
    { name: 'Delhivery Surface Network', corridor: 'North-South Corridor' },
    { name: 'BlueDart Surface Express', corridor: 'All India Network' },
    { name: 'Mahindra Logistics Partners', corridor: 'Central Corridor' },
];

export function HeroSection() {
    const { t } = useLanguage();
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.15
            }
        }
    };

    const wordVariants: Variants = {
        hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.5,
                ease: 'easeOut'
            }
        }
    };

    return (
        <>
            <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0B1120] border-b border-slate-800/80 pt-8 sm:pt-12 pb-16 sm:pb-20 lg:pb-24">
                
                {/* Layered Background Ambience */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-industrial-grid opacity-20" />
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00E5C3]/10 rounded-full blur-[140px] pointer-events-none" />
                    <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] bg-[#FF6B35]/10 rounded-full blur-[160px] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1120]/40 to-[#0B1120]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* LEFT COLUMN: Authority, Value Proposition, Anchored CTAs */}
                        <div className="lg:col-span-7 flex flex-col items-start text-left">
                            
                            {/* Simple, Clear Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge shadow-[0_0_15px_rgba(0,229,195,0.15)]"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-[#00E5C3]" />
                                <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                                    {t('hero_badge')}
                                </span>
                            </motion.div>

                            {/* Left-Aligned Headline */}
                            <motion.h1
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="text-fluid-hero font-extrabold text-white tracking-tight leading-[1.08] mb-6 font-space"
                            >
                                <motion.span variants={wordVariants} className="inline-block mr-2 text-white">
                                    {t('hero_h1_1')}
                                </motion.span>
                                <br />
                                <motion.span
                                    variants={wordVariants}
                                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#00E5C3] via-teal-300 to-emerald-400"
                                >
                                    {t('hero_h1_2')}
                                </motion.span>
                            </motion.h1>

                            {/* Easy, Simple, High-Value Sub-Headline */}
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                                className="text-base sm:text-lg lg:text-xl text-[#94A3B8] font-normal leading-relaxed max-w-xl mb-8"
                            >
                                {t('hero_sub')}
                            </motion.p>

                            {/* Anchored Business CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
                                className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10"
                            >
                                <Link
                                    href="/auth/register"
                                    className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-[#0B1120] bg-[#00E5C3] hover:bg-[#05f0cd] transition-all duration-200 shadow-[0_0_25px_rgba(0,229,195,0.4)] hover:shadow-[0_0_35px_rgba(0,229,195,0.65)] hover:scale-[1.03] active:scale-[0.97] min-h-[48px]"
                                >
                                    <span>{t('btn_start_free')}</span>
                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </Link>

                                <Link
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-200 hover:text-white border border-slate-700 hover:border-[#00E5C3]/60 bg-slate-900/60 hover:bg-slate-800/80 transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,195,0.15)] min-h-[48px]"
                                >
                                    <span>{t('btn_how_it_works')}</span>
                                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                                </Link>

                                <button
                                    onClick={() => setIsDemoOpen(true)}
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-[#00E5C3] transition-colors group sm:ml-2 min-h-[44px]"
                                >
                                    <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-[#00E5C3] group-hover:bg-teal-500/10 transition-colors">
                                        <Play className="h-3 w-3 text-[#00E5C3] fill-current" />
                                    </div>
                                    <span>{t('btn_watch_demo')}</span>
                                </button>
                            </motion.div>

                            {/* Trust Bar */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="w-full pt-6 border-t border-slate-800/80"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-4 w-4 text-[#00E5C3]" />
                                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        {t('trust_bar_label')}
                                    </span>
                                </div>

                                <div className="relative overflow-hidden w-full max-w-lg py-1">
                                    <div className="animate-marquee flex items-center gap-8">
                                        {[...TRUST_LOGOS, ...TRUST_LOGOS].map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800"
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#00E5C3]" />
                                                <span className="text-white font-medium">{item.name}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-400">{item.corridor}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: Interactive Live Logistics Visual */}
                        <div className="lg:col-span-5 w-full flex items-center justify-center">
                            <HeroVisual3D />
                        </div>

                    </div>
                </div>
            </section>

            <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
        </>
    );
}
