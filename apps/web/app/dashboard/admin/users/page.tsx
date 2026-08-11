'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: 'CUSTOMER' | 'DRIVER' | 'OWNER';
    isActive: boolean;
    isVerified: boolean;
    joinedAt: string;
}

const ROLE_STYLES: Record<string, string> = {
    CUSTOMER: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    DRIVER: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    OWNER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function AdminUsersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?period=${period}`);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [period]);

    const filtered = (data?.recentUsers || []).filter((u: UserRecord) => {
        const matchesSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-500" /> Users
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">All registered platform users</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            {/* Stats row */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: data.recentUsers?.length || 0, color: 'text-blue-400' },
                        ...data.roleDistribution.map((r: any) => ({ label: r.role, value: r.count, color: r.role === 'CUSTOMER' ? 'text-violet-400' : r.role === 'DRIVER' ? 'text-orange-400' : 'text-emerald-400' })),
                        { label: `New (${period})`, value: data.newUsersInRange, color: 'text-pink-400' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="border-border/50 bg-card/50">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                    <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="">All Roles</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="DRIVER">Driver</option>
                    <option value="OWNER">Owner</option>
                </select>
                <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
            </div>

            {/* Users Table */}
            <Card className="border-border/50 bg-card/50">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No users found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/30">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((u: UserRecord) => (
                                        <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-medium">{u.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', ROLE_STYLES[u.role] || '')}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                                    u.isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                )}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {new Date(u.joinedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/30">
                                Showing {filtered.length} of {data?.recentUsers?.length || 0} users
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
