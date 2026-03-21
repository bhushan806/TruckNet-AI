'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import LocationPickerMap from '@/components/map/LocationPickerMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Mic, Camera, MapPin, Phone } from 'lucide-react';

export default function RoadsidePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [formData, setFormData] = useState({
        type: 'OTHER',
        description: '',
    });

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocation({ lat, lng });
    };

    const handleSubmit = async () => {
        if (!location) return alert('Please select a location');
        if (!formData.description) return alert('Please describe the issue');

        setLoading(true);
        try {
            // Mock driver/vehicle IDs for now (In real app, get from context/auth)
            const payload = {
                driverId: '656565656565656565656565', // Replace with real ID
                vehicleId: '656565656565656565656566', // Replace with real ID
                location: { ...location, address: 'Unknown Road' }, // Reverse geocode in future
                description: formData.description,
                type: formData.type,
                images: [], // Implement upload later
                voiceUrl: '' // Implement upload later
            };

            const res = await api.post('/roadside/report', payload);
            const breakdownId = res.data.data.breakdown.id;

            // Redirect to tracking page
            router.push(`/dashboard/driver/roadside/${breakdownId}`);
        } catch (error) {
            console.error('Failed to report breakdown', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    Roadside Assistance
                </h1>
                <Button variant="destructive" className="animate-pulse shadow-lg shadow-red-500/50">
                    SOS EMERGENCY
                </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <div className="space-y-2">
                    <Label>Issue Type</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, type: val })} defaultValue="OTHER">
                        <SelectTrigger>
                            <SelectValue placeholder="Select Issue Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PUNCTURE">Tire Puncture</SelectItem>
                            <SelectItem value="ENGINE">Engine Failure</SelectItem>
                            <SelectItem value="FUEL">Fuel Shortage</SelectItem>
                            <SelectItem value="ACCIDENT">Accident</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        placeholder="Describe the problem (e.g., Smoke coming from engine...)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => alert('Voice recording simulated')}>
                        <Mic className="h-6 w-6" />
                        Record Voice
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => alert('Photo upload simulated')}>
                        <Camera className="h-6 w-6" />
                        Upload Photo
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Current Location
                    </Label>
                    <LocationPickerMap onLocationSelect={handleLocationSelect} />
                    {location && (
                        <p className="text-xs text-muted-foreground">
                            Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                        </p>
                    )}
                </div>

                <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Request Help'}
                </Button>
            </div>
        </div>
    );
}
