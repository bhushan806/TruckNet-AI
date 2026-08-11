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
    ShieldAlert,
    User,
    DollarSign,
    Bell,
    Package,
    Bot,
    Car,
    Globe,
    HeartPulse,
    Eye,
    ArrowLeft,
    Shield,
} from 'lucide-react';


interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout, viewingAs, setViewingAs } = useAuth();

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
            { href: '/dashboard/driver/profile', label: 'My Profile', icon: User },
            { href: '/dashboard/driver/trips', label: 'My Trips', icon: Package },
            { href: '/dashboard/driver/loads', label: 'Available Loads', icon: Truck },
            { href: '/dashboard/driver/vehicles', label: 'My Vehicles', icon: Car },
            { href: '/dashboard/driver/finance', label: 'Earnings', icon: DollarSign },
            { href: '/dashboard/driver/documents', label: 'Documents', icon: FileText },
            { href: '/dashboard/driver/roadside', label: 'Roadside Help', icon: ShieldAlert },
            { href: '/dashboard/driver/assistant', label: 'AI Assistant', icon: Bot },
            { href: '/dashboard/driver/notifications', label: 'Notifications', icon: Bell },
            { href: '/dashboard/driver/settings', label: 'Settings', icon: Settings },
        ],
        OWNER: [
            { href: '/dashboard/owner', label: 'Fleet Manager', icon: LayoutDashboard },
            { href: '/dashboard/owner/vehicles', label: 'My Vehicles', icon: Truck },
            { href: '/dashboard/owner/find-drivers', label: 'Find Drivers', icon: Users },
            { href: '/dashboard/owner/loads', label: 'Load Board', icon: Package },
            { href: '/dashboard/owner/drivers', label: 'My Drivers', icon: Users },
            { href: '/dashboard/owner/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/dashboard/owner/finance', label: 'Finance', icon: DollarSign },
        ],
        ADMIN: [
            { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
            { href: '/dashboard/admin/users', label: 'Users', icon: Users },
            { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/dashboard/admin/traffic', label: 'Traffic', icon: Globe },
            { href: '/dashboard/admin/health', label: 'System Health', icon: HeartPulse },
            { href: '/dashboard/admin/ai', label: 'Admin AI', icon: Bot },
        ],
    };

    // When admin is viewing as a role, show that role's sidebar links
    const effectiveRole = (user.role === 'ADMIN' && viewingAs) ? viewingAs : user.role;
    const links = [
        ...(roleLinks[effectiveRole as keyof typeof roleLinks] || []),
        ...(user.role !== 'ADMIN' ? commonLinks : []),
    ];

    const viewAsOptions = [
        { role: 'CUSTOMER' as const, label: 'View as Customer', color: 'text-violet-400 hover:bg-violet-500/10 border-violet-500/20' },
        { role: 'DRIVER' as const, label: 'View as Driver', color: 'text-orange-400 hover:bg-orange-500/10 border-orange-500/20' },
        { role: 'OWNER' as const, label: 'View as Owner', color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20' },
    ];

    return (
        <div className={cn('pb-12 min-h-screen border-r bg-card flex flex-col', className)}>
            <div className="flex-1 space-y-1 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-4 mb-6">
                        <Truck className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-bold tracking-tight">TruckNet India</h2>
                    </div>

                    {/* Admin previewing a role indicator */}
                    {user.role === 'ADMIN' && viewingAs && (
                        <div className="mb-3 mx-1 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                            <span className="text-xs text-orange-400 font-medium">Preview: {viewingAs}</span>
                        </div>
                    )}

                    <div className="space-y-0.5">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start text-sm',
                                            isActive && 'font-semibold'
                                        )}
                                    >
                                        <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{link.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Admin View As section */}
                    {user.role === 'ADMIN' && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Shield className="h-3 w-3" />
                                Preview Roles
                            </p>
                            <div className="space-y-1">
                                {viewingAs ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-xs text-blue-400 hover:bg-blue-500/10 border-blue-500/20"
                                        onClick={() => setViewingAs(null)}
                                    >
                                        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                                        Return to Admin
                                    </Button>
                                ) : (
                                    viewAsOptions.map(opt => (
                                        <Button
                                            key={opt.role}
                                            variant="outline"
                                            size="sm"
                                            className={cn('w-full justify-start text-xs border', opt.color)}
                                            onClick={() => setViewingAs(opt.role)}
                                        >
                                            <Eye className="mr-2 h-3.5 w-3.5" />
                                            {opt.label}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-3 pb-4">
                <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user.role === 'ADMIN' && viewingAs ? `ADMIN → ${viewingAs}` : user.role}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
