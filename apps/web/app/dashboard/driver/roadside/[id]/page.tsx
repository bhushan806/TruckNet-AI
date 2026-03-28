'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import MapComponent from '@/components/map/Map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Star, Clock, MapPin, CheckCircle, Truck, AlertTriangle } from 'lucide-react';

export default function RoadsideTrackingPage() {
    const params = useParams();
    const [breakdown, setBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBreakdown = async () => {
            try {
                const res = await api.get(`/roadside/${params.id}`);
                setBreakdown(res.data.data);
            } catch (error) {
                console.error('Failed to fetch breakdown', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBreakdown();

        // Poll for updates (Simulating socket.io for now)
        const interval = setInterval(fetchBreakdown, 5000);
        return () => clearInterval(interval);
    }, [params.id]);

    if (loading) return <div className="p-6">Loading tracking details...</div>;
    if (!breakdown) return <div className="p-6">Breakdown request not found.</div>;

    const steps = [
        { status: 'REPORTED', label: 'Reported', icon: AlertTriangle },
        { status: 'ASSIGNED', label: 'Mechanic Assigned', icon: CheckCircle },
        { status: 'ON_THE_WAY', label: 'On the Way', icon: Truck },
        { status: 'COMPLETED', label: 'Resolved', icon: Star },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === breakdown.status);
    const provider = breakdown.serviceProvider;

    const markers = [
        { lat: breakdown.location.lat, lng: breakdown.location.lng, title: 'Your Location' }
    ];

    if (provider) {
        markers.push({
            lat: provider.location.lat,
            lng: provider.location.lng,
            title: provider.name
        });
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Request #{breakdown.id.slice(-6)}</h1>
                <Badge variant={breakdown.status === 'COMPLETED' ? 'default' : 'destructive'} className="text-lg">
                    {breakdown.status.replace(/_/g, ' ')}
                </Badge>
            </div>

            {/* Status Stepper */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    return (
                        <div key={step.status} className={`flex flex-col items-center gap-2 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                            <div className={`p-3 rounded-full ${isActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium hidden md:block">{step.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Map */}
                <div className="md:col-span-2 h-96 bg-gray-100 rounded-xl overflow-hidden border">
                    <MapComponent
                        center={[breakdown.location.lat, breakdown.location.lng]}
                        zoom={13}
                        markers={markers}
                    />
                </div>

                {/* Details */}
                <div className="space-y-6">
                    {/* AI Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                ✨ AI Diagnosis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Prediction:</span>
                                <span className="font-medium">{breakdown.aiAnalysis?.prediction || 'Analyzing...'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Severity:</span>
                                <Badge variant="outline">{breakdown.aiAnalysis?.severity || 'Unknown'}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Provider Info */}
                    {provider ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Assigned Mechanic</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                                        {provider.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold">{provider.name}</p>
                                        <div className="flex items-center text-yellow-500 text-sm">
                                            <Star className="h-3 w-3 fill-current" />
                                            <span className="ml-1">{provider.rating}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-4 w-4" /> ETA
                                    </span>
                                    <span className="font-bold">15 mins</span>
                                </div>

                                <Button className="w-full gap-2" variant="outline">
                                    <Phone className="h-4 w-4" />
                                    Call {provider.phone}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Searching for nearby mechanics...
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
