'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export function FinalCTA() {
    const { t } = useLanguage();

    return (
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#0B1120] border-b border-slate-800/80 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#00E5C3]/10 to-[#FF6B35]/10 rounded-full blur-[140px]" />
                <div className="absolute inset-0 bg-industrial-grid opacity-20" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="p-8 sm:p-14 rounded-3xl industrial-card border border-teal-500/30 shadow-[0_25px_60px_-15px_rgba(0,229,195,0.2)] text-center relative overflow-hidden">
                    
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5C3] to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge mb-6">
                            <Sparkles className="h-3.5 w-3.5 text-[#00E5C3]" />
                            <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                                {t('cta_badge')}
                            </span>
                        </div>

                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 font-space">
                            {t('cta_title')}
                        </h2>

                        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            {t('cta_sub')}
                        </p>

                        {/* Anchored CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
                            <Link
                                href="/auth/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#FF6B35] hover:bg-[#ff7e4d] shadow-[0_0_25px_rgba(255,107,53,0.4)] hover:shadow-[0_0_35px_rgba(255,107,53,0.65)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 min-h-[48px]"
                            >
                                <span>{t('cta_btn_book')}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                href="/find-vehicle"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-semibold text-slate-200 hover:text-white border border-slate-700 hover:border-[#00E5C3] bg-slate-900/80 hover:bg-slate-800 transition-all duration-200 min-h-[48px]"
                            >
                                <span>{t('cta_btn_track')}</span>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#00E5C3]" />
                                <span>{t('cta_b1')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#00E5C3]" />
                                <span>{t('cta_b2')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#00E5C3]" />
                                <span>{t('cta_b3')}</span>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </section>
    );
}
