'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { MapPin, Calendar, Truck, User } from 'lucide-react';

export default function DispatchPage() {
    const [rides, setRides] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ridesRes, driversRes] = await Promise.all([
                api.get('/rides/available'),
                api.get('/driver/all')
            ]);
            setRides(ridesRes.data.data);
            setDrivers(driversRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (rideId: string) => {
        if (!selectedDriver) return;
        setAssigning(rideId);
        try {
            await api.post(`/rides/${rideId}/assign`, { driverId: selectedDriver });
            alert('Driver assigned successfully!');
            fetchData(); // Refresh list
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to assign driver');
        } finally {
            setAssigning(null);
            setSelectedDriver('');
        }
    };

    return (
        <div className="container py-8 space-y-6">
            <h1 className="text-3xl font-bold">Dispatch Console</h1>
            <p className="text-muted-foreground">Assign pending loads to your drivers.</p>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : rides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No pending loads available.
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

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">Assign Driver</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Assign Driver</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Select Driver</label>
                                                <Select onValueChange={setSelectedDriver}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a driver..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {drivers.map((driver) => (
                                                            <SelectItem key={driver.id} value={driver.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    <span>{driver.user?.name || 'Unknown Driver'}</span>
                                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                                        {driver.isAvailable ? 'Available' : 'Busy'}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {selectedDriver && (() => {
                                                const driver = drivers.find(d => d.id === selectedDriver);
                                                if (!driver) return null;
                                                return (
                                                    <Card className="bg-muted/50 border-none">
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                                    {driver.user?.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold">{driver.user?.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{driver.experienceYears} Years Experience</p>
                                                                </div>
                                                                <div className="ml-auto flex gap-2">
                                                                    <Button size="sm" variant="outline" asChild>
                                                                        <a href={`tel:${driver.user?.phone}`}>Call</a>
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" asChild>
                                                                        <a href={`mailto:${driver.user?.email}`}>Email</a>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                <div className="bg-background p-2 rounded border">
                                                                    <p className="text-xs text-muted-foreground">License</p>
                                                                    <p className="font-medium">{driver.licenseNumber}</p>
                                                                </div>
                                                                <div className="bg-background p-2 rounded border">
                                                                    <p className="text-xs text-muted-foreground">Rating</p>
                                                                    <p className="font-medium flex items-center gap-1">
                                                                        {driver.rating} <span className="text-yellow-500">★</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })()}

                                            <Button
                                                className="w-full"
                                                onClick={() => handleAssign(ride.id || ride._id)}
                                                disabled={!selectedDriver || assigning === (ride.id || ride._id)}
                                            >
                                                {assigning === (ride.id || ride._id) ? 'Sending Request...' : 'Send Assignment Request'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
