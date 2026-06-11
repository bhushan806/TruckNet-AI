'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Load the full AIAssistant in expanded/page mode (no floating widget — use existing one for that)
const AIAssistant = dynamic(() => import('@/components/ai/AIAssistant'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[600px]">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    ),
});

export default function DriverAssistantPage() {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">TruckNet Dost 🤖</h1>
                    <p className="text-muted-foreground text-sm">Your AI-powered logistics assistant — ask anything about loads, routes, or regulations</p>
                </div>
            </div>

            {/* Render the full AI assistant UI */}
            <AIAssistant />
        </div>
    );
}
