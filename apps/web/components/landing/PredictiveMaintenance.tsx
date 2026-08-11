'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PredictiveMaintenance() {
    const [engineHealth, setEngineHealth] = useState(92);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setEngineHealth(prev => prev === 92 ? 88 : prev === 88 ? 91 : 92);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative py-32 px-6 bg-[#0A1118] text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-900/10 rounded-full blur-[100px] mix-blend-screen opacity-40" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto text-center mb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.2] mb-6">
                        Know the problem before <br className="hidden md:block" />
                        <span className="text-slate-500">the breakdown.</span>
                    </h2>
                    <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
                        Real-time telemetry and predictive intelligence keep your fleet on the road. We monitor the vitals so you can focus on the journey.
                    </p>
                </motion.div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
                >
                    {/* Engine Health Card */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Activity className="w-5 h-5 text-teal-500" />
                                <span className="font-medium">Engine Health</span>
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">Optimal</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <motion.span 
                                className="text-5xl font-light tracking-tight text-white"
                                animate={{ opacity: [1, 0.8, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {engineHealth}%
                            </motion.span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 mt-6 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-teal-500"
                                animate={{ width: `${engineHealth}%` }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                            />
                        </div>
                    </div>

                    {/* Service Due Card */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Settings className="w-5 h-5 text-slate-400" />
                                <span className="font-medium">Service Due</span>
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">Scheduled</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-light tracking-tight text-white">1,200 km</span>
                            <span className="text-sm text-slate-500">Next: Oil & Filter Change</span>
                        </div>
                        <div className="flex items-center gap-2 mt-6 text-sm text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-teal-500" />
                            Booking confirmed for 14th Aug
                        </div>
                    </div>

                    {/* Tyre Condition Card */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-400 opacity-80" />
                                <span className="font-medium">Tyre Condition</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Front Axle</div>
                                <div className="text-lg font-medium text-slate-200">Good</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Rear Axle</div>
                                <div className="text-lg font-medium text-slate-200">Fair</div>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Risk Card */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3 text-slate-300">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <span className="font-medium">Risk Assessment</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 relative z-10 leading-relaxed">
                            <span className="text-amber-400 font-medium">Low risk of breakdown.</span> Alternator voltage showed slight fluctuation yesterday. Monitoring closely.
                        </p>
                    </div>
                </motion.div>
            </div>
            
            {/* Transition to next light section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
        </section>
    );
}
