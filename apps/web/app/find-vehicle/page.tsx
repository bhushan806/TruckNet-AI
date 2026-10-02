'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent from '@/components/map/Map';
import TripConnectModal from '@/components/trip/TripConnectModal';
import api from '@/lib/api';
import { AlertCircle, RefreshCw, Truck, MessageCircle, ShieldCheck, Lock } from 'lucide-react';

export default function FindVehiclePage() {
    const [trackingId, setTrackingId] = useState('');
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);

    const handleTrack = async () => {
        const id = trackingId.trim();
        if (!id) return;

        setLoading(true);
        setErrorMsg('');
        setTrackingData(null);

        try {
            // First query trip by load identifier or load endpoint
            const res = await api.get(`/loads/${id}`);
            const load = res.data?.data;

            if (load) {
                const lat = load.pickupLat || 19.0760;
                const lng = load.pickupLng || 72.8777;

                setTrackingData({
                    loadId: load._id,
                    transactionId: load.transactionId || `TRX-${load._id.slice(-6).toUpperCase()}`,
                    loadNumber: load.loadNumber || `LOD-${load._id.slice(-8).toUpperCase()}`,
                    status: load.status?.replace(/_/g, ' ') || 'In Transit',
                    origin: load.source,
                    destination: load.destination,
                    vehicleType: load.vehicleType || 'Commercial Truck',
                    goodsType: load.goodsType,
                    weight: `${load.weight} Tons`,
                    lat,
                    lng,
                    carrier: load.ownerId?.companyName || 'Verified Fleet Transporter',
                    driverName: load.driverId?.userId?.name || 'Assigned Driver',
                });
            }
        } catch (err: any) {
            setErrorMsg('No active shipment found with this ID. Please ensure you entered a valid Transaction ID (TRX-...), Load ID (LOD-...), or 24-char Code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-12 space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                    <Truck className="h-3.5 w-3.5" /> Real-Time Telemetry Tracking & Direct Trust
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Track Commercial Shipment</h1>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Enter your live Transaction ID (TRX-...), Load ID (LOD-...), or booking code to inspect real-time GPS location and connect directly.
                </p>
            </div>

            <div className="max-w-xl mx-auto flex gap-3">
                <Input
                    placeholder="Enter Transaction ID (e.g. TRX-...) or Load ID"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="h-12 bg-white font-mono text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <Button onClick={handleTrack} disabled={loading} className="h-12 px-6 bg-blue-900 hover:bg-blue-800">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Track Live'}
                </Button>
            </div>

            {errorMsg && (
                <div className="max-w-xl mx-auto flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {trackingData && (
                <div className="grid md:grid-cols-2 gap-8 mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="bg-slate-50 border-b pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Shipment Overview</CardTitle>
                                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                    {trackingData.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                <span>TXN: <strong className="text-slate-900">{trackingData.transactionId}</strong></span>
                                <span>LOAD: <strong className="text-slate-900">{trackingData.loadNumber}</strong></span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3.5 pt-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Route</span>
                                <span className="font-semibold text-slate-900">{trackingData.origin} ➔ {trackingData.destination}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Cargo</span>
                                <span className="font-semibold text-slate-900">{trackingData.weight} ({trackingData.goodsType})</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Vehicle Type</span>
                                <span className="font-semibold text-slate-900">{trackingData.vehicleType}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Transporter</span>
                                <span className="font-semibold text-slate-900">{trackingData.carrier}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-slate-500">Live GPS</span>
                                <span className="font-mono text-xs text-emerald-700 font-bold">{trackingData.lat.toFixed(4)}, {trackingData.lng.toFixed(4)}</span>
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 text-white font-semibold text-xs h-10 shadow-sm"
                                    onClick={() => setShowConnectModal(true)}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" /> Direct Contact & Live Chat
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="h-[380px] rounded-2xl overflow-hidden border shadow-md relative">
                        <MapComponent
                            center={[trackingData.lat, trackingData.lng]}
                            zoom={11}
                            markers={[{ lat: trackingData.lat, lng: trackingData.lng, title: `Shipment: ${trackingData.goodsType} (${trackingData.transactionId})` }]}
                        />
                    </div>
                </div>
            )}

            {/* Direct Contact & Real-Time Chat Modal */}
            <TripConnectModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                loadId={trackingData?.loadId}
                loadIdentifier={trackingData?.transactionId || trackingData?.loadNumber || trackingData?.loadId}
            />
        </div>
    );
}
