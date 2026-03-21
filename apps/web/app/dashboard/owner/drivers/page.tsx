'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Truck, FileText, Shield, Phone, Mail, Star } from 'lucide-react';
import api from '@/lib/api';

export default function ManageDriversPage() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await api.get('/driver/my-drivers');
                setDrivers(res.data.data);
            } catch (error) {
                console.error('Failed to fetch drivers', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-white">Loading drivers...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white text-glow">Manage Drivers</h1>
                <p className="text-muted-foreground font-light">View and manage your employed drivers and their documents.</p>
            </div>

            {drivers.length === 0 ? (
                <Card className="glass border-none">
                    <CardContent className="p-8 text-center text-slate-400">
                        No drivers found. Go to "Recruit Drivers" to hire new drivers.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {drivers.map((driver) => (
                        <DriverCard key={driver._id} driver={driver} />
                    ))}
                </div>
            )}
        </div>
    );
}

function DriverCard({ driver }: { driver: any }) {
    return (
        <Card className="glass glass-hover border-none overflow-hidden group">
            <CardHeader className="bg-white/5 border-b border-white/10 pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                            {driver.user?.name?.[0] || 'D'}
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">{driver.user?.name || 'Unknown Driver'}</CardTitle>
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <Star className="h-3 w-3 fill-current" />
                                <span>{driver.rating?.toFixed(1) || 'N/A'}</span>
                                <span className="text-slate-500">({driver.totalTrips} trips)</span>
                            </div>
                        </div>
                    </div>
                    <Badge variant={driver.isAvailable ? 'default' : 'secondary'} className={driver.isAvailable ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-slate-700 text-slate-300'}>
                        {driver.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-4 w-4 text-slate-500" />
                        {driver.user?.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="h-4 w-4 text-slate-500" />
                        {driver.user?.phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <Shield className="h-4 w-4 text-slate-500" />
                        Lic: {driver.licenseNumber}
                    </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Assigned Vehicle</div>
                    {driver.vehicle ? (
                        <div className="flex items-center gap-2 text-blue-300 font-medium">
                            <Truck className="h-4 w-4" />
                            {driver.vehicle.number}
                            <span className="text-xs text-slate-500 font-normal">({driver.vehicle.type})</span>
                        </div>
                    ) : (
                        <div className="text-slate-500 italic text-sm">No vehicle assigned</div>
                    )}
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-slate-300">
                            <FileText className="mr-2 h-4 w-4" />
                            View Documents
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Driver Documents</DialogTitle>
                            <CardDescription className="text-slate-400">Verified legal documents for {driver.user?.name}</CardDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            {driver.documents && driver.documents.length > 0 ? (
                                driver.documents.map((doc: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded text-blue-400">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{doc.type.replace('_', ' ')}</div>
                                                <div className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={
                                            doc.status === 'VERIFIED' ? 'border-green-500/50 text-green-400' :
                                                doc.status === 'REJECTED' ? 'border-red-500/50 text-red-400' :
                                                    'border-yellow-500/50 text-yellow-400'
                                        }>
                                            {doc.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No documents uploaded yet.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
