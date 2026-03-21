'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MapComponent from '@/components/map/Map';
import api from '@/lib/api';
import { Package, MapPin, Clock, Truck } from 'lucide-react';

export default function CustomerDashboard() {
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        weight: '',
        goodsType: '',
        price: '',
        vehicleType: 'Truck',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handlePostLoad = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Geocode for distance estimation
            const sourceRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.source)}`);
            const sourceData = await sourceRes.json();
            const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.destination)}`);
            const destData = await destRes.json();

            let distance = 0;
            let pickupLat = 0, pickupLng = 0, dropLat = 0, dropLng = 0;
            if (sourceData[0] && destData[0]) {
                pickupLat = parseFloat(sourceData[0].lat);
                pickupLng = parseFloat(sourceData[0].lon);
                dropLat = parseFloat(destData[0].lat);
                dropLng = parseFloat(destData[0].lon);

                const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=false`);
                const routeData = await routeRes.json();
                if (routeData.code === 'Ok' && routeData.routes?.length > 0) {
                    distance = Math.round(routeData.routes[0].distance / 1000);
                }
            }

            await api.post('/loads', {
                source: formData.source,
                destination: formData.destination,
                weight: parseFloat(formData.weight),
                goodsType: formData.goodsType,
                price: parseFloat(formData.price),
                vehicleType: formData.vehicleType,
                description: formData.description,
                distance,
                pickupLat, pickupLng, dropLat, dropLng,
            });

            setSuccess('Load posted successfully! Truck owners can now bid on it.');
            setFormData({ source: '', destination: '', weight: '', goodsType: '', price: '', vehicleType: 'Truck', description: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to post load');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold">Customer Dashboard</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Post a Load Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Post a Load
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePostLoad} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">{error}</div>
                            )}
                            {success && (
                                <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md">{success}</div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pickup Location</Label>
                                    <Input
                                        placeholder="e.g. Pune"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Drop Location</Label>
                                    <Input
                                        placeholder="e.g. Mumbai"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Weight (tons)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Budget (₹)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 15000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Goods Type</Label>
                                    <Input
                                        placeholder="e.g. Electronics"
                                        value={formData.goodsType}
                                        onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Select
                                        value={formData.vehicleType}
                                        onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Truck">Truck</SelectItem>
                                            <SelectItem value="Container">Container</SelectItem>
                                            <SelectItem value="Trailer">Trailer</SelectItem>
                                            <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description (optional)</Label>
                                <Input
                                    placeholder="Any special instructions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Posting...' : 'Post Load'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Map */}
                <div className="h-[500px] rounded-lg overflow-hidden border">
                    <MapComponent />
                </div>
            </div>

            {/* My Loads Tracking */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">My Loads</h2>
                <MyLoadsList />
            </div>
        </div>
    );
}

function MyLoadsList() {
    const [loads, setLoads] = useState<any[]>([]);

    useEffect(() => {
        const fetchLoads = async () => {
            try {
                const res = await api.get('/loads/my-loads');
                setLoads(res.data.data);
            } catch (error) {
                console.error('Failed to fetch loads', error);
            }
        };
        fetchLoads();
    }, []);

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

    const handleCancel = async (loadId: string) => {
        if (!confirm('Are you sure you want to cancel this load?')) return;
        try {
            await api.patch(`/loads/${loadId}/cancel`);
            setLoads(prev => prev.map(l =>
                (l._id === loadId || l.id === loadId) ? { ...l, status: 'CANCELLED' } : l
            ));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Cannot cancel this load');
        }
    };

    if (loads.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No loads posted yet. Post a load above to get started.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loads.map((load) => (
                <Card key={load._id || load.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">
                                {load.source} → {load.destination}
                            </CardTitle>
                            <Badge className={getStatusColor(load.status)}>
                                {load.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Goods:</span>
                            <span>{load.goodsType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Weight:</span>
                            <span>{load.weight} tons</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-bold text-green-600">₹{load.price}</span>
                        </div>
                        {load.distance > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Distance:</span>
                                <span>{load.distance} km</span>
                            </div>
                        )}

                        {/* Owner info after acceptance */}
                        {load.ownerId && load.status !== 'OPEN' && (
                            <div className="pt-2 border-t mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Accepted by Owner</p>
                                <p className="font-medium">{load.ownerId?.companyName || 'Transport Company'}</p>
                            </div>
                        )}

                        {load.status === 'OPEN' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => handleCancel(load._id || load.id)}
                            >
                                Cancel Load
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
