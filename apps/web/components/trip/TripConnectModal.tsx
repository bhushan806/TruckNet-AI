'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Phone,
    MessageCircle,
    Copy,
    Check,
    Send,
    ShieldCheck,
    Truck,
    User,
    Lock,
    Clock,
    MapPin,
    AlertCircle,
    RefreshCw,
    FileText
} from 'lucide-react';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import BiltyViewerModal from './BiltyViewerModal';

interface TripConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId?: string;
    loadId?: string;
    loadIdentifier?: string; // loadId, loadNumber, or transactionId
}

export default function TripConnectModal({
    isOpen,
    onClose,
    tripId,
    loadId,
    loadIdentifier,
}: TripConnectModalProps) {
    const [activeTab, setActiveTab] = useState<'contact' | 'chat'>('contact');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contactData, setContactData] = useState<any>(null);
    const [resolvedTripId, setResolvedTripId] = useState<string | null>(tripId || null);

    // Chat states
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showBiltyModal, setShowBiltyModal] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ── Load Trip & Contact Data ──
    const fetchTripData = async () => {
        setLoading(true);
        setError('');
        try {
            let res;
            if (tripId) {
                res = await api.get(`/trips/${tripId}/contact`);
                setContactData(res.data.data);
                setResolvedTripId(tripId);
            } else if (loadId || loadIdentifier) {
                const id = loadId || loadIdentifier;
                res = await api.get(`/trips/by-load/${id}`);
                if (res.data?.data?.hasTrip && res.data.data.trip) {
                    setContactData(res.data.data.trip);
                    setResolvedTripId(res.data.data.trip.tripId);
                } else {
                    // Load exists but no trip booked yet
                    setContactData({
                        isPendingBooking: true,
                        load: res.data?.data?.load,
                        transactionId: res.data?.data?.load?.transactionId,
                        loadNumber: res.data?.data?.load?.loadNumber,
                    });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load trip contact information');
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch Chat Messages ──
    const fetchChatMessages = async (tId: string) => {
        try {
            const res = await api.get(`/trips/${tId}/messages`);
            setMessages(res.data.data || []);
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch {
            // Silently ignore or initialize empty
            setMessages([]);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchTripData();
    }, [isOpen, tripId, loadId, loadIdentifier]);

    // ── Socket.io Setup for Live Chat ──
    useEffect(() => {
        if (!isOpen || !resolvedTripId) return;

        fetchChatMessages(resolvedTripId);

        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('joinTrip', resolvedTripId);
        });

        socket.on('trip:new_message', (msg: any) => {
            if (msg.tripId === resolvedTripId) {
                setMessages((prev) => {
                    const exists = prev.some((m) => (m._id || m.id) === (msg._id || msg.id));
                    if (exists) return prev;
                    return [...prev, msg];
                });
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isOpen, resolvedTripId]);

    // ── Send Message ──
    const handleSendMessage = async (textToSend?: string) => {
        const content = (textToSend || newMessage).trim();
        if (!content || !resolvedTripId || sending) return;

        setSending(true);
        try {
            const res = await api.post(`/trips/${resolvedTripId}/messages`, {
                content,
                messageType: textToSend ? 'QUICK_STATUS' : 'TEXT',
            });
            if (res.data?.data) {
                const msg = res.data.data;
                setMessages((prev) => {
                    const exists = prev.some((m) => (m._id || m.id) === (msg._id || msg.id));
                    if (exists) return prev;
                    return [...prev, msg];
                });
            }
            setNewMessage('');
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getWhatsAppUrl = (phone: string, role: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const trx = contactData?.transactionId || '';
        const lod = contactData?.loadNumber || '';
        const route = contactData?.route ? `${contactData.route.source} to ${contactData.route.destination}` : '';
        const text = `Namaste! Regarding TruckNet Consignment (Txn: ${trx}, Load: ${lod}, Route: ${route}) - Connecting with you as ${role}.`;
        return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    };

    const quickStatusOptions = [
        'Gate pass ready 📄',
        'Truck loading in progress ⏳',
        'Dispatched & en-route 🚚',
        'Approaching destination 📍',
        'Truck reached unloading point 🏁',
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 relative">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                                <Truck className="h-5 w-5" />
                            </span>
                            <DialogTitle className="text-lg font-bold text-white tracking-wide">
                                Direct Contact & Trust Portal
                            </DialogTitle>
                        </div>
                        {contactData?.status && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5">
                                {contactData.status.toUpperCase().replace(/_/g, ' ')}
                            </Badge>
                        )}
                    </div>

                    <DialogDescription className="text-slate-300 text-xs">
                        Direct connection between Shipper, Fleet Owner, and Driver with verified credentials.
                    </DialogDescription>

                    {/* Transaction & Load Unique Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                        {contactData?.transactionId && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-cyan-400 px-2.5 py-1 rounded-md border border-slate-700">
                                <span>TXN:</span>
                                <span className="font-bold text-white">{contactData.transactionId}</span>
                                <button
                                    onClick={() => copyToClipboard(contactData.transactionId, 'txn')}
                                    className="hover:text-cyan-200 ml-1"
                                    title="Copy Transaction ID"
                                >
                                    {copiedField === 'txn' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                            </div>
                        )}

                        {contactData?.loadNumber && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-blue-400 px-2.5 py-1 rounded-md border border-slate-700">
                                <span>LOAD:</span>
                                <span className="font-bold text-white">{contactData.loadNumber}</span>
                                <button
                                    onClick={() => copyToClipboard(contactData.loadNumber, 'load')}
                                    className="hover:text-blue-200 ml-1"
                                    title="Copy Load ID"
                                >
                                    {copiedField === 'load' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                            </div>
                        )}

                        {contactData?.tripNumber && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-amber-400 px-2.5 py-1 rounded-md border border-slate-700">
                                <span>TRIP:</span>
                                <span className="font-bold text-white">{contactData.tripNumber}</span>
                            </div>
                        )}

                        <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                            <Lock className="h-3 w-3" /> Anti-Overlap Protected
                        </div>

                        {!contactData?.isPendingBooking && (
                            <button
                                onClick={() => setShowBiltyModal(true)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200 bg-emerald-900/70 hover:bg-emerald-800 px-2.5 py-1 rounded border border-emerald-700/60 transition-colors shadow-sm"
                            >
                                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Statutory Bilty (LR)</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                            activeTab === 'contact'
                                ? 'border-blue-600 text-blue-900 bg-white font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📞 Contact & Verified Credentials
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        disabled={!resolvedTripId}
                        className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                            activeTab === 'chat'
                                ? 'border-blue-600 text-blue-900 bg-white font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800 disabled:opacity-50'
                        }`}
                    >
                        💬 Real-Time Trip Chat {messages.length > 0 && `(${messages.length})`}
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 max-h-[460px] overflow-y-auto">
                    {loading && (
                        <div className="py-12 text-center space-y-3">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">Fetching verified consignment details...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && contactData?.isPendingBooking && (
                        <div className="p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                            <h4 className="font-bold text-slate-900 text-sm">Trip Assignment in Progress</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                This load ({contactData.loadNumber || 'Open'}) is currently published to verified fleet owners.
                                Once a transporter accepts or assigns a truck, their verified contact details and direct live chat will appear here automatically.
                            </p>
                            <div className="pt-2 text-xs font-mono text-slate-600">
                                Protected Transaction Code: <span className="font-bold text-slate-900">{contactData.transactionId}</span>
                            </div>
                        </div>
                    )}

                    {/* TAB 1: CONTACT CARDS */}
                    {!loading && !error && !contactData?.isPendingBooking && activeTab === 'contact' && (
                        <div className="space-y-4">
                            {/* Driver Card */}
                            {contactData?.driver && (
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 bg-emerald-600 text-white font-bold text-sm shadow-sm">
                                                <AvatarFallback>
                                                    {contactData.driver.name?.slice(0, 2).toUpperCase() || 'DR'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-slate-900 text-sm">{contactData.driver.name}</h4>
                                                    <span title="Identity Verified">
                                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                    </span>
                                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold py-0">
                                                        Assigned Driver
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Vehicle: <span className="font-mono font-semibold text-slate-800">{contactData.driver.vehicleNumber}</span> ({contactData.driver.vehicleType})
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    Body: {contactData.driver.bodyType} • Cap: {contactData.driver.capacity} MT
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200">
                                        <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-medium"
                                            onClick={() => window.location.href = `tel:${contactData.driver.phone}`}
                                            disabled={!contactData.driver.phone}
                                        >
                                            <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Driver ({contactData.driver.phone || 'N/A'})
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs h-9 font-medium"
                                            onClick={() => window.open(getWhatsAppUrl(contactData.driver.phone, 'Driver'), '_blank')}
                                            disabled={!contactData.driver.phone}
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Fleet Owner Card */}
                            {contactData?.owner && (
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 bg-purple-700 text-white font-bold text-sm shadow-sm">
                                                <AvatarFallback>
                                                    {contactData.owner.name?.slice(0, 2).toUpperCase() || 'FO'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-slate-900 text-sm">{contactData.owner.name}</h4>
                                                    <span title="Business Verified">
                                                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                                                    </span>
                                                    <Badge className="bg-purple-100 text-purple-800 text-[10px] font-semibold py-0">
                                                        Fleet Transporter
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-700 font-medium mt-0.5">{contactData.owner.companyName}</p>
                                                <p className="text-[11px] text-slate-500">{contactData.owner.email || 'Email verified'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-9 font-medium"
                                            onClick={() => window.location.href = `tel:${contactData.owner.phone}`}
                                            disabled={!contactData.owner.phone}
                                        >
                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Call Transporter
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs h-9 font-medium"
                                            onClick={() => window.open(getWhatsAppUrl(contactData.owner.phone, 'Transporter'), '_blank')}
                                            disabled={!contactData.owner.phone}
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Shipper / Customer Card */}
                            {contactData?.customer && (
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 bg-blue-600 text-white font-bold text-sm shadow-sm">
                                                <AvatarFallback>
                                                    {contactData.customer.name?.slice(0, 2).toUpperCase() || 'SH'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-slate-900 text-sm">{contactData.customer.name}</h4>
                                                    <Badge className="bg-blue-100 text-blue-800 text-[10px] font-semibold py-0">
                                                        Load Owner / Shipper
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-0.5">
                                                    Route: {contactData.route?.source} ➔ {contactData.route?.destination}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {contactData.route?.goodsType} • {contactData.route?.weight} Tons • ₹{contactData.route?.price?.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-9 font-medium"
                                            onClick={() => window.location.href = `tel:${contactData.customer.phone}`}
                                            disabled={!contactData.customer.phone}
                                        >
                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Call Shipper
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs h-9 font-medium"
                                            onClick={() => window.open(getWhatsAppUrl(contactData.customer.phone, 'Customer'), '_blank')}
                                            disabled={!contactData.customer.phone}
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: IN-APP LIVE CHAT */}
                    {!loading && !error && activeTab === 'chat' && (
                        <div className="flex flex-col h-[380px]">
                            {/* Message Feed */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                                        <MessageCircle className="h-8 w-8 text-slate-300" />
                                        <p className="text-xs font-medium">No messages yet on this consignment.</p>
                                        <p className="text-[11px] text-slate-400">
                                            Send a message or pick a quick update chip below to notify the other party in real time!
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const role = m.senderRole || 'USER';
                                        let roleColor = 'bg-slate-100 text-slate-800';
                                        if (role === 'CUSTOMER') roleColor = 'bg-blue-50 text-blue-800 border-blue-200';
                                        if (role === 'OWNER') roleColor = 'bg-purple-50 text-purple-800 border-purple-200';
                                        if (role === 'DRIVER') roleColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                                        return (
                                            <div key={m._id || m.id || idx} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-slate-900">{m.senderName || 'Participant'}</span>
                                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${roleColor}`}>
                                                            {role}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 whitespace-pre-wrap">{m.content}</p>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Quick Response Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                                {quickStatusOptions.map((opt, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSendMessage(opt)}
                                        className="text-[10px] whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors flex-shrink-0"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            {/* Input Form */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex gap-2 pt-2 border-t border-slate-200"
                            >
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type message to driver & transporter..."
                                    className="text-xs h-10 bg-slate-50"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Statutory Indian Bilty / LR Viewer */}
                <BiltyViewerModal
                    isOpen={showBiltyModal}
                    onClose={() => setShowBiltyModal(false)}
                    tripId={resolvedTripId || undefined}
                    loadId={loadId || undefined}
                    transactionId={contactData?.transactionId}
                />
            </DialogContent>
        </Dialog>
    );
}
