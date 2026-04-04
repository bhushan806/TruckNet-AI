'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    // Belt-and-suspenders client-side guard:
    // Middleware handles most cases, but this catches any edge cases where
    // state changes after hydration (e.g., session expiry while on dashboard).
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    // Prevent flash of dashboard content while checking auth
    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            {/* Desktop Sidebar */}
            <div className="hidden border-r bg-background md:block md:w-64 fixed h-full z-30">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}
            {isMobileMenuOpen && (
                <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform md:hidden">
                    <Sidebar />
                </div>
            )}

            <div className="flex flex-col w-full md:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                    <div className="flex-1">
                        {/* Breadcrumbs or Title could go here */}
                    </div>
                </header>

                <main className="flex-1 p-4 sm:px-6 sm:py-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
