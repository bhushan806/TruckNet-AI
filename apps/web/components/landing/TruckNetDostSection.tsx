'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CHAT_SEQUENCE = [
    { type: 'driver', text: "Bhai, find a load from Pune to Nashik for tomorrow." },
    { type: 'dost', text: "Found 3 matches. Best rate is ₹14,000 for 9 tonnes (Steel). Should I book it? 🚚" },
    { type: 'driver', text: "Yes, book it. Also, what's the best route right now?" },
    { type: 'dost', text: "Take NH60. It's clear right now, saving you about 45 mins of traffic. 🗺️" },
    { type: 'driver', text: "When is my next truck service due?" },
    { type: 'dost', text: "Based on your mileage, engine oil change is due in 1,200 km. I'll remind you next week! 🔧" }
];

export function TruckNetDostSection() {
    const [messagesVisible, setMessagesVisible] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setMessagesVisible(prev => {
                if (prev < CHAT_SEQUENCE.length) return prev + 1;
                return prev;
            });
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative py-32 px-6 bg-slate-50 text-slate-900 overflow-hidden">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                
                {/* Text Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="order-2 md:order-1"
                >
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10">
                        <Bot className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-medium text-teal-700 tracking-wide uppercase">TruckNet Dost</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-tight">
                        Your AI companion <br className="hidden md:block" />
                        <span className="text-slate-500">on the road.</span>
                    </h2>
                    
                    <p className="text-lg text-slate-500 max-w-lg mb-8 font-light leading-relaxed">
                        AI that helps you on the road, not gets in the way. Ask for loads, route advice, or maintenance alerts in simple, everyday language.
                    </p>

                    <Link href="/auth/register">
                        <button className="px-6 py-3 bg-white text-slate-900 font-medium rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 shadow-sm flex items-center gap-2 group">
                            Meet Dost
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </motion.div>

                {/* Chat Visual */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="order-1 md:order-2 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-100 to-transparent rounded-3xl transform rotate-3 scale-105 opacity-50 z-0" />
                    
                    <div className="relative z-10 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[480px]">
                        {/* Chat Header */}
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900">TruckNet Dost</div>
                                <div className="text-xs text-teal-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                    Online
                                </div>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 p-6 overflow-hidden bg-slate-50/50 flex flex-col gap-4">
                            {CHAT_SEQUENCE.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: idx < messagesVisible ? 1 : 0, y: idx < messagesVisible ? 0 : 10, scale: idx < messagesVisible ? 1 : 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    className={`flex ${msg.type === 'driver' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        msg.type === 'driver' 
                                        ? 'bg-slate-900 text-white rounded-tr-sm' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transition to next dark section */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A1118] to-transparent z-10" />
        </section>
    );
}
