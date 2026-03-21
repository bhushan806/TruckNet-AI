'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
    Truck,
    LayoutDashboard,
    MapPin,
    FileText,
    Users,
    BarChart3,
    LogOut,
    Settings,
    ShieldAlert
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    const commonLinks = [
        { href: '/rules', label: 'Safety Rules', icon: ShieldAlert },
    ];

    const roleLinks = {
        CUSTOMER: [
            { href: '/dashboard/customer', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/find-vehicle', label: 'Track Shipment', icon: MapPin },
        ],
        DRIVER: [
            { href: '/dashboard/driver', label: 'Driver Console', icon: LayoutDashboard },
            { href: '/dashboard/driver/roadside', label: 'Roadside Help', icon: Truck },
        ],
        OWNER: [
            { href: '/dashboard/owner', label: 'Fleet Manager', icon: LayoutDashboard },
            { href: '/dashboard/owner/vehicles', label: 'My Vehicles', icon: Truck },
            { href: '/dashboard/owner/find-drivers', label: 'Find Drivers', icon: Users },
            { href: '/dashboard/owner/analytics', label: 'Analytics', icon: BarChart3 },
        ],
        ADMIN: []
    };

    const links = [...(roleLinks[user.role as keyof typeof roleLinks] || []), ...commonLinks];

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-card", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-4 mb-6">
                        <Truck className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-bold tracking-tight">TruckNet India</h2>
                    </div>
                    <div className="space-y-1">
                        {links.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={pathname === link.href ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                >
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 left-0 w-full px-3">
                <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
