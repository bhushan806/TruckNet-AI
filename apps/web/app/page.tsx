'use client';

// ── TruckNet India — Modern Industrial Tech Homepage ──
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Modular High-Stakes Logistics Landing Components
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsStrip } from '@/components/landing/StatsStrip';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LiveOpsPreview } from '@/components/landing/LiveOpsPreview';
import { EnterpriseTrust } from '@/components/landing/EnterpriseTrust';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Preserve Auth routing redirect functionality for logged-in users
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'DRIVER') router.replace('/dashboard/driver');
            else if (user.role === 'OWNER') router.replace('/dashboard/owner');
            else router.replace('/dashboard/customer');
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] selection:bg-[#00E5C3]/30 selection:text-[#00E5C3] overflow-x-hidden">
            {/* Hero Section: Split 60/40 Layout with 3D Logistics Terminal & Anchored CTAs */}
            <HeroSection />

            {/* Real-Time Stats Strip: Scroll-Triggered Count-Up */}
            <StatsStrip />

            {/* Core Feature Grid: Businesses, Drivers, Fleet Owners with 3D Hover Lift */}
            <FeatureGrid />

            {/* How It Works: 3-Step Animated Timeline with Progress Line */}
            <HowItWorks />

            {/* Live Command Center Terminal: Interactive Order Book, Route Optimizer, Voice Co-Pilot */}
            <LiveOpsPreview />

            {/* Enterprise Trust: MoRTH Vahan APIs, NPCI Escrow, Multi-Region SLA */}
            <EnterpriseTrust />

            {/* Final Action CTA: High-Contrast Conversion Banner */}
            <FinalCTA />

            {/* Industrial B2B Footer */}
            <Footer />
        </div>
    );
}
