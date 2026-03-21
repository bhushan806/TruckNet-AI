'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Sheet import removed
// Since I don't have Sheet, I will use a simple mobile overlay implementation here or just a hidden sidebar for now.
// Actually, I can quickly create a basic Sheet component or just use a conditional class.
// Let's stick to a responsive layout where sidebar is hidden on mobile and can be toggled.

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
