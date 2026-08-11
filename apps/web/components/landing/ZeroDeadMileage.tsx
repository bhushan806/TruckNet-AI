'use client';

import { motion } from 'framer-motion';
import { Package, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ZeroDeadMileage() {
    const [phase, setPhase] = useState<'empty' | 'match'>('empty');

    useEffect(() => {
        const timer = setInterval(() => {
            setPhase(p => p === 'empty' ? 'match' : 'empty');
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative py-32 px-6 bg-[#0A1118] text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[100px] mix-blend-screen opacity-50" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10">
                        <span className="text-xs font-medium text-teal-300 tracking-wide uppercase">Zero Dead Mileage</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.2] mb-6">
                        Turn empty miles into <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">productive miles.</span>
                    </h2>
                    <p className="text-lg text-slate-400 font-light leading-relaxed mb-8">
                        Our intelligence engine identifies return loads before your truck even finishes its current journey. No more waiting. No more empty returns.
                    </p>
                    
                    <div className="space-y-6">
                        <div className={`p-4 rounded-xl border transition-colors duration-500 ${phase === 'empty' ? 'bg-slate-900/50 border-slate-700' : 'bg-transparent border-transparent opacity-50'}`}>
                            <div className="text-sm font-medium text-slate-400 mb-1">Traditional Journey</div>
                            <div className="text-lg font-medium">Deliver → Wait → Return Empty</div>
                        </div>
                        <div className={`p-4 rounded-xl border transition-colors duration-500 ${phase === 'match' ? 'bg-teal-950/30 border-teal-800/50' : 'bg-transparent border-transparent opacity-50'}`}>
                            <div className="text-sm font-medium text-teal-500/80 mb-1">TruckNet Journey</div>
                            <div className="text-lg font-medium text-teal-50">Deliver → Match → Earn on Return</div>
                        </div>
                    </div>
                </motion.div>

                {/* Animated Route Visualization */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="relative aspect-square md:aspect-[4/3] bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden flex items-center justify-center p-8"
                >
                    {/* SVG Map/Routes */}
                    <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible">
                        {/* City Nodes */}
                        <circle cx="100" cy="200" r="6" fill="#475569" />
                        <text x="100" y="225" fill="#94a3b8" fontSize="12" textAnchor="middle">Origin</text>

                        <circle cx="300" cy="100" r="6" fill="#475569" />
                        <text x="300" y="85" fill="#94a3b8" fontSize="12" textAnchor="middle">Destination</text>

                        <circle cx="200" cy="250" r="6" fill="#14b8a6" className={`transition-opacity duration-1000 ${phase === 'match' ? 'opacity-100' : 'opacity-0'}`} />
                        <text x="200" y="275" fill="#5eead4" fontSize="12" textAnchor="middle" className={`transition-opacity duration-1000 ${phase === 'match' ? 'opacity-100' : 'opacity-0'}`}>New Load</text>

                        {/* Outbound Route */}
                        <path d="M100,200 Q200,100 300,100" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                        
                        {/* Return Route (Empty) */}
                        <motion.path 
                            d="M300,100 Q200,180 100,200" 
                            fill="none" 
                            stroke="#ef4444" 
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: phase === 'empty' ? 1 : 0, opacity: phase === 'empty' ? 1 : 0 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* Return Route (Matched) */}
                        <motion.path 
                            d="M300,100 Q250,200 200,250" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: phase === 'match' ? 1 : 0, opacity: phase === 'match' ? 1 : 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                        <motion.path 
                            d="M200,250 Q150,230 100,200" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: phase === 'match' ? 1 : 0, opacity: phase === 'match' ? 1 : 0 }}
                            transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
                        />

                        {/* Truck Icon */}
                        <motion.g 
                            animate={
                                phase === 'empty' 
                                ? { x: [200, -100], y: [-100, 0] } // Fake curve path roughly following Q200,180
                                : { x: [200, 0, -100], y: [-100, 50, 0] }
                            }
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <circle cx="300" cy="100" r="10" fill="#1e293b" />
                            <Truck x="294" y="94" width="12" height="12" color={phase === 'empty' ? '#ef4444' : '#10b981'} />
                        </motion.g>

                        {/* Load Icon */}
                        <motion.g
                            className={`transition-opacity duration-1000 ${phase === 'match' ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <circle cx="200" cy="250" r="12" fill="#042f2e" className="animate-pulse" />
                            <Package x="194" y="244" width="12" height="12" color="#14b8a6" />
                        </motion.g>
                    </svg>

                    <div className="absolute top-6 left-6 right-6 flex justify-between">
                        <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-300">
                            Status: <span className={phase === 'empty' ? 'text-red-400' : 'text-teal-400'}>{phase === 'empty' ? 'Returning Empty' : 'Load Matched'}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Transition to next light section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
        </section>
    );
}
