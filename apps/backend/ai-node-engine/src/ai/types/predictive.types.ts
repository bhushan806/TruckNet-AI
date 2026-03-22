// ── Predictive Intelligence: Shared TypeScript Interfaces ──
// Used across all 7 predictive modules for consistent data contracts.

// ── Module 1: Risk Prediction ──

export interface RiskPredictionInput {
    shipmentId: string;
    currentLocation: { lat: number; lng: number };
    plannedRoute: Array<{ lat: number; lng: number; name?: string }>;
    originCity?: string;
    destinationCity?: string;
    timeOfDay?: 'peak' | 'off-peak';
    trafficData?: 'clear' | 'moderate' | 'heavy';
    weatherData?: 'clear' | 'rain' | 'fog' | 'storm';
    driverRating?: number;
    goodsType?: string;
}

export interface ContributingFactor {
    factor: string;
    impact: number;       // percentage points added
    description: string;
}

export interface RiskPredictionResult {
    shipmentId: string;
    delayProbability: number;           // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    predictedDelayMinutes: number;
    contributingFactors: ContributingFactor[];
    timestamp: string;
    confidence: number;                 // 0-1
}

// ── Module 2: Decision Engine ──

export interface AlternateRoute {
    routeId: string;
    description: string;
    timeSaved: number;        // minutes
    fuelSaved: number;        // INR
    newRiskScore: number;     // 0-100
}

export interface DecisionResult {
    shipmentId: string;
    action: 'CONTINUE' | 'SUGGEST_CAUTION' | 'SUGGEST_REROUTE' | 'FORCE_REROUTE' | 'ESCALATE';
    primaryRecommendation: string;
    alternateRoutes?: AlternateRoute[];
    estimatedImpact: {
        timeSaved: number;
        delayAvoided: boolean;
    };
    requiresApproval: boolean;
}

// ── Module 3: Alert Engine ──

export type AlertType = 'RISK_HIGH' | 'REROUTE_SUGGESTED' | 'DELAY_CRITICAL' | 'NETWORK_CONGESTION';

export interface AlertRecord {
    alertId: string;
    shipmentId: string;
    userId: string;
    type: AlertType;
    title: string;
    message: string;
    actionRequired: boolean;
    suggestedAction: string;
    timestamp: string;
    read: boolean;
    acknowledged: boolean;
    escalated: boolean;
    escalationCount: number;
}

// ── Module 4: Network Intelligence ──

export interface RegionDefinition {
    regionId: string;
    regionName: string;
    center: { lat: number; lng: number };
    radiusKm: number;
    cities: string[];
}

export interface NetworkRegionStatus {
    regionId: string;
    regionName: string;
    center: { lat: number; lng: number };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    activeShipments: number;
    highRiskShipments: number;
    primaryFactors: string[];
    recommendation: string;
    timestamp: string;
}

// ── Module 5: Risk Heatmap ──

export interface HeatmapZone {
    zoneId: string;
    zoneName: string;
    center: { lat: number; lng: number };
    radius: number;            // meters
    riskLevel: 'GREEN' | 'YELLOW' | 'RED';
    riskScore: number;
    affectedShipments: number;
    primaryCause: string;
    recommendations: string[];
}

export interface HeatmapData {
    timestamp: string;
    zones: HeatmapZone[];
}

// ── Module 6: Monitoring ──

export interface MonitoringCycleResult {
    cycleId: number;
    shipmentsProcessed: number;
    alertsGenerated: number;
    errors: number;
    durationMs: number;
    timestamp: string;
}

// ── Module 7: Dost Enhancement ──

export interface PredictiveIntelligenceContext {
    available: boolean;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    predictedDelayMinutes: number;
    reasons: string[];
    recommendedAction: string;
    timeSavedIfReroute: number;
}
