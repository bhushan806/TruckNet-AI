'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

export function FinalCTA() {
    return (
        <section className="relative py-32 px-6 bg-slate-50 text-slate-900 overflow-hidden">
            {/* Subtle Animated Background Network (Light mode) */}
            <div className="absolute inset-0 z-0 opacity-40">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-light" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-light)" />
                    
                    <g className="stroke-slate-200" fill="none" strokeWidth="1">
                        <path d="M-100,100 C300,150 400,300 800,200" />
                        <path d="M-100,300 C200,200 600,400 900,250" />
                    </g>
                    
                    <motion.circle 
                        cx="150" cy="115" r="3" fill="#14b8a6"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.circle 
                        cx="500" cy="335" r="3" fill="#0f766e"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                </svg>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 mb-6">
                        Ready to move smarter?
                    </h2>
                    <p className="text-xl text-slate-500 mb-12 font-light">
                        Bring intelligence to every journey with TruckNet.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/auth/register">
                            <button className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-teal-500/20">
                                Get Started
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <Link href="/auth/register">
                            <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-all duration-300 flex items-center justify-center gap-2">
                                <Bot className="w-4 h-4 text-teal-600" />
                                Talk to TruckNet Dost
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
            
            {/* Smooth transition to footer */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
        </section>
    );
}
