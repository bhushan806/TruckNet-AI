'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Activity, RefreshCw, AlertTriangle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const REFRESH_MS = 10_000;

export default function AdminTrafficPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
        try {
            const res = await api.get('/admin/traffic');
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

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const s = data?.summary || {};
    const statCards = [
        { label: 'Total Requests', value: s.totalRequests?.toLocaleString() || '—', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Today', value: s.requestsToday?.toLocaleString() || '—', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Per Minute', value: s.requestsPerMinute ?? '—', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Avg Latency', value: `${s.avgLatencyMs ?? '—'}ms`, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Error Rate', value: `${s.errorRate ?? '—'}%`, icon: AlertTriangle, color: s.errorRate > 5 ? 'text-red-400' : 'text-emerald-400', bg: s.errorRate > 5 ? 'bg-red-400/10' : 'bg-emerald-400/10' },
        { label: 'Total Errors', value: s.totalErrors?.toLocaleString() || '0', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-blue-500" /> API Traffic Monitor
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {lastUpdated && `Updated ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago · `}
                        Auto-refreshes every {REFRESH_MS / 1000}s
                    </p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                    <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /> Refresh
                </button>
            </div>

            {/* IMPORTANT Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400/80">
                    <strong>Note:</strong> Traffic metrics are instance-level in-memory application metrics and <strong>reset when the backend restarts</strong>.
                    They are NOT persistent historical analytics. Suitable for live operational monitoring during the current session.
                </p>
            </div>

            {/* Server meta */}
            {data?.meta && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 flex flex-wrap gap-4">
                    <span>Uptime: <strong>{data.meta.uptimeHuman}</strong></span>
                    <span>Started: <strong>{new Date(data.meta.instanceStartedAt).toLocaleString('en-IN')}</strong></span>
                    <span>Active requests now: <strong>{s.activeRequests}</strong></span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="border-border/50 bg-card/50">
                            <CardContent className="p-4">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', stat.bg)}>
                                    <stat.icon className={cn('h-4 w-4', stat.color)} />
                                </div>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={cn('text-xl font-bold mt-0.5', stat.color)}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Hourly Traffic Chart */}
            {data?.hourlyChart && data.hourlyChart.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-base">Requests (Last 24 Hours)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={data.hourlyChart}>
                                    <defs>
                                        <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="hour"
                                        tickFormatter={(v: any) => v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                                        labelFormatter={(v: any) => v ? new Date(v).toLocaleString('en-IN') : ''}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="url(#reqGrad)" strokeWidth={2} name="Requests" />
                                    <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} name="Errors" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Status Code Distribution */}
            {data?.statusDistribution && Object.keys(data.statusDistribution).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader><CardTitle className="text-base">Status Code Distribution</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {Object.entries(data.statusDistribution).map(([code, count]) => {
                                const c = parseInt(code);
                                const color = c >= 500 ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : c >= 400 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        : c >= 300 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                return (
                                    <div key={code} className={cn('px-3 py-2 rounded-xl border text-sm font-semibold', color)}>
                                        {code}: <span className="font-bold">{(count as number).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Top Endpoints */}
            {data?.topEndpoints && data.topEndpoints.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader><CardTitle className="text-base">Top Endpoints</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/30">
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Endpoint</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Requests</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Errors</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avg Latency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topEndpoints.map((ep: any, i: number) => (
                                            <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                                                <td className="px-4 py-2.5 font-mono text-xs text-blue-400">{ep.endpoint}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold">{ep.count.toLocaleString()}</td>
                                                <td className={cn('px-4 py-2.5 text-right', ep.errors > 0 ? 'text-red-400 font-semibold' : 'text-muted-foreground')}>
                                                    {ep.errors}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{ep.avgLatencyMs}ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
