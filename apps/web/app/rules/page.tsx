'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function RulesPage() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Safety Rules & Regulations</h1>
                <p className="text-muted-foreground">Guidelines for safe and compliant driving on TruckNet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <ShieldAlert className="h-8 w-8 text-red-500 mb-2" />
                        <CardTitle>Speed Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                            <li>National Highways: 80 km/h (Trucks)</li>
                            <li>State Highways: 60 km/h</li>
                            <li>City Roads: 40 km/h</li>
                            <li>School Zones: 25 km/h</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <CardTitle>Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                            <li>Valid Driving License</li>
                            <li>Vehicle Registration (RC)</li>
                            <li>Insurance Certificate</li>
                            <li>Pollution Under Control (PUC)</li>
                            <li>Fitness Certificate</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Info className="h-8 w-8 text-blue-500 mb-2" />
                        <CardTitle>Emergency Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                            <li>Police: 100</li>
                            <li>Ambulance: 102</li>
                            <li>National Highway Helpline: 1033</li>
                            <li>TruckNet Support: 1800-123-4567</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-muted p-8 rounded-lg mt-8">
                <h2 className="text-2xl font-bold mb-4">AI Safety Tips</h2>
                <p className="text-muted-foreground">
                    Our AI system analyzes route data to provide real-time safety alerts.
                    Always ensure your GPS is active to receive warnings about accident-prone zones,
                    weather conditions, and traffic congestion ahead.
                </p>
            </div>
        </div>
    );
}
