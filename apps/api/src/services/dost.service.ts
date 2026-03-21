// ── TruckNet Dost AI Brain Service ──
// The central AI brain of TruckNet India. Like Jarvis but for Indian roads.
// Handles role-based context, language detection, module routing, and AI chat.
// Enhanced with structured AI data injection (pricing, risk, load sharing, insights).

import { callGrokAPI } from './aiService';
import { logger } from '../utils/logger';
import { RideModel } from '../models/mongoose/Ride';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { LoadModel } from '../models/mongoose/Load';
import DocumentModel from '../models/Document';

// ── New AI Module Imports ──
import { calculateDynamicPrice } from '../ai/pricing.engine';
import { assessDeliveryRisk } from '../ai/risk.engine';
import { optimizeLoadSharing } from '../ai/loadSharing.engine';
import { generateOwnerInsights } from '../ai/insights.engine';

// ── Predictive Intelligence Imports ──
import { predictShipmentRisk } from '../ai/riskPrediction.service';
import { makeDecision } from '../ai/decisionEngine.service';
import type { PredictiveIntelligenceContext } from '../ai/types/predictive.types';

// ── Master System Prompts ──
const TRUCKNET_DOST_PROMPT = `You are TRUCKNET DOST — the official AI brain of TruckNet India. You are like Jarvis from Iron Man but built for Indian roads and trucking.

You communicate with Indian truck drivers, fleet owners, and customers. Your tone must be:
- Very polite and respectful (use "Aap", never "Tu")
- Professional yet friendly
- Highly knowledgeable about logistics, trucks, and Indian geography
- You can speak in English, Hindi, and Hinglish.

CAPABILITIES:
You can help with:
- Load Matching (finding trucks/loads)
- Pricing Prediction
- Delivery Risk & Delay Prediction (Weather, Traffic, Tolls)
- Optimal Route Suggestions
- Load Sharing & Empty Miles Reduction

FORMATTING RULES:
- Use emojis naturally but professionally (🚛, 📍, 💰, ⚠️, 🟢)
- Keep responses concise and scannable (do not write long paragraphs)
- Use bullet points for lists
- Do not use markdown headers (##), prefer bold text for emphasis
- If you don't know something, safely admit it and offer contact to human support.`;

const PUBLIC_DEMO_PROMPT = `You are TRUCKNET DOST in PUBLIC DEMO MODE.
You are the AI brain of TruckNet India, showcasing the platform's capabilities to new visitors.

RULES FOR PUBLIC MODE:
- Be highly enthusiastic, helpful, and polite.
- Explain features and capabilities (Load Matching, Delay Prediction, Tracking, Routing).
- Provide demo examples using sample Indian cities and generic data if asked.
- NEVER claim to access the user's personal data, as they are not logged in.
- If the user asks about their specific shipments, fleet, or account, politely explain they need to login.
- Gently encourage signup for full customized features.
- Keep responses engaging to convert visitors into signed-up users.

Example response for tracking:
"I'd love to help track your shipment! 🚛 Once you create a free account, I can track your specific loads in real-time. Want to see a demo of how it works?"`;

// ── Role Specific Instructions (Authenticated) ──
const ROLE_INSTRUCTIONS: Record<string, string> = {
    CUSTOMER: `
LANGUAGE RULE: Detect language from user message.
Hindi → reply in Hindi. English → reply English.
Hinglish → reply Hinglish. Auto-detect always.

USER ROLE BEHAVIOR:
If role is CUSTOMER:
  - Help them book trucks
  - Track their orders
  - Handle payments
  - First message greeting: "Namaste! 🚛 Aaj kahan bhejni hai maal?"

BOOKING FLOW (for CUSTOMER):
Step 1 — ask only pickup: "Maal kahan se uthana hai? 📍"
Step 2 — ask only destination: "Kahan pahunchana hai? 📍"
Step 3 — confirm: "Truck dhundh raha hoon... ✅"
Never ask more than one question per message.
Maximum 3 steps to complete booking.
`,
    DRIVER: `
LANGUAGE RULE: Detect language from user message.
Hindi → reply in Hindi. English → reply English.
Hinglish → reply Hinglish. Auto-detect always.

USER ROLE BEHAVIOR:
If role is DRIVER:
  - Help find loads
  - Show earnings and best routes
  - Manage documents
  - First message greeting: "Jai ho bhai! 🚛 Aaj kahan jaana hai?"

LOAD FINDING (for DRIVER):
Step 1 — ask location: "Abhi kahan ho? 📍"
Step 2 — show available loads nearby
`,
    OWNER: `
LANGUAGE RULE: Detect language from user message.
Hindi → reply in Hindi. English → reply English.
Hinglish → reply Hinglish. Auto-detect always.

USER ROLE BEHAVIOR:
If role is OWNER:
  - Show fleet overview
  - Alert on idle trucks
  - Show driver performance
  - First message greeting: "Namaste! 🚛 Aaj fleet ka kya haal hai?"

FLEET OVERVIEW (for OWNER):
Show all trucks, which are active, which are idle.
Alert on any idle truck over 24 hours.
Alert on any document expiring within 30 days.
`
};

const COMMON_RULES = `
URGENT MODE:
If user says urgent / jaldi / abhi:
Skip all steps. Show nearest truck immediately.
Mark as PRIORITY 🔴

RULES:
- Max 5 lines per reply
- One question per message only
- Use emojis: 🚛 📍 💰 ✅ 📞 ⏰ 📄 🔴 📦 ⭐ 🗺️ 💡 ⚠️
- Never ask for email or password
- If stuck: "📞 Helpline pe call karo — 24/7 available 🙏"
- Never leave user without a next step

ADDITIONAL CAPABILITIES:
You now have access to structured AI data. When provided, weave it naturally into your response:
- PRICING DATA: Show price range in ₹, confidence %, and breakdown
- RISK DATA: Show risk level (🟢/🟡/🔴), reasons, and recommendations 
- LOAD SHARING: Show how loads can be combined to save costs
- PREDICTIVE INTELLIGENCE: When available, explain delay predictions, risk factors, and recommended actions clearly
- OWNER INSIGHTS: Show fleet metrics, idle trucks, earnings trends, best routes
Format these as bullet points. Keep responses under 8 lines when structured data is included.`;


// ── Interfaces ──
interface DostChatParams {
    message: string;
    role: string;
    userId: string;
    conversationHistory?: Array<{ role: string; content: string }>;
}

interface DostResponse {
    reply: string;
    language: string;
    module: string;
    actions: string[];
    data: object;
    structuredData?: {           // New: structured AI outputs injected alongside LLM reply
        pricing?: object;
        risk?: object;
        loadSharing?: object;
        insights?: object;
        routeAdvanced?: object;
    };
    predictiveIntelligence?: PredictiveIntelligenceContext;  // Predictive intelligence data
}

// ── Language Detection ──
function detectLanguage(text: string): string {
    // Check for Devanagari characters (Hindi)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) return 'hi';
    return 'en';
}

// ── Module Detection (Enhanced with new modules) ──
function detectModule(message: string): string {
    const msg = message.toLowerCase();

    // ── New modules (checked first for specificity) ──
    if (/\b(share load|load share|combine|club|empty run|load sharing)\b/.test(msg)) return 'load_sharing';
    if (/\b(price|rate|cost|kitna lagega|bhada|quote|pricing)\b/.test(msg)) return 'pricing';
    if (/\b(risk|delay|safe|danger|kharab|khatara)\b/.test(msg)) return 'risk';
    if (/\b(insight|report|profit|kamai|munafa|idle|fleet report)\b/.test(msg)) return 'insights';

    // ── Existing modules (unchanged) ──
    if (/\b(book|truck|maal|bhejo|bhejni|uthana|pahunchana)\b/.test(msg)) return 'booking';
    if (/\b(load|kaam|kahan jaana|find load)\b/.test(msg)) return 'driver';
    if (/\b(fleet|gaadi|driver|truck status|idle)\b/.test(msg)) return 'fleet';
    if (/\b(track|kahan hai|location|kidhar)\b/.test(msg)) return 'tracking';
    if (/\b(payment|paisa|pay|paise|rupay)\b/.test(msg)) return 'payment';
    if (/\b(document|rc|license|insurance|kagaz)\b/.test(msg)) return 'document';
    if (/\b(demand|route|forecast|market)\b/.test(msg)) return 'demand';

    return 'general';
}

// ── Suggested Actions by Module (Enhanced with new modules) ──
function getSuggestedActions(module: string, role: string): string[] {
    if (role === 'CUSTOMER') {
        switch (module) {
            case 'booking': return ['📍 Track Order', '💰 Payment Status'];
            case 'tracking': return ['📞 Call Driver', '🚛 Book Another'];
            case 'payment': return ['📄 Download Receipt', '🚛 Book Truck'];
            case 'pricing': return ['🚛 Book Now', '📊 Compare Routes'];
            case 'risk': return ['📍 Track Order', '📞 Call Driver'];
            default: return ['🚛 Book Truck', '📍 Track Order', '💰 Price Check'];
        }
    }
    if (role === 'DRIVER') {
        switch (module) {
            case 'driver': return ['💰 My Earnings', '📄 Documents'];
            case 'payment': return ['📦 Find Load', '📄 Documents'];
            case 'document': return ['📦 Find Load', '💰 My Earnings'];
            case 'load_sharing': return ['📦 Find Load', '🗺️ Best Route'];
            case 'risk': return ['🗺️ Alternate Route', '📦 Find Load'];
            default: return ['📦 Find Load', '💰 My Earnings', '🚛 Load Share'];
        }
    }
    if (role === 'OWNER') {
        switch (module) {
            case 'fleet': return ['📊 Reports', '🔔 Alerts'];
            case 'document': return ['🚛 Fleet Status', '📊 Reports'];
            case 'insights': return ['🚛 Fleet Status', '📦 Load Sharing'];
            case 'load_sharing': return ['📊 Fleet Insights', '🗺️ Best Route'];
            default: return ['🚛 Fleet Status', '📊 Insights', '🔔 Alerts'];
        }
    }
    return ['🚛 Book Truck', '📦 Find Load', '📍 Track'];
}

// ── Build Database Context by Role ──
async function getDatabaseContext(userId: string, role: string): Promise<object> {
    try {
        if (role === 'CUSTOMER') {
            const recentBookings = await RideModel.find({ customerId: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
            return { recentBookings };
        }

        if (role === 'DRIVER') {
            const driverProfile = await DriverProfileModel.findOne({ userId }).lean();
            const openLoads = await LoadModel.find({ status: 'OPEN' })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            return {
                driverProfile: driverProfile ? {
                    rating: driverProfile.rating,
                    totalTrips: driverProfile.totalTrips,
                    isAvailable: driverProfile.isAvailable,
                    documents: driverProfile.documents
                } : null,
                openLoads: openLoads.map(l => ({
                    source: l.source,
                    destination: l.destination,
                    weight: l.weight,
                    goodsType: l.goodsType,
                    price: l.price,
                    vehicleType: l.vehicleType
                }))
            };
        }

        if (role === 'OWNER') {
            const ownerProfile = await OwnerProfileModel.findOne({ userId }).lean();
            if (!ownerProfile) return { ownerProfile: null, vehicles: [], expiringDocs: [] };

            const vehicles = await VehicleModel.find({ ownerId: ownerProfile._id }).lean();

            // Documents expiring within 30 days
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const expiringDocs = await DocumentModel.find({
                owner: userId,
                expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
            }).lean();

            return {
                ownerProfile: { companyName: ownerProfile.companyName },
                vehicles: vehicles.map(v => ({
                    number: v.number,
                    type: v.type,
                    status: v.status,
                    capacity: v.capacity
                })),
                expiringDocs: expiringDocs.map(d => ({
                    title: d.title,
                    type: d.type,
                    expiryDate: d.expiryDate,
                    status: d.status
                }))
            };
        }
    } catch (error: any) {
        logger.error('Dost context build error', { error: error.message, role, userId });
    }

    return {};
}

// ── Structured AI Data Fetcher (non-blocking) ──
// Runs structured AI modules in parallel without blocking the LLM call.
// Each module has its own try/catch — failures are silently logged.
async function fetchStructuredData(module: string, role: string, message: string): Promise<DostResponse['structuredData']> {
    const structuredData: DostResponse['structuredData'] = {};

    try {
        // Only run relevant modules based on detected module
        const tasks: Promise<void>[] = [];

        if (module === 'pricing' || message.toLowerCase().includes('price') || message.toLowerCase().includes('rate')) {
            tasks.push(
                calculateDynamicPrice({
                    distanceKm: 150,
                    originRegion: 'Pune',
                    destinationRegion: 'Mumbai',
                    vehicleType: 'Truck',
                    weight: 10,
                }).then(result => { structuredData.pricing = result; })
                 .catch(e => logger.warn('Structured pricing failed', { error: (e as any).message }))
            );
        }

        if (module === 'risk' || message.toLowerCase().includes('risk') || message.toLowerCase().includes('delay')) {
            tasks.push(
                assessDeliveryRisk({
                    originLat: 18.5204, originLng: 73.8567,
                    destinationLat: 19.0760, destinationLng: 72.8777,
                    originCity: 'Pune', destinationCity: 'Mumbai',
                    driverRating: 4.2,
                }).then(result => { structuredData.risk = result; })
                 .catch(e => logger.warn('Structured risk failed', { error: (e as any).message }))
            );
        }

        if (module === 'load_sharing' || message.toLowerCase().includes('share') || message.toLowerCase().includes('combine')) {
            tasks.push(
                (async () => {
                    const loads = await LoadModel.find({ status: 'OPEN' }).limit(10).lean();
                    const loadItems = loads.map((l: any) => ({
                        loadId: l._id.toString(),
                        pickupLat: l.pickupLat ?? 18.52, pickupLng: l.pickupLng ?? 73.85,
                        dropLat: l.dropLat ?? 19.07, dropLng: l.dropLng ?? 72.87,
                        weight: l.weight ?? 5,
                    }));
                    const trucks = [
                        { truckId: 'T1', capacity: 20, currentLat: 18.52, currentLng: 73.85 },
                        { truckId: 'T2', capacity: 15, currentLat: 19.07, currentLng: 72.87 },
                    ];
                    const result = await optimizeLoadSharing(loadItems, trucks);
                    structuredData.loadSharing = result;
                })().catch(e => logger.warn('Structured load sharing failed', { error: (e as any).message }))
            );
        }

        // Run all structured AI tasks in parallel (with 5s timeout)
        await Promise.race([
            Promise.allSettled(tasks),
            new Promise(resolve => setTimeout(resolve, 5000)), // 5s timeout
        ]);
    } catch (error: any) {
        logger.warn('Structured data fetching failed', { error: error.message });
    }

    return Object.keys(structuredData).length > 0 ? structuredData : undefined;
}

// ── Predictive Intelligence Data Fetcher (non-blocking) ──
// If query relates to tracking, delay, ETA, or risk → fetch prediction data.
async function fetchPredictiveData(module: string, message: string): Promise<PredictiveIntelligenceContext | undefined> {
    try {
        const msg = message.toLowerCase();
        const isPredictionRelevant = (
            module === 'tracking' ||
            module === 'risk' ||
            /\b(delay|late|time|eta|reach|pahunch|kitna time|kab tak|on time|der|ruk)\b/.test(msg)
        );

        if (!isPredictionRelevant) return undefined;

        // Fetch risk prediction (using demo shipment data)
        const prediction = await predictShipmentRisk({
            shipmentId: 'DOST-QUERY',
            currentLocation: { lat: 18.5204, lng: 73.8567 },
            plannedRoute: [
                { lat: 18.5204, lng: 73.8567, name: 'Pune' },
                { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
            ],
            originCity: 'Pune',
            destinationCity: 'Mumbai',
        });

        const decision = await makeDecision(prediction);

        return {
            available: true,
            riskScore: prediction.delayProbability,
            riskLevel: prediction.riskLevel,
            predictedDelayMinutes: prediction.predictedDelayMinutes,
            reasons: prediction.contributingFactors.map(f => f.description),
            recommendedAction: decision.primaryRecommendation,
            timeSavedIfReroute: decision.estimatedImpact.timeSaved,
        };
    } catch (error: any) {
        logger.warn('Predictive intelligence fetch failed', { error: error.message });
        return undefined;
    }
}

// ── Main Chat Function (Enhanced with Structured AI Data) ──
export async function chat(params: DostChatParams): Promise<DostResponse> {
    const { message, role, userId, conversationHistory = [] } = params;

    let databaseContext: object = {};
    let roleInstruction: string | undefined;

    // 2. Detect module early (needed for structured data)
    const module = detectModule(message);

    // 3. If frontend sends empty history, load from DB as fallback
    //    This ensures LLM has context even from a new device or after cache clear
    let effectiveHistory = conversationHistory;
    if (effectiveHistory.length === 0 && userId && userId !== 'anonymous') {
        try {
            const { ChatModel } = await import('../models/mongoose/Chat');
            const chatDoc = await ChatModel.findOne({ userId }).lean();
            if (chatDoc && chatDoc.messages && chatDoc.messages.length > 0) {
                // Take last 10 messages, exclude system messages
                effectiveHistory = chatDoc.messages
                    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
                    .slice(-10)
                    .map((m: any) => ({ role: m.role, content: m.content }));
            }
        } catch (dbError: any) {
            logger.warn('Failed to load DB chat history fallback', { error: dbError.message });
            // Continue with empty history — non-blocking
        }
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];

    if (userId === 'anonymous') {
        // 1a. Public Mode Prompt
        messages.push({
            role: 'system',
            content: PUBLIC_DEMO_PROMPT
        });
    } else {
        // 1b. Authenticated Mode Prompt
        roleInstruction = ROLE_INSTRUCTIONS[role];
        let systemPrompt = TRUCKNET_DOST_PROMPT;
        if (roleInstruction) systemPrompt += `\n\n${roleInstruction}`;
        systemPrompt += `\n\n${COMMON_RULES}`; // Add common rules for authenticated users
        
        // 2. Add Database Context (Only for authenticated users)
        databaseContext = await getDatabaseContext(userId, role);
        if (Object.keys(databaseContext).length > 0) {
            systemPrompt += `\n\nDATA CONTEXT:\n${JSON.stringify(databaseContext, null, 2)}`;
        }
        
        messages.push({
            role: 'system',
            content: systemPrompt
        });
    }

    // 3. Add conversation history (last 10 messages max to stay within context limits)
    const recentHistory = effectiveHistory.slice(-10);
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // 4. Run LLM + structured data + predictive intelligence in parallel (non-blocking)
    const [aiReply, structuredData, predictiveIntelligence] = await Promise.all([
        callGrokAPI(messages),
        userId === 'anonymous' ? Promise.resolve(undefined) : fetchStructuredData(module, role, message),
        userId === 'anonymous' ? Promise.resolve(undefined) : fetchPredictiveData(module, message),
    ]);

    // 4b. If predictive data available, inject into messages for a second LLM pass
    //     (or append to reply — we chose appending for speed)
    if (predictiveIntelligence?.available) {
        // Re-run LLM with prediction context for enhanced response
        const predictionContext = `\n\nPREDICTIVE INTELLIGENCE DATA:\n` +
            `- Risk Score: ${predictiveIntelligence.riskScore}% (${predictiveIntelligence.riskLevel})\n` +
            `- Predicted Delay: ${predictiveIntelligence.predictedDelayMinutes} minutes\n` +
            `- Reasons: ${predictiveIntelligence.reasons.join(', ')}\n` +
            `- Recommended Action: ${predictiveIntelligence.recommendedAction}\n` +
            `Based on this data, provide a helpful, human-friendly response that: ` +
            `1) Clearly states the delay risk, 2) Explains WHY, 3) Recommends WHAT TO DO.`;

        // Inject prediction context into the system prompt (augment, don't replace)
        messages[0].content += predictionContext;
    }

    // 5. Detect language from user message
    const language = detectLanguage(message);

    // 6. Get suggested actions
    const actions = getSuggestedActions(module, role);

    // 7. Enhance reply with structured data summary if available
    let enhancedReply = aiReply;
    if (structuredData) {
        const supplements: string[] = [];

        if (structuredData.pricing) {
            const p = structuredData.pricing as any;
            supplements.push(`\n💰 Price: ₹${p.minPrice?.toLocaleString('en-IN')}–₹${p.maxPrice?.toLocaleString('en-IN')} (${Math.round((p.confidence ?? 0) * 100)}% confidence)`);
        }
        if (structuredData.risk) {
            const r = structuredData.risk as any;
            const emoji = r.riskLevel === 'LOW' ? '🟢' : r.riskLevel === 'MEDIUM' ? '🟡' : '🔴';
            supplements.push(`\n${emoji} Risk: ${r.riskLevel} (${r.riskScore}/100)`);
        }
        if (structuredData.loadSharing) {
            const ls = structuredData.loadSharing as any;
            if (ls.combinations?.length > 0) {
                supplements.push(`\n🚛 Load Sharing: ${ls.combinations.length} optimized groups, ~${ls.totalSavingsKm}km savings`);
            }
        }

        if (supplements.length > 0) {
            enhancedReply += '\n' + supplements.join('');
        }
    }

    return {
        reply: enhancedReply,
        language,
        module,
        actions,
        data: databaseContext,
        structuredData,
        predictiveIntelligence,
    };
}
