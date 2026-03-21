"use client";

import { motion } from "framer-motion";
import {
    Leaf,
    AlertTriangle,
    Navigation,
    TrendingUp,
    Truck,
    CheckCircle,
    MapPin,
    Clock
} from "lucide-react";

interface AiInsightCardProps {
    type: string; // ROUTE, WARNING, ACTION, STATUS, INFO
    title: string;
    description: string;
    confidence?: number;
    data?: any;
    onAction?: () => void;
}

const getIcon = (type: string) => {
    switch (type) {
        case "ROUTE": return <Navigation className="w-6 h-6 text-blue-400" />;
        case "WARNING": return <AlertTriangle className="w-6 h-6 text-orange-400" />;
        case "ACTION": return <Truck className="w-6 h-6 text-green-400" />;
        case "STATUS": return <Clock className="w-6 h-6 text-purple-400" />;
        case "INFO": return <TrendingUp className="w-6 h-6 text-cyan-400" />;
        default: return <Leaf className="w-6 h-6 text-gray-400" />;
    }
};

const getColor = (type: string) => {
    switch (type) {
        case "ROUTE": return "border-blue-500/30 bg-blue-500/5";
        case "WARNING": return "border-orange-500/30 bg-orange-500/5";
        case "ACTION": return "border-green-500/30 bg-green-500/5";
        case "STATUS": return "border-purple-500/30 bg-purple-500/5";
        case "INFO": return "border-cyan-500/30 bg-cyan-500/5";
        default: return "border-white/10 bg-white/5";
    }
};

export default function AiInsightCard({ type, title, description, confidence, data, onAction }: AiInsightCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-5 rounded-xl border backdrop-blur-md shadow-lg ${getColor(type)} hover:scale-[1.02] transition-transform duration-200`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        {getIcon(type)}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white/90">{title}</h3>
                        {confidence && (
                            <div className="flex items-center gap-1 mt-1">
                                <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                        style={{ width: `${confidence * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-white/50">{Math.round(confidence * 100)}% Match</span>
                            </div>
                        )}
                    </div>
                </div>

                {type === "ROUTE" && data?.route && (
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/20">
                        {data.total_distance_km} KM
                    </span>
                )}
            </div>

            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                {description}
            </p>

            {/* Dynamic Action Buttons or Extra Data */}
            {data?.steps && (
                <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-xs text-gray-400 mb-2">OPTIMIZED PATH:</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {data.route.map((city: string, i: number) => (
                            <div key={i} className="flex items-center">
                                <span className="text-xs font-medium text-white/80">{city}</span>
                                {i < data.route.length - 1 && <span className="mx-2 text-gray-600">→</span>}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Efficiency Score: {data.optimization_score}
                    </div>
                </div>
            )}

            {onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium text-white transition-colors"
                >
                    View Details
                </button>
            )}
        </motion.div>
    );
}
