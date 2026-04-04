'use client';

// ── TruckNet India — Landing Page ──
// FIX 11: Complete rebuild with all 6 required sections.
// Hero → User Cards → How It Works → Dost Chat Preview → Stats → Footer

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Truck, Package, Users, MapPin, ArrowRight, CheckCircle2,
    Star, Shield, Zap, Brain, Phone, ChevronRight, MessageCircle,
    TrendingUp, Navigation, Clock, IndianRupee
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// ── Animated Counter Hook ──
function useCountUp(target: number, duration = 2000, startTrigger = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startTrigger) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration, startTrigger]);
    return count;
}

// ── Mock Chat conversation ──
const DEMO_CHAT = [
    { role: 'assistant', content: 'Hello! I am TruckNet Dost. How can I help you today? 🚛' },
    { role: 'user', content: 'What is the best route from Mumbai to Pune?' },
    { role: 'assistant', content: 'The Expressway (NH48) is best for Mumbai → Pune. Distance: 150km, Time: ~2.5 hours. Toll: ₹295 approx. Fuel estimate: ₹800. Any other questions? 🗺️' },
    { role: 'user', content: 'Tell me the freight price for 5 tonnes' },
    { role: 'assistant', content: 'The rate for 5 tonne freight on the Mumbai-Pune route is ₹12,000-₹15,000. It can be 20% more during peak season. Post on TruckNet for the best bid! 💰' },
];

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const statsRef = useRef<HTMLDivElement>(null);
    const [statsVisible, setStatsVisible] = useState(false);
    const [chatStep, setChatStep] = useState(0);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push(`/dashboard/${user.role.toLowerCase()}`);
        }
    }, [user, loading, router]);

    // Animate chat messages one by one
    useEffect(() => {
        if (chatStep >= DEMO_CHAT.length) return;
        const t = setTimeout(() => setChatStep(prev => prev + 1), 1200 + chatStep * 400);
        return () => clearTimeout(t);
    }, [chatStep]);

    // Intersection observer for stats counter
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const loadsCount = useCountUp(10000, 2000, statsVisible);
    const ownersCount = useCountUp(500, 2000, statsVisible);
    const citiesCount = useCountUp(50, 1500, statsVisible);
    const ratingCount = useCountUp(48, 2000, statsVisible);

    if (loading || user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

            {/* ══════════════════════════════════════════════════
                SECTION 1 — HERO
            ══════════════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4">
                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-500/10 blur-[130px] rounded-full" />
                    {/* India map outline (SVG dots) */}
                    <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 800 600">
                        <path d="M 400 80 C 450 90 500 120 520 160 C 540 200 530 240 510 270 C 490 300 470 310 480 350 C 490 390 500 420 480 450 C 460 480 420 490 400 500 C 380 490 340 480 320 450 C 300 420 310 390 320 350 C 330 310 310 300 290 270 C 270 240 260 200 280 160 C 300 120 350 90 400 80 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                        {/* Route lines */}
                        <line x1="300" y1="200" x2="500" y2="300" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" />
                        <line x1="350" y1="350" x2="450" y2="250" stroke="#10B981" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" style={{animationDelay:'0.5s'}} />
                        <circle cx="300" cy="200" r="4" fill="#3B82F6" className="animate-ping" />
                        <circle cx="500" cy="300" r="4" fill="#10B981" className="animate-ping" style={{animationDelay:'0.7s'}} />
                    </svg>
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Indian Logistics Revolution
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-100 to-blue-300">
                            India's Smartest
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                            Truck Network
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        AI-powered load matching, real-time GPS tracking, aur guaranteed payments —<br className="hidden md:block" />
                        everything in one place. 🚛
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link href="/auth/register">
                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl text-base shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95">
                                <Package className="h-5 w-5" />
                                Post a Load
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </Link>
                        <Link href="/find-vehicle">
                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold rounded-2xl text-base border border-slate-700 hover:border-slate-600 transition-all hover:scale-105 active:scale-95">
                                <Truck className="h-5 w-5 text-blue-400" />
                                Find a Truck
                            </button>
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                        {[
                            { icon: Shield, text: 'Verified Drivers' },
                            { icon: Zap, text: '2 min Matching' },
                            { icon: Star, text: '4.8★ Rating' },
                            { icon: CheckCircle2, text: 'Secure Payments' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4 text-emerald-500" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 2 — THREE USER CARDS
            ══════════════════════════════════════════════════ */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            A solution for everyone
                        </h2>
                        <p className="text-slate-400 text-lg">Whether you're a customer, fleet owner, or driver — TruckNet helps you all</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Package,
                                color: 'from-blue-600 to-blue-700',
                                glow: 'blue',
                                title: 'Customer / Factory',
                                tagline: 'Post your load',
                                benefits: [
                                    'Post a load, get the best truck in 2 mins',
                                    'Real-time GPS tracking',
                                    'Guaranteed delivery with insurance',
                                ],
                                cta: 'Post a Load',
                                href: '/auth/register?role=CUSTOMER',
                            },
                            {
                                icon: Users,
                                color: 'from-violet-600 to-violet-700',
                                glow: 'violet',
                                title: 'Fleet Owner',
                                tagline: 'Manage your fleet',
                                benefits: [
                                    'Find the best loads automatically with AI',
                                    'Track driver performance',
                                    'Earning analytics & reports',
                                ],
                                cta: 'Register Fleet',
                                href: '/auth/register?role=OWNER',
                            },
                            {
                                icon: Truck,
                                color: 'from-emerald-600 to-emerald-700',
                                glow: 'emerald',
                                title: 'Driver',
                                tagline: 'Earn more, drive safely',
                                benefits: [
                                    'Get help from Dost AI anytime',
                                    'Get best route suggestions',
                                    'Emergency SOS feature available',
                                ],
                                cta: 'Join as a Driver',
                                href: '/auth/register?role=DRIVER',
                            },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5 shadow-lg`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                                <p className="text-slate-400 text-sm mb-5">{card.tagline}</p>

                                <ul className="space-y-2.5 mb-6">
                                    {card.benefits.map((b, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>

                                <Link href={card.href}>
                                    <button className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r ${card.color} text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all`}>
                                        {card.cta}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 3 — HOW IT WORKS
            ══════════════════════════════════════════════════ */}
            <section className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How does it work?</h2>
                    <p className="text-slate-400 mb-12">Delivery completed in 3 simple steps</p>

                    <div className="grid md:grid-cols-3 gap-6 relative">
                        {/* Connector lines */}
                        <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500/50 via-violet-500/50 to-emerald-500/50" />
                        <div className="hidden md:block absolute top-8 left-3/4 right-0 h-0.5 bg-gradient-to-r from-violet-500/50 to-emerald-500/50" />

                        {[
                            {
                                step: '01',
                                icon: Package,
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/10 border-blue-500/20',
                                title: 'Post a Load',
                                desc: 'Enter your load details — pickup, delivery, weight, goods type. It takes just 2 minutes!',
                            },
                            {
                                step: '02',
                                icon: Brain,
                                color: 'text-violet-400',
                                bg: 'bg-violet-500/10 border-violet-500/20',
                                title: 'AI Finds a Match',
                                desc: 'Our AI engine finds the best available trucks and gets real-time quotes.',
                            },
                            {
                                step: '03',
                                icon: CheckCircle2,
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10 border-emerald-500/20',
                                title: 'Delivery Complete!',
                                desc: 'Book a driver, track via GPS, and release payment on delivery.',
                            },
                        ].map((step, i) => (
                            <div key={i} className="relative">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.bg} border mb-5`}>
                                    <step.icon className={`h-7 w-7 ${step.color}`} />
                                </div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded-full">
                                    {step.step}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 4 — DOST AI CHAT PREVIEW
            ══════════════════════════════════════════════════ */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Text side */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
                                <Brain className="h-3.5 w-3.5" />
                                AI-Powered Assistant
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                TruckNet Dost —<br />
                                <span className="text-violet-400">Your AI Companion</span>
                            </h2>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Get answers to any question. Route planning, pricing, load matching —
                                Dost helps with everything. Available 24/7!
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    { icon: Navigation, text: 'Best route suggestions' },
                                    { icon: IndianRupee, text: 'Real-time freight pricing' },
                                    { icon: Phone, text: 'Emergency SOS assistance' },
                                    { icon: MessageCircle, text: 'Multilingual support' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                        <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                            <item.icon className="h-3.5 w-3.5 text-violet-400" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/auth/register">
                                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-violet-500/20">
                                    Chat with Dost
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </Link>
                        </div>

                        {/* Chat preview */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Chat header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
                                    <Brain className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold leading-tight">TruckNet Dost</p>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-emerald-400 text-xs">Online</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="p-4 space-y-3 min-h-[280px]">
                                {DEMO_CHAT.slice(0, chatStep).map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2`}
                                    >
                                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-blue-600/80 text-white rounded-tr-sm'
                                                : 'bg-slate-700/80 text-slate-100 rounded-tl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {chatStep < DEMO_CHAT.length && chatStep % 2 === 0 && (
                                    <div className="flex gap-2">
                                        <div className="bg-slate-700/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: `${i * 150}ms`}} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 5 — TRUST NUMBERS
            ══════════════════════════════════════════════════ */}
            <section ref={statsRef} className="py-20 px-4 bg-gradient-to-br from-blue-950/50 to-slate-950">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Trusted by India</h2>
                    <p className="text-slate-400 mb-12">Lakhs of people trust TruckNet</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: loadsCount, suffix: '+', label: 'Loads Posted', icon: Package },
                            { value: ownersCount, suffix: '+', label: 'Fleet Owners', icon: Users },
                            { value: citiesCount, suffix: '+', label: 'Cities Covered', icon: MapPin },
                            { value: ratingCount / 10, suffix: '★', label: 'Average Rating', icon: Star },
                        ].map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">
                                    {i === 3 ? stat.value.toFixed(1) : stat.value.toLocaleString('en-IN')}
                                    <span className="text-blue-400">{stat.suffix}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm">
                                    <stat.icon className="h-3.5 w-3.5" />
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 6 — FOOTER
            ══════════════════════════════════════════════════ */}
            <footer className="border-t border-slate-800/50 py-12 px-4 bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">TruckNet India</p>
                                <p className="text-slate-500 text-xs">Bharat ka Truck Network</p>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            {[
                                { label: 'About', href: '#' },
                                { label: 'Contact', href: '#' },
                                { label: 'Privacy Policy', href: '#' },
                                { label: 'Terms', href: '/rules' },
                                { label: 'Find Vehicle', href: '/find-vehicle' },
                            ].map((link, i) => (
                                <Link key={i} href={link.href} className="text-slate-400 hover:text-white transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-800/50 mt-8 pt-8 text-center text-slate-500 text-sm">
                        © {new Date().getFullYear()} TruckNet India. All rights reserved.
                        <span className="block mt-1">Made with ❤️ for India's truck drivers 🚛</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
