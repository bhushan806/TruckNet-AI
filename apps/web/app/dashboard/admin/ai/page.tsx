'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Send, RefreshCw, Sparkles, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const STARTER_QUESTIONS = [
    'How many users are registered on the platform?',
    'What is the current load match success rate?',
    'How many loads are open right now?',
    'How many drivers are currently available?',
    'What is the current system traffic and latency?',
    'Summarize the current state of the platform.',
];

export default function AdminAiPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return;
        const userMsg: Message = { role: 'user', content: content.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/admin/ops/chat', {
                message: content.trim(),
            });
            const reply = res.data.data.reply;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: reply,
                timestamp: new Date(),
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'AI temporarily unavailable. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const clearChat = async () => {
        setMessages([]);
        try {
            await api.post('/admin/ops/chat', { message: 'reset', resetHistory: true });
        } catch { }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-5rem)] gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-6 w-6 text-blue-500" /> Admin AI Assistant
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Ask questions about real TruckNet platform data.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <Lock className="h-3 w-3" />
                        Admin Only
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-muted-foreground transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/20">
                                <Sparkles className="h-10 w-10 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">TruckNet Operations AI</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                    Ask about users, loads, vehicles, trips, traffic, or platform health.
                                    All answers use real database data.
                                </p>
                            </div>
                            <div className="grid gap-2 w-full max-w-lg">
                                {STARTER_QUESTIONS.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-left px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot className="h-4 w-4 text-blue-400" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-muted text-foreground rounded-tl-sm'
                                    )}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        <p className={cn('text-xs mt-1.5', msg.role === 'user' ? 'text-blue-200' : 'text-muted-foreground')}>
                                            {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1.5 items-center h-5">
                                    {[0, 0.2, 0.4].map((delay, i) => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <CardContent className="p-4 border-t border-border/50">
                    <div className="flex gap-3 items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about users, loads, vehicles, trips, or platform health..."
                            rows={1}
                            className="flex-1 resize-none rounded-xl bg-muted border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground max-h-32"
                            style={{ minHeight: 44 }}
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || loading}
                            className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3" />
                        Credentials, keys, and secrets are never shared by this assistant.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
