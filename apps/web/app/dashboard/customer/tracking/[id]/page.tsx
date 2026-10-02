'use client';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, MessageCircle, Share2, ShieldCheck, MapPin, Truck, CheckCircle2, AlertCircle, RefreshCw, FileText, CreditCard } from 'lucide-react';
import MapComponent from '@/components/map/Map';
import TripConnectModal from '@/components/trip/TripConnectModal';
import BiltyViewerModal from '@/components/trip/BiltyViewerModal';
import PaymentModal from '@/components/payment/PaymentModal';
import api from '@/lib/api';
import { createSocket } from '@/lib/socket';

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: loadId } = use(params);

    const [load, setLoad] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showBiltyModal, setShowBiltyModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [truckLocation, setTruckLocation] = useState<{ lat: number; lng: number }>({
        lat: 19.0760,
        lng: 72.8777
    });

    const fetchLoad = async () => {
        try {
            const res = await api.get(`/loads/${loadId}`);
            if (res.data?.data) {
                const data = res.data.data;
                setLoad(data);
                if (data.pickupLat && data.pickupLng) {
                    setTruckLocation({ lat: data.pickupLat, lng: data.pickupLng });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to load shipment details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoad();

        // Connect to Socket.io for live updates
        const socket = createSocket();

        socket.on('connect', () => {
            socket.emit('joinRide', loadId);
        });

        socket.on('load:statusChanged', (data: any) => {
            if (data.loadId === loadId) {
                setLoad((prev: any) => prev ? { ...prev, status: data.status } : prev);
            }
        });

        socket.on('locationUpdated', (data: any) => {
            if (data.lat && data.lng) {
                setTruckLocation({ lat: data.lat, lng: data.lng });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [loadId]);

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'OPEN': return 1;
            case 'ACCEPTED_BY_OWNER': return 2;
            case 'ASSIGNED_TO_DRIVER': return 3;
            case 'IN_TRANSIT': return 4;
            case 'COMPLETED': return 5;
            default: return 1;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-slate-50">
                <div className="text-center space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">Connecting to live tracking satellite...</p>
                </div>
            </div>
        );
    }

    if (error || !load) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-6 rounded-2xl border shadow-sm text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                    <h3 className="font-bold text-slate-900">Shipment Not Found</h3>
                    <p className="text-sm text-slate-500">{error || 'Invalid tracking ID or load has been archived.'}</p>
                    <Button onClick={() => window.location.href = '/dashboard/customer'} className="bg-blue-600">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentStep = getStatusStep(load.status);
    const driverName = load.driverId?.userId?.name || 'Driver Being Assigned';
    const driverPhone = load.driverId?.userId?.phone || 'Pending';
    const companyName = load.ownerId?.companyName || 'Verified Fleet Partner';

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:flex-row overflow-hidden">
            {/* LEFT PANEL: STATUS & DETAILS */}
            <div className="w-full md:w-[420px] flex flex-col bg-white border-r border-slate-200 h-full overflow-y-auto z-10 shadow-xl">
                {/* Driver / Fleet Card */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Fleet</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[11px]">
                            {load.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-sm bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                            <AvatarFallback>{driverName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-base text-slate-900 truncate">{driverName}</h3>
                                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-slate-600 truncate">{companyName}</p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{load.vehicleType || 'Commercial Truck'} • {load.weight} Tons</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-xs text-slate-800"
                            onClick={() => {
                                if (driverPhone !== 'Pending') {
                                    window.location.href = `tel:${driverPhone}`;
                                }
                            }}
                            disabled={driverPhone === 'Pending'}
                        >
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> {driverPhone !== 'Pending' ? driverPhone : 'Call Driver'}
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => window.open(`https://wa.me/91${driverPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`TruckNet Ref: ${load.transactionId || load.loadNumber || load._id} - Hi driver!`)}`, '_blank')}
                            disabled={driverPhone === 'Pending'}
                        >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> WhatsApp
                        </Button>
                    </div>

                    <Button
                        className="w-full mt-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs h-9 font-semibold shadow-md"
                        onClick={() => setShowConnectModal(true)}
                    >
                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> Direct Chat & Verified Credentials
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full mt-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border-emerald-300 text-xs h-9 font-semibold shadow-sm"
                        onClick={() => setShowBiltyModal(true)}
                    >
                        <FileText className="h-3.5 w-3.5 mr-2 text-emerald-600" /> View Statutory Bilty (LR) & Documents
                    </Button>

                    <Button
                        className="w-full mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs h-9 font-semibold shadow-md"
                        onClick={() => setShowPaymentModal(true)}
                    >
                        <CreditCard className="h-3.5 w-3.5 mr-2" /> Pay Advance / Settle Freight (UPI)
                    </Button>
                </div>

                {/* Timeline */}
                <div className="p-6 flex-1">
                    <h2 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Shipment Lifecycle</h2>
                    <div className="space-y-6 relative pl-4">
                        <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                        {/* Step 1: Created */}
                        <div className="relative flex gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 translate-y-1 ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Load Posted</h4>
                                <p className="text-xs text-slate-500">{load.source} ➔ {load.destination}</p>
                            </div>
                        </div>

                        {/* Step 2: Owner Accepted */}
                        <div className="relative flex gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 translate-y-1 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Transporter Accepted</h4>
                                <p className="text-xs text-slate-500">{currentStep >= 2 ? 'Fleet partner confirmed load' : 'Waiting for transporter acceptance'}</p>
                            </div>
                        </div>

                        {/* Step 3: Driver Assigned */}
                        <div className="relative flex gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 translate-y-1 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Driver Assigned</h4>
                                <p className="text-xs text-slate-500">{currentStep >= 3 ? driverName : 'Driver assignment in progress'}</p>
                            </div>
                        </div>

                        {/* Step 4: In Transit */}
                        <div className="relative flex gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 translate-y-1 ${currentStep >= 4 ? 'bg-orange-500 animate-pulse ring-4 ring-orange-100' : 'bg-slate-300'}`}></div>
                            <div>
                                <h4 className={`text-sm ${currentStep >= 4 ? 'font-bold text-orange-600' : 'font-semibold text-slate-900'}`}>In Transit</h4>
                                <p className="text-xs text-slate-500">{currentStep >= 4 ? 'Vehicle en-route to destination' : 'Pending loading & dispatch'}</p>
                            </div>
                        </div>

                        {/* Step 5: Completed */}
                        <div className="relative flex gap-4">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 translate-y-1 ${currentStep >= 5 ? 'bg-emerald-600' : 'bg-slate-300'}`}></div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Delivered</h4>
                                <p className="text-xs text-slate-500">{currentStep >= 5 ? 'Consignment delivered & verified' : 'POD pending delivery'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-700">
                            TXN: <span className="font-bold text-slate-900">{load.transactionId || 'TRX-' + load._id.slice(-6).toUpperCase()}</span>
                        </span>
                        <span className="font-bold text-blue-900">₹{load.price?.toLocaleString('en-IN')} Total</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>LOAD: {load.loadNumber || load._id.slice(-8).toUpperCase()}</span>
                        <span className="text-emerald-600 font-sans font-medium">🛡️ Anti-Overlap Protected</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: LIVE LEAFLET MAP */}
            <div className="flex-1 bg-slate-100 relative">
                <MapComponent
                    center={[truckLocation.lat, truckLocation.lng]}
                    zoom={11}
                    markers={[
                        {
                            lat: truckLocation.lat,
                            lng: truckLocation.lng,
                            title: `🚛 ${driverName} (${load.goodsType})`
                        }
                    ]}
                />

                {/* Floating Telemetry Badge */}
                <div className="absolute top-4 right-4 z-[500] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Live GPS Telemetry
                    </div>
                    <p className="text-slate-500 text-[11px]">
                        Coordinates: {truckLocation.lat.toFixed(4)}, {truckLocation.lng.toFixed(4)}
                    </p>
                </div>
            </div>

            {/* Direct Connect & Chat Modal */}
            <TripConnectModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                loadId={loadId}
                loadIdentifier={load.transactionId || load.loadNumber || loadId}
            />

            {/* Statutory Indian Bilty / LR Viewer */}
            <BiltyViewerModal
                isOpen={showBiltyModal}
                onClose={() => setShowBiltyModal(false)}
                loadId={loadId}
                transactionId={load.transactionId}
            />

            {/* Online UPI & Escrow Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                loadId={loadId}
                transactionId={load.transactionId}
                onPaymentSuccess={fetchLoad}
            />
        </div>
    );
}
