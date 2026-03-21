'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// NavItems extracted outside Navbar to avoid "cannot create components during render" error
function NavItems({ user }: { user: any }) {
    return (
        <>
            {!user && (
                <>
                    <Link href="/find-vehicle" className="text-sm font-medium transition-colors hover:text-primary">Find Vehicle</Link>
                    <Link href="/rules" className="text-sm font-medium transition-colors hover:text-primary">Road Rules</Link>
                </>
            )}

            {user?.role === 'CUSTOMER' && (
                <>
                    <Link href="/dashboard/customer" className="text-sm font-medium text-primary hover:text-primary/80">Dashboard</Link>
                    <Link href="/find-vehicle" className="text-sm font-medium transition-colors hover:text-primary">Track Shipment</Link>
                </>
            )}

            {user?.role === 'DRIVER' && (
                <>
                    <Link href="/dashboard/driver" className="text-sm font-medium text-primary hover:text-primary/80">Driver Console</Link>
                    <Link href="/rules" className="text-sm font-medium transition-colors hover:text-primary">Safety Rules</Link>
                </>
            )}

            {user?.role === 'OWNER' && (
                <>
                    <Link href="/dashboard/owner" className="text-sm font-medium text-primary hover:text-primary/80">Fleet Manager</Link>
                    <Link href="/dashboard/owner/finance" className="text-sm font-medium transition-colors hover:text-primary">Finance</Link>
                    <Link href="/dashboard/owner/loads" className="text-sm font-medium transition-colors hover:text-primary">Find Loads</Link>
                    <Link href="/dashboard/owner/analytics" className="text-sm font-medium transition-colors hover:text-primary">Analytics</Link>
                </>
            )}
        </>
    );
}

export function Navbar() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-space tracking-tight hidden sm:inline-block">TruckNet India</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    <NavItems user={user} />
                </nav>

                {/* Actions & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium hidden lg:inline-block text-muted-foreground">
                                {user.name}
                            </span>
                            <Button variant="ghost" size="sm" onClick={logout} className="hidden md:flex">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="hidden md:flex gap-2">
                            <Link href="/auth/login">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-50 bg-background border-t animate-in slide-in-from-top-5 fade-in duration-200">
                    <div className="container py-8 px-4 flex flex-col gap-6">
                        <nav className="flex flex-col gap-4">
                            <NavItems user={user} />
                        </nav>
                        <div className="border-t pt-6 flex flex-col gap-4">
                            {user ? (
                                <Button variant="outline" onClick={logout} className="w-full justify-start">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout ({user.name})
                                </Button>
                            ) : (
                                <>
                                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">Log in</Button>
                                    </Link>
                                    <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full">Get Started</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
