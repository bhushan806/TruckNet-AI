'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Radio, CheckCircle2, ShieldCheck, ArrowRight, Coins, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export function HowItWorks() {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start center', 'end center'],
    });

    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    const steps = [
        {
            number: '01',
            title: t('hiw_step1_title'),
            subtitle: t('hiw_step1_sub'),
            description: t('hiw_step1_desc'),
            icon: Search,
            highlight: t('hiw_step1_hl'),
            badge: 'Step 1: Booking',
        },
        {
            number: '02',
            title: t('hiw_step2_title'),
            subtitle: t('hiw_step2_sub'),
            description: t('hiw_step2_desc'),
            icon: Radio,
            highlight: t('hiw_step2_hl'),
            badge: 'Step 2: Dispatch',
        },
        {
            number: '03',
            title: t('hiw_step3_title'),
            subtitle: t('hiw_step3_sub'),
            description: t('hiw_step3_desc'),
            icon: Coins,
            highlight: t('hiw_step3_hl'),
            badge: 'Step 3: Safe Delivery',
        },
    ];

    return (
        <section
            id="how-it-works"
            ref={containerRef}
            className="relative py-20 sm:py-28 bg-[#0B1120] border-b border-slate-800/80 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-24">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge mb-4">
                        <Sparkles className="h-3.5 w-3.5 text-[#00E5C3]" />
                        <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                            {t('hiw_badge')}
                        </span>
                    </div>

                    <h2 className="text-fluid-section font-extrabold text-white tracking-tight mb-4 font-space">
                        {t('hiw_title')}
                    </h2>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {t('hiw_sub')}
                    </p>
                </div>

                {/* Timeline Container */}
                <div className="relative">
                    
                    {/* Desktop Horizontal Connecting Line */}
                    <div className="hidden lg:block absolute top-[52px] left-[15%] right-[15%] h-[2px] bg-slate-800 z-0">
                        <motion.div
                            style={{ scaleX, transformOrigin: 'left' }}
                            className="h-full bg-gradient-to-r from-[#00E5C3] via-teal-400 to-[#FF6B35]"
                        />
                    </div>

                    {/* Mobile Vertical Connecting Line */}
                    <div className="lg:hidden absolute top-8 bottom-8 left-[31px] w-[2px] bg-slate-800 z-0">
                        <motion.div
                            style={{ scaleY, transformOrigin: 'top' }}
                            className="w-full bg-gradient-to-b from-[#00E5C3] via-teal-400 to-[#FF6B35]"
                        />
                    </div>

                    {/* 3 Step Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 relative z-10">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ duration: 0.5, delay: idx * 0.15, ease: 'easeOut' }}
                                    className="flex flex-col items-start"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-16 w-16 rounded-2xl bg-[#0B1120] border-2 border-teal-500/40 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,195,0.2)] group-hover:border-[#00E5C3] transition-all">
                                            <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                                                <Icon className="h-7 w-7 text-[#00E5C3]" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#00E5C3] tracking-widest uppercase">
                                                STEP {step.number}
                                            </span>
                                            <span className="text-xs text-slate-300 font-medium">
                                                {step.subtitle}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full p-6 sm:p-7 rounded-2xl industrial-card hover:border-teal-500/40 transition-all flex flex-col justify-between flex-1">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-3 font-space">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                                {step.description}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-[#00E5C3]">
                                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                                <span>{step.highlight}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                                                <span>STAGE:</span>
                                                <span className="text-white font-semibold">{step.badge}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Call to Action strip */}
                <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-[#00E5C3]" />
                        <span className="text-sm text-slate-300">
                            {t('hiw_cta_bar')}
                        </span>
                    </div>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#00E5C3] hover:text-white transition-colors group"
                    >
                        <span>{t('book_truck')}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
