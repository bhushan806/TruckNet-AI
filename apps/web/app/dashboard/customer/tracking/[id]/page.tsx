'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageCircle, Share2, ShieldCheck, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // Mock Data simulating "In Transit" state
    const [status, setStatus] = useState('IN_TRANSIT');

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:flex-row overflow-hidden">

            {/* LEFT PANEL: STATUS & DETAILS */}
            <div className="w-full md:w-[400px] flex flex-col bg-white border-r border-slate-200 h-full overflow-y-auto z-10 shadow-xl">

                {/* Driver Card */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Assigned Driver</h2>
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>DK</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-slate-900">Dinesh Kumar</h3>
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-sm text-slate-500">MH 12 GT 4455 • Tata 1109</p>
                            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                                4.9 ★ Verified Safe
                            </Badge>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <Button variant="outline" className="bg-white hover:bg-slate-50">
                            <Phone className="h-4 w-4 mr-2" /> Call
                        </Button>
                        <Button variant="outline" className="bg-white hover:bg-slate-50 text-green-600 border-green-200 hover:text-green-700 hover:border-green-300">
                            <MessageCircle className="h-4 w-4 mr-2" /> Chat
                        </Button>
                        <Button variant="ghost">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="p-6 flex-1">
                    <h2 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">Shipment Status</h2>

                    <div className="space-y-8 relative pl-4">
                        {/* Vertical Line */}
                        <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                        {/* Step 1: Confirmed */}
                        <div className="relative flex gap-4">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm z-10 translate-y-1"></div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Booking Confirmed</h4>
                                <p className="text-xs text-slate-500">Today, 2:30 PM</p>
                            </div>
                        </div>

                        {/* Step 2: At Pickup */}
                        <div className="relative flex gap-4">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm z-10 translate-y-1"></div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Truck Arrived @ Pune</h4>
                                <p className="text-xs text-slate-500">Today, 4:15 PM</p>
                            </div>
                        </div>

                        {/* Step 3: In Transit (Active) */}
                        <div className="relative flex gap-4">
                            <div className="w-4 h-4 rounded-full bg-orange-500 border-4 border-white ring-4 ring-orange-100 shadow-sm z-10 translate-y-1 animate-pulse"></div>
                            <div>
                                <h4 className="font-semibold text-orange-600">In Transit</h4>
                                <p className="text-xs text-slate-500">Estimated Arrival: 9:00 PM</p>
                                <div className="mt-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <p className="text-xs text-orange-800 font-medium flex items-center gap-2">
                                        <Truck className="h-3 w-3" />
                                        Expected to reach Toll Plaza in 15 mins
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Drop */}
                        <div className="relative flex gap-4 opacity-50">
                            <div className="w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm z-10 translate-y-1"></div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Delivery @ Mumbai</h4>
                                <p className="text-xs text-slate-500">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                    Trip ID: #TRK-8829-X • Insured by Acko
                </div>
            </div>

            {/* RIGHT PANEL: MAP */}
            <div className="flex-1 bg-slate-100 relative items-center justify-center flex">
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/73.8567,18.5204,10,0/800x600?access_token=YOUR_TOKEN')] bg-cover opacity-50 grayscale"></div>

                {/* Fallback Map UI since we don't have a real map key yet */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl z-10 text-center max-w-sm">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <MapPin className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Live Tracking Active</h3>
                    <p className="text-slate-500 mb-6">
                        The truck is moving towards Mumbai on NH-48.
                        <br />
                        <span className="font-semibold text-slate-900">Current Speed: 55 km/hr</span>
                    </p>
                    <Button className="w-full bg-blue-900 hover:bg-blue-800">
                        Refresh Location
                    </Button>
                </div>
            </div>
        </div>
    );
}
