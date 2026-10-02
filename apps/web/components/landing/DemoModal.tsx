'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative w-full max-w-2xl rounded-2xl bg-[#0B1120] border border-slate-700 p-6 sm:p-8 shadow-2xl overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-7 w-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                            <Play className="h-3.5 w-3.5 text-[#00E5C3] fill-current" />
                        </div>
                        <span className="text-xs font-bold text-[#00E5C3] uppercase tracking-wider">
                            1-Minute Platform Overview
                        </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 font-space">
                        How TruckNet Makes Transport Easy & Safe
                    </h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Learn how businesses and transporters book verified commercial trucks, track shipments live on GPS, and save money with zero middleman fees.
                    </p>

                    {/* Step-by-step simple preview cards */}
                    <div className="space-y-3 mb-8">
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300 mt-0.5">
                                1
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Enter Your Cargo Details</h4>
                                <p className="text-xs text-slate-300 mt-0.5">Tell us where you want to pick up and drop goods. Get an instant, transparent price estimate with no hidden broker cuts.</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300 mt-0.5">
                                2
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Connect with a Verified Driver</h4>
                                <p className="text-xs text-slate-300 mt-0.5">A nearby verified driver accepts your load. You receive their verified vehicle RC, driver phone number, and commercial permits right away.</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300 mt-0.5">
                                3
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Track Live GPS & Confirm Safe Delivery</h4>
                                <p className="text-xs text-slate-300 mt-0.5">Follow the truck's exact location on your mobile screen. Once your goods arrive in perfect condition, confirm with an OTP to pay safely.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Free to create an account • No advance deposit</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                            <Link
                                href="/auth/register"
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#00E5C3] text-[#0B1120] font-bold text-sm hover:bg-[#05f0cd] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(0,229,195,0.3)]"
                            >
                                <span>Book a Truck Free</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
