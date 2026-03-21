'use client';

import { motion } from 'framer-motion';
import { Truck, Map, Shield, Zap, CircleDollarSign, BarChart3 } from 'lucide-react';
import { ReactNode } from 'react';

interface FeatureCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

            <div className="relative z-10">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

export function FeatureGrid() {
    const features = [
        {
            icon: <Truck className="w-6 h-6" />,
            title: "Smart Matching",
            description: "Our AI instantly connects your load with the perfect vehicle type, optimizing for size, weight, and route efficiency."
        },
        {
            icon: <Map className="w-6 h-6" />,
            title: "Route Optimization",
            description: "Save time and fuel with AI-calculated routes that account for traffic, weather, and road conditions in real-time."
        },
        {
            icon: <CircleDollarSign className="w-6 h-6" />,
            title: "Fair & Transparent",
            description: "No hidden fees. Get market-standard pricing tailored to your load, with instant quotes and secure payments."
        },
        // Symmetrical 3-column layout implies multiples of 3 for best look at large screens, 
        // or we can stick to just 3 core props as requested. 
        // User asked for "3 core value props" in a 3-column layout.
    ];

    return (
        <section className="w-full py-24 bg-slate-900/50">
            <div className="container px-4 md:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Built for Modern Logistics
                    </h2>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg">
                        Everything you need to manage your shipments and fleet, powered by advanced artificial intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <FeatureCard
                            key={idx}
                            {...feature}
                            delay={idx * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
