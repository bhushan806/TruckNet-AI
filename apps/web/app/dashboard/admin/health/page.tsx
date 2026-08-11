'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const REFRESH_MS = 30_000;

interface ServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    latencyMs?: number;
    detail?: string;
}

const STATUS_CONFIG = {
    healthy: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Healthy' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', label: 'Degraded' },
    down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Down' },
};

export default function AdminHealthPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
        try {
            const res = await api.get('/admin/system-health');
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <HeartPulse className="h-6 w-6 text-emerald-500" /> System Health
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {lastUpdated ? `Checked ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago · Auto-refreshes every ${REFRESH_MS / 1000}s` : 'Checking...'}
                    </p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                    <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Pinging services...</p>
                    </div>
                </div>
            ) : !data ? (
                <p className="text-center text-muted-foreground py-10">Health check failed.</p>
            ) : (
                <>
                    {/* Overall Status */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className={cn(
                            'rounded-xl p-5 border flex items-center gap-4',
                            data.overallStatus === 'healthy'
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-yellow-500/5 border-yellow-500/20'
                        )}>
                            {data.overallStatus === 'healthy'
                                ? <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                : <AlertTriangle className="h-8 w-8 text-yellow-400" />
                            }
                            <div>
                                <p className={cn('text-xl font-bold', data.overallStatus === 'healthy' ? 'text-emerald-400' : 'text-yellow-400')}>
                                    {data.overallStatus === 'healthy' ? 'All Systems Operational' : 'Some Services Degraded'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Checked at {new Date(data.checkedAt).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Service Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(data.services as ServiceHealth[]).map((svc, i) => {
                            const cfg = STATUS_CONFIG[svc.status];
                            const Icon = cfg.icon;
                            return (
                                <motion.div key={svc.service} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <Card className={cn('border bg-card/50 backdrop-blur-xl', cfg.border)}>
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold text-sm">{svc.service}</span>
                                                <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {cfg.label}
                                                </div>
                                            </div>
                                            {svc.latencyMs !== undefined && (
                                                <p className="text-xs text-muted-foreground">
                                                    Latency: <span className="font-mono text-foreground">{svc.latencyMs}ms</span>
                                                </p>
                                            )}
                                            {svc.detail && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate" title={svc.detail}>
                                                    {svc.detail}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Server Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="border-border/50 bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-muted-foreground" /> Server Process
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Node.js Version', value: data.nodeVersion },
                                    { label: 'Server Uptime', value: `${Math.floor(data.serverUptime / 3600)}h ${Math.floor((data.serverUptime % 3600) / 60)}m` },
                                    { label: 'Memory (RSS)', value: `${data.memoryMB} MB` },
                                ].map(m => (
                                    <div key={m.label} className="p-3 rounded-xl bg-muted/30">
                                        <p className="text-xs text-muted-foreground">{m.label}</p>
                                        <p className="text-sm font-semibold font-mono mt-0.5">{m.value}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </div>
    );
}
