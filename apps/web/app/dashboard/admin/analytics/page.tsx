'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Route, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PERIODS = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
];

const PIE_COLORS = ['#6366f1', '#f97316', '#10b981', '#ef4444'];

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/analytics?period=${period}`);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [period]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-blue-500" /> Analytics
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real platform data — charts reflect actual database records.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl overflow-hidden border border-border">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={cn(
                                    'px-3 py-2 text-sm font-medium transition-colors',
                                    period === p.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
                    >
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : !data ? (
                <p className="text-center text-muted-foreground py-10">Failed to load analytics.</p>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'New Users', value: data.users.newUsersInRange, icon: TrendingUp, color: 'text-blue-400' },
                            { label: 'New Loads', value: data.loads.loadsInRange, icon: Package, color: 'text-orange-400' },
                            { label: 'Matches', value: data.loads.matched, icon: BarChart3, color: 'text-emerald-400' },
                            { label: 'New Rides', value: data.trips.ridesInRange, icon: Route, color: 'text-purple-400' },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card className="border-border/50 bg-card/50">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <s.icon className={cn('h-8 w-8 opacity-40', s.color)} />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{s.label}</p>
                                            <p className={cn('text-2xl font-bold', s.color)}>{s.value.toLocaleString()}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* User Registrations Chart */}
                    {data.users.dailyRegistrations.length > 0 ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base">User Registrations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={data.users.dailyRegistrations}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Users" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <Card className="border-border/50 bg-card/50">
                            <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                No user registration data for this period.
                            </CardContent>
                        </Card>
                    )}

                    {/* Load Volume + Role Distribution */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {data.loads.dailyLoads.length > 0 ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card className="border-border/50 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Load Volume</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={data.loads.dailyLoads}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                                                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} dot={false} name="Total" />
                                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="border-border/50 bg-card/50">
                                <CardContent className="py-10 text-center text-muted-foreground text-sm">No load data for this period.</CardContent>
                            </Card>
                        )}

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Role Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center">
                                    {data.users.roleDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={data.users.roleDistribution}
                                                    dataKey="count"
                                                    nameKey="role"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ role, percent = 0 }: any) => `${role} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {data.users.roleDistribution.map((_: any, i: number) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No role data available.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Match Success Rate */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="border-border/50 bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    Load Match Success Rate
                                    <span className="text-emerald-400 font-bold">{data.loads.matchSuccessRate}%</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                        style={{ width: `${Math.min(data.loads.matchSuccessRate, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>{data.loads.matched} loads matched</span>
                                    <span>{data.loads.loadsInRange} total loads in period</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Avg ride price */}
                    {data.trips.avgPrice > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                            <Card className="border-border/50 bg-card/50">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Route className="h-8 w-8 text-purple-400 opacity-60" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Average Ride Price</p>
                                        <p className="text-2xl font-bold text-purple-400">₹{data.trips.avgPrice.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}
