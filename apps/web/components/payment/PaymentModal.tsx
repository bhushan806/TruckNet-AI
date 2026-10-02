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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard,
    QrCode,
    CheckCircle2,
    ShieldCheck,
    Copy,
    Check,
    AlertCircle,
    RefreshCw,
    Lock,
    ArrowRight,
    Printer,
    FileText,
    ExternalLink,
    IndianRupee,
    Building2,
    Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import { createSocket } from '@/lib/socket';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
    transactionId?: string;
    onPaymentSuccess?: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    loadId,
    transactionId,
    onPaymentSuccess,
}: PaymentModalProps) {
    const [stage, setStage] = useState<'ADVANCE' | 'BALANCE' | 'FULL'>('ADVANCE');
    const [loading, setLoading] = useState(true);
    const [generatingOrder, setGeneratingOrder] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Order state
    const [paymentSummary, setPaymentSummary] = useState<any>(null);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [utrNumber, setUtrNumber] = useState('');
    const [verifiedPayment, setVerifiedPayment] = useState<any>(null);

    // ── Fetch Consignment Financial Summary ──
    const fetchPaymentDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/payments/by-load/${loadId}`);
            if (res.data?.data) {
                setPaymentSummary(res.data.data);
                // If advance already paid, auto-select BALANCE
                if (res.data.data.isAdvanceSettled && !res.data.data.isFullySettled) {
                    setStage('BALANCE');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch financial details');
        } finally {
            setLoading(false);
        }
    };

    // ── Create or Retrieve Dynamic UPI Order ──
    const generateOrder = async (selectedStage = stage) => {
        setGeneratingOrder(true);
        setError('');
        try {
            const res = await api.post('/payments/order', {
                loadId,
                stage: selectedStage,
            });
            if (res.data?.data) {
                setActiveOrder(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate payment order');
        } finally {
            setGeneratingOrder(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setVerifiedPayment(null);
        setUtrNumber('');
        setSuccessMessage('');
        fetchPaymentDetails();
        generateOrder(stage);

        // ── Real-Time Socket Listener for Instant Confirmation ──
        const socket = createSocket();

        socket.on('connect', () => {
            socket.emit('joinRide', loadId);
        });

        socket.on('payment:updated', (data: any) => {
            if (data.loadId === loadId) {
                setVerifiedPayment(data);
                setSuccessMessage(`Payment of ₹${data.amount?.toLocaleString('en-IN')} verified successfully!`);
                if (onPaymentSuccess) onPaymentSuccess();
                fetchPaymentDetails();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [isOpen, loadId]);

    // Switch stage tab
    const handleStageChange = (newStage: 'ADVANCE' | 'BALANCE' | 'FULL') => {
        setStage(newStage);
        setVerifiedPayment(null);
        setUtrNumber('');
        generateOrder(newStage);
    };

    // ── Submit UTR for Anti-Fraud Verification ──
    const handleVerifyUtr = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanUtr = utrNumber.trim();
        if (!cleanUtr || cleanUtr.length < 8) {
            setError('Please enter a valid 12-digit Indian Bank UTR or UPI Reference Number.');
            return;
        }

        setVerifying(true);
        setError('');
        try {
            const res = await api.post('/payments/verify-utr', {
                paymentReference: activeOrder?.payment?.paymentReference,
                utrNumber: cleanUtr,
            });

            if (res.data?.data?.payment) {
                setVerifiedPayment(res.data.data.payment);
                setSuccessMessage('Payment confirmed & locked in TruckNet Escrow!');
                if (onPaymentSuccess) onPaymentSuccess();
                fetchPaymentDetails();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'UTR verification failed. Please check the reference number.');
        } finally {
            setVerifying(false);
        }
    };

    // ── Release Escrow Balance upon delivery & POD signoff ──
    const [releasingEscrow, setReleasingEscrow] = useState(false);

    const handleReleaseEscrow = async () => {
        if (!confirm('Are you sure you want to release the escrow balance to the transporter? Please ensure the consignment has been delivered and POD is confirmed.')) return;
        setReleasingEscrow(true);
        setError('');
        try {
            const res = await api.post('/payments/release-escrow', { loadId });
            setSuccessMessage(`Escrow balance of ₹${res.data?.data?.amount?.toLocaleString('en-IN') || ''} released to transporter successfully!`);
            fetchPaymentDetails();
            if (onPaymentSuccess) onPaymentSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to release escrow balance');
        } finally {
            setReleasingEscrow(false);
        }
    };

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold py-0.5 px-2">
                                    🛡️ 100% Secure NPCI Escrow
                                </Badge>
                                <span className="text-xs text-slate-400 font-mono">
                                    REF: {transactionId || paymentSummary?.transactionId || 'TRX-ONLINE'}
                                </span>
                            </div>
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-blue-400" />
                                Online Freight Settlement & Escrow
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-300 mt-1">
                                Pay securely via Google Pay, PhonePe, Paytm, or BHIM UPI with automated UTR confirmation.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Milestone Tabs */}
                    {!verifiedPayment && (
                        <div className="flex gap-2 mt-5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
                            <button
                                onClick={() => handleStageChange('ADVANCE')}
                                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                                    stage === 'ADVANCE'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Stage 1: Advance (25%)
                            </button>
                            <button
                                onClick={() => handleStageChange('BALANCE')}
                                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                                    stage === 'BALANCE'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Stage 2: Balance (75%)
                            </button>
                            <button
                                onClick={() => handleStageChange('FULL')}
                                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                                    stage === 'FULL'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Single Shot (100%)
                            </button>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2.5 border border-red-200">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Alert */}
                    {successMessage && (
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold">{successMessage}</span>
                        </div>
                    )}

                    {/* Escrow Locked Alert & Release Action */}
                    {paymentSummary?.hasEscrowBalance && !verifiedPayment && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-2.5 text-amber-900">
                                <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <div>
                                    <div className="font-bold">
                                        Escrow Balance Locked: ₹{paymentSummary.escrowBalanceAmount?.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-[11px] text-amber-700">
                                        Funds held securely by TruckNet. Release to transporter upon delivery confirmation.
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleReleaseEscrow}
                                disabled={releasingEscrow}
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs h-8 px-4 shadow-sm whitespace-nowrap"
                            >
                                {releasingEscrow ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />}
                                Release Escrow to Transporter
                            </Button>
                        </div>
                    )}

                    {/* SUCCESS CONFIRMATION RECEIPT VIEW */}
                    {verifiedPayment ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-50 to-teal-50/40 border border-emerald-200 text-center space-y-3">
                                <div className="h-14 w-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                                    <Check className="h-8 w-8 stroke-[3]" />
                                </div>
                                <h3 className="font-bold text-lg text-emerald-950">Payment Authenticated & Recorded</h3>
                                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                                    The payment for <strong>{verifiedPayment.stage}</strong> milestone of ₹{verifiedPayment.amount?.toLocaleString('en-IN')} has been verified.
                                    The statutory Lorry Receipt (Bilty) has been synchronized with this payment stamp.
                                </p>
                                <div className="inline-flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 shadow-sm">
                                    <span>BANK UTR:</span>
                                    <strong className="tracking-wider">{verifiedPayment.utrNumber}</strong>
                                </div>
                            </div>

                            {/* Digital Tax Receipt Breakdown */}
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                                <div className="flex justify-between items-center border-b pb-2 font-semibold text-slate-800">
                                    <span>Receipt Number</span>
                                    <span className="font-mono text-blue-700">{verifiedPayment.receiptNumber || 'RCT-TRUCKNET-VERIFIED'}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Gross Milestone Value</span>
                                    <span className="font-semibold text-slate-900">₹{verifiedPayment.amount?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>TruckNet Platform Brokerage (2.0%)</span>
                                    <span>₹{verifiedPayment.platformFee || Math.round(verifiedPayment.amount * 0.02)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>GST on Brokerage (18% SAC 9965)</span>
                                    <span>₹{verifiedPayment.platformGst || Math.round((verifiedPayment.amount * 0.02) * 0.18)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 pt-2 border-t font-semibold text-slate-900">
                                    <span>Net Transporter Settlement</span>
                                    <span className="text-emerald-700 font-bold">
                                        ₹{(verifiedPayment.netPayeeAmount || (verifiedPayment.amount - (verifiedPayment.platformFee + verifiedPayment.platformGst)))?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                                    onClick={handlePrintReceipt}
                                >
                                    <Printer className="h-3.5 w-3.5 mr-2" /> Print Official Tax Slip
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                    onClick={onClose}
                                >
                                    Done & Return to Trip
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* ACTIVE PAYMENT STEP: QR & UTR SUBMISSION */
                        <div className="space-y-6">
                            {generatingOrder ? (
                                <div className="py-16 text-center space-y-3">
                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                                    <p className="text-xs text-slate-500 font-medium">Generating NPCI compliant UPI dynamic QR...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Amount Card & Transparent Fee Breakdown */}
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                                {stage} Payable Amount
                                            </span>
                                            <span className="text-2xl font-black text-slate-900">
                                                ₹{activeOrder?.payment?.amount?.toLocaleString('en-IN') || '0'}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 grid grid-cols-2 gap-2">
                                            <div>
                                                <span>Total Consignment: </span>
                                                <strong className="text-slate-800">₹{paymentSummary?.totalFreight?.toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div className="text-right">
                                                <span>TruckNet Cut (2%): </span>
                                                <strong className="text-blue-700">₹{activeOrder?.breakdown?.totalPlatformCut || '0'}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code and UPI Intent Section */}
                                    <div className="grid md:grid-cols-2 gap-6 items-center">
                                        {/* QR Frame */}
                                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 text-center shadow-sm flex flex-col items-center justify-center space-y-2">
                                            {activeOrder?.qrCodeDataUrl ? (
                                                <img
                                                    src={activeOrder.qrCodeDataUrl}
                                                    alt="Scan to Pay UPI"
                                                    className="w-48 h-48 rounded-lg shadow-inner border border-slate-100"
                                                />
                                            ) : (
                                                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400">
                                                    <QrCode className="h-10 w-10 animate-pulse" />
                                                </div>
                                            )}
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                Scan with PhonePe, Google Pay, or Paytm
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                                <ShieldCheck className="h-3 w-3" /> Auto-Verified Settlement
                                            </div>
                                        </div>

                                        {/* Mobile / Direct Pay Links */}
                                        <div className="space-y-4 text-xs">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                    Merchant VPA / UPI ID
                                                </label>
                                                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border font-mono text-slate-800">
                                                    <span>{activeOrder?.payment?.payeeVpa || 'trucknet.escrow@okhdfcbank'}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(activeOrder?.payment?.payeeVpa || 'trucknet.escrow@okhdfcbank', 'vpa')}
                                                        className="hover:text-blue-600 transition-colors p-1"
                                                        title="Copy VPA"
                                                    >
                                                        {copiedField === 'vpa' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                    Pay on Mobile App
                                                </label>
                                                <Button
                                                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs h-10 font-semibold shadow-sm flex items-center justify-center gap-2"
                                                    onClick={() => {
                                                        if (activeOrder?.upiIntentUrl) {
                                                            window.location.href = activeOrder.upiIntentUrl;
                                                        }
                                                    }}
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" /> Tap to Open GPay / PhonePe / Paytm
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* UTR Verification Input */}
                                    <form onSubmit={handleVerifyUtr} className="p-5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                                Step 2: Enter 12-Digit Bank UTR / UPI Reference Number
                                            </label>
                                            <span className="text-[10px] text-blue-700 font-medium">After scanning & paying</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={utrNumber}
                                                onChange={(e) => setUtrNumber(e.target.value)}
                                                placeholder="e.g. 428190348211 (from your payment slip)"
                                                className="bg-white border-blue-200 text-xs h-10 font-mono tracking-wider"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={verifying || !utrNumber.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 h-10 whitespace-nowrap"
                                            >
                                                {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                                            </Button>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            🔒 Anti-Fraud: Every UTR is checked for cryptographic uniqueness. Duplicate submissions are permanently blocked.
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
