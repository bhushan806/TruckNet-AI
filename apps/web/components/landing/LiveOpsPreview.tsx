'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, Cpu, Radio, Navigation, MessageSquare, CheckCircle2, Shield, Fuel, Clock, ArrowRight, Truck,
    Mic, Volume2, PhoneCall, Check, X, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export function LiveOpsPreview() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'booking' | 'route' | 'copilot'>('booking');
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    return (
        <section id="live-ops" className="relative py-20 sm:py-28 bg-[#0B1120] border-b border-slate-800/80 overflow-hidden">
            <div className="absolute inset-0 bg-industrial-grid opacity-15 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge mb-4">
                        <Truck className="h-3.5 w-3.5 text-[#00E5C3]" />
                        <span className="text-[11px] font-bold text-[#00E5C3] tracking-wider uppercase">
                            {t('demo_badge')}
                        </span>
                    </div>

                    <h2 className="text-fluid-section font-extrabold text-white tracking-tight mb-4 font-space">
                        {t('demo_title')}
                    </h2>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {t('demo_sub')}
                    </p>
                </div>

                {/* Command Center Window */}
                <div className="max-w-5xl mx-auto rounded-2xl industrial-card border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden">
                    
                    {/* Window Titlebar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className="text-xs text-white font-bold pl-2 border-l border-slate-700">
                                TRUCKNET INDIA — {language === 'hi' ? 'ग्राहक और ड्राइवर पोर्टल' : language === 'mr' ? 'ग्राहक आणि चालक पोर्टल' : 'CUSTOMER & DRIVER PORTAL'}
                            </span>
                        </div>

                        {/* Interactive Tab Selectors */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: 'booking', label: t('demo_tab1'), icon: Truck },
                                { id: 'route', label: t('demo_tab2'), icon: Navigation },
                                { id: 'copilot', label: t('demo_tab3'), icon: MessageSquare },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isActive
                                                ? 'bg-[#00E5C3] text-[#0B1120] font-bold shadow-md'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Window Body with Animated Tab Transitions */}
                    <div className="p-6 sm:p-8 bg-[#0B1120]/95 min-h-[340px]">
                        <AnimatePresence mode="wait">
                            
                            {/* TAB 1: Easy Truck Booking */}
                            {activeTab === 'booking' && (
                                <motion.div
                                    key="booking"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                        <div>
                                            <h4 className="text-lg font-bold text-white font-space">
                                                Available Trucks Ready for Dispatch
                                            </h4>
                                            <p className="text-xs text-slate-300">
                                                Verified trucks matched instantly near your pickup location
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>32 TRUCKS READY NEARBY</span>
                                        </div>
                                    </div>

                                    {/* Customer Load Booking Rows */}
                                    <div className="space-y-3 text-xs">
                                        <div className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00E5C3] font-bold">
                                                    01
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-sm">
                                                        Delhi (Kundli Industrial Area) ➔ Mumbai (Bhiwandi Hub)
                                                    </div>
                                                    <div className="text-slate-300 text-[11px]">
                                                        Cargo: 25 Ton Commercial Goods • Vehicle: 16-Tyre Multi-Axle Truck
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <div className="text-slate-400 text-[10px]">ALL-INCLUSIVE RATE</div>
                                                    <div className="text-white font-bold text-sm">₹64,200 (No Extra Fees)</div>
                                                </div>
                                                <span className="px-3 py-1 rounded bg-teal-500/20 text-[#00E5C3] text-[11px] font-bold border border-teal-500/30">
                                                    VERIFIED TRUCK ASSIGNED
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                                    02
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-sm">
                                                        Pune ➔ Bengaluru (Peenya Industrial Area)
                                                    </div>
                                                    <div className="text-slate-300 text-[11px]">
                                                        Cargo: 18 Ton Industrial Parts • Vehicle: 32ft Closed Container
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <div className="text-slate-400 text-[10px]">ALL-INCLUSIVE RATE</div>
                                                    <div className="text-white font-bold text-sm">₹42,800 (No Extra Fees)</div>
                                                </div>
                                                <span className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                                                    READY TO BOOK
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 2: Route & Savings */}
                            {activeTab === 'route' && (
                                <motion.div
                                    key="route"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                        <div>
                                            <h4 className="text-lg font-bold text-white font-space">
                                                Smart Route Savings: Delhi to Mumbai
                                            </h4>
                                            <p className="text-xs text-slate-300">
                                                How our platform saves hours of travel and cuts transport expenses
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#00E5C3] font-semibold">
                                            <Navigation className="h-4 w-4" />
                                            <span>FASTEST ROUTE SELECTED</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                                            <Fuel className="h-8 w-8 text-amber-400" />
                                            <div>
                                                <div className="text-[11px] text-slate-400 font-semibold">FUEL EXPENSE SAVED</div>
                                                <div className="text-lg font-bold text-white">₹4,250 Saved</div>
                                                <div className="text-[11px] text-emerald-400">Via expressway bypass</div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                                            <Clock className="h-8 w-8 text-[#00E5C3]" />
                                            <div>
                                                <div className="text-[11px] text-slate-400 font-semibold">FASTER ARRIVAL</div>
                                                <div className="text-lg font-bold text-white">2.5 Hours Quicker</div>
                                                <div className="text-[11px] text-slate-300">Avoids city traffic jams</div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                                            <Shield className="h-8 w-8 text-emerald-400" />
                                            <div>
                                                <div className="text-[11px] text-slate-400 font-semibold">FASTAG TOLL PASS</div>
                                                <div className="text-lg font-bold text-white">Instant Toll Clearance</div>
                                                <div className="text-[11px] text-emerald-400">Zero toll booth waiting</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 3: Driver Helper — Voice & Visual-First UI for Low-Literacy Drivers */}
                            {activeTab === 'copilot' && (
                                <motion.div
                                    key="copilot"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                        <div>
                                            <h4 className="text-lg font-bold text-white font-space flex items-center gap-2">
                                                <span>TruckNet Dost — आवाज़ से काम (Voice & 1-Tap UI)</span>
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    ड्राइवर स्पेशल
                                                </span>
                                            </h4>
                                            <p className="text-xs text-slate-300">
                                                ड्राइवर को टाइप करने की ज़रूरत नहीं — सिर्फ बोलें और आवाज़ में जवाब सुनें (Hindi, Marathi, Punjabi, Gujarati)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                                            <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                                            <span>आवाज़ पहचान चालू है (Voice AI Active)</span>
                                        </div>
                                    </div>

                                    {/* Visual Voice Interface Box */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        
                                        {/* Left Box: Voice Dialogue in Hindi / Regional */}
                                        <div className="space-y-3">
                                            {/* Driver Spoken Prompt */}
                                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                                                <div className="h-9 w-9 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/40 flex items-center justify-center text-[#FF6B35] shrink-0">
                                                    <Mic className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                        <span>ड्राइवर ने माइक दबाकर बोला:</span>
                                                        <span className="text-[10px] text-amber-400 font-mono">(Hindi Voice Input)</span>
                                                    </div>
                                                    <p className="text-white text-sm font-medium">
                                                        "दोस्त, गाड़ी खाली हो गई है, जयपुर से अहमदाबाद के लिए वापसी का लोड दिला दो!"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* TruckNet Dost Audio Playback Response */}
                                            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-3">
                                                <button
                                                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                                                    className="h-9 w-9 rounded-full bg-[#00E5C3] text-[#0B1120] flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-lg"
                                                    title="आवाज़ सुनें (Listen Audio)"
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </button>
                                                <div className="flex-1">
                                                    <div className="text-[#00E5C3] text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                                                        <span>TRUCKNET दोस्त ने बोलकर बताया:</span>
                                                        <span className="text-emerald-400 font-mono text-[10px]">🔊 लाउडस्पीकर चालू</span>
                                                    </div>
                                                    <p className="text-slate-100 text-sm font-medium leading-relaxed">
                                                        "हाँ भइया! विश्वकर्मा इंडस्ट्रियल एरिया से 22 टन टाइल्स का लोड है। भाड़ा ₹36,500 पक्का है, माल खाली होते ही खाते में आएगा। नीचे हरा बटन दबाएं।"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Box: Big Visual 1-Tap Load Card (Made for Illiterate / Non-Reading Drivers) */}
                                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                                                        <span className="text-xs font-bold text-white uppercase">
                                                            नया लोड तैयार (New Load Offer)
                                                        </span>
                                                    </div>
                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                                        तुरंत बैंक पेमेंट
                                                    </span>
                                                </div>

                                                {/* Visual Route & Earnings */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                        <MapPin className="h-4 w-4 text-emerald-400" />
                                                        <span>जयपुर (Jaipur) ➔ अहमदाबाद (Ahmedabad)</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                                        <span className="text-xs text-slate-400">कुल भाड़ा (Earning):</span>
                                                        <span className="text-base font-extrabold text-[#00E5C3]">₹36,500</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Big Visual Buttons — Green (Accept) and Red (Reject) */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
                                                >
                                                    <Check className="h-5 w-5 stroke-[3]" />
                                                    <span>हाँ / स्वीकारें (Accept)</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 active:scale-95 transition-all"
                                                >
                                                    <X className="h-5 w-5" />
                                                    <span>नहीं / छोड़ें (Skip)</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Window Footer Actions */}
                    <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-300 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Over 1,200 verified trucks ready to move your goods right now</span>
                        </div>
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5C3] hover:text-white transition-colors"
                        >
                            <span>BOOK A TRUCK IN 1 MINUTE</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    );
}
