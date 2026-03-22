// ── AI Module Index ──
// Central export point for all AI modules.
// Routes call Services → Services call AI modules.

export { optimizeRoute } from './routeOptimizer';
export type { RoutePoint, OptimizedRoute } from './routeOptimizer';

export { predictDemand } from './demandPrediction';
export type { DemandContext, DemandPrediction } from './demandPrediction';

export { assessFraudRisk } from './fraudDetection';
export type { TransactionSignal, FraudAssessment } from './fraudDetection';

// ── New AI Modules ──

export { optimizeRouteAdvanced } from './routeOptimizer';
export type { AdvancedRouteOption, AdvancedRouteResult } from './routeOptimizer';

export { optimizeLoadSharing } from './loadSharing.engine';
export type { LoadItem, TruckSlot, LoadGroup, LoadSharingResult } from './loadSharing.engine';

export { calculateDynamicPrice } from './pricing.engine';
export type { PricingInput, PricingResult } from './pricing.engine';

export { generateOwnerInsights } from './insights.engine';
export type { VehicleData, TripRecord, InsightItem, OwnerInsightsResult } from './insights.engine';

export { assessDeliveryRisk } from './risk.engine';
export type { RiskInput, RiskResult } from './risk.engine';

// ── Predictive Intelligence Modules ──

export { predictShipmentRisk } from './riskPrediction.service';
export { makeDecision } from './decisionEngine.service';
export { createAlert, getAlertsByUser, acknowledgeAlert, escalateUnacknowledgedAlerts } from './alertEngine.service';
export { analyzeNetworkPatterns, getRegionDefinitions } from './networkIntelligence.service';
export { generateHeatmap, getCachedHeatmap } from './heatmap.service';
export { monitoringService } from './monitoring.service';
