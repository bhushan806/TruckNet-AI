"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import AiInsightCard from "./AiInsightCard";
import { Sparkles, RefreshCw } from "lucide-react";

// Mock User Context (In real app, fetch from Auth Provider)
// We will allow switching roles for Demo purposes
const DEMO_ROLES = ["DRIVER", "OWNER", "CUSTOMER"];

export default function AiDashboard() {
    const [role, setRole] = useState("DRIVER");
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<any>(null);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            // Use standard Demo Emails to trigger Auto-Seeding in Backend
            let demoUserId = "demo.driver@trucknet.in";
            if (role === "OWNER") demoUserId = "demo.owner@trucknet.in";
            if (role === "CUSTOMER") demoUserId = "demo.customer@trucknet.in";

            // API call to our Node.js endpoint via shared api module
            const res = await api.post("/ai/insights", {
                role: role,
                userId: demoUserId
            });
            setInsights(res.data.data);
        } catch (err) {
            console.error("Failed to fetch insights", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [role]);

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-8">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                        TruckNet Intelligence
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Real-time decision support for {role}s
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
                    {DEMO_ROLES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${role === r
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                    <button
                        onClick={fetchInsights}
                        className="p-2 ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-white/5 border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">

                    {/* Summary Section */}
                    {insights?.summary && (
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 backdrop-blur-xl">
                            <h2 className="text-xl font-semibold text-white mb-1">
                                AI Summary: <span className="text-cyan-300">{insights.summary}</span>
                            </h2>
                            <p className="text-sm text-gray-400">{insights.explanation}</p>
                        </div>
                    )}

                    {/* Recommendations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {insights?.top_recommendations?.map((rec: any, idx: number) => (
                            <AiInsightCard
                                key={idx}
                                type={rec.type || "INFO"}
                                title={rec.title}
                                description={rec.description}
                                confidence={insights.confidence_score}
                                data={rec.data}
                            />
                        ))}

                        {insights?.insights?.map((ins: any, idx: number) => (
                            <AiInsightCard
                                key={`ins-${idx}`}
                                type={ins.type || "INFO"}
                                title={ins.type === "WARNING" ? "Attention Needed" : "Market update"}
                                description={ins.text}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {(!insights?.top_recommendations?.length && !insights?.insights?.length) && (
                        <div className="text-center py-20 text-gray-500">
                            No insights available for this context.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
