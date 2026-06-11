'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Plus, Wallet, Filter } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { notify } from '@/lib/toast';

export default function DriverFinancePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [addOpen, setAddOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({
        description: '',
        amount: '',
        type: 'income' as 'income' | 'expense',
        category: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/finance?type=${filter}`);
            setData(res.data.data);
        } catch (err: any) {
            notify.error('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filter]);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.description || !form.amount || !form.category) {
            notify.error('Please fill all fields');
            return;
        }
        setAdding(true);
        try {
            await api.post('/finance', {
                ...form,
                amount: parseFloat(form.amount),
            });
            notify.success('Transaction added!');
            setAddOpen(false);
            setForm({ description: '', amount: '', type: 'income', category: '' });
            fetchData();
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Failed to add transaction');
        } finally {
            setAdding(false);
        }
    };

    const summary = data?.summary;
    const transactions: any[] = data?.transactions || [];

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const getCategoryColor = (type: string) =>
        type === 'income'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/driver">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">My Earnings</h1>
                        <p className="text-muted-foreground text-sm">Track your income and expenses</p>
                    </div>
                </div>
                <Button onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Transaction
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Total Income</p>
                                        <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.totalRevenue || 0)}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-100 opacity-70" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-100 text-sm">Total Expenses</p>
                                        <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.totalExpenses || 0)}</p>
                                    </div>
                                    <TrendingDown className="h-8 w-8 text-red-100 opacity-70" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`border-none shadow-md text-white ${(summary?.netProfit || 0) >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Net Profit</p>
                                        <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.netProfit || 0)}</p>
                                    </div>
                                    <Wallet className="h-8 w-8 text-blue-100 opacity-70" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>{transactions.length} transactions found</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={filter} onValueChange={setFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="expense">Expenses</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>No transactions yet.</p>
                                    <p className="text-sm mt-1">Add your first income or expense entry.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx: any) => (
                                        <div key={tx._id || tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {tx.type === 'income'
                                                        ? <TrendingUp className="h-4 w-4 text-green-600" />
                                                        : <TrendingDown className="h-4 w-4 text-red-600" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{tx.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className={`text-xs ${getCategoryColor(tx.type)}`}>
                                                            {tx.category}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Add Transaction Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddTransaction} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={(v: 'income' | 'expense') => setForm({ ...form, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">💰 Income</SelectItem>
                                    <SelectItem value="expense">💸 Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g. Pune to Mumbai delivery"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 5000"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Delivery Payment">Delivery Payment</SelectItem>
                                    <SelectItem value="Bonus">Bonus</SelectItem>
                                    <SelectItem value="Fuel">Fuel</SelectItem>
                                    <SelectItem value="Toll">Toll</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={adding}>
                                {adding ? 'Adding...' : 'Add Transaction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
