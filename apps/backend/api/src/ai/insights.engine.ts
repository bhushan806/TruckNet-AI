// ── AI Module: Owner Profit Intelligence Engine ──
// Provides AI-driven insights to fleet owners:
//   - Idle time analysis
//   - Earnings trends
//   - Route profitability
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';

// ── Interfaces ──

export interface VehicleData {
    vehicleId: string;
    number: string;
    status: string;           // 'ACTIVE' | 'IDLE' | 'MAINTENANCE'
    lastTripDate?: Date;
    totalTrips?: number;
    totalEarnings?: number;
}

export interface TripRecord {
    tripId: string;
    vehicleId: string;
    source: string;
    destination: string;
    earnings: number;
    distanceKm: number;
    completedAt: Date;
}

export interface InsightItem {
    type: 'WARNING' | 'INFO' | 'TIP' | 'ALERT';
    title: string;
    message: string;          // Hinglish-friendly message
    metric?: string;          // e.g., "30%" or "₹15,000"
    action?: string;          // suggested action label
}

export interface OwnerInsightsResult {
    insights: InsightItem[];
    summary: string;           // one-line Hinglish summary
    metrics: {
        totalVehicles: number;
        activeVehicles: number;
        idleVehicles: number;
        idlePercentage: number;
        weeklyEarnings: number;
        topRoute: string;
        topRouteEarnings: number;
    };
}

// ── Main Function ──

/**
 * Generates AI-driven profit insights for fleet owners.
 *
 * Analyzes vehicle utilization, earnings patterns, and route profitability.
 * Returns Hinglish-friendly insights with actionable recommendations.
 *
 * Fallback: Returns generic "data insufficient" message if analysis fails.
 */
export async function generateOwnerInsights(
    vehicles: VehicleData[],
    recentTrips: TripRecord[]
): Promise<OwnerInsightsResult> {
    try {
        const insights: InsightItem[] = [];
        const now = new Date();

        // ── 1. Idle Time Analysis ──
        const idleVehicles = vehicles.filter(v => v.status === 'IDLE' || v.status === 'idle');
        const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'active');
        const idlePercentage = vehicles.length > 0
            ? Math.round((idleVehicles.length / vehicles.length) * 100)
            : 0;

        if (idleVehicles.length > 0) {
            // Check how long vehicles have been idle
            const longIdleVehicles = idleVehicles.filter(v => {
                if (!v.lastTripDate) return true; // never assigned = very idle
                const daysSinceTrip = (now.getTime() - new Date(v.lastTripDate).getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceTrip > 2;
            });

            if (longIdleVehicles.length > 0) {
                insights.push({
                    type: 'ALERT',
                    title: 'Trucks Idle Zyada Time Se 🚛',
                    message: `${longIdleVehicles.length} trucks 2+ din se khade hain. Inhe load assign karo — paisa waste ho raha hai!`,
                    metric: `${longIdleVehicles.length} trucks`,
                    action: 'Auto-Assign Loads',
                });
            } else {
                insights.push({
                    type: 'INFO',
                    title: 'Idle Trucks Available',
                    message: `${idleVehicles.length} trucks abhi free hain. Naye loads ke liye ready!`,
                    metric: `${idleVehicles.length} trucks`,
                });
            }
        }

        // ── 2. Earnings Trend Analysis ──
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const thisWeekTrips = recentTrips.filter(t =>
            new Date(t.completedAt) >= oneWeekAgo
        );
        const lastWeekTrips = recentTrips.filter(t =>
            new Date(t.completedAt) >= twoWeeksAgo && new Date(t.completedAt) < oneWeekAgo
        );

        const thisWeekEarnings = thisWeekTrips.reduce((s, t) => s + t.earnings, 0);
        const lastWeekEarnings = lastWeekTrips.reduce((s, t) => s + t.earnings, 0);

        if (lastWeekEarnings > 0) {
            const changePercent = Math.round(
                ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100
            );

            if (changePercent > 0) {
                insights.push({
                    type: 'INFO',
                    title: 'Earnings Up! 📈',
                    message: `Is hafte ki kamai ${changePercent}% zyada hai pichle hafte se. Bahut badiya! 💪`,
                    metric: `+${changePercent}%`,
                });
            } else if (changePercent < -10) {
                insights.push({
                    type: 'WARNING',
                    title: 'Earnings Down ⚠️',
                    message: `Kamai ${Math.abs(changePercent)}% kam hai pichle hafte se. Zyada loads lene ki zaroorat hai.`,
                    metric: `${changePercent}%`,
                    action: 'View Available Loads',
                });
            }
        }

        // ── 3. Route Profitability Analysis ──
        const routeEarnings: Record<string, { total: number; trips: number; avgDistance: number }> = {};

        for (const trip of recentTrips) {
            const routeKey = `${trip.source} → ${trip.destination}`;
            if (!routeEarnings[routeKey]) {
                routeEarnings[routeKey] = { total: 0, trips: 0, avgDistance: 0 };
            }
            routeEarnings[routeKey].total += trip.earnings;
            routeEarnings[routeKey].trips += 1;
            routeEarnings[routeKey].avgDistance += trip.distanceKm;
        }

        // Find most profitable route (by earnings per km)
        let topRoute = '';
        let topRouteEarnings = 0;
        let topRoutePerKm = 0;

        for (const [route, data] of Object.entries(routeEarnings)) {
            const avgDist = data.avgDistance / data.trips;
            const perKm = avgDist > 0 ? data.total / avgDist : 0;
            if (perKm > topRoutePerKm) {
                topRoutePerKm = perKm;
                topRoute = route;
                topRouteEarnings = data.total;
            }
        }

        if (topRoute) {
            insights.push({
                type: 'TIP',
                title: 'Best Route 🗺️',
                message: `"${topRoute}" sabse profitable route hai — ₹${Math.round(topRoutePerKm)}/km return de raha hai!`,
                metric: `₹${Math.round(topRoutePerKm)}/km`,
                action: 'Find Loads on This Route',
            });

            // Find least profitable route for comparison
            let worstRoute = '';
            let worstPerKm = Infinity;
            for (const [route, data] of Object.entries(routeEarnings)) {
                const avgDist = data.avgDistance / data.trips;
                const perKm = avgDist > 0 ? data.total / avgDist : 0;
                if (perKm < worstPerKm && route !== topRoute) {
                    worstPerKm = perKm;
                    worstRoute = route;
                }
            }

            if (worstRoute && topRoutePerKm > 0) {
                const improvement = Math.round(((topRoutePerKm - worstPerKm) / worstPerKm) * 100);
                if (improvement > 10) {
                    insights.push({
                        type: 'TIP',
                        title: 'Route Switch Suggestion 💡',
                        message: `"${topRoute}" route "${worstRoute}" se ${improvement}% zyada return deta hai. Wahan focus karo!`,
                        metric: `+${improvement}%`,
                    });
                }
            }
        }

        // ── 4. Fleet Utilization Tip ──
        if (idlePercentage > 40) {
            insights.push({
                type: 'WARNING',
                title: 'Fleet Utilization Low ⚠️',
                message: `${idlePercentage}% fleet idle hai. Load sharing ya market expansion pe dhyan do.`,
                metric: `${idlePercentage}% idle`,
                action: 'Explore Load Sharing',
            });
        }

        // Build summary
        const summary = insights.length > 0
            ? `📊 ${vehicles.length} vehicles, ${activeVehicles.length} active, ₹${thisWeekEarnings.toLocaleString('en-IN')} is hafte ki kamai.`
            : '📊 Fleet data abhi sufficient nahi hai insights ke liye. Thoda aur data aane do.';

        logger.info('Owner insights generated', {
            totalInsights: insights.length,
            totalVehicles: vehicles.length,
            idlePercentage,
        });

        return {
            insights,
            summary,
            metrics: {
                totalVehicles: vehicles.length,
                activeVehicles: activeVehicles.length,
                idleVehicles: idleVehicles.length,
                idlePercentage,
                weeklyEarnings: thisWeekEarnings,
                topRoute: topRoute || 'N/A',
                topRouteEarnings,
            },
        };
    } catch (error: any) {
        logger.error('Owner insights generation failed', { error: error.message });
        return {
            insights: [{
                type: 'INFO',
                title: 'Insights Unavailable',
                message: 'Abhi insights generate nahi ho pa rahe. Thodi der baad try karo. 🙏',
            }],
            summary: 'Insights abhi available nahi hain.',
            metrics: {
                totalVehicles: 0,
                activeVehicles: 0,
                idleVehicles: 0,
                idlePercentage: 0,
                weeklyEarnings: 0,
                topRoute: 'N/A',
                topRouteEarnings: 0,
            },
        };
    }
}
