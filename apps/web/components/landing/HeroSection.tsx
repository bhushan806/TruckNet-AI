'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#050B14]">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-teal-900/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-[100px] mix-blend-screen opacity-50" />
            </div>

            {/* Network Visualization Background */}
            <div className="absolute inset-0 z-0 opacity-30">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" />
                        </pattern>
                        <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                            <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Grid */}
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Abstract Highway Lines */}
                    <g className="stroke-teal-500/20" fill="none" strokeWidth="1">
                        <path d="M-100,300 C200,250 400,450 800,300 C1200,150 1400,350 1800,300" />
                        <path d="M-100,500 C300,450 500,250 900,400 C1300,550 1500,350 1900,500" />
                    </g>
                    
                    {/* Animated Route Line */}
                    <motion.path 
                        d="M-100,300 C200,250 400,450 800,300 C1200,150 1400,350 1800,300" 
                        fill="none" 
                        stroke="url(#route-grad)" 
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Nodes (Cities) */}
                    <circle cx="250" cy="285" r="4" fill="#14b8a6" className="animate-pulse" />
                    <circle cx="600" cy="390" r="4" fill="#10b981" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    <circle cx="1050" cy="210" r="4" fill="#0f766e" className="animate-pulse" style={{ animationDelay: '2s' }} />
                </svg>

                {/* Floating Particles (Trucks) */}
                <motion.div 
                    className="absolute top-[285px] left-[250px] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"
                    animate={{ 
                        x: [0, 350, 800], 
                        y: [0, 105, -75],
                        opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-20 pb-12 flex flex-col items-center text-center">
                
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span className="text-xs font-medium text-teal-300 tracking-wide uppercase">AI-Powered Logistics Platform</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1] mb-8 max-w-4xl"
                >
                    Move Smarter.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">
                        Drive Further.
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
                >
                    Logistics intelligence that connects trucks, drivers and businesses — helping every journey become more efficient, transparent, and human.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link href="/auth/register">
                        <button className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                            Get Started
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                    <Link href="#problem">
                        <button className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium rounded-lg border border-slate-800 hover:border-slate-700 transition-all duration-300 flex items-center justify-center gap-2">
                            Explore TruckNet
                        </button>
                    </Link>
                </motion.div>
            </div>
            
            {/* Subtle Gradient Fade to Next Section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
        </section>
    );
}
