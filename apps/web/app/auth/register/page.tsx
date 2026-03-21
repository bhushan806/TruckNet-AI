'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Truck } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/register', formData);
            const { user, accessToken } = res.data.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'DRIVER') router.push('/dashboard/driver');
            else if (user.role === 'OWNER') router.push('/dashboard/owner');
            else router.push('/dashboard/customer');

        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:bg-slate-950 dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>
            <Card className="w-full max-w-md shadow-xl border-border/50 bg-card/95 backdrop-blur">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Truck className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
                    <CardDescription>
                        Join TruckNet India to manage your logistics
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium animate-in fade-in slide-in-from-bottom-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="role">I am a</Label>
                            <select
                                id="role"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="CUSTOMER">Customer (Book Trucks)</option>
                                <option value="DRIVER">Driver (Find Loads)</option>
                                <option value="OWNER">Vehicle Owner (Manage Fleet)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={formData.name} onChange={handleChange} required className="bg-background/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="bg-background/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required className="bg-background/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="bg-background/50" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account? <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
