'use client';

import { motion } from 'framer-motion';

const stats = [
    { label: "Active Drivers", value: "12,000+" },
    { label: "Cities Covered", value: "85+" },
    { label: "Loads Delivered", value: "1.2M+" },
    { label: "Uptime", value: "99.9%" },
];

export function StatsRibbon() {
    return (
        <section className="w-full py-8 border-y border-white/5 bg-slate-900/50 backdrop-blur-sm">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="flex flex-col items-center justify-center text-center"
                        >
                            <span className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                                {stat.value}
                            </span>
                            <span className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-medium">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
