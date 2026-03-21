'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export function AddVehicleDialog({ onVehicleAdded }: { onVehicleAdded: () => void }) {
    const [open, setOpen] = useState(false);
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
                capacity: parseFloat(formData.capacity)
            });
            setOpen(false);
            setFormData({ number: '', type: '', capacity: '' });
            onVehicleAdded();
        } catch (error) {
            console.error(error);
            alert('Failed to add vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>
                        Enter the details of your vehicle to add it to your fleet.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="number" className="text-right">
                                Number
                            </Label>
                            <Input
                                id="number"
                                placeholder="MH-12-AB-1234"
                                className="col-span-3"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type
                            </Label>
                            <Select
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRUCK">Truck</SelectItem>
                                    <SelectItem value="VAN">Van</SelectItem>
                                    <SelectItem value="CONTAINER">Container</SelectItem>
                                    <SelectItem value="TRAILER">Trailer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right">
                                Capacity
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="capacity"
                                    type="number"
                                    placeholder="5.5"
                                    step="0.1"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    required
                                />
                                <span className="text-sm text-muted-foreground">Tons</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Vehicle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
