'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, Activity, Wrench, Bell, Sparkles, Users, Box, Briefcase, FileText, ShieldCheck, ArrowUpRight, Map, Plus } from 'lucide-react';
import MapComponent from '@/components/map/Map';
import api from '@/lib/api';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

export default function OwnerDashboard() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([
        { title: "System Update", message: "Dark mode optimization applied successfully." },
        { title: "Driver Alert", message: "Driver Raj accepted the load to Mumbai." }
    ]);
    const [stats, setStats] = useState({
        total: 0,
        onRoad: 0,
        available: 0,
        maintenance: 0
    });

    const calculateStats = (data: any[]) => {
        setStats({
            total: data.length,
            onRoad: data.filter((v: any) => v.status === 'ON_TRIP' || v.status === 'BUSY').length,
            available: data.filter((v: any) => v.status === 'AVAILABLE').length,
            maintenance: data.filter((v: any) => v.status === 'MAINTENANCE').length
        });
    };

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles');
            const data = res.data.data;
            setVehicles(data);
            calculateStats(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchVehicles();

        // Socket.io connection — derive base URL from API URL env var
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('vehicleUpdated', (updatedVehicle: any) => {
            setVehicles(prev => {
                const newVehicles = prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
                calculateStats(newVehicles);
                return newVehicles;
            });
        });

        socket.on('notification', (newNotification: any) => {
            setNotifications(prev => [newNotification, ...prev]);
            toast.info(`New Alert: ${newNotification.title}`);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Prepare markers for map
    const vehicleMarkers = vehicles
        .filter(v => v.currentLat && v.currentLng)
        .map(v => ({
            lat: v.currentLat,
            lng: v.currentLng,
            title: `${v.number} (${v.status})`
        }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white text-glow">Owner Dashboard</h1>
                    <p className="text-muted-foreground font-light">Manage your fleet, drivers, and operations.</p>
                </div>
                <div className="flex gap-2 relative">
                    <Button
                        variant="outline"
                        className="glass hover:bg-white/10 text-white border-white/20 relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </Button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-[9999] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                                <h4 className="font-semibold text-white">Notifications</h4>
                                <span className="text-xs text-slate-400">{notifications.length} new</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((notif: any, i) => (
                                        <div key={i} className="p-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className="text-sm font-medium text-blue-400">{notif.title}</h5>
                                                <span className="text-[10px] text-slate-500">Just now</span>
                                            </div>
                                            <p className="text-xs text-slate-300">{notif.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-slate-700 bg-slate-900/50 rounded-b-lg">
                                <Button variant="ghost" className="w-full text-xs h-8 text-slate-400 hover:text-white" onClick={() => setNotifications([])}>
                                    Mark all as read
                                </Button>
                            </div>
                        </div>
                    )}

                    <Link href="/dashboard/owner/vehicles/add">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white neon-blue border-none">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vehicle
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards - Bento Grid */}
            <div className="bento-grid">
                <Card className="glass glass-hover border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-slate-300">Total Fleet</CardTitle>
                        <Truck className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{stats.total}</div>
                        <p className="text-xs text-slate-400 mt-1">Vehicles in your fleet</p>
                    </CardContent>
                </Card>
                <Card className="glass glass-hover border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-slate-300">On Road</CardTitle>
                        <Activity className="h-4 w-4 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{stats.onRoad}</div>
                        <p className="text-xs text-slate-400 mt-1">Currently active trips</p>
                    </CardContent>
                </Card>
                <Card className="glass glass-hover border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-slate-300">Available</CardTitle>
                        <Truck className="h-4 w-4 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{stats.available}</div>
                        <p className="text-xs text-slate-400 mt-1">Ready for assignment</p>
                    </CardContent>
                </Card>
                <Card className="glass glass-hover border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-light text-slate-300">Maintenance</CardTitle>
                        <Wrench className="h-4 w-4 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]">{stats.maintenance}</div>
                        <p className="text-xs text-slate-400 mt-1">Vehicles in service</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Live Tracking - Spans 2 columns */}
                <Card className="lg:col-span-2 h-[500px] flex flex-col overflow-hidden border-none glass shadow-2xl">
                    <CardHeader className="bg-white/5 border-b border-white/10 backdrop-blur-sm">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Map className="h-5 w-5 text-blue-400" />
                            <span className="text-glow">Live Fleet Tracking</span>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-xs text-green-400 font-mono">LIVE</span>
                            </div>
                        </CardTitle>
                        <CardDescription className="text-slate-400">Real-time location of your active vehicles.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative">
                        <div className="absolute inset-0">
                            <MapComponent markers={vehicleMarkers} />
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Spans 1 column */}
                <div className="space-y-6">
                    <div className="grid gap-4">
                        <h3 className="font-semibold text-lg px-1 text-white">Quick Actions</h3>

                        <Link href="/dashboard/owner/vehicles">
                            <Card className="glass glass-hover border-none group cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                        <Truck className="h-6 w-6 text-blue-400 group-hover:text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-blue-200 transition-colors">Manage Vehicles</p>
                                        <p className="text-xs text-slate-400">Add or edit fleet details</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/owner/find-drivers">
                            <Card className="glass glass-hover border-none group cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                                        <Users className="h-6 w-6 text-green-400 group-hover:text-green-300" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-green-200 transition-colors">Recruit Drivers</p>
                                        <p className="text-xs text-slate-400">Find qualified drivers</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/owner/loads">
                            <Card className="glass glass-hover border-none group cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                                        <Box className="h-6 w-6 text-orange-400 group-hover:text-orange-300" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-orange-200 transition-colors">Load Board</p>
                                        <p className="text-xs text-slate-400">Manage active shipments</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none text-white overflow-hidden relative shadow-lg neon-blue">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Sparkles className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                AI Optimization
                            </CardTitle>
                            <CardDescription className="text-blue-100">
                                Your fleet is running at 85% efficiency.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full font-semibold text-blue-700 bg-white hover:bg-blue-50">
                                        View Recommendations
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] bg-slate-900 text-white border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl">
                                            <Sparkles className="h-5 w-5 text-blue-400" />
                                            AI Fleet Optimization
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                            <h4 className="font-semibold text-blue-400 mb-2">🚀 Efficiency Boost Available</h4>
                                            <p className="text-sm text-slate-300">
                                                Vehicle <strong>MH-12-AB-1234</strong> is taking a longer route than necessary.
                                                Switching to the suggested route via NH-48 could save <strong>45 mins</strong> and <strong>₹300</strong> in fuel.
                                            </p>
                                            <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">Apply New Route</Button>
                                        </div>

                                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                            <h4 className="font-semibold text-orange-400 mb-2">⚠️ Maintenance Alert</h4>
                                            <p className="text-sm text-slate-300">
                                                Based on usage patterns, <strong>MH-14-XY-9876</strong> will require brake servicing in approximately <strong>300 km</strong>.
                                                Schedule now to avoid breakdown.
                                            </p>
                                            <Button size="sm" variant="outline" className="mt-3 border-orange-500/50 text-orange-400 hover:bg-orange-500/10">Schedule Service</Button>
                                        </div>

                                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <h4 className="font-semibold text-green-400 mb-2">💰 Revenue Opportunity</h4>
                                            <p className="text-sm text-slate-300">
                                                High demand detected in <strong>Pune Industrial Area</strong>.
                                                Relocating 2 idle trucks there could increase daily revenue by <strong>15%</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
