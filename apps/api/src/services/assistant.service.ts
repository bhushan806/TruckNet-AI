import { env } from '../config/env';
import { logger } from '../utils/logger';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { LoadModel } from '../models/mongoose/Load';
import axios from 'axios';
import { MatchService } from './match.service';
import { RoadsideService } from './roadside.service';
import { callGrokAPI } from './aiService';
import { chat as dostChat } from './dost.service';

// ── New AI Module Imports ──
import { optimizeLoadSharing, type LoadItem, type TruckSlot } from '../ai/loadSharing.engine';
import { calculateDynamicPrice } from '../ai/pricing.engine';
import { generateOwnerInsights, type VehicleData, type TripRecord } from '../ai/insights.engine';
import { assessDeliveryRisk } from '../ai/risk.engine';
import { optimizeRouteAdvanced } from '../ai/routeOptimizer';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { RideModel } from '../models/mongoose/Ride';

const matchService = new MatchService();
const roadsideService = new RoadsideService();

export class AssistantService {
    async processCommand(userId: string, message: string) {
        const intent = this.detectIntent(message);
        let response = "I'm sorry, I didn't understand that. You can ask me to find loads, track vehicles, or report a breakdown.";
        let data = null;
        let action = null;

        try {
            switch (intent) {
                case 'FIND_LOADS':
                    try {
                        const mockLoad = {
                            load_id: "L123",
                            origin: { lat: 18.5204, lng: 73.8567 },
                            destination: { lat: 19.0760, lng: 72.8777 },
                            weight: 10.5,
                            goods_type: "Electronics"
                        };

                        const mockDrivers = [
                            { driver_id: "D1", location: { lat: 18.5200, lng: 73.8500 }, rating: 4.8, vehicle_type: "Truck", is_available: true },
                            { driver_id: "D2", location: { lat: 18.6000, lng: 73.8000 }, rating: 4.5, vehicle_type: "Truck", is_available: true },
                        ];

                        const aiResponse = await axios.post(`${env.AI_ENGINE_URL}/match`, {
                            load: mockLoad,
                            available_drivers: mockDrivers
                        });

                        const matches = aiResponse.data;
                        response = `I found ${matches.length} smart matches for your load! Top match score: ${matches[0]?.score}`;
                        data = matches;
                        action = 'SHOW_LOADS';
                    } catch (e) {
                        logger.error('AI Engine unavailable for smart matching', { error: (e as any).message });
                        // Fallback to local DB
                        const loads = await LoadModel.find({ status: 'OPEN' }).limit(5).lean();
                        response = `AI Engine is offline, but I found ${loads.length} available loads from the database.`;
                        data = loads;
                        action = 'SHOW_LOADS';
                    }
                    break;

                case 'PRICE_CHECK':
                    try {
                        // ── Enhanced: Use Smart Dynamic Pricing Engine ──
                        const originCity = message.includes('Mumbai') ? 'Mumbai' :
                                          message.includes('Delhi') ? 'Delhi' :
                                          message.includes('Bangalore') ? 'Bangalore' : 'Pune';
                        const destCity = message.includes('Pune') ? 'Pune' :
                                        message.includes('Mumbai') && originCity !== 'Mumbai' ? 'Mumbai' :
                                        message.includes('Delhi') && originCity !== 'Delhi' ? 'Delhi' : 'Mumbai';

                        const pricingResult = await calculateDynamicPrice({
                            distanceKm: 150,
                            originRegion: originCity,
                            destinationRegion: destCity,
                            vehicleType: 'Truck',
                            weight: 10,
                        });

                        response = `💰 Price Estimate: ₹${pricingResult.minPrice.toLocaleString('en-IN')}–₹${pricingResult.maxPrice.toLocaleString('en-IN')}\n` +
                            `📊 Confidence: ${Math.round(pricingResult.confidence * 100)}%\n` +
                            `📝 ${pricingResult.reasoning}`;
                        data = pricingResult;
                        action = 'SHOW_PRICE';
                    } catch (e) {
                        logger.error('Dynamic pricing failed', { error: (e as any).message });
                        response = "I couldn't calculate the dynamic price right now.";
                    }
                    break;

                case 'TRACK_VEHICLE':
                    // Use Mongoose to find vehicles
                    const driverProfile = await DriverProfileModel.findOne({ userId });
                    if (driverProfile) {
                        const vehicles = await VehicleModel.find({ driverId: driverProfile._id }).lean();
                        if (vehicles.length > 0) {
                            response = `Your vehicle ${vehicles[0].number} is currently tracked.`;
                            data = vehicles;
                            action = 'SHOW_MAP';
                        } else {
                            response = "You don't have any vehicles assigned.";
                        }
                    } else {
                        response = "No driver profile found.";
                    }
                    break;

                case 'ROADSIDE_HELP':
                    response = "I'm starting the roadside assistance protocol. Please describe your issue.";
                    action = 'NAVIGATE_ROADSIDE';
                    break;

                case 'OPTIMIZE_ROUTE':
                    try {
                        // ── Enhanced: Use Advanced Route Intelligence ──
                        const routeResult = await optimizeRouteAdvanced(
                            { lat: 18.5204, lng: 73.8567, name: 'Pune' },
                            { lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
                        );

                        const fastest = routeResult.options.find(o => o.label === 'Fastest');
                        const cheapest = routeResult.options.find(o => o.label === 'Cheapest');
                        const balanced = routeResult.options.find(o => o.label === 'Balanced');

                        response = `🗺️ Route Options:\n\n` +
                            `⚡ Fastest: ${fastest?.distanceKm}km, ~${Math.round((fastest?.estimatedTimeMinutes ?? 0) / 60)}h, ₹${fastest?.totalCost} (Toll: ₹${fastest?.tollEstimate})\n` +
                            `💰 Cheapest: ${cheapest?.distanceKm}km, ~${Math.round((cheapest?.estimatedTimeMinutes ?? 0) / 60)}h, ₹${cheapest?.totalCost} (No toll)\n` +
                            `⚖️ Balanced: ${balanced?.distanceKm}km, ~${Math.round((balanced?.estimatedTimeMinutes ?? 0) / 60)}h, ₹${balanced?.totalCost}\n\n` +
                            `✅ ${routeResult.recommendation}`;
                        data = routeResult;
                        action = 'SHOW_ROUTE';
                    } catch (e) {
                        logger.error('Advanced route optimization failed', { error: (e as any).message });
                        // Fallback to basic response
                        response = "I've analyzed the route. Here is the optimized route for your delivery.";
                        data = {
                            route: [
                                { lat: 18.5204, lng: 73.8567, name: 'Pune' },
                                { lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
                            ],
                            savings: '15 mins',
                            distance: '148 km'
                        };
                        action = 'SHOW_ROUTE';
                    }
                    break;

                // ── New Intent: Load Sharing ──
                case 'SHARE_LOAD':
                    try {
                        // Fetch open loads from DB for load sharing
                        const openLoads = await LoadModel.find({ status: 'OPEN' }).limit(20).lean();
                        const loadItems: LoadItem[] = openLoads.map((l: any) => ({
                            loadId: l._id.toString(),
                            pickupLat: l.pickupLat ?? 18.5204,
                            pickupLng: l.pickupLng ?? 73.8567,
                            dropLat: l.dropLat ?? 19.0760,
                            dropLng: l.dropLng ?? 72.8777,
                            weight: l.weight ?? 5,
                            pickupCity: l.source,
                            dropCity: l.destination,
                        }));

                        // Mock truck slots (in production, fetch from VehicleModel)
                        const truckSlots: TruckSlot[] = [
                            { truckId: 'T1', capacity: 20, currentLat: 18.52, currentLng: 73.85 },
                            { truckId: 'T2', capacity: 15, currentLat: 19.07, currentLng: 72.87 },
                            { truckId: 'T3', capacity: 25, currentLat: 18.55, currentLng: 73.90 },
                        ];

                        const sharingResult = await optimizeLoadSharing(loadItems, truckSlots);

                        if (sharingResult.combinations.length > 0) {
                            const combo = sharingResult.combinations[0];
                            response = `🚛 Load Sharing Optimization:\n\n` +
                                `✅ ${sharingResult.combinations.length} optimized groups found!\n` +
                                `📦 Top group: ${combo.loads.length} loads combined → Truck ${combo.truckId}\n` +
                                `⚖️ Capacity used: ${combo.capacityUsed}%\n` +
                                `💰 Savings: ~${sharingResult.totalSavingsKm} km saved\n` +
                                `📊 Route similarity: ${Math.round(combo.routeSimilarityScore * 100)}%`;
                        } else {
                            response = '📦 Abhi load sharing ke liye suitable combinations nahi mili. Individual loads check karo.';
                        }
                        data = sharingResult;
                        action = 'SHOW_LOAD_SHARING';
                    } catch (e) {
                        logger.error('Load sharing failed', { error: (e as any).message });
                        const fallbackLoads = await LoadModel.find({ status: 'OPEN' }).limit(5).lean();
                        response = `Load sharing AI unavailable. Here are ${fallbackLoads.length} available loads.`;
                        data = fallbackLoads;
                        action = 'SHOW_LOADS';
                    }
                    break;

                // ── New Intent: Owner Insights ──
                case 'OWNER_INSIGHTS':
                    try {
                        const ownerProfile = await OwnerProfileModel.findOne({ userId }).lean();
                        if (!ownerProfile) {
                            response = '⚠️ Owner profile nahi mila. Pehle profile setup karo.';
                            break;
                        }

                        const vehicles = await VehicleModel.find({ ownerId: ownerProfile._id }).lean();
                        const vehicleData: VehicleData[] = vehicles.map((v: any) => ({
                            vehicleId: v._id.toString(),
                            number: v.number,
                            status: v.status || 'IDLE',
                            lastTripDate: v.updatedAt,
                            totalTrips: 0,
                            totalEarnings: 0,
                        }));

                        // Fetch recent completed rides for trip data
                        const recentRides = await RideModel.find({
                            ownerId: ownerProfile._id,
                        }).sort({ createdAt: -1 }).limit(50).lean();

                        const tripRecords: TripRecord[] = recentRides.map((r: any) => ({
                            tripId: r._id.toString(),
                            vehicleId: r.vehicleId?.toString() || '',
                            source: r.pickupLocation || 'Unknown',
                            destination: r.dropLocation || 'Unknown',
                            earnings: r.fare || 0,
                            distanceKm: r.distance || 100,
                            completedAt: r.completedAt || r.createdAt || new Date(),
                        }));

                        const insightsResult = await generateOwnerInsights(vehicleData, tripRecords);

                        response = `📊 Fleet Intelligence:\n\n${insightsResult.summary}\n\n`;
                        for (const insight of insightsResult.insights.slice(0, 3)) {
                            response += `${insight.type === 'ALERT' ? '🔴' : insight.type === 'WARNING' ? '⚠️' : insight.type === 'TIP' ? '💡' : 'ℹ️'} ${insight.title}\n${insight.message}\n\n`;
                        }

                        data = insightsResult;
                        action = 'SHOW_INSIGHTS';
                    } catch (e) {
                        logger.error('Owner insights failed', { error: (e as any).message });
                        response = '📊 Insights abhi generate nahi ho rahe. Thodi der baad try karo. 🙏';
                    }
                    break;

                // ── New Intent: Risk Check ──
                case 'RISK_CHECK':
                    try {
                        const riskResult = await assessDeliveryRisk({
                            originLat: 18.5204,
                            originLng: 73.8567,
                            destinationLat: 19.0760,
                            destinationLng: 72.8777,
                            originCity: 'Pune',
                            destinationCity: 'Mumbai',
                            driverRating: 4.2,
                            driverTotalTrips: 50,
                            goodsType: 'General',
                        });

                        const riskEmoji = riskResult.riskLevel === 'LOW' ? '🟢' :
                                         riskResult.riskLevel === 'MEDIUM' ? '🟡' : '🔴';

                        response = `⚠️ Risk Assessment:\n\n` +
                            `${riskEmoji} Risk Level: ${riskResult.riskLevel} (Score: ${riskResult.riskScore}/100)\n` +
                            `📊 Delay Probability: ${Math.round(riskResult.delayProbability * 100)}%\n` +
                            `⏰ Estimated Delay: ~${riskResult.estimatedDelayMinutes} mins\n\n` +
                            `📝 Reasons:\n${riskResult.reasons.map(r => `  • ${r}`).join('\n')}\n\n` +
                            `💡 Recommendations:\n${riskResult.recommendations.map(r => `  • ${r}`).join('\n')}`;

                        data = riskResult;
                        action = 'SHOW_RISK';
                    } catch (e) {
                        logger.error('Risk assessment failed', { error: (e as any).message });
                        response = '⚠️ Risk assessment abhi available nahi hai. Standard precautions follow karo. 🙏';
                    }
                    break;

                case 'GREETING':
                    response = "Hello! I'm your TruckNet AI Assistant. How can I help you today?";
                    action = null;
                    break;
            }
        } catch (error) {
            logger.error('AI processing error', { error: (error as any).message });
            response = "I encountered an error while processing your request.";
        }

        return {
            message: response,
            data,
            action
        };
    }

    private detectIntent(message: string): string {
        const msg = message.toLowerCase();

        // ── New intents (checked first for specificity) ──
        if (msg.includes('share load') || msg.includes('load share') || msg.includes('combine load') || msg.includes('load sharing') || msg.includes('empty run')) return 'SHARE_LOAD';
        if (msg.includes('insight') || msg.includes('fleet report') || msg.includes('profit') || msg.includes('idle truck') || msg.includes('kamai') || msg.includes('munafa')) return 'OWNER_INSIGHTS';
        if (msg.includes('risk') || msg.includes('delay') || msg.includes('safe') || msg.includes('danger') || msg.includes('khatara') || msg.includes('kharab')) return 'RISK_CHECK';

        // ── Existing intents (unchanged) ──
        if (msg.includes('load') || msg.includes('job') || msg.includes('freight')) return 'FIND_LOADS';
        if (msg.includes('where') || msg.includes('track') || msg.includes('location')) return 'TRACK_VEHICLE';
        if (msg.includes('help') || msg.includes('breakdown') || msg.includes('emergency') || msg.includes('sos')) return 'ROADSIDE_HELP';
        if (msg.includes('route') || msg.includes('optimize') || msg.includes('direction') || msg.includes('traffic')) return 'OPTIMIZE_ROUTE';
        if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('quote')) return 'PRICE_CHECK';
        if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) return 'GREETING';

        return 'UNKNOWN';
    }

    async askAI(message: string, role: string, userId: string = 'anonymous') {
        try {
            // Route through Dost AI brain for full-featured response
            const dostResponse = await dostChat({ message, role, userId });
            return dostResponse;
        } catch (error: any) {
            // SECURITY: Log error internally, never expose raw error message to user
            logger.error('Dost AI error in askAI', { error: error.message });
            return {
                reply: "TruckNet Dost abhi available nahi hai.\nThodi der baad try karo. 🙏",
                language: 'hi',
                module: 'general',
                actions: [],
                data: {}
            };
        }
    }
}
