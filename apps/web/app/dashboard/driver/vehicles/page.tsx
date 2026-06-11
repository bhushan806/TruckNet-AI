'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Truck, CheckCircle, AlertCircle, Info, Wrench } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { notify } from '@/lib/toast';

export default function DriverVehiclesPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/driver/profile');
            setProfile(res.data.data);
        } catch {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleToggleAvailability = async () => {
        setUpdatingStatus(true);
        try {
            await api.post('/driver/status');
            notify.success('Availability status updated!');
            fetchProfile();
        } catch {
            notify.error('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const vehicle = profile?.vehicle;
    const isAvailable = profile?.isAvailable;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">My Vehicle</h1>
                    <p className="text-muted-foreground text-sm">Your assigned truck and availability status</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : vehicle ? (
                <>
                    {/* Vehicle Card */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{vehicle.number}</CardTitle>
                                        <CardDescription>{vehicle.type}</CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        vehicle.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 border-green-200' :
                                        vehicle.status === 'ON_TRIP' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                        'bg-red-100 text-red-800 border-red-200'
                                    }
                                >
                                    {vehicle.status === 'AVAILABLE'
                                        ? <CheckCircle className="h-3 w-3 mr-1" />
                                        : <AlertCircle className="h-3 w-3 mr-1" />
                                    }
                                    {vehicle.status?.replace('_', ' ')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-muted/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                                    <p className="text-xl font-bold">{vehicle.capacity}</p>
                                    <p className="text-xs text-muted-foreground">Tons</p>
                                </div>
                                <div className="bg-muted/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                                    <p className="text-base font-bold">{vehicle.type}</p>
                                </div>
                                <div className="bg-muted/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Reg. Number</p>
                                    <p className="text-base font-bold">{vehicle.number}</p>
                                </div>
                                <div className="bg-muted/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className={`text-base font-bold ${vehicle.status === 'AVAILABLE' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {vehicle.status?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Driver Availability Toggle */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-muted-foreground" /> Driver Availability
                            </CardTitle>
                            <CardDescription>Toggle whether you are available to take new load assignments</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Current Status</p>
                                <p className={`text-xs mt-1 ${isAvailable ? 'text-green-600' : 'text-orange-600'}`}>
                                    {isAvailable ? '✅ Available for loads' : '⏸️ Not taking new loads'}
                                </p>
                            </div>
                            <Button
                                variant={isAvailable ? 'destructive' : 'default'}
                                onClick={handleToggleAvailability}
                                disabled={updatingStatus}
                            >
                                {updatingStatus ? 'Updating...' : isAvailable ? 'Go Offline' : 'Go Online'}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* No vehicle assigned yet */
                <Card>
                    <CardContent className="py-16 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">No Vehicle Assigned Yet</h2>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                            Vehicles are assigned by fleet owners. Once an owner adds you to their fleet, your assigned truck will appear here.
                        </p>
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-left max-w-sm mx-auto">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How to get a vehicle assigned?</p>
                                    <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                                        <li>• Complete your driver profile</li>
                                        <li>• Upload all required documents</li>
                                        <li>• Wait for a fleet owner to connect with you</li>
                                        <li>• Accept available loads to build your reputation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center mt-6">
                            <Link href="/dashboard/driver/profile">
                                <Button variant="outline">Complete Profile</Button>
                            </Link>
                            <Link href="/dashboard/driver/documents">
                                <Button>Upload Documents</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
