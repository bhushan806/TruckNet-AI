'use client';

import { motion } from 'framer-motion';
import { Clock, Fuel, MessageSquareX, Truck, Wrench } from 'lucide-react';

const problems = [
    { icon: Truck, text: "Empty returning trucks", delay: 0.1 },
    { icon: Fuel, text: "Wasted fuel & resources", delay: 0.2 },
    { icon: Clock, text: "Endless waiting time", delay: 0.3 },
    { icon: Wrench, text: "Unplanned maintenance", delay: 0.4 },
    { icon: MessageSquareX, text: "Fragmented communication", delay: 0.5 }
];

export function ProblemSection() {
    return (
        <section id="problem" className="relative py-32 px-6 bg-slate-50 text-slate-900 overflow-hidden">
            <div className="max-w-5xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 mb-6">
                        Every empty kilometre <span className="text-slate-400">costs.</span>
                    </h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
                        The traditional logistics journey is filled with hidden inefficiencies that eat into margins and exhaust drivers.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-32">
                    {problems.map((problem, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: problem.delay }}
                            className="flex flex-col items-center text-center p-6 rounded-2xl bg-white shadow-sm border border-slate-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                                <problem.icon strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{problem.text}</span>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative text-center"
                >
                    {/* Connecting visual element */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-px h-16 bg-gradient-to-b from-transparent to-teal-500" />
                    
                    <h3 className="text-3xl md:text-5xl font-medium tracking-tight text-slate-900">
                        TruckNet connects the <span className="text-teal-600">missing pieces.</span>
                    </h3>
                </motion.div>
            </div>
            
            {/* Transition to next dark section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A1118] to-transparent z-10" />
        </section>
    );
}
