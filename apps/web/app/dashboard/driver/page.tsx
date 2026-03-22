'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Navigation, Clock, Shield, DollarSign, Award, Truck, Package } from 'lucide-react';
import MapComponent from '@/components/map/Map';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function DriverDashboard() {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [assignedLoads, setAssignedLoads] = useState<any[]>([]);
    const [updatingLoadId, setUpdatingLoadId] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
        fetchLoads();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/driver/profile');
            setProfile(res.data.data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    const fetchLoads = async () => {
        try {
            const res = await api.get('/loads/driver-loads');
            setAssignedLoads(res.data.data);
        } catch (error) {
            console.error('Failed to fetch loads', error);
        }
    };

    const toggleStatus = async () => {
        try {
            const res = await api.post('/driver/status');
            setIsOnline(res.data.data.isAvailable);
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleUpdateLoadStatus = async (loadId: string, newStatus: string) => {
        if (updatingLoadId) return; // prevent duplicate
        const confirmMsg = newStatus === 'IN_TRANSIT'
            ? 'Start transit for this load?'
            : 'Mark this load as completed?';
        if (!confirm(confirmMsg)) return;

        setUpdatingLoadId(loadId);
        try {
            await api.patch(`/loads/${loadId}/status`, { status: newStatus });
            alert(`Load status updated to ${newStatus.replace(/_/g, ' ')}!`);
            fetchLoads();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingLoadId(null);
        }
    };

    const handleSOS = async () => {
        if (!confirm("Are you sure you want to trigger Smart SOS?")) return;
        try {
            const currentLat = 18.5204;
            const currentLng = 73.8567;
            const res = await api.post('/ai/sos', { lat: currentLat, lng: currentLng });
            if (res.data.status === 'success') {
                alert(`SMART SOS TRIGGERED!\n\n${res.data.data.alert}`);
            }
        } catch (error: any) {
            console.error('Failed to trigger SOS', error);
            alert('SOS Failed! Call Police manually.');
        }
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            'ASSIGNED_TO_DRIVER': 'bg-purple-100 text-purple-800',
            'IN_TRANSIT': 'bg-orange-100 text-orange-800',
            'COMPLETED': 'bg-green-100 text-green-800',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    const activeLoads = assignedLoads.filter(l => l.status !== 'COMPLETED');
    const completedLoads = assignedLoads.filter(l => l.status === 'COMPLETED');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Profile Header */}
            <Card className="border-none shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-4 border-white/10">
                                <AvatarImage src={(user as any)?.avatar || ''} />
                                <AvatarFallback className="text-slate-900 text-xl font-bold">
                                    {user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold">{user?.name}</h1>
                                <div className="flex items-center gap-2 text-slate-300 mt-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-semibold text-white">{profile?.rating || '5.0'}</span>
                                    <span>•</span>
                                    <span>{profile?.totalTrips || 0} Trips</span>
                                    <span>•</span>
                                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">
                                        {profile?.vehicle?.type || 'No Vehicle'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                            <Button
                                variant="destructive"
                                className="h-12 px-6 font-bold shadow-red-900/50 shadow-lg animate-pulse"
                                onClick={handleSOS}
                            >
                                <Shield className="mr-2 h-5 w-5" />
                                SMART SOS
                            </Button>

                            <div className="text-right">
                                <p className="text-sm text-slate-400">Status</p>
                                <p className={`font-bold ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                            <Switch
                                checked={isOnline}
                                onCheckedChange={toggleStatus}
                                className="data-[state=checked]:bg-green-500"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & Map */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Package className="h-6 w-6 text-purple-500 mb-2" />
                                <p className="text-2xl font-bold">{activeLoads.length}</p>
                                <p className="text-xs text-muted-foreground">Active Loads</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Clock className="h-6 w-6 text-blue-500 mb-2" />
                                <p className="text-2xl font-bold">{completedLoads.length}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Award className="h-6 w-6 text-orange-500 mb-2" />
                                <p className="text-2xl font-bold">Gold</p>
                                <p className="text-xs text-muted-foreground">Tier Status</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Map */}
                    <Card className="h-[400px] overflow-hidden border-border/50 shadow-md flex flex-col">
                        <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Navigation className="h-4 w-4 text-primary" />
                                    Live Map
                                </h3>
                                <Badge variant="outline" className="bg-background">High Demand Area</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative">
                            <MapComponent />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Assigned Loads */}
                <div className="space-y-6">
                    {/* Connection Requests */}
                    <ConnectionRequests />

                    {/* Assigned Loads */}
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg">My Assigned Loads</h2>
                        {activeLoads.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No active load assignments.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {activeLoads.map((load) => (
                                    <Card key={load._id || load.id} className="border-l-4 border-l-purple-500 shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge className={getStatusColor(load.status)}>
                                                    {load.status.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="font-bold text-green-600">₹{load.price}</span>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm font-medium">{load.source} → {load.destination}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {load.goodsType} • {load.weight}t
                                                    {load.distance > 0 && ` • ${load.distance} km`}
                                                </p>
                                            </div>

                                            {/* Status action buttons */}
                                            {load.status === 'ASSIGNED_TO_DRIVER' && (
                                                <Button
                                                    className="w-full bg-orange-600 hover:bg-orange-700"
                                                    onClick={() => handleUpdateLoadStatus(load._id || load.id, 'IN_TRANSIT')}
                                                    disabled={!!updatingLoadId}
                                                >
                                                    <Truck className="h-4 w-4 mr-2" />
                                                    {updatingLoadId === (load._id || load.id) ? 'Starting...' : 'Start Transit'}
                                                </Button>
                                            )}

                                            {load.status === 'IN_TRANSIT' && (
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleUpdateLoadStatus(load._id || load.id, 'COMPLETED')}
                                                    disabled={!!updatingLoadId}
                                                >
                                                    {updatingLoadId === (load._id || load.id) ? 'Completing...' : 'Mark Completed'}
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConnectionRequests() {
    const [requests, setRequests] = useState<any[]>([]);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/driver');
            setRequests(res.data.data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await api.post(`/requests/${id}/respond`, { status });
            alert(`Request ${status.toLowerCase()}!`);
            fetchRequests();
        } catch (error) {
            console.error('Failed to respond', error);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="font-semibold text-lg text-purple-500">Job Requests</h2>
            <div className="space-y-3">
                {requests.map((req) => (
                    <Card key={req._id} className="border-l-4 border-l-purple-500 shadow-md bg-purple-50/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={(req.ownerId as any)?.avatar} />
                                    <AvatarFallback>{(req.ownerId as any)?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{(req.ownerId as any)?.name}</p>
                                    <p className="text-xs text-muted-foreground">Fleet Owner</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{req.message}</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleRespond(req._id, 'ACCEPTED')}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleRespond(req._id, 'REJECTED')}
                                >
                                    Decline
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
