'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Truck } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { AddVehicleDialog } from '@/components/dashboard/AddVehicleDialog';

export default function VehicleManagementPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [editForm, setEditForm] = useState({ capacity: 0, type: '' });

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles');
            setVehicles(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleMaintenance = async (vehicle: any) => {
        try {
            const newStatus = vehicle.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
            await api.put(`/vehicles/${vehicle._id || vehicle.id}`, { status: newStatus });
            fetchVehicles();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const openEdit = (vehicle: any) => {
        setEditingVehicle(vehicle);
        setEditForm({ capacity: vehicle.capacity, type: vehicle.type });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingVehicle) return;
        try {
            await api.put(`/vehicles/${editingVehicle._id || editingVehicle.id}`, editForm);
            setEditOpen(false);
            setEditingVehicle(null);
            fetchVehicles();
        } catch (error) {
            console.error('Failed to update vehicle', error);
        }
    };

    return (
        <div className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/dashboard/owner" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Vehicle Management</h1>
                    <p className="text-muted-foreground">Oversee maintenance and vehicle details.</p>
                </div>
                <AddVehicleDialog onVehicleAdded={fetchVehicles} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                    <Card key={vehicle._id || vehicle.id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white">{vehicle.number}</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{vehicle.type}</div>
                            <p className="text-xs text-muted-foreground">Capacity: {vehicle.capacity} Tons</p>
                            <div className="flex items-center mt-2 gap-2">
                                <span className={`h-2 w-2 rounded-full ${vehicle.status === 'AVAILABLE' ? 'bg-green-500' : vehicle.status === 'MAINTENANCE' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                <p className="text-xs text-muted-foreground">Status: {vehicle.status}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300" onClick={() => openEdit(vehicle)}>
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`w-full border-slate-700 hover:bg-slate-800 ${vehicle.status === 'MAINTENANCE' ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}`}
                                    onClick={() => handleMaintenance(vehicle)}
                                >
                                    {vehicle.status === 'MAINTENANCE' ? 'Active' : 'Maintain'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {vehicles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No vehicles found. Add your first vehicle to get started.
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-lg font-bold text-white mb-4">Edit Vehicle</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-400">Type</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-400">Capacity (Tons)</label>
                                <input
                                    type="number"
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={editForm.capacity}
                                    onChange={(e) => setEditForm({ ...editForm, capacity: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-500">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
