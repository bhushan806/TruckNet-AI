'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import api from '@/lib/api';
import {
    DollarSign,
    FileText,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Download,
    Upload,
    Truck,
    User
} from 'lucide-react';

export default function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [financeData, setFinanceData] = useState<any>({ transactions: [], summary: {} });
    const [documents, setDocuments] = useState<any[]>([]);

    // Upload Form State
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', type: 'Vehicle', expiryDate: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [financeRes, docRes] = await Promise.all([
                api.get('/finance'),
                api.get('/documents')
            ]);
            setFinanceData(financeRes.data.data);
            setDocuments(docRes.data.data);
        } catch (error) {
            console.error('Failed to fetch finance data', error);
            // toast.error("Could not load financial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpload = async () => {
        if (!uploadForm.title || !uploadForm.expiryDate || !selectedFile) {
            toast.error("Please fill all fields and select a file");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('type', uploadForm.type);
            formData.append('expiryDate', uploadForm.expiryDate);
            formData.append('file', selectedFile);

            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Document uploaded successfully");
            setUploadOpen(false);
            setUploadForm({ title: '', type: 'Vehicle', expiryDate: '' });
            setSelectedFile(null);
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Upload failed', error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Finance & Compliance</h1>
                <p className="text-muted-foreground">Monitor your fleet's financial health and manage regulatory documents.</p>
            </div>

            <Tabs defaultValue="finance" className="space-y-6">
                <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                    <TabsTrigger value="finance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Finance
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <FileText className="w-4 h-4 mr-2" />
                        Document Vault
                    </TabsTrigger>
                </TabsList>

                {/* --- FINANCE TAB --- */}
                <TabsContent value="finance" className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Total Revenue (Monthly)</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">₹{financeData.summary?.totalRevenue?.toLocaleString() || '0'}</div>
                                <p className="text-xs text-green-500 flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    +12.5% from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Total Expenses</CardTitle>
                                <CreditCard className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">₹{financeData.summary?.totalExpenses?.toLocaleString() || '0'}</div>
                                <p className="text-xs text-orange-500 flex items-center mt-1">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    +5.2% (Fuel Costs)
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-900/20 border-blue-800/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-300">Net Profit</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-400">₹{financeData.summary?.netProfit?.toLocaleString() || '0'}</div>
                                <p className="text-xs text-blue-300 mt-1">Margin: 67%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions List */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Transactions</CardTitle>
                            <CardDescription>Latest financial activity from your fleet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {financeData.transactions?.map((tx: any) => (
                                    <div key={tx._id} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{tx.description}</p>
                                                <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                                                {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!financeData.transactions || financeData.transactions.length === 0) && (
                                    <div className="text-center text-slate-500 py-8">No transactions found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- DOCUMENTS TAB --- */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                                All
                            </Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-white">Vehicles</Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-white">Drivers</Button>
                        </div>

                        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-500">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload New
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>Upload Document</DialogTitle>
                                    <DialogDescription className="text-slate-400">Add a new document to your secure vault.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Document Title</Label>
                                        <Input
                                            placeholder="e.g. Vehicle Insurance"
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            className="bg-slate-800 border-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            value={uploadForm.type}
                                            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                        >
                                            <option value="Vehicle">Vehicle Document</option>
                                            <option value="Driver">Driver Document</option>
                                            <option value="Permit">Permit / Compliance</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Expiry Date</Label>
                                        <Input
                                            type="date"
                                            value={uploadForm.expiryDate}
                                            onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                                            className="bg-slate-800 border-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Document File</Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                            className="bg-slate-800 border-slate-700"
                                        />
                                    </div>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-500" onClick={handleUpload} disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Save Document'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc: any) => (
                            <Card key={doc._id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-colors group">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                            {doc.type === 'Vehicle' ? <Truck className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{doc.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-400">Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                                                {doc.status === 'valid' && <Badge className="bg-green-500/20 text-green-400 border-none h-5 text-[10px]">Valid</Badge>}
                                                {doc.status === 'expiring' && <Badge className="bg-yellow-500/20 text-yellow-400 border-none h-5 text-[10px]">Expiring Soon</Badge>}
                                                {doc.status === 'expired' && <Badge className="bg-red-500/20 text-red-400 border-none h-5 text-[10px]">Expired</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
