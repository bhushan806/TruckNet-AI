'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Truck, User, Package, Weight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function OwnerLoadsPage() {
    const [openLoads, setOpenLoads] = useState<any[]>([]);
    const [myLoads, setMyLoads] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [selectedLoad, setSelectedLoad] = useState<any>(null);
    const [assignMode, setAssignMode] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [openRes, myRes, driversRes] = await Promise.all([
                api.get('/loads/open'),
                api.get('/loads/owner-loads'),
                api.get('/driver/my-drivers')
            ]);
            setOpenLoads(Array.isArray(openRes.data.data) ? openRes.data.data : []);
            setMyLoads(Array.isArray(myRes.data.data) ? myRes.data.data : []);
            setDrivers(Array.isArray(driversRes.data.data) ? driversRes.data.data : []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptLoad = async (loadId: string) => {
        if (acceptingId) return; // prevent duplicate
        setAcceptingId(loadId);
        try {
            await api.post(`/loads/${loadId}/accept`);
            alert('Load accepted successfully!');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to accept load');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleOpenAssignDialog = (load: any) => {
        setSelectedLoad(load);
        setAssignMode(true);
        setSelectedDriver('');
    };

    const handleAssignDriver = async () => {
        if (!selectedDriver || !selectedLoad) return;
        const loadId = selectedLoad._id || selectedLoad.id;
        setAssigning(loadId);
        try {
            await api.post(`/loads/${loadId}/assign`, { driverProfileId: selectedDriver });
            alert('Driver assigned successfully!');
            fetchData();
            setSelectedLoad(null);
            setAssignMode(false);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to assign driver');
        } finally {
            setAssigning(null);
        }
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            'OPEN': 'bg-yellow-100 text-yellow-800',
            'ACCEPTED_BY_OWNER': 'bg-blue-100 text-blue-800',
            'ASSIGNED_TO_DRIVER': 'bg-purple-100 text-purple-800',
            'IN_TRANSIT': 'bg-orange-100 text-orange-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <Link href="/dashboard/owner" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Load Marketplace</h1>
                <p className="text-muted-foreground">Browse available loads from customers and manage your accepted loads.</p>
            </div>

            <Tabs defaultValue="available" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="available">
                        Available Loads ({openLoads.length})
                    </TabsTrigger>
                    <TabsTrigger value="my-loads">
                        My Loads ({myLoads.length})
                    </TabsTrigger>
                </TabsList>

                {/* Available Loads Tab */}
                <TabsContent value="available">
                    {loading ? (
                        <div className="text-center py-12">Loading available loads...</div>
                    ) : openLoads.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No Available Loads</h3>
                            <p className="text-muted-foreground">There are no open loads at the moment. Check back later.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {openLoads.map((load) => (
                                <Card key={load._id || load.id} className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Truck className="h-3 w-3" />
                                                {load.vehicleType || 'Truck'}
                                            </Badge>
                                            <span className="font-bold text-lg text-green-600">₹{load.price}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-green-500 mt-1" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pickup</p>
                                                    <p className="font-medium">{load.source}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-red-500 mt-1" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Drop</p>
                                                    <p className="font-medium">{load.destination}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                                            <span className="flex items-center gap-1">
                                                <Package className="h-3 w-3" />
                                                {load.goodsType} • {load.weight}t
                                            </span>
                                            {load.distance > 0 && <span>{load.distance} km</span>}
                                        </div>

                                        {load.customerId && (
                                            <div className="text-xs text-muted-foreground">
                                                Posted by: {load.customerId.name || 'Customer'}
                                            </div>
                                        )}

                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => handleAcceptLoad(load._id || load.id)}
                                            disabled={!!acceptingId}
                                        >
                                            {acceptingId === (load._id || load.id) ? 'Accepting...' : 'Accept Load'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* My Loads Tab */}
                <TabsContent value="my-loads">
                    {myLoads.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No Accepted Loads</h3>
                            <p className="text-muted-foreground">Accept loads from the Available tab to see them here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {myLoads.map((load) => (
                                <Card key={load._id || load.id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge className={getStatusColor(load.status)}>
                                                {load.status.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="font-bold text-lg text-green-600">₹{load.price}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-green-500 mt-1" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pickup</p>
                                                    <p className="font-medium">{load.source}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-red-500 mt-1" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Drop</p>
                                                    <p className="font-medium">{load.destination}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            {load.goodsType} • {load.weight}t
                                        </div>

                                        {load.status === 'ACCEPTED_BY_OWNER' && (
                                            <Button
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                onClick={() => handleOpenAssignDialog(load)}
                                            >
                                                <User className="h-4 w-4 mr-2" /> Assign Driver
                                            </Button>
                                        )}

                                        {load.driverId && (
                                            <div className="pt-2 border-t text-sm">
                                                <p className="text-muted-foreground">Assigned Driver</p>
                                                <p className="font-medium">{load.driverId.userId?.name || 'Driver'}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Assign Driver Dialog */}
            <Dialog open={assignMode} onOpenChange={(open) => !open && setAssignMode(false)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Driver</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {drivers.length === 0 ? (
                            <p className="text-muted-foreground text-center">
                                No drivers connected. Invite drivers to join your fleet first.
                            </p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select a Driver</label>
                                    <Select onValueChange={setSelectedDriver}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a driver..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map((driver) => (
                                                <SelectItem key={driver._id || driver.id} value={driver._id || driver.id}>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <span>{driver.user?.name || 'Unknown Driver'}</span>
                                                        {driver.rating && (
                                                            <Badge variant="secondary" className="ml-2">
                                                                ★ {driver.rating}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleAssignDriver}
                                    disabled={!selectedDriver || !!assigning}
                                >
                                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
