'use client';

// ── Server Wake-Up Component ──
// FIX 9: Handles Render free-tier cold starts gracefully.
// Shows a warm Hindi message with a truck animation for ~50 seconds while services wake up.
// Uses sessionStorage to skip the check for 10 minutes once services are confirmed healthy.

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL;
const CACHE_KEY = 'services_healthy_until';
const HEALTHY_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface ServiceStatus {
    api: 'checking' | 'up' | 'slow' | 'down';
    ai: 'checking' | 'up' | 'slow' | 'down';
}

export function ServerWakeUp({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<ServiceStatus>({ api: 'checking', ai: 'checking' });
    const [showOverlay, setShowOverlay] = useState(false);
    const [dots, setDots] = useState('.');

    useEffect(() => {
        // Check if we already confirmed services healthy recently
        try {
            const cachedUntil = sessionStorage.getItem(CACHE_KEY);
            if (cachedUntil && Date.now() < parseInt(cachedUntil, 10)) {
                // Services known healthy — skip wake-up check
                return;
            }
        } catch { /* sessionStorage not available (SSR) */ }

        // Show overlay after 3 seconds if services haven't responded
        const overlayTimer = setTimeout(() => setShowOverlay(true), 3000);

        // Animate dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '.' : prev + '.');
        }, 500);

        // Ping both services simultaneously
        const checkService = async (url: string, key: 'api' | 'ai') => {
            if (!url) {
                setStatus(prev => ({ ...prev, [key]: 'up' })); // not configured — skip
                return;
            }
            const start = Date.now();
            try {
                await fetch(`${url.replace(/\/api$/, '')}/health`, {
                    signal: AbortSignal.timeout(60_000),
                    cache: 'no-store',
                });
                const elapsed = Date.now() - start;
                setStatus(prev => ({ ...prev, [key]: elapsed > 5000 ? 'slow' : 'up' }));
            } catch {
                setStatus(prev => ({ ...prev, [key]: 'down' }));
            }
        };

        Promise.all([
            checkService(API_URL || '', 'api'),
            checkService(AI_ENGINE_URL || '', 'ai'),
        ]).then(() => {
            clearTimeout(overlayTimer);
            clearInterval(dotsInterval);
            setShowOverlay(false);
            // Cache health timestamp
            try {
                sessionStorage.setItem(CACHE_KEY, String(Date.now() + HEALTHY_DURATION_MS));
            } catch { /* ignore */ }
        });

        return () => {
            clearTimeout(overlayTimer);
            clearInterval(dotsInterval);
        };
    }, []);

    const bothUp = status.api !== 'checking' && status.ai !== 'checking';

    return (
        <>
            {children}
            {showOverlay && !bothUp && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                    <div className="text-center max-w-xs px-6">
                        {/* Bouncing truck animation */}
                        <div className="text-6xl mb-6 animate-bounce">🚛</div>

                        <h2 className="text-white text-xl font-bold mb-2">
                            Gadi start ho rahi hai{dots}
                        </h2>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Pehli baar thodi der lagti hai. Server ko jaagna pad raha hai. 😴
                            Ek minute mein ready ho jayega!
                        </p>

                        {/* Service status indicators */}
                        <div className="space-y-2 text-left bg-slate-900 rounded-xl p-4 text-xs">
                            <StatusRow label="Backend API" status={status.api} />
                            <StatusRow label="AI Dost Engine" status={status.ai} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function StatusRow({ label, status }: { label: string; status: 'checking' | 'up' | 'slow' | 'down' }) {
    const indicator = {
        checking: <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />,
        up: <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />,
        slow: <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />,
        down: <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />,
    }[status];

    const text = {
        checking: 'Jaag raha hai...',
        up: 'Ready ✓',
        slow: 'Slow — wait karo',
        down: 'Down — try later',
    }[status];

    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
                {indicator} {label}
            </span>
            <span className={`font-medium ${status === 'up' ? 'text-emerald-400' : status === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
                {text}
            </span>
        </div>
    );
}
