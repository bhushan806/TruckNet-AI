'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users, Truck, Package, Route, Activity, TrendingUp,
    RefreshCw, Eye, BarChart3, Globe, HeartPulse, Bot,
    CheckCircle2, Clock, XCircle, ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OverviewData {
    users: { total: number; customers: number; drivers: number; owners: number; newToday: number; availableDrivers: number };
    vehicles: { total: number; available: number; onTrip: number; maintenance: number };
    loads: { total: number; open: number; inTransit: number; completed: number; cancelled: number; newToday: number; matchSuccessRate: number };
    rides: { total: number; pending: number; ongoing: number; completed: number; newToday: number };
}

const REFRESH_INTERVAL_MS = 15_000;

export default function AdminDashboard() {
    const { user, setViewingAs } = useAuth();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
        try {
            const res = await api.get('/admin/overview');
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch admin overview', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchData]);

    const timeSinceUpdate = lastUpdated
        ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
        : null;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading platform data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const statCards = [
        {
            title: 'Total Users',
            value: data.users.total,
            sub: `+${data.users.newToday} today`,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            details: `${data.users.customers} Customers · ${data.users.drivers} Drivers · ${data.users.owners} Owners`,
        },
        {
            title: 'Vehicles',
            value: data.vehicles.total,
            sub: `${data.vehicles.onTrip} on trip`,
            icon: Truck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            details: `${data.vehicles.available} Available · ${data.vehicles.maintenance} Maintenance`,
        },
        {
            title: 'Loads',
            value: data.loads.total,
            sub: `+${data.loads.newToday} today`,
            icon: Package,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            details: `${data.loads.open} Open · ${data.loads.inTransit} In Transit · ${data.loads.matchSuccessRate}% match rate`,
        },
        {
            title: 'Rides',
            value: data.rides.total,
            sub: `${data.rides.ongoing} ongoing`,
            icon: Route,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            details: `${data.rides.pending} Pending · ${data.rides.completed} Completed`,
        },
    ];

    const loadStatusCards = [
        { label: 'Open', value: data.loads.open, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'In Transit', value: data.loads.inTransit, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Completed', value: data.loads.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Cancelled', value: data.loads.cancelled, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    ];

    const quickLinks = [
        { href: '/dashboard/admin/users', label: 'Users', icon: Users, desc: 'View & manage users' },
        { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3, desc: 'Charts & trends' },
        { href: '/dashboard/admin/traffic', label: 'Traffic', icon: Globe, desc: 'API metrics' },
        { href: '/dashboard/admin/health', label: 'System Health', icon: HeartPulse, desc: 'Service status' },
        { href: '/dashboard/admin/ai', label: 'Admin AI', icon: Bot, desc: 'Ask the platform AI' },
    ];

    const viewAsRoles = [
        { role: 'CUSTOMER' as const, label: 'Customer', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20' },
        { role: 'DRIVER' as const, label: 'Driver', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
        { role: 'OWNER' as const, label: 'Fleet Owner', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.name}. Real-time platform snapshot.
                    </p>
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Updated {timeSinceUpdate}s ago · Auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-muted-foreground transition-colors"
                    >
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                        Refresh
                    </button>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 flex items-center gap-2">
                        <Activity className="h-5 w-5 animate-pulse" />
                        <span className="font-semibold text-sm">Live</span>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                    >
                        <Card className={cn('relative overflow-hidden border bg-card/50 backdrop-blur-xl hover:shadow-lg transition-all', stat.border)}>
                            <div className={cn('absolute top-0 right-0 w-28 h-28 blur-3xl opacity-20 -mr-8 -mt-8 rounded-full', stat.bg)} />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                                <div className={cn('p-2 rounded-lg', stat.bg)}>
                                    <stat.icon className={cn('h-4 w-4', stat.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</div>
                                <p className={cn('text-xs mt-0.5 font-semibold', stat.color)}>{stat.sub}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.details}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Load Pipeline + Driver Availability */}
            <div className="grid gap-4 md:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-orange-500" />
                                Load Pipeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            {loadStatusCards.map(s => (
                                <div key={s.label} className={cn('rounded-xl p-3 flex items-center gap-3', s.bg)}>
                                    <s.icon className={cn('h-5 w-5', s.color)} />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                        <p className="text-lg font-bold">{s.value.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                Platform Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Match Success Rate', value: `${data.loads.matchSuccessRate}%`, color: 'text-emerald-400' },
                                { label: 'Available Drivers', value: data.users.availableDrivers, color: 'text-blue-400' },
                                { label: 'Active Vehicles', value: data.vehicles.onTrip, color: 'text-orange-400' },
                                { label: 'Ongoing Rides', value: data.rides.ongoing, color: 'text-purple-400' },
                            ].map(m => (
                                <div key={m.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                                    <span className="text-sm text-muted-foreground">{m.label}</span>
                                    <span className={cn('text-sm font-bold', m.color)}>{m.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" /> Admin Sections
                </h2>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {quickLinks.map(link => (
                        <Link key={link.href} href={link.href}>
                            <Card className="border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <link.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <p className="text-sm font-semibold">{link.label}</p>
                                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* View As Role */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            Preview Role Dashboards
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            View real application data from each role's perspective. Your Admin identity remains unchanged.
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        {viewAsRoles.map(r => (
                            <button
                                key={r.role}
                                onClick={() => setViewingAs(r.role)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                                    r.color
                                )}
                            >
                                <Eye className="h-4 w-4" />
                                View as {r.label}
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
