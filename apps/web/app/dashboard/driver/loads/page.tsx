'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { ArrowLeft, MapPin, Calendar, Truck } from 'lucide-react';
import Link from 'next/link';

export default function AvailableLoadsPage() {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const res = await api.get('/rides/available');
            setRides(res.data.data);
        } catch (error) {
            console.error('Failed to fetch rides', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRide = async (rideId: string) => {
        setActionLoading(rideId);
        try {
            await api.post(`/rides/${rideId}/accept`);
            alert('Ride accepted successfully!');
            fetchRides(); // Refresh list
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to accept ride');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="container py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Available Loads</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading available loads...</div>
            ) : rides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No loads available at the moment.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rides.map((ride) => (
                        <Card key={ride.id || ride._id} className="hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        {ride.vehicleType || 'Truck'}
                                    </Badge>
                                    <span className="font-bold text-lg text-green-600">₹{ride.price}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-green-500 mt-1" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Pickup</p>
                                            <p className="font-medium">{ride.source}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-red-500 mt-1" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Drop</p>
                                            <p className="font-medium">{ride.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Today
                                    </span>
                                    <span>{ride.distance} km</span>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={() => handleAcceptRide(ride.id || ride._id)}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === (ride.id || ride._id) ? 'Accepting...' : 'Accept Load'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
