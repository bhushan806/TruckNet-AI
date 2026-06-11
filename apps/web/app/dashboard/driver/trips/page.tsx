'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, MapPin, Clock, CheckCircle, Truck, Star } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ASSIGNED_TO_DRIVER: { label: 'Assigned', color: 'bg-purple-100 text-purple-800', icon: Package },
    IN_TRANSIT: { label: 'In Transit', color: 'bg-orange-100 text-orange-800', icon: Truck },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Package },
};

export default function DriverTripsPage() {
    const [loads, setLoads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        const fetchLoads = async () => {
            setLoading(true);
            try {
                const res = await api.get('/loads/driver-loads');
                setLoads(res.data.data || []);
            } catch {
                setLoads([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLoads();
    }, []);

    const filtered = loads.filter(l => {
        if (filter === 'active') return l.status !== 'COMPLETED' && l.status !== 'CANCELLED';
        if (filter === 'completed') return l.status === 'COMPLETED';
        return true;
    });

    const stats = {
        total: loads.length,
        active: loads.filter(l => l.status !== 'COMPLETED' && l.status !== 'CANCELLED').length,
        completed: loads.filter(l => l.status === 'COMPLETED').length,
        totalEarnings: loads
            .filter(l => l.status === 'COMPLETED')
            .reduce((sum, l) => sum + (l.price || 0), 0),
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">My Trips</h1>
                    <p className="text-muted-foreground text-sm">View your load history and trip details</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total Trips</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-500">{stats.active}</p>
                        <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground mt-1">Completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">₹{stats.totalEarnings.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map(f => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize"
                    >
                        {f}
                    </Button>
                ))}
            </div>

            {/* Trips List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No trips found.</p>
                        <p className="text-sm mt-1">
                            {filter === 'all' ? 'You have no load history yet.' : `No ${filter} trips.`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(load => {
                        const cfg = STATUS_CONFIG[load.status] || { label: load.status, color: 'bg-gray-100 text-gray-700', icon: Package };
                        const StatusIcon = cfg.icon;
                        return (
                            <Card key={load._id || load.id} className={`border-l-4 transition-all hover:shadow-md ${load.status === 'COMPLETED' ? 'border-l-green-500' : load.status === 'IN_TRANSIT' ? 'border-l-orange-500' : 'border-l-purple-500'}`}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className={cfg.color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {cfg.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(load.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                <span className="truncate">{load.source}</span>
                                                <span className="text-muted-foreground">→</span>
                                                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                <span className="truncate">{load.destination}</span>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>{load.goodsType}</span>
                                                <span>•</span>
                                                <span>{load.weight} tons</span>
                                                {load.distance > 0 && <>
                                                    <span>•</span>
                                                    <span>{load.distance} km</span>
                                                </>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-lg font-bold text-green-600">₹{load.price?.toLocaleString('en-IN')}</span>
                                            {load.status === 'COMPLETED' && (
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <Star className="h-3 w-3 fill-yellow-400" />
                                                    <span className="text-xs">Trip Complete</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
