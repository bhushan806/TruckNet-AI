'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    MessageSquare, Mic, Send, X, Bot, User, Volume2, VolumeX,
    Trash2, ChevronDown, Sparkles, Shield, Brain, Globe,
    Package, Truck, AlertTriangle, MapPin, DollarSign, LifeBuoy,
    Zap, ArrowRight, TrendingUp
} from 'lucide-react';
import api, { aiApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    action?: string;
    data?: any;
    structuredData?: {
        pricing?: any;
        risk?: any;
        loadSharing?: any;
        insights?: any;
        routeAdvanced?: any;
    };
    predictiveIntelligence?: any;
}

// Role-based welcome messages
function getWelcomeMessage(role: string | undefined): string {
    return 'Namaste! Main TruckNet Dost hoon 🚛\nAapki kya madad kar sakta hoon?\nNeeche se koi sawaal chuno ya apna sawaal likho!';
}


// Role-based quick action buttons
function getQuickActions(role: string | undefined): Array<{ label: string; icon: any; text: string }> {
    return [
        { label: 'Best Route', icon: MapPin, text: 'Best route dikhao 🗺️' },
        { label: 'Find Truck', icon: Truck, text: 'Truck dhundho 🚛' },
        { label: 'Weather', icon: Globe, text: 'Aaj ka mausam kaisa hai? ⛅' },
        { label: 'Price Check', icon: DollarSign, text: 'Load price batao 💰' },
    ];
}

// Context-aware suggestions based on current page
function getPageContext(pathname: string, isAuthenticated: boolean): { title: string; suggestions: string[] } {
    if (!isAuthenticated) return {
        title: 'Visitor Demo',
        suggestions: ['How does TruckNet AI work?', 'What is delay prediction?', 'Show me a demo', 'Can I track shipments?'],
    };
    if (pathname.includes('/owner')) return {
        title: 'Fleet Overview',
        suggestions: ['Fleet health kya hai?', 'Idle trucks dikhao', 'Driver performance report'],
    };
    if (pathname.includes('/driver')) return {
        title: 'Driver Console',
        suggestions: ['Aaj ke loads dikhao', 'Best route suggest karo', 'My earnings check karo'],
    };
    if (pathname.includes('/customer')) return {
        title: 'Customer Dashboard',
        suggestions: ['Track my order', 'Book a new truck', 'Check delivery ETA'],
    };
    if (pathname.includes('/ai')) return {
        title: 'AI Intelligence',
        suggestions: ['Risk prediction run karo', 'Network heatmap dikhao', 'Fleet analysis'],
    };
    return {
        title: 'Dashboard',
        suggestions: ['Kya kar sakte ho?', 'Help me get started'],
    };
}

// ── Structured Data Card Components ──

function PricingCard({ data }: { data: any }) {
    if (!data) return null;
    return (
        <div className="mt-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 text-xs mb-2">
                <DollarSign className="h-3.5 w-3.5" /> Dynamic Pricing
            </div>
            <div className="space-y-1 text-xs text-emerald-700">
                <p>📊 Range: <span className="font-semibold">₹{data.minPrice?.toLocaleString('en-IN')} – ₹{data.maxPrice?.toLocaleString('en-IN')}</span></p>
                <p>✅ Recommended: <span className="font-semibold">₹{data.recommendedPrice?.toLocaleString('en-IN')}</span></p>
                <p>📈 Confidence: <span className="font-semibold">{Math.round((data.confidence ?? 0) * 100)}%</span></p>
                {data.breakdown && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                        Surge: {data.breakdown.demandSurgeFactor}x | Fuel: ₹{data.breakdown.fuelEstimate}
                    </p>
                )}
            </div>
        </div>
    );
}

function RiskCard({ data }: { data: any }) {
    if (!data) return null;
    const emoji = data.riskLevel === 'LOW' ? '🟢' : data.riskLevel === 'MEDIUM' ? '🟡' : '🔴';
    const colors = data.riskLevel === 'LOW' ? 'from-green-50 to-emerald-50 border-green-200' :
                   data.riskLevel === 'MEDIUM' ? 'from-amber-50 to-yellow-50 border-amber-200' :
                   'from-red-50 to-rose-50 border-red-200';
    return (
        <div className={`mt-3 bg-gradient-to-r ${colors} border rounded-xl p-3.5`}>
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-2">
                <Shield className="h-3.5 w-3.5" /> {emoji} Risk: {data.riskLevel} ({data.riskScore}/100)
            </div>
            <div className="space-y-1 text-xs">
                <p>⏰ Delay: ~{data.estimatedDelayMinutes} mins ({Math.round((data.delayProbability ?? 0) * 100)}%)</p>
                {data.reasons?.slice(0, 2).map((r: string, i: number) => (
                    <p key={i} className="text-[10px] opacity-80">• {r}</p>
                ))}
            </div>
        </div>
    );
}

function LoadSharingCard({ data }: { data: any }) {
    if (!data || !data.combinations?.length) return null;
    return (
        <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-blue-800 text-xs mb-2">
                <Truck className="h-3.5 w-3.5" /> Load Sharing
            </div>
            <div className="space-y-1 text-xs text-blue-700">
                <p>✅ {data.combinations.length} optimized groups</p>
                <p>💰 ~{data.totalSavingsKm} km saved</p>
                {data.combinations.slice(0, 2).map((c: any, i: number) => (
                    <p key={i} className="text-[10px]">
                        Group {i + 1}: {c.loads?.length} loads → Truck {c.truckId} ({c.capacityUsed}% full)
                    </p>
                ))}
            </div>
        </div>
    );
}

function RouteOptionsCard({ data }: { data: any }) {
    if (!data?.options) return null;
    return (
        <div className="mt-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-violet-800 text-xs mb-2">
                <MapPin className="h-3.5 w-3.5" /> Route Options
            </div>
            <div className="space-y-1.5 text-xs text-violet-700">
                {data.options?.map((opt: any, i: number) => (
                    <div key={i} className={`flex justify-between ${opt.recommended ? 'font-semibold' : ''}`}>
                        <span>{opt.label === 'Fastest' ? '⚡' : opt.label === 'Cheapest' ? '💰' : '⚖️'} {opt.label}</span>
                        <span>{opt.distanceKm}km • ₹{opt.totalCost} {opt.recommended ? '✅' : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PredictiveIntelligenceCard({ data }: { data: any }) {
    if (!data?.available) return null;
    const emoji = data.riskLevel === 'LOW' ? '🟢' : data.riskLevel === 'MEDIUM' ? '🟡'
                : data.riskLevel === 'HIGH' ? '🟠' : '🔴';
    const colors = data.riskLevel === 'LOW' ? 'from-green-50 to-emerald-50 border-green-200' :
                   data.riskLevel === 'MEDIUM' ? 'from-amber-50 to-yellow-50 border-amber-200' :
                   data.riskLevel === 'HIGH' ? 'from-orange-50 to-amber-50 border-orange-200' :
                   'from-red-50 to-rose-50 border-red-200';
    return (
        <div className={`mt-3 bg-gradient-to-r ${colors} border rounded-xl p-3.5`}>
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-2">
                <Brain className="h-3.5 w-3.5" /> {emoji} Predictive Intelligence
            </div>
            <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                    <span>Risk Score</span>
                    <span className="font-semibold">{data.riskScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all ${
                            data.riskScore <= 30 ? 'bg-green-500' :
                            data.riskScore <= 60 ? 'bg-amber-500' :
                            data.riskScore <= 85 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, data.riskScore)}%` }}
                    />
                </div>
                <p>⏰ Predicted delay: ~{data.predictedDelayMinutes} min</p>
                {data.reasons?.slice(0, 2).map((r: string, i: number) => (
                    <p key={i} className="text-[10px] opacity-80">• {r}</p>
                ))}
                {data.recommendedAction && (
                    <p className="text-[10px] font-medium mt-1 pt-1 border-t">
                        💡 {data.recommendedAction.length > 100 ? data.recommendedAction.slice(0, 100) + '…' : data.recommendedAction}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Thinking Status Messages ──
const THINKING_MESSAGES = [
    'Analyzing route conditions...',
    'Checking traffic patterns...',
    'Predicting delay probability...',
    'Fetching live data...',
    'Processing with AI...',
];

export default function AIAssistant() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    const pageContext = getPageContext(pathname || '', !!user);
    const isPublicMode = !user;

    // Cycle thinking messages while loading
    useEffect(() => {
        if (!isLoading) { setThinkingMessage(''); return; }
        let idx = 0;
        setThinkingMessage(THINKING_MESSAGES[0]);
        const interval = setInterval(() => {
            idx = (idx + 1) % THINKING_MESSAGES.length;
            setThinkingMessage(THINKING_MESSAGES[idx]);
        }, 2000);
        return () => clearInterval(interval);
    }, [isLoading]);

    // ── FIX 4: Immediate state wipe on user identity change ──
    // Track which user's data is currently loaded so we can detect switches.
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

    // ── FIX 8: Per-tab anonymous session ID ──
    // Uses sessionStorage so it auto-clears when the browser tab closes.
    function getAnonymousSessionId(): string {
        let sid = '';
        try {
            sid = sessionStorage.getItem('anon_session_id') || '';
            if (!sid) {
                sid = crypto.randomUUID();
                sessionStorage.setItem('anon_session_id', sid);
            }
        } catch {
            sid = `anon_${Date.now()}`;
        }
        return sid;
    }

    // Derive chat storage key — user-specific or per-tab anonymous
    const chatKey = user?.id
        ? `chat_${user.id}`
        : `chat_anon_${getAnonymousSessionId()}`;

    useEffect(() => {
        // IMMEDIATELY wipe messages before loading the new user's history.
        // This prevents user A's messages from being re-saved under user B's key.
        if (user?.id !== currentUserId) {
            setMessages([]);
            setShowQuickActions(false);
            setCurrentUserId(user?.id);
        }
    }, [user?.id, currentUserId]);

    useEffect(() => {
        if (!isOpen) return;

        const loadChatHistory = async () => {
            if (isPublicMode) {
                // FIX 8: Anonymous visitors get a per-tab isolated session.
                // sessionStorage means closing the tab clears the demo chat.
                const anonKey = chatKey; // already scoped with randomUUID
                try {
                    const saved = sessionStorage.getItem(anonKey);
                    const parsed = saved ? JSON.parse(saved) : [];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                        setShowQuickActions(false);
                    } else {
                        setMessages([{ role: 'assistant', content: getWelcomeMessage(undefined) }]);
                        setShowQuickActions(true);
                    }
                } catch {
                    setMessages([{ role: 'assistant', content: getWelcomeMessage(undefined) }]);
                    setShowQuickActions(true);
                }
                return;
            }

            // FIX 4: Load logged-in user's history — localStorage first, then server.
            // At this point currentUserId === user?.id (already synced above).
            const localData = localStorage.getItem(chatKey);

            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                        setShowQuickActions(false);
                    }
                } catch {
                    localStorage.removeItem(chatKey);
                }
            }

            // Fetch from server (Node backend /api/dost/history is authoritative)
            try {
                const res = await aiApi.get('/dost/history');
                const history = res.data?.history || [];

                if (Array.isArray(history) && history.length > 0) {
                    setMessages(history);
                    localStorage.setItem(chatKey, JSON.stringify(history));
                    setShowQuickActions(false);
                } else if (!localData) {
                    setMessages([{ role: 'assistant', content: getWelcomeMessage(user?.role) }]);
                    setShowQuickActions(true);
                }
            } catch {
                // Server unreachable — use cached local data or welcome message
                if (!localData) {
                    setMessages([{ role: 'assistant', content: getWelcomeMessage(user?.role) }]);
                    setShowQuickActions(true);
                }
            }
        };

        loadChatHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user?.id, user?.role, isPublicMode]);

    // ── Sync messages to storage ──
    // FIX 4: Only sync if the user identity matches what's loaded.
    // FIX 8: Anonymous users write to sessionStorage (not localStorage).
    useEffect(() => {
        if (messages.length === 0) return;
        if (isPublicMode) {
            try { sessionStorage.setItem(chatKey, JSON.stringify(messages)); } catch { /* ignore */ }
        } else if (user?.id === currentUserId && currentUserId) {
            // Confirmed same user — safe to persist
            try { localStorage.setItem(chatKey, JSON.stringify(messages)); } catch { /* ignore */ }
        }
        // If user?.id !== currentUserId, the identity reset is still in flight — do NOT write.
    }, [messages, user?.id, currentUserId, isPublicMode, chatKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, isOpen]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // ── Text-to-Speech Helper ──
    const speakText = useCallback((text: string) => {
        if (!ttsEnabled) return;
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const cleanText = text
            .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
            .replace(/[•\-\*#]/g, '')
            .replace(/₹/g, 'rupees ')
            .trim();
        if (!cleanText) return;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const hasHindi = /[\u0900-\u097F]/.test(text);
        utterance.lang = hasHindi ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, [ttsEnabled]);

    const handleClearChat = async () => {
        if (!window.confirm("Clear chat history?")) return;
        const userIdToUse = user?.id || 'anonymous';
        try {
            if (!isPublicMode) await aiApi.delete('/dost/history');
            localStorage.removeItem(`chat_${userIdToUse}`);
            setMessages([{ role: 'assistant', content: getWelcomeMessage(user?.role) }]);
            setShowQuickActions(true);
        } catch {
            localStorage.removeItem(`chat_${userIdToUse}`);
            setMessages([{ role: 'assistant', content: getWelcomeMessage(user?.role) }]);
            setShowQuickActions(true);
        }
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;
        const userMsg = { role: 'user' as const, content: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowQuickActions(false);
        setIsLoading(true);

        try {
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await aiApi.post('/dost/chat', {
                message: messageText,
                conversationHistory
            });

            let reply = res.data.reply || res.data.message || "Kuch gadbad hui, try karo 🚛";
            const structuredData = res.data.structuredData || null;
            const predictiveIntelligence = res.data.predictiveIntelligence || null;

            if (typeof reply === "string" && !reply.trim()) {
                reply = "Namaste! Main TruckNet Dost hoon. Aapki kya help kar sakta hoon? 🚛";
            }
            const assistantMsg: Message = {
                role: 'assistant',
                content: reply,
                structuredData,
                predictiveIntelligence,
            };
            setMessages(prev => [...prev, assistantMsg]);
            speakText(reply);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'TruckNet Dost abhi busy hai 🚛 \nThodi der mein try karo!',
                action: 'RETRY'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!user) {
            setMessages(prev => [...prev, { role: 'user', content: input }, {
                role: 'assistant',
                content: 'Chat use karne ke liye pehle login karo! 🔐',
                action: 'LOGIN_PROMPT'
            }]);
            setInput('');
            return;
        }
        await sendMessage(input);
    };

    const handleQuickAction = async (text: string) => {
        if (!user) {
            setMessages(prev => [...prev, { role: 'user', content: text }, {
                role: 'assistant',
                content: 'Chat use karne ke liye pehle login karo! 🔐',
                action: 'LOGIN_PROMPT'
            }]);
            return;
        }
        await sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Voice Input ──
    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            recognition.lang = 'hi-IN';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone in browser settings.');
                }
            };
            recognition.onresult = (event: any) => {
                const results = event.results;
                const lastResult = results[results.length - 1];
                const transcript = lastResult[0].transcript;
                if (lastResult.isFinal) {
                    setInput(transcript);
                    setTimeout(() => sendMessage(transcript), 300);
                } else {
                    setInput(transcript);
                }
            };
            recognition.start();
        } else {
            alert('Voice input is not supported in this browser. Use Chrome for best results.');
        }
    };

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <button
                id="ai-assistant-trigger"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-[9999]
                    h-14 w-14 rounded-2xl
                    bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]
                    text-white shadow-lg shadow-blue-500/25
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105
                    active:scale-95
                    ${isOpen ? 'rotate-0' : ''}
                    ${isLoading ? 'animate-pulse' : ''}
                `}
                style={{ display: isOpen ? 'none' : 'flex' }}
            >
                <Brain className="h-6 w-6" />
                {/* Notification pulse */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
            </button>

            {/* ── Overlay Backdrop ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── AI Co-Pilot Panel ── */}
            <div
                className={`
                    fixed top-0 right-0 h-full z-[9999]
                    w-full sm:w-[420px]
                    bg-[#F9FAFB] border-l border-[#E5E7EB]
                    shadow-2xl shadow-black/10
                    flex flex-col
                    transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* ── Header ── */}
                <div className="bg-white border-b border-[#E5E7EB] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                <Brain className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-[#111827] text-[15px] leading-tight">
                                    TruckNet Dost {isPublicMode && <span className="text-emerald-600 font-normal text-xs ml-1">(Public Demo)</span>}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {!isPublicMode ? (
                                        <>
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[11px] text-[#6B7280]">AI Co-Pilot Active</span>
                                        </>
                                    ) : (
                                        <span className="text-[11px] text-[#6B7280]">🔓 No login required</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="p-2 rounded-lg text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                                title="Clear chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setTtsEnabled(!ttsEnabled);
                                    if (ttsEnabled) window.speechSynthesis?.cancel();
                                }}
                                className={`p-2 rounded-lg transition-colors ${ttsEnabled ? 'text-[#2563EB] bg-blue-50' : 'text-[#6B7280] hover:bg-gray-100'}`}
                                title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
                            >
                                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
                                title="Close panel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── AI Capabilities Badges ── */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-medium text-[#2563EB]">
                            <Sparkles className="h-2.5 w-2.5" /> Predictive Intel
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-medium text-emerald-700">
                            <Shield className="h-2.5 w-2.5" /> Risk Detection
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-[10px] font-medium text-violet-700">
                            <Globe className="h-2.5 w-2.5" /> Hinglish
                        </span>
                    </div>
                </div>

                {/* ── Context Bar ── */}
                <div className="bg-white border-b border-[#E5E7EB] px-5 py-2.5">
                    <p className="text-[11px] text-[#6B7280]">
                        📍 You&apos;re on <span className="font-medium text-[#111827]">{pageContext.title}</span>
                    </p>
                </div>

                {/* ── Messages Area ── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white mt-0.5">
                                    <Bot className="h-3.5 w-3.5" />
                                </div>
                            )}
                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] mt-0.5">
                                    <User className="h-3.5 w-3.5" />
                                </div>
                            )}
                            {/* Message Bubble */}
                            <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                                <div className={`
                                    px-3.5 py-2.5 text-[13px] leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-[#2563EB] text-white rounded-2xl rounded-tr-md shadow-sm'
                                        : 'bg-white text-[#111827] border border-[#E5E7EB] rounded-2xl rounded-tl-md shadow-sm'
                                    }
                                `}>
                                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                                </div>

                                {/* ── Structured Data Cards ── */}
                                {msg.structuredData?.pricing && <PricingCard data={msg.structuredData.pricing} />}
                                {msg.structuredData?.risk && <RiskCard data={msg.structuredData.risk} />}
                                {msg.structuredData?.loadSharing && <LoadSharingCard data={msg.structuredData.loadSharing} />}
                                {msg.structuredData?.routeAdvanced && <RouteOptionsCard data={msg.structuredData.routeAdvanced} />}
                                {msg.predictiveIntelligence && <PredictiveIntelligenceCard data={msg.predictiveIntelligence} />}

                                {/* Existing: Render Action Data (Loads) */}
                                {msg.action === 'SHOW_LOADS' && msg.data && (
                                    <div className="mt-2 space-y-1.5">
                                        {msg.data.map((load: any) => (
                                            <div key={load.id} className="bg-white border border-[#E5E7EB] rounded-lg p-2.5 text-xs">
                                                <p className="font-semibold text-[#111827]">{load.origin} ➝ {load.destination}</p>
                                                <p className="text-[#6B7280]">₹{load.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {msg.action === 'RETRY' && (
                                    <div className="mt-2">
                                        <button 
                                            onClick={() => {
                                                const userMsgs = messages.filter(m => m.role === 'user');
                                                if(userMsgs.length > 0) {
                                                    sendMessage(userMsgs[userMsgs.length - 1].content);
                                                }
                                            }}
                                            className="text-white text-xs px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors shadow-sm"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}
                                {msg.action === 'LOGIN_PROMPT' && (
                                    <div className="mt-2">
                                        <Button 
                                            onClick={() => router.push('/auth/login')}
                                            className="h-8 text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
                                        >
                                            Login Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* ── Login Upsell for Public Mode ── */}
                    {isPublicMode && messages.length > 2 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 my-2 text-center shadow-sm">
                            <h3 className="text-xs font-semibold text-blue-900 mb-1">✨ Loving the experience?</h3>
                            <p className="text-[11px] text-blue-700 mb-3">
                                Sign up to track your real shipments, get personalized delay predictions, and manage your fleet.
                            </p>
                            <Button
                                onClick={() => { setIsOpen(false); router.push('/auth/register'); }}
                                className="w-full h-8 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm"
                            >
                                Sign Up Free →
                            </Button>
                        </div>
                    )}

                    {/* ── Quick Actions (shown after welcome) ── */}
                    {showQuickActions && messages.length <= 1 && (
                        <div className="space-y-3">
                            {/* Context Suggestions */}
                            <div className="pt-2">
                                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">Try asking</p>
                                <div className="space-y-1.5">
                                    {pageContext.suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickAction(s)}
                                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-xl hover:border-[#2563EB] hover:bg-blue-50/50 transition-all group"
                                        >
                                            <ArrowRight className="h-3 w-3 text-[#6B7280] group-hover:text-[#2563EB] transition-colors" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Action Chips */}
                            <div>
                                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {getQuickActions(user?.role).map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickAction(action.text)}
                                            className="flex items-center gap-2 px-3 py-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-xl hover:border-[#2563EB] hover:bg-blue-50/50 hover:shadow-sm transition-all"
                                        >
                                            <action.icon className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />
                                            <span className="truncate">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Thinking Indicator ── */}
                    {isLoading && (
                        <div className="flex gap-2.5">
                            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white">
                                <Bot className="h-3.5 w-3.5 animate-pulse" />
                            </div>
                            <div className="bg-white border border-[#E5E7EB] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-[11px] text-[#6B7280] animate-pulse">{thinkingMessage}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* ── Input Area ── */}
                <div className="bg-white border-t border-[#E5E7EB] px-4 py-3">
                    <div className="flex items-end gap-2">
                        <button
                            className={`
                                flex-shrink-0 p-2.5 rounded-xl transition-all
                                ${isListening
                                    ? 'bg-red-50 text-red-500 animate-pulse shadow-sm'
                                    : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]'
                                }
                            `}
                            onClick={startListening}
                            title="Voice input (Hindi/English)"
                        >
                            <Mic className="h-4.5 w-4.5" />
                        </button>
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Dost anything..."
                                disabled={!user}
                                className="
                                    w-full resize-none
                                    border border-[#E5E7EB] rounded-xl
                                    px-4 py-2.5 pr-10
                                    text-[13px] text-[#111827]
                                    placeholder:text-[#9CA3AF]
                                    bg-[#F9FAFB]
                                    focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]
                                    min-h-[40px] max-h-[100px]
                                    transition-all
                                    disabled:bg-gray-100 disabled:cursor-not-allowed disabled:placeholder-gray-400
                                "
                                rows={1}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim() || !user}
                            className={`
                                flex-shrink-0 p-2.5 rounded-xl transition-all
                                ${input.trim() && !isLoading && !!user
                                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20 hover:bg-[#1D4ED8] active:scale-95'
                                    : 'bg-gray-100 text-[#9CA3AF] cursor-not-allowed'
                                }
                            `}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">
                        Powered by AI • Hindi / English / Hinglish supported
                    </p>
                </div>
            </div>
        </>
    );
}
