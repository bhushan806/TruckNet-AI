from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import math
import random
from datetime import datetime

app = FastAPI(title="TruckNet AI Engine", version="1.0.0")

# --- Data Models ---

class Location(BaseModel):
    lat: float
    lng: float

class LoadRequest(BaseModel):
    load_id: str
    origin: Location
    destination: Location
    weight: float
    goods_type: str

class Driver(BaseModel):
    driver_id: str
    location: Location
    rating: float
    vehicle_type: str
    is_available: bool

class MatchResponse(BaseModel):
    driver_id: str
    score: float
    distance_km: float

class PriceRequest(BaseModel):
    distance_km: float
    weight: float
    vehicle_type: str
    origin_city: str

class PriceResponse(BaseModel):
    total_price: float
    base_fare: float
    surge_multiplier: float
    breakdown: dict

# --- Core Logic ---

def calculate_distance(loc1: Location, loc2: Location) -> float:
    # Haversine formula for distance
    R = 6371  # Earth radius in km
    dlat = math.radians(loc2.lat - loc1.lat)
    dlon = math.radians(loc2.lng - loc1.lng)
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(loc1.lat)) * math.cos(math.radians(loc2.lat)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# --- Core Engines ---
from matching import MatchingEngine
from routing import RouteOptimizer

matching_engine = MatchingEngine()
route_optimizer = RouteOptimizer()

# --- Endpoints ---

# --- Endpoint Classes Update ---
# --- Endpoint Classes Update ---
class EtaRequest(BaseModel):
    base_time: float # in minutes
    weather_condition: str # Rain, Storm, Clear
    vehicle_type: str # Heavy Truck, etc.

class EtaResponse(BaseModel):
    adjusted_eta: float
    base_time: float
    adjustment_factor: float
    details: str

class SosRequest(BaseModel):
    lat: float
    lng: float

class SosResponse(BaseModel):
    alert: str
    nearest_hospital: dict
    nearest_police: dict

class InsightsRequest(BaseModel):
    role: str # DRIVER, OWNER, CUSTOMER
    user_id: str
    context: dict = {} # Flexible context: {current_location, load_details, truck_stats...}

class InsightsResponse(BaseModel):
    summary: str
    top_recommendations: List[dict]
    insights: List[dict]
    confidence_score: float
    explanation: str

# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "TruckNet AI Engine"}

@app.post("/get-insights", response_model=InsightsResponse)
def get_ai_insights(req: InsightsRequest):
    """
    Unified AI Endpoint for TruckNet.
    Dynamically returns insights based on User Role.
    """
    role = req.role.upper()
    context = req.context
    
    response = InsightsResponse(
        summary="No insights available.",
        top_recommendations=[],
        insights=[],
        confidence_score=0.0,
        explanation="Could not determine user role or context."
    )

    if role == "DRIVER":
        # 1. Route Optimization Insight (Efficiency Boost)
        current_loc = context.get("current_location", "Mumbai") # e.g. {lat: x, lng: y} or "City"
        dest_loc = context.get("destination", "Pune")
        
        # Determine strict city names for the mock router if objects passed
        start_city = "Mumbai"
        end_city = "Pune"
        if isinstance(current_loc, dict):
             # Simple mock reverse geocode or default
             start_city = "Mumbai" 
        elif isinstance(current_loc, str):
             start_city = current_loc

        if isinstance(dest_loc, dict): 
             end_city = "Pune"
        elif isinstance(dest_loc, str):
             end_city = dest_loc

        route_res = route_optimizer.calculate_optimal_route(start_city, end_city)
        
        if "error" not in route_res:
            rec = {
                "type": "ROUTE",
                "title": "Efficiency Boost Available",
                "description": f"Vehicle is taking a longer route. Switch to {route_res['route'][1]} to save 45 mins and ₹300 fuel.",
                "data": route_res,
                "action_label": "Apply New Route"
            }
            response.top_recommendations.append(rec)
            response.summary = "Efficiency Boost Available"
            response.confidence_score = 0.95
        
        # 2. Maintenance Alert (Based on total trips or random for demo if data limited)
        total_trips = context.get("total_trips", 0)
        # In real logic, we'd check last_service_km vs current_km
        if total_trips > 50: 
             response.insights.append({
                 "type": "WARNING",
                 "title": "Maintenance Alert",
                 "text": "Brake servicing recommended. Vehicle has covered high mileage.",
                 "action_label": "Schedule Service"
             })
        
        # 3. Earnings Insight
        earnings = context.get("current_earnings", 0)
        if earnings < 5000:
             response.insights.append({
                 "type": "INFO",
                 "title": "Revenue Opportunity",
                 "text": "Your earnings are below target. Check 'Nearby Loads' to reduce empty runs."
             })

    elif role == "OWNER":
        # 1. Fleet Utilization
        idle_trucks = context.get("idle_truck_count", 0)
        maintenance_trucks = context.get("maintenance_count", 0)
        
        if idle_trucks > 0:
            rec = {
                "type": "ACTION",
                "title": "Revenue Opportunity",
                "description": f"High demand detected in Pune Industrial Area. Relocating {idle_trucks} idle trucks there could increase daily revenue by 15%.",
                "action_label": "Auto-Assign Loads"
            }
            response.top_recommendations.append(rec)
            response.summary = f"{idle_trucks} Trucks are currently idle."
            response.confidence_score = 0.88
            
        if maintenance_trucks > 0:
             response.insights.append({
                 "type": "WARNING",
                 "title": "Fleet Health Alert",
                 "text": f"{maintenance_trucks} vehicles require immediate maintenance attention."
             })

        # 2. Market Insight
        response.insights.append({
            "type": "INFO",
            "title": "Market Trends",
            "text": "Freight rates in Mumbai -> Delhi sector up by 12%."
        })

    elif role == "CUSTOMER":
        # 1. Delivery Prediction
        active_shipments = context.get("active_shipments", 0)
        latest_status = context.get("latest_shipment_status", "UNKNOWN")
        
        if active_shipments > 0:
            rec = {
                "type": "STATUS",
                "title": f"Shipment #{random.randint(1000,9999)} Update",
                "description": f"Your shipment is currently {latest_status}. Expected arrival: Today 6:30 PM.",
                "data": {"eta": "18:30", "status": latest_status},
                "action_label": "Track Live"
            }
            response.top_recommendations.append(rec)
            response.summary = "Shipments on track."
            response.confidence_score = 0.92
        else:
             response.summary = "No active shipments."
             response.insights.append({
                 "type": "INFO",
                 "title": "Booking Tip",
                 "text": "Truck availability is high. Book now for best rates."
             })

    response.explanation = f"Generated insights based on {role} profile and real-time context."
    
    return response

@app.post("/match", response_model=List[MatchResponse])
def smart_matching(load: LoadRequest, available_drivers: List[Driver]):
    """
    Feature 2: Truck Owner AI (Smart Load Matching)
    """
    # Convert Pydantic models to dicts
    load_dict = load.model_dump()
    load_dict["destination_city"] = "Pune" # Mocking
    
    drivers_dict = [d.model_dump() for d in available_drivers]
    
    # Run Engine
    results = matching_engine.match_driver_to_load(load_dict, drivers_dict)
    
    # Convert back to Response Model
    response = []
    for r in results:
        response.append(MatchResponse(
            driver_id=r["driver_id"],
            score=r["total_score"],
            distance_km=r["details"]["distance_km"]
        ))
        
    return response

@app.post("/predict-eta", response_model=EtaResponse)
def calculate_smart_eta(req: EtaRequest):
    """
    Feature 1: Customer AI (Predictive ETA)
    """
    base = req.base_time
    multiplier = 1.0
    reason = []

    if req.weather_condition.lower() == "rain":
        multiplier += 0.15
        reason.append("Weather (Rain) +15%")
    elif req.weather_condition.lower() == "storm":
        multiplier += 0.40
        reason.append("Weather (Storm) +40%")
        
    if req.vehicle_type.lower() == "heavy truck":
        multiplier += 0.10
        reason.append("Vehicle (Heavy Truck) +10%")
        
    adjusted = base * multiplier
    
    return EtaResponse(
        adjusted_eta=round(adjusted, 0),
        base_time=base,
        adjustment_factor=multiplier,
        details=", ".join(reason) if reason else "Standard Conditions"
    )

@app.post("/trigger-sos", response_model=SosResponse)
def trigger_smart_sos(req: SosRequest):
    """
    Feature 3: Driver AI (Smart SOS & Safety)
    """
    # Mock nearest locations
    hospital_dist = 2.0
    police_dist = 3.0
    
    hospital_name = "City General Hospital"
    police_station = "Central Police Station"
    
    alert_msg = f"SOS at [{req.lat}, {req.lng}]. Nearest Hospital: {hospital_name} ({hospital_dist}km away). Nearest Police: {police_station} ({police_dist}km away)."
    
    return SosResponse(
        alert=alert_msg,
        nearest_hospital={"name": hospital_name, "distance": hospital_dist},
        nearest_police={"name": police_station, "distance": police_dist}
    )

@app.post("/predict-price", response_model=PriceResponse)
def dynamic_pricing(req: PriceRequest):
    """
    Module 3: Dynamic Pricing Engine (Existing)
    """
    base_rates = {"Mumbai": 20, "Delhi": 18, "Bangalore": 22, "Pune": 19}
    base_rate_per_km = base_rates.get(req.origin_city, 20)
    base_fare = base_rate_per_km * req.distance_km
    
    current_hour = datetime.now().hour
    surge = 1.0
    if 8 <= current_hour <= 11 or 17 <= current_hour <= 21:
        surge += 0.5
    
    total_price = (base_fare * surge) * (1.2 if req.weight > 5 else 1.0)
    
    return PriceResponse(
        total_price=round(total_price, 2),
        base_fare=round(base_fare, 2),
        surge_multiplier=round(surge, 2),
        breakdown={"rate": base_rate_per_km, "dist": req.distance_km}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
