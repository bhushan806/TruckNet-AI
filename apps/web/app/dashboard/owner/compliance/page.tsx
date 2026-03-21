'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CompliancePage() {
    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/dashboard/owner" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Compliance & Documents</h1>
                    <p className="text-muted-foreground">Ensure all vehicles meet regulatory standards.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <FileCheck className="h-8 w-8 text-green-500" />
                        <div>
                            <CardTitle>All Clear</CardTitle>
                            <p className="text-sm text-muted-foreground">3 Vehicles Compliant</p>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                        <div>
                            <CardTitle>Expiring Soon</CardTitle>
                            <p className="text-sm text-muted-foreground">1 Insurance Policy expiring in 30 days</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm">View Details</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
