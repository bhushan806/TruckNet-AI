'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Printer,
    FileText,
    ShieldCheck,
    Truck,
    Download,
    Copy,
    Check,
    AlertCircle,
    RefreshCw,
    QrCode,
    Stamp,
    Building2,
    Calendar,
    Hash
} from 'lucide-react';
import api from '@/lib/api';

interface BiltyViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId?: string;
    loadId?: string;
    loadIdentifier?: string;
    transactionId?: string;
}

export default function BiltyViewerModal({
    isOpen,
    onClose,
    tripId,
    loadId,
    loadIdentifier,
    transactionId,
}: BiltyViewerModalProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            let res;
            if (tripId) {
                res = await api.get(`/trips/${tripId}/documents`);
            } else if (loadId || loadIdentifier || transactionId) {
                const id = loadId || loadIdentifier || transactionId;
                res = await api.get(`/trips/by-load/${id}/documents`);
            }
            if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setDocuments(res.data.data);
                setSelectedDocIndex(0);
            } else {
                setError('No legal documents generated for this trip yet. Once the trip is booked, documents are generated automatically.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to load transportation documents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchDocuments();
    }, [isOpen, tripId, loadId, loadIdentifier, transactionId]);

    const activeDoc = documents[selectedDocIndex] || null;

    const handlePrint = () => {
        window.print();
    };

    const copyLRNumber = (lr: string) => {
        navigator.clipboard.writeText(lr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 max-h-[92vh] flex flex-col">
                {/* Modal Top Bar */}
                <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-white">
                                Statutory Indian Transportation Documents
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs">
                                Carriage by Road Act 2007 (Section 8) & Rule 138 CGST Rules Compliant
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs h-8"
                            onClick={handlePrint}
                            disabled={!activeDoc}
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
                        </Button>
                    </div>
                </div>

                {/* Document Type Switcher Tabs */}
                {documents.length > 1 && (
                    <div className="flex bg-slate-200 border-b border-slate-300 p-1.5 gap-1.5 print:hidden overflow-x-auto text-xs font-semibold">
                        {documents.map((doc, idx) => (
                            <button
                                key={doc._id || idx}
                                onClick={() => setSelectedDocIndex(idx)}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                    selectedDocIndex === idx
                                        ? 'bg-white text-blue-900 shadow-sm font-bold border border-slate-300'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${
                                    doc.documentType === 'BILTY_LR' ? 'bg-blue-600' :
                                    doc.documentType === 'EWAY_SLIP' ? 'bg-purple-600' : 'bg-emerald-600'
                                }`}></span>
                                {doc.documentType === 'BILTY_LR' && 'Lorry Receipt (Bilty)'}
                                {doc.documentType === 'EWAY_SLIP' && 'Transit Pass & Part-B Slip'}
                                {doc.documentType === 'POD' && 'Proof of Delivery (POD)'}
                                {doc.documentType === 'FREIGHT_BILL' && 'Freight Bill'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Document Body (Printable Area) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:p-0 print:bg-white print:overflow-visible">
                    {loading && (
                        <div className="py-20 text-center space-y-3">
                            <RefreshCw className="h-9 w-9 animate-spin text-blue-600 mx-auto" />
                            <p className="text-sm text-slate-500 font-medium">Generating official statutory consignment records...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-6 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-3 border border-red-200 my-8">
                            <AlertCircle className="h-6 w-6 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Document Generation Status</p>
                                <p className="mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && activeDoc && (
                        <div className="bg-white border-2 border-slate-800 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-lg text-slate-900 font-sans print:border-none print:shadow-none print:p-2 print:m-0">
                            {/* BILTY / LORRY RECEIPT HEADER */}
                            <div className="border-b-2 border-slate-800 pb-4 mb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                                            CONSIGNMENT NOTE / LORRY RECEIPT (BILTY)
                                        </span>
                                        <h2 className="text-xl font-black text-slate-950 mt-1 uppercase tracking-tight">
                                            {activeDoc.transporter?.companyName || 'TRUCKNET LOGISTICS CARRIER'}
                                        </h2>
                                        <p className="text-xs text-slate-600 font-medium">
                                            Goods Transport Agency (GTA) • Reg: {activeDoc.transporter?.address}
                                        </p>
                                        <p className="text-xs text-slate-700 font-mono font-bold mt-0.5">
                                            GSTIN: {activeDoc.transporter?.gstin} • Ph: {activeDoc.transporter?.phone}
                                        </p>
                                    </div>

                                    {/* LR Number Box */}
                                    <div className="text-right border-2 border-blue-900 bg-blue-50/70 p-2.5 rounded-lg">
                                        <span className="text-[10px] font-bold text-blue-900 block uppercase">
                                            Lorry Receipt (LR) No.
                                        </span>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-base font-black font-mono text-blue-950">
                                                {activeDoc.lrNumber}
                                            </span>
                                            <button
                                                onClick={() => copyLRNumber(activeDoc.lrNumber)}
                                                className="text-slate-400 hover:text-blue-900 print:hidden"
                                                title="Copy LR No."
                                            >
                                                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                            Date: {new Date(activeDoc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Commercial Identifiers Subheader */}
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono bg-slate-50 p-2 rounded">
                                    <div>
                                        <span className="text-slate-500 block text-[9px] uppercase">Transaction Reference</span>
                                        <strong className="text-slate-900 font-bold">{activeDoc.transactionId}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[9px] uppercase">Trip Master Number</span>
                                        <strong className="text-slate-900 font-bold">{activeDoc.tripNumber}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[9px] uppercase">Load Consignment ID</span>
                                        <strong className="text-slate-900 font-bold">{activeDoc.loadNumber}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Consignor vs Consignee Grid */}
                            <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 text-xs mb-4 bg-slate-50/50">
                                <div className="border-r border-slate-300 pr-3">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[11px] pb-1 border-b border-slate-200">
                                        <Building2 className="h-3.5 w-3.5 text-blue-700" />
                                        Consignor (Shipper)
                                    </div>
                                    <p className="font-bold text-slate-950 mt-1.5 text-sm">{activeDoc.consignor?.name}</p>
                                    <p className="text-slate-600 mt-0.5">{activeDoc.consignor?.address}</p>
                                    <p className="text-slate-700 font-medium">City: <span className="font-bold">{activeDoc.consignor?.city}</span></p>
                                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">GSTIN: {activeDoc.consignor?.gstin}</p>
                                    <p className="text-slate-500 text-[11px]">Phone: {activeDoc.consignor?.phone}</p>
                                </div>

                                <div className="pl-1">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[11px] pb-1 border-b border-slate-200">
                                        <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                                        Consignee (Receiver / Destination)
                                    </div>
                                    <p className="font-bold text-slate-950 mt-1.5 text-sm">{activeDoc.consignee?.name}</p>
                                    <p className="text-slate-600 mt-0.5">{activeDoc.consignee?.address}</p>
                                    <p className="text-slate-700 font-medium">City: <span className="font-bold">{activeDoc.consignee?.city}</span></p>
                                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">GSTIN: {activeDoc.consignee?.gstin}</p>
                                    <p className="text-slate-500 text-[11px]">Phone: {activeDoc.consignee?.phone}</p>
                                </div>
                            </div>

                            {/* Vehicle & Driver Credentials */}
                            <div className="border border-slate-300 rounded-lg p-3 text-xs mb-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                                    <span className="font-bold uppercase text-[11px] text-slate-900 flex items-center gap-1.5">
                                        <Truck className="h-3.5 w-3.5 text-blue-700" />
                                        Certified Transport Vehicle & Crew
                                    </span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                        RC Verified
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Vehicle Reg. (RC) No.</span>
                                        <strong className="text-sm font-black font-mono text-slate-950">{activeDoc.vehicle?.number}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Body / Spec Type</span>
                                        <strong className="text-slate-800">{activeDoc.vehicle?.bodyType}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Assigned Driver</span>
                                        <strong className="text-slate-800">{activeDoc.driver?.name}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Driving License (DL)</span>
                                        <strong className="font-mono text-slate-800">{activeDoc.driver?.licenseNumber}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Consignment Particulars Table */}
                            <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[11px]">
                                        <tr>
                                            <th className="p-2 border-r border-slate-300">Description of Goods</th>
                                            <th className="p-2 border-r border-slate-300">HSN/SAC</th>
                                            <th className="p-2 border-r border-slate-300">Packaging Type</th>
                                            <th className="p-2 border-r border-slate-300 text-center">Charged Wt (MT)</th>
                                            <th className="p-2 text-right">Declared Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="p-2.5 font-bold border-r border-slate-300">{activeDoc.goods?.type}</td>
                                            <td className="p-2.5 font-mono border-r border-slate-300">{activeDoc.goods?.hsnCode}</td>
                                            <td className="p-2.5 text-slate-600 border-r border-slate-300">{activeDoc.goods?.packagingType}</td>
                                            <td className="p-2.5 font-bold font-mono text-center border-r border-slate-300">{activeDoc.goods?.weight} MT</td>
                                            <td className="p-2.5 font-bold font-mono text-right">₹{activeDoc.goods?.declaredValue?.toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Freight & Payment Terms */}
                            <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 text-xs mb-4 bg-blue-50/30">
                                <div>
                                    <span className="font-bold text-[11px] uppercase text-slate-900 block mb-1">
                                        Commercial Terms & GST Declaration
                                    </span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        {activeDoc.freight?.gstExemptionNote || 'GTA Road Freight covered under Section 9(3) CGST Act. Tax payable under RCM by service recipient at 5%.'}
                                    </p>
                                    <div className="mt-2 text-[10px] text-slate-500">
                                        Toll, Green Tax, and RTO Transit Taxes: <strong className="text-slate-800">Included in freight charge</strong>
                                    </div>
                                </div>

                                <div className="border-l border-slate-300 pl-4 space-y-1 font-mono text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-sans">Total Freight:</span>
                                        <span className="font-bold text-slate-950">₹{activeDoc.freight?.totalAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-sans">Advance Paid:</span>
                                        <span className="text-emerald-700 font-bold">₹{activeDoc.freight?.advancePaid?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-300 pt-1">
                                        <span className="text-slate-900 font-sans font-bold">Balance Payable:</span>
                                        <span className="font-black text-blue-900 text-sm">₹{activeDoc.freight?.balanceDue?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 font-sans">
                                        <span className="text-slate-500 text-[10px]">Payment Basis:</span>
                                        <Badge className="bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-bold">
                                            {activeDoc.freight?.paymentMode?.replace(/_/g, ' ') || 'TO PAY'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Statutory Legal Terms (Carriage by Road Act 2007) */}
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-1 mb-4">
                                <span className="font-bold uppercase text-[10px] text-slate-800 block">
                                    Statutory Notice under Section 8 & 10 of Carriage by Road Act, 2007:
                                </span>
                                {activeDoc.legalClauses?.map((clause: string, i: number) => (
                                    <p key={i} className="leading-snug">{clause}</p>
                                ))}
                            </div>

                            {/* Digital Signature & Certification Seal */}
                            <div className="flex items-center justify-between border-t-2 border-slate-800 pt-3 text-[10px]">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <span>Certified Digital Signature Seal</span>
                                    </div>
                                    <p className="font-mono text-slate-400 text-[9px] truncate max-w-sm">
                                        SHA256: {activeDoc.digitalSignature?.hash}
                                    </p>
                                    <p className="text-slate-500">
                                        Issuer: {activeDoc.digitalSignature?.signer}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="border border-slate-800 px-3 py-1 font-mono font-bold text-slate-900 inline-block rounded bg-slate-50 text-[10px]">
                                        [VERIFIED ORIGINAL]
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1">Consignee Copy / Transit Pass</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
