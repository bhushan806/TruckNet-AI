'use client';

// ── Admin View-As Banner ──
// Shown at the top of any dashboard when Admin is previewing a role.
// This is a frontend-only visual indicator — the JWT identity remains ADMIN.
// SECURITY: This banner is purely cosmetic. Backend authorization is unchanged.

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Eye } from 'lucide-react';

export function AdminViewAsBanner() {
    const { viewingAs, setViewingAs, user } = useAuth();
    const router = useRouter();

    // Only show when admin is viewing as another role
    if (!viewingAs || user?.role !== 'ADMIN') return null;

    const roleLabels: Record<string, string> = {
        CUSTOMER: 'Customer',
        DRIVER: 'Driver',
        OWNER: 'Fleet Owner',
    };

    const roleColors: Record<string, string> = {
        CUSTOMER: 'from-violet-600 to-violet-700',
        DRIVER: 'from-orange-500 to-orange-600',
        OWNER: 'from-emerald-600 to-emerald-700',
    };

    const handleReturn = async () => {
        await setViewingAs(null);
        router.push('/dashboard/admin');
    };

    return (
        <div
            className={`w-full bg-gradient-to-r ${roleColors[viewingAs] || 'from-blue-600 to-blue-700'} px-4 py-2.5 flex items-center justify-between shadow-lg z-50`}
            role="alert"
            aria-label={`Admin preview mode: viewing as ${roleLabels[viewingAs]}`}
        >
            <div className="flex items-center gap-2.5 text-white">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tracking-wide uppercase">Admin Preview</span>
                </div>
                <Eye className="h-3.5 w-3.5 text-white/80" />
                <span className="text-sm font-medium">
                    Viewing as <span className="font-bold">{roleLabels[viewingAs]}</span>
                </span>
                <span className="text-xs text-white/70 hidden sm:inline">
                    — Your admin identity is unchanged
                </span>
            </div>

            <button
                onClick={handleReturn}
                className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1.5 text-sm font-semibold"
                aria-label="Return to Admin Dashboard"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Admin
            </button>
        </div>
    );
}
