'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, CheckCheck, Package, Truck, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const ICON_MAP: Record<string, React.ElementType> = {
    load: Package,
    trip: Truck,
    alert: AlertCircle,
    info: Info,
    default: Bell,
};

const COLOR_MAP: Record<string, string> = {
    load: 'bg-purple-100 text-purple-600',
    trip: 'bg-blue-100 text-blue-600',
    alert: 'bg-red-100 text-red-600',
    info: 'bg-gray-100 text-gray-600',
    default: 'bg-primary/10 text-primary',
};

// Fallback local notifications (for when API returns empty)
const SAMPLE_NOTIFICATIONS = [
    {
        id: 'n1',
        title: 'Welcome to TruckNet! 🎉',
        message: 'Your driver account is active. Complete your profile and upload documents to start receiving loads.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'n2',
        title: 'Upload Your Documents',
        message: 'To get verified and receive priority load assignments, upload your driving license, RC, insurance, and PUC certificate.',
        type: 'alert',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
];

export default function DriverNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                // Try API first — fall back to samples if endpoint not available
                const res = await api.get('/drivers/notifications');
                const data = res.data?.data || [];
                setNotifications(data.length > 0 ? data : SAMPLE_NOTIFICATIONS);
            } catch {
                // API may not have notifications endpoint yet — show sample notifications
                setNotifications(SAMPLE_NOTIFICATIONS);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id || n._id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/driver">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm">Stay updated on your loads and assignments</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                        <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No notifications yet.</p>
                        <p className="text-sm mt-1">You'll be notified about new loads, assignments, and important updates here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notif => {
                        const id = notif._id || notif.id;
                        const type = notif.type || 'default';
                        const Icon = ICON_MAP[type] || ICON_MAP.default;
                        const iconColor = COLOR_MAP[type] || COLOR_MAP.default;
                        return (
                            <Card
                                key={id}
                                className={`cursor-pointer transition-all hover:shadow-md ${!notif.read ? 'border-primary/30 bg-primary/5' : ''}`}
                                onClick={() => markRead(id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-semibold text-sm ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notif.title}
                                                </p>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {!notif.read && (
                                                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                                    )}
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
