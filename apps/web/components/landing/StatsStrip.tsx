'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Route, Users, ShieldCheck, Clock, IndianRupee, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface StatItemProps {
    value: number;
    suffix: string;
    prefix?: string;
    decimals?: number;
    label: string;
    sublabel: string;
    icon: React.ElementType;
}

function StatCounter({ value, suffix, prefix = '', decimals = 0, label, sublabel, icon: Icon }: StatItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    const count = useMotionValue(0);
    const [displayValue, setDisplayValue] = useState(prefix + '0' + suffix);

    useEffect(() => {
        if (inView) {
            const controls = animate(count, value, {
                duration: 2.2,
                ease: 'easeOut',
                onUpdate: latest => {
                    if (decimals > 0) {
                        setDisplayValue(prefix + latest.toFixed(decimals) + suffix);
                    } else {
                        setDisplayValue(prefix + Math.floor(latest).toLocaleString('en-IN') + suffix);
                    }
                }
            });
            return controls.stop;
        }
    }, [inView, value, decimals, prefix, suffix, count]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-2xl industrial-card relative overflow-hidden group hover:border-teal-500/40"
        >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5C3]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-[#00E5C3] group-hover:scale-105 group-hover:bg-teal-500/20 transition-all">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>VERIFIED</span>
                </div>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-space tracking-tight mb-1">
                {displayValue}
            </div>

            <div className="text-sm font-semibold text-slate-200 mb-0.5">
                {label}
            </div>

            <div className="text-xs text-slate-400">
                {sublabel}
            </div>
        </motion.div>
    );
}

export function StatsStrip() {
    const { t, language } = useLanguage();

    const isEnglish = language === 'en';

    return (
        <section className="relative z-20 py-12 sm:py-16 bg-[#0B1120] border-b border-slate-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header Tag */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 pb-4 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-[#00E5C3]" />
                        <span>{t('stat_trusted')}</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-400">
                        {t('stat_pan_india')}
                    </div>
                </div>

                {/* 4 Customer Value Metric Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCounter
                        value={isEnglish ? 1.2 : 12}
                        decimals={isEnglish ? 1 : 0}
                        prefix=""
                        suffix={isEnglish ? "M+ Km" : " लाख+ किमी"}
                        label={t('stat_km_title')}
                        sublabel={t('stat_km_sub')}
                        icon={Route}
                    />

                    <StatCounter
                        value={500}
                        decimals={0}
                        prefix=""
                        suffix="+"
                        label={t('stat_trucks_title')}
                        sublabel={t('stat_trucks_sub')}
                        icon={Users}
                    />

                    <StatCounter
                        value={98}
                        decimals={0}
                        prefix=""
                        suffix="%"
                        label={t('stat_ontime_title')}
                        sublabel={t('stat_ontime_sub')}
                        icon={Clock}
                    />

                    <StatCounter
                        value={2.4}
                        decimals={1}
                        prefix="₹"
                        suffix={isEnglish ? " Cr" : " करोड़"}
                        label={t('stat_savings_title')}
                        sublabel={t('stat_savings_sub')}
                        icon={IndianRupee}
                    />
                </div>
            </div>
        </section>
    );
}
