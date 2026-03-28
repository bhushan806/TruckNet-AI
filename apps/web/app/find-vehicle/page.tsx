'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent from '@/components/map/Map';

import api from '@/lib/api';

export default function FindVehiclePage() {
    const [trackingId, setTrackingId] = useState('');
    const [trackingData, setTrackingData] = useState<any>(null);

    const handleTrack = async () => {
        if (trackingId) {
            try {
                // Mock fetching shipment details to get base time and vehicle type
                const baseTime = 300; // 5 hours in minutes
                const vehicleType = "Heavy Truck";
                const weatherCondition = "Rain"; // Mock weather

                const res = await api.post('/ai/eta', { baseTime, weatherCondition, vehicleType });
                const data = res.data;

                if (data.status === 'success') {
                    const etaDetails = data.data;
                    setTrackingData({
                        status: 'In Transit',
                        location: 'Nagpur, Maharashtra',
                        eta: `${Math.floor(etaDetails.adjusted_eta / 60)}h ${etaDetails.adjusted_eta % 60}m (AI Adjusted)`,
                        details: etaDetails.details,
                        lat: 21.1458,
                        lng: 79.0882
                    });
                }
            } catch (error) {
                console.error("Failed to fetch AI ETA", error);
                setTrackingData({
                    status: 'In Transit',
                    location: 'Nagpur, Maharashtra',
                    eta: '5 Hours (Standard)',
                    lat: 21.1458,
                    lng: 79.0882
                });
            }
        }
    };

    return (
        <div className="container py-12 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Track Your Shipment</h1>
                <p className="text-muted-foreground">Enter your booking ID or vehicle number to get real-time status.</p>
            </div>

            <div className="max-w-xl mx-auto flex gap-4">
                <Input
                    placeholder="Enter Booking ID (e.g. TRK-1234)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                />
                <Button onClick={handleTrack}>Track</Button>
            </div>

            {trackingData && (
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipment Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span>Status</span>
                                <span className="font-bold text-blue-600">{trackingData.status}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Current Location</span>
                                <span className="font-bold">{trackingData.location}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>ETA</span>
                                <span className="font-bold">{trackingData.eta}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="h-[400px] rounded-lg overflow-hidden border">
                        <MapComponent
                            center={[trackingData.lat, trackingData.lng]}
                            zoom={10}
                            markers={[{ lat: trackingData.lat, lng: trackingData.lng, title: 'Current Location' }]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
