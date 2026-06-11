'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, Trash2, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { notify } from '@/lib/toast';

const REQUIRED_DOCS = [
    { key: 'DRIVING_LICENSE', label: "Driving License", description: "Valid commercial driving license" },
    { key: 'RC', label: "Registration Certificate (RC)", description: "Vehicle registration document" },
    { key: 'INSURANCE', label: "Insurance Policy", description: "Comprehensive vehicle insurance" },
    { key: 'PUC', label: "PUC Certificate", description: "Pollution Under Control certificate" },
    { key: 'FITNESS', label: "Fitness Certificate", description: "Vehicle fitness/roadworthiness certificate" },
];

export default function DriverDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/documents');
            setDocuments(res.data.data || []);
        } catch {
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (docType: string, file: File) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', docType);
        setUploading(docType);
        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            notify.success('Document uploaded successfully!');
            fetchDocuments();
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        setDeleting(docId);
        try {
            await api.delete(`/documents/${docId}`);
            notify.success('Document deleted');
            fetchDocuments();
        } catch {
            notify.error('Failed to delete document');
        } finally {
            setDeleting(null);
        }
    };

    const getDocForType = (type: string) =>
        documents.find(d => d.type === type || d.name?.toUpperCase().includes(type));

    const uploadedCount = REQUIRED_DOCS.filter(d => getDocForType(d.key)).length;
    const completionPercent = Math.round((uploadedCount / REQUIRED_DOCS.length) * 100);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">My Documents</h1>
                    <p className="text-muted-foreground text-sm">Upload and manage your mandatory documents</p>
                </div>
            </div>

            {/* Completion Progress */}
            <Card className="border-none shadow-md bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-slate-300 text-sm">Document Completion</p>
                            <h2 className="text-2xl font-bold">{uploadedCount} / {REQUIRED_DOCS.length} Documents</h2>
                        </div>
                        <div className="h-16 w-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                            <span className="text-lg font-bold">{completionPercent}%</span>
                        </div>
                    </div>
                    <Progress value={completionPercent} className="h-2 bg-white/20" />
                    <p className="text-slate-400 text-xs mt-2">
                        {completionPercent === 100
                            ? '✅ All documents verified — you are ready to drive!'
                            : `Upload ${REQUIRED_DOCS.length - uploadedCount} more documents to complete your profile`}
                    </p>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Required Documents */}
                    <div>
                        <h2 className="font-semibold text-lg mb-4">Required Documents</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {REQUIRED_DOCS.map(doc => {
                                const uploaded = getDocForType(doc.key);
                                return (
                                    <Card key={doc.key} className={`border-2 transition-colors ${uploaded ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : 'border-dashed border-border hover:border-primary/50'}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? 'bg-green-100 dark:bg-green-900/50' : 'bg-muted'}`}>
                                                    {uploaded
                                                        ? <CheckCircle className="h-5 w-5 text-green-600" />
                                                        : <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm">{doc.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>

                                                    {uploaded ? (
                                                        <div className="mt-3 flex gap-2">
                                                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Uploaded</Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 text-xs text-destructive hover:text-destructive p-1"
                                                                disabled={deleting === (uploaded._id || uploaded.id)}
                                                                onClick={() => handleDelete(uploaded._id || uploaded.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                {deleting === (uploaded._id || uploaded.id) ? 'Deleting...' : 'Remove'}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                className="hidden"
                                                                ref={el => { fileRefs.current[doc.key] = el; }}
                                                                onChange={e => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleUpload(doc.key, file);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs w-full"
                                                                disabled={uploading === doc.key}
                                                                onClick={() => fileRefs.current[doc.key]?.click()}
                                                            >
                                                                <Upload className="h-3 w-3 mr-1" />
                                                                {uploading === doc.key ? 'Uploading...' : 'Upload'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* All Documents List */}
                    {documents.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-lg mb-4">All Uploaded Documents</h2>
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {documents.map(doc => (
                                            <div key={doc._id || doc.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{doc.name || doc.type}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {doc.url && (
                                                        <Button size="sm" variant="ghost" asChild>
                                                            <a href={`${process.env.NEXT_PUBLIC_API_URL}/documents/file/${doc.url.split('/').pop()}`} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        disabled={deleting === (doc._id || doc.id)}
                                                        onClick={() => handleDelete(doc._id || doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
