'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            // For prototype: show the link directly
            setResetLink(`/auth/reset-password?token=${res.data.data.resetToken}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                                <CheckCircle2 className="h-5 w-5" />
                                <p className="text-sm font-medium">Reset link sent!</p>
                            </div>
                            <div className="p-4 bg-muted rounded-md text-xs break-all">
                                <p className="font-semibold mb-1">Prototype Only (Click to reset):</p>
                                <Link href={resetLink} className="text-primary hover:underline">
                                    {window.location.origin}{resetLink}
                                </Link>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/auth/login">Back to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter>
                    <Link href="/auth/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
