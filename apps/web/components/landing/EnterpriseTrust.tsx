'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Landmark, Server, FileCheck2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function EnterpriseTrust() {
    const { t } = useLanguage();

    const trustPoints = [
        {
            title: t('trust_p1_title'),
            description: t('trust_p1_desc'),
            icon: Landmark,
        },
        {
            title: t('trust_p2_title'),
            description: t('trust_p2_desc'),
            icon: Lock,
        },
        {
            title: t('trust_p3_title'),
            description: t('trust_p3_desc'),
            icon: Server,
        },
        {
            title: t('trust_p4_title'),
            description: t('trust_p4_desc'),
            icon: FileCheck2,
        },
    ];

    return (
        <section className="relative py-20 sm:py-24 bg-[#0B1120] border-b border-slate-800/80 overflow-hidden">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge mb-4">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#00E5C3]" />
                        <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                            {t('trust_badge')}
                        </span>
                    </div>

                    <h2 className="text-fluid-section font-extrabold text-white tracking-tight mb-4 font-space">
                        {t('trust_title')}
                    </h2>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {t('trust_sub')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {trustPoints.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-6 sm:p-8 rounded-2xl industrial-card group hover:border-[#00E5C3]/40 flex items-start gap-5"
                            >
                                <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-[#00E5C3] group-hover:scale-110 transition-transform">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2 font-space group-hover:text-[#00E5C3] transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
