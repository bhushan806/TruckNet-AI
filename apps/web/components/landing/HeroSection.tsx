'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative w-full py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Glowing Orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Grid Mesh Overlay for texture */}
            <div className="absolute inset-0 bg-grid-mesh opacity-20 pointer-events-none -z-10" />

            <div className="container px-4 md:px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center space-y-6 max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm mb-4">
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                        Reimagining Logistics for India
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-100 to-blue-200">
                            AI Powered Transportation
                        </span>
                    </h1>

                    {/* Subheadline using requested responsive centering */}
                    <p className="mx-auto max-w-[700px] text-slate-400 md:text-xl leading-relaxed">
                        Connect directly with verified truck owners and drivers. Experience precision matching, real-time tracking, and fair transparent pricing.
                    </p>

                    {/* Buttons Stack */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
                        <Link href="/find-vehicle" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_25px_rgba(59,130,246,0.4)] border-0 transition-all hover:scale-105">
                                Find a Vehicle
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/auth/register" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base glass-card text-slate-200 border-white/10 hover:bg-white/5 hover:border-white/20 transition-all">
                                Join as Driver
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Verified Drivers</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Instant Quotes</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
