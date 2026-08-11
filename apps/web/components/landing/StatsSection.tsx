'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

// Counter component for animated numbers
function Counter({ from, to, duration = 2 }: { from: number, to: number, duration?: number }) {
    const [count, setCount] = useState(from);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!isInView) return;
        
        let startTimestamp: number;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeProgress * (to - from) + from));
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }, [isInView, from, to, duration]);

    return <span ref={ref}>{count}</span>;
}

export function StatsSection() {
    return (
        <section className="relative py-32 px-6 bg-[#0A1118] text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-900/10 rounded-full blur-[100px] mix-blend-screen opacity-30" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4">
                            <Counter from={100} to={0} duration={2.5} />%
                        </div>
                        <h3 className="text-lg font-medium text-teal-400 mb-2">Dead Mileage</h3>
                        <p className="text-sm text-slate-400 font-light leading-relaxed">
                            Our goal for every truck in the network through intelligent matching.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4">
                            <Counter from={0} to={24} duration={2} />/<Counter from={0} to={7} duration={2} />
                        </div>
                        <h3 className="text-lg font-medium text-teal-400 mb-2">AI Assistance</h3>
                        <p className="text-sm text-slate-400 font-light leading-relaxed">
                            TruckNet Dost is always awake, ready to help drivers on the road.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4">
                            <Counter from={0} to={7} duration={1.5} />+
                        </div>
                        <h3 className="text-lg font-medium text-teal-400 mb-2">Indian Languages</h3>
                        <p className="text-sm text-slate-400 font-light leading-relaxed">
                            Speak naturally in your native language via voice interface.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4 flex items-center">
                            <span className="w-4 h-4 rounded-full bg-teal-500 mr-4 animate-pulse" />
                            Live
                        </div>
                        <h3 className="text-lg font-medium text-teal-400 mb-2">Intelligence</h3>
                        <p className="text-sm text-slate-400 font-light leading-relaxed">
                            Real-time GPS, pricing, and predictive maintenance monitoring.
                        </p>
                    </motion.div>

                </div>
            </div>
            
            {/* Transition to next light section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10" />
        </section>
    );
}
