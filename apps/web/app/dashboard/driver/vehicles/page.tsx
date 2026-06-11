'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Truck, Plus, Wrench, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { notify } from '@/lib/toast';

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
    MAINTENANCE: 'bg-red-100 text-red-800 border-red-200',
    ON_TRIP: 'bg-orange-100 text-orange-800 border-orange-200',
    BUSY: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function DriverVehiclesPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ number: '', type: '', capacity: '' });
    const [editForm, setEditForm] = useState({ type: '', capacity: '' });

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vehicles');
            setVehicles(res.data.data || []);
        } catch {
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVehicles(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await api.post('/vehicles', { ...form, capacity: parseFloat(form.capacity) });
            notify.success('Vehicle added successfully!');
            setAddOpen(false);
            setForm({ number: '', type: '', capacity: '' });
            fetchVehicles();
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Failed to add vehicle');
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (v: any) => {
        setEditingVehicle(v);
        setEditForm({ type: v.type, capacity: v.capacity?.toString() });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingVehicle) return;
        setSaving(true);
        try {
            await api.put(`/vehicles/${editingVehicle._id || editingVehicle.id}`, {
                type: editForm.type,
                capacity: parseFloat(editForm.capacity),
            });
            notify.success('Vehicle updated!');
            setEditOpen(false);
            fetchVehicles();
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMaintenance = async (vehicle: any) => {
        const newStatus = vehicle.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        try {
            await api.put(`/vehicles/${vehicle._id || vehicle.id}`, { status: newStatus });
            notify.success(`Vehicle marked as ${newStatus.toLowerCase()}`);
            fetchVehicles();
        } catch {
            notify.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/driver">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">My Vehicles</h1>
                        <p className="text-muted-foreground text-sm">Manage your registered trucks and vehicles</p>
                    </div>
                </div>
                <Button onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : vehicles.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No vehicles registered yet</p>
                        <p className="text-sm mt-1 mb-4">Add your truck to start receiving load assignments</p>
                        <Button onClick={() => setAddOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Your First Vehicle
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map(vehicle => (
                        <Card key={vehicle._id || vehicle.id} className="hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Truck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{vehicle.number}</CardTitle>
                                            <CardDescription className="text-xs">{vehicle.type}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={STATUS_COLORS[vehicle.status] || 'bg-gray-100 text-gray-800'}>
                                        {vehicle.status === 'AVAILABLE' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                        {vehicle.status?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                    <div className="bg-muted/50 rounded-lg p-2">
                                        <p className="text-xs text-muted-foreground">Capacity</p>
                                        <p className="font-semibold">{vehicle.capacity} Tons</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-2">
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <p className="font-semibold text-xs">{vehicle.status?.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(vehicle)}>
                                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 ${vehicle.status === 'MAINTENANCE' ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
                                        onClick={() => handleToggleMaintenance(vehicle)}
                                    >
                                        <Wrench className="h-3 w-3 mr-1" />
                                        {vehicle.status === 'MAINTENANCE' ? 'Set Active' : 'Maintain'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Vehicle Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Vehicle</DialogTitle>
                        <DialogDescription>Enter your truck details to register it on TruckNet.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Registration Number</Label>
                            <Input
                                placeholder="e.g. MH-12-AB-1234"
                                value={form.number}
                                onChange={e => setForm({ ...form, number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Select onValueChange={v => setForm({ ...form, type: v })} required>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRUCK">Truck</SelectItem>
                                    <SelectItem value="VAN">Van</SelectItem>
                                    <SelectItem value="CONTAINER">Container</SelectItem>
                                    <SelectItem value="TRAILER">Trailer</SelectItem>
                                    <SelectItem value="MINI_TRUCK">Mini Truck</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity (Tons)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 10.5"
                                value={form.capacity}
                                onChange={e => setForm({ ...form, capacity: e.target.value })}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Vehicle'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Vehicle Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Vehicle — {editingVehicle?.number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Input value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity (Tons)</Label>
                            <Input type="number" step="0.1" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
