'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Phone, Mail, Star, Truck, Shield, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { notify } from '@/lib/toast';

export default function DriverProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', licenseNumber: '', experience: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/driver/profile');
            const data = res.data.data;
            setProfile(data);
            setForm({
                name: data?.name || user?.name || '',
                phone: data?.phone || user?.phone || '',
                licenseNumber: data?.licenseNumber || '',
                experience: data?.experience?.toString() || '',
            });
        } catch {
            // Fallback to auth context user if profile API fails
            setForm({
                name: user?.name || '',
                phone: user?.phone || '',
                licenseNumber: '',
                experience: '',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/driver/profile', {
                name: form.name,
                phone: form.phone,
                licenseNumber: form.licenseNumber,
                experience: form.experience ? parseInt(form.experience) : undefined,
            });
            notify.success('Profile updated successfully!');
            setEditing(false);
            fetchProfile();
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const displayName = profile?.name || user?.name || 'Driver';
    const displayEmail = profile?.email || user?.email || '';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground text-sm">View and manage your driver profile</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="lg:col-span-1 border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <Avatar className="h-24 w-24 border-4 border-white/10 mt-2">
                                <AvatarImage src={user?.avatar || ''} />
                                <AvatarFallback className="text-slate-900 text-2xl font-bold bg-white">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{displayName}</h2>
                                <p className="text-slate-400 text-sm mt-1">{displayEmail}</p>
                                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                                    {user?.role || 'DRIVER'}
                                </Badge>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center gap-1 justify-center">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-bold">{profile?.rating || '5.0'}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Rating</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="font-bold">{profile?.totalTrips || 0}</p>
                                    <p className="text-xs text-slate-400 mt-1">Trips</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Details */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Your driver details and license information</CardDescription>
                            </div>
                            {!editing ? (
                                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditing(false); fetchProfile(); }}>
                                        <X className="h-4 w-4 mr-1" /> Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" /> Full Name
                                    </Label>
                                    {editing ? (
                                        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                                    ) : (
                                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50">{form.name || '—'}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" /> Email
                                    </Label>
                                    <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 text-muted-foreground">{displayEmail || '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
                                    </Label>
                                    {editing ? (
                                        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 9876543210" />
                                    ) : (
                                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50">{form.phone || '—'}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" /> License Number
                                    </Label>
                                    {editing ? (
                                        <Input value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="e.g. MH1420230012345" />
                                    ) : (
                                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50">{form.licenseNumber || '—'}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" /> Experience (years)
                                    </Label>
                                    {editing ? (
                                        <Input type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5" />
                                    ) : (
                                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50">{form.experience ? `${form.experience} years` : '—'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Assigned Vehicle */}
                            {profile?.vehicle && (
                                <div className="mt-4 pt-4 border-t">
                                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Assigned Vehicle</h3>
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Truck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{profile.vehicle.number}</p>
                                            <p className="text-sm text-muted-foreground">{profile.vehicle.type} • {profile.vehicle.capacity} Tons</p>
                                        </div>
                                        <Badge className="ml-auto" variant={profile.vehicle.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                                            {profile.vehicle.status}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
