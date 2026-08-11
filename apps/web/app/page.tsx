'use client';

// ── TruckNet India — Landing Page (Redesigned) ──
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Truck } from 'lucide-react';

// Landing Page Modular Components
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ZeroDeadMileage } from '@/components/landing/ZeroDeadMileage';
import { TruckNetDostSection } from '@/components/landing/TruckNetDostSection';
import { PredictiveMaintenance } from '@/components/landing/PredictiveMaintenance';
import { DriverFirstSection } from '@/components/landing/DriverFirstSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Preserve Auth routing functionality
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'DRIVER') router.replace('/dashboard/driver');
            else if (user.role === 'OWNER') router.replace('/dashboard/owner');
            else router.replace('/dashboard/customer');
        }
    }, [user, loading, router]);

    return (
        <main className="min-h-screen bg-[#050B14] text-white selection:bg-teal-500/30 selection:text-teal-200">
            
            <HeroSection />
            <ProblemSection />
            <ZeroDeadMileage />
            <TruckNetDostSection />
            <PredictiveMaintenance />
            <DriverFirstSection />
            <StatsSection />
            <FinalCTA />

            {/* Footer Section */}
            <footer className="border-t border-slate-800 py-12 px-6 bg-slate-950 relative z-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">TruckNet India</p>
                                <p className="text-slate-500 text-xs">AI-Powered Logistics</p>
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

                    <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
                        © {new Date().getFullYear()} TruckNet India. All rights reserved.
                        <span className="block mt-1">Made for India's logistics network 🚛</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
