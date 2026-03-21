'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AddVehiclePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        number: '',
        type: '',
        capacity: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/vehicles', {
                ...formData,
                capacity: Number(formData.capacity)
            });
            router.push('/dashboard/owner/vehicles');
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to add vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <Link href="/dashboard/owner" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Add New Vehicle</h1>
                <p className="text-muted-foreground">Register a new vehicle to your fleet.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Details</CardTitle>
                    <CardDescription>Enter the information for the new vehicle.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="number">Vehicle Number</Label>
                            <Input
                                id="number"
                                placeholder="e.g. MH-12-AB-1234"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Vehicle Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Truck">Truck</SelectItem>
                                    <SelectItem value="Container">Container</SelectItem>
                                    <SelectItem value="Van">Van</SelectItem>
                                    <SelectItem value="Trailer">Trailer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity (Tons)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                placeholder="e.g. 10"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                required
                                min="0.1"
                                step="0.1"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Vehicle
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
