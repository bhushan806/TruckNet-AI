'use client';

import { motion } from 'framer-motion';
import { Languages, Mic, FileText, FastForward, HeartHandshake } from 'lucide-react';

const benefits = [
    { icon: Mic, title: "Voice-first interaction", desc: "Speak naturally in your own language instead of typing." },
    { icon: Languages, title: "7+ Indian languages", desc: "Available in Hindi, Marathi, Tamil, Telugu, and more." },
    { icon: FileText, title: "Less paperwork", desc: "Digital PODs and automated invoicing so you can keep driving." },
    { icon: FastForward, title: "Faster decisions", desc: "Instant load matching and transparent pricing upfront." }
];

export function DriverFirstSection() {
    return (
        <section className="relative py-32 px-6 bg-slate-50 text-slate-900 overflow-hidden">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white">
                            <HeartHandshake className="w-4 h-4 text-teal-600" />
                            <span className="text-xs font-medium text-slate-600 tracking-wide uppercase">Driver-First Design</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6">
                            Technology should make the journey <br className="hidden md:block" />
                            <span className="text-teal-600">easier, not harder.</span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                            Your truck works hard. Your technology should too. We built TruckNet specifically for the people behind the wheel.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
                                <benefit.icon strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">{benefit.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            {/* Transition to next dark section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A1118] to-transparent z-10" />
        </section>
    );
}
