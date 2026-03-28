'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Phone, Eye, Plus, ArrowLeft, MapPin, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function FindDriversPage() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await api.get('/auth/drivers');
                setDrivers(res.data.data);
            } catch (error) {
                console.error('Failed to fetch drivers', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    if (loading) return <div className="container py-8">Loading drivers...</div>;

    return (
        <div className="container py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard/owner" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <UsersIcon className="h-8 w-8 text-primary" />
                        Find New Drivers
                    </h1>
                    <p className="text-muted-foreground">Browse available driver candidates to join your fleet.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Post Job Opening
                </Button>
            </div>

            {/* Drivers Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {drivers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No available drivers found at the moment.
                    </div>
                ) : (
                    drivers.map((profile) => (
                        <Card key={profile.id} className="flex flex-col">
                            <CardHeader className="flex flex-row gap-4 pb-2">
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 border-2 border-white shadow-sm uppercase">
                                    {profile.user.name.substring(0, 2)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-blue-600">{profile.user.name}</h3>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Briefcase className="mr-1 h-3 w-3" />
                                        {profile.experienceYears} Years Experience
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <BadgeIcon className="mr-1 h-3 w-3" />
                                        {profile.licenseNumber}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</p>
                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                        {profile.bio || 'No bio provided.'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Preferred Routes
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.routes && profile.routes.length > 0 ? (
                                            profile.routes.slice(0, 3).map((route: string) => (
                                                <span key={route} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                    {route}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Any</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Availability
                                    </p>
                                    <p className="text-sm font-medium">{profile.isAvailable ? 'Immediate' : 'Busy'}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t bg-gray-50/50">
                                <Button variant="outline" className="w-full" asChild>
                                    <a href={`tel:${profile.user.phone}`}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Contact
                                    </a>
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Profile
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Driver Profile</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600">
                                                    {profile.user.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold">{profile.user.name}</h2>
                                                    <p className="text-muted-foreground">{profile.experienceYears} Years Experience</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a href={`tel:${profile.user.phone}`}>Call</a>
                                                        </Button>
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a href={`mailto:${profile.user.email}`}>Email</a>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post('/requests/send', {
                                                                        driverId: profile.id,
                                                                        message: "I'd like to hire you for my fleet."
                                                                    });
                                                                    alert(`Connection request sent to ${profile.user.name}!`);
                                                                } catch (error: any) {
                                                                    alert(error.response?.data?.message || 'Failed to send request');
                                                                }
                                                            }}
                                                        >
                                                            Send Request
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-muted rounded-lg">
                                                    <p className="text-xs text-muted-foreground">License Number</p>
                                                    <p className="font-medium">{profile.licenseNumber}</p>
                                                </div>
                                                <div className="p-3 bg-muted rounded-lg">
                                                    <p className="text-xs text-muted-foreground">Rating</p>
                                                    <p className="font-medium flex items-center gap-1">
                                                        {profile.rating} <span className="text-yellow-500">★</span>
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-muted rounded-lg">
                                                    <p className="text-xs text-muted-foreground">Total Trips</p>
                                                    <p className="font-medium">{profile.totalTrips}</p>
                                                </div>
                                                <div className="p-3 bg-muted rounded-lg">
                                                    <p className="text-xs text-muted-foreground">Status</p>
                                                    <p className={`font-medium ${profile.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                                        {profile.isAvailable ? 'Available' : 'Busy'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="font-semibold">Bio</h3>
                                                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                                                    {profile.bio || 'No bio provided.'}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="font-semibold">Preferred Routes</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.routes && profile.routes.length > 0 ? (
                                                        profile.routes.map((route: string) => (
                                                            <span key={route} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                                {route}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Any</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

function BadgeIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78" />
        </svg>
    )
}
