'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, UserCheck, ShieldAlert, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    badgeColor: string;
    icon: React.ElementType;
    iconColor: string;
    bullets: string[];
    ctaText: string;
    ctaHref: string;
    index: number;
}

function FeatureCard({
    title,
    subtitle,
    description,
    badge,
    badgeColor,
    icon: Icon,
    iconColor,
    bullets,
    ctaText,
    ctaHref,
    index,
}: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -8, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl industrial-card group hover:border-[#00E5C3]/40 hover:shadow-[0_20px_50px_-15px_rgba(0,229,195,0.18)]"
        >
            <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#00E5C3]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className={`h-12 w-12 rounded-xl ${iconColor} border flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${badgeColor}`}>
                        {badge}
                    </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 font-space group-hover:text-[#00E5C3] transition-colors">
                    {title}
                </h3>
                <p className="text-xs font-semibold text-[#00E5C3] uppercase tracking-wide mb-4">
                    {subtitle}
                </p>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {description}
                </p>

                <ul className="space-y-3 mb-8 pt-4 border-t border-slate-800/80">
                    {bullets.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-[#00E5C3] flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Link
                href={ctaHref}
                className="w-full inline-flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-sm font-bold text-white group/btn transition-all duration-200"
            >
                <span>{ctaText}</span>
                <ArrowRight className="h-4 w-4 text-[#00E5C3] group-hover/btn:translate-x-1 transition-transform" />
            </Link>
        </motion.div>
    );
}

export function FeatureGrid() {
    const { t } = useLanguage();

    return (
        <section id="for-business" className="relative py-20 sm:py-28 bg-[#0B1120] border-b border-slate-800/80 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-500/5 rounded-full blur-[160px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge mb-4">
                        <Sparkles className="h-3.5 w-3.5 text-[#00E5C3]" />
                        <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                            {t('solutions_badge')}
                        </span>
                    </div>

                    <h2 className="text-fluid-section font-extrabold text-white tracking-tight mb-4 font-space">
                        {t('solutions_title')}
                    </h2>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {t('solutions_sub')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    
                    {/* Card 1: For Businesses */}
                    <FeatureCard
                        index={0}
                        title={t('card_business_title')}
                        subtitle={t('card_business_sub')}
                        description={t('card_business_desc')}
                        badge="FOR BUSINESSES"
                        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/30"
                        icon={Building2}
                        iconColor="bg-blue-500/20 border-blue-500/30"
                        bullets={[
                            t('card_business_b1'),
                            t('card_business_b2'),
                            t('card_business_b3'),
                            t('card_business_b4'),
                        ]}
                        ctaText={t('btn_book_now')}
                        ctaHref="/auth/register?role=CUSTOMER"
                    />

                    {/* Card 2: For Drivers */}
                    <FeatureCard
                        index={1}
                        title={t('card_driver_title')}
                        subtitle={t('card_driver_sub')}
                        description={t('card_driver_desc')}
                        badge="FOR DRIVERS"
                        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        icon={UserCheck}
                        iconColor="bg-emerald-500/20 border-emerald-500/30"
                        bullets={[
                            t('card_driver_b1'),
                            t('card_driver_b2'),
                            t('card_driver_b3'),
                            t('card_driver_b4'),
                        ]}
                        ctaText={t('btn_join_driver')}
                        ctaHref="/auth/register?role=DRIVER"
                    />

                    {/* Card 3: For Fleet Owners */}
                    <FeatureCard
                        index={2}
                        title={t('card_fleet_title')}
                        subtitle={t('card_fleet_sub')}
                        description={t('card_fleet_desc')}
                        badge="FOR FLEET OWNERS"
                        badgeColor="bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30"
                        icon={ShieldAlert}
                        iconColor="bg-[#FF6B35]/20 border-[#FF6B35]/30"
                        bullets={[
                            t('card_fleet_b1'),
                            t('card_fleet_b2'),
                            t('card_fleet_b3'),
                            t('card_fleet_b4'),
                        ]}
                        ctaText={t('btn_register_fleet')}
                        ctaHref="/auth/register?role=OWNER"
                    />

                </div>
            </div>
        </section>
    );
}
