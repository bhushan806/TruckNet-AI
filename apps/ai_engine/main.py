"""
TruckNet AI Engine — FastAPI
Fixes applied:
  - FIX 2:  CORS typo corrected + env-driven allow-list
  - FIX 3:  Conversation history injected into HuggingFace messages array
  - FIX 12: Structured logging + granular exception handling (no more catch-all)
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
import random
import os
import base64
import json
import logging
import traceback
import requests
from datetime import datetime

# ── Structured Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("trucknet_ai")

# ── App Init ──
app = FastAPI(title="TruckNet AI Engine", version="2.0.0")

# ── FIX 2: CORS — env-driven, typo-free ──
# Reads from CORS_ORIGIN env var (comma-separated list).
# Falls back to correct URLs — NOTE: 'trucknet' not 'rucknet' (typo is now removed).
_raw_cors = os.environ.get("CORS_ORIGIN", "")
_cors_origins = [o.strip() for o in _raw_cors.split(",") if o.strip()]

if not _cors_origins:
    _cors_origins = [
        "https://trucknet-frontend.vercel.app",
        "https://truck-net-ai-web.vercel.app",
        "https://trucknet-prod.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
    ]

logger.info(f"CORS allow-list: {_cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data Models ──

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

class EtaRequest(BaseModel):
    base_time: float          # in minutes
    weather_condition: str    # Rain, Storm, Clear
    vehicle_type: str         # Heavy Truck, etc.

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
    role: str           # DRIVER, OWNER, CUSTOMER
    user_id: str
    context: dict = {}  # Flexible context

class InsightsResponse(BaseModel):
    summary: str
    top_recommendations: List[dict]
    insights: List[dict]
    confidence_score: float
    explanation: str

# ── FIX 3: Updated Chat Request Model — accepts conversation history ──
class ChatRequest(BaseModel):
    message: str
    conversationHistory: List[dict] = []   # [{role: 'user'|'assistant', content: str}]
    language: str = "hinglish"

# ── Core Logic ──

def calculate_distance(loc1: Location, loc2: Location) -> float:
    """Haversine formula for great-circle distance in km."""
    R = 6371
    dlat = math.radians(loc2.lat - loc1.lat)
    dlon = math.radians(loc2.lng - loc1.lng)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(loc1.lat)) * math.cos(math.radians(loc2.lat)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ── Core AI Sub-engines ──
from matching import MatchingEngine
from routing import RouteOptimizer

matching_engine = MatchingEngine()
route_optimizer = RouteOptimizer()

# ── Health Endpoints ──

@app.get("/")
def root_check():
    return {"status": "healthy", "service": "TruckNet AI Engine", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "TruckNet AI Engine",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

# ── AI Insights ──

@app.post("/get-insights", response_model=InsightsResponse)
def get_ai_insights(req: InsightsRequest):
    role = req.role.upper()
    context = req.context

    response = InsightsResponse(
        summary="No insights available.",
        top_recommendations=[],
        insights=[],
        confidence_score=0.0,
        explanation="Could not determine user role or context.",
    )

    if role == "DRIVER":
        current_loc = context.get("current_location", "Mumbai")
        dest_loc = context.get("destination", "Pune")
        start_city = current_loc if isinstance(current_loc, str) else "Mumbai"
        end_city = dest_loc if isinstance(dest_loc, str) else "Pune"

        route_res = route_optimizer.calculate_optimal_route(start_city, end_city)
        if "error" not in route_res:
            rec = {
                "type": "ROUTE",
                "title": "Efficiency Boost Available",
                "description": (
                    f"Vehicle is taking a longer route. Switch to "
                    f"{route_res['route'][1]} to save 45 mins and ₹300 fuel."
                ),
                "data": route_res,
                "action_label": "Apply New Route",
            }
            response.top_recommendations.append(rec)
            response.summary = "Efficiency Boost Available"
            response.confidence_score = 0.95

        total_trips = context.get("total_trips", 0)
        if total_trips > 50:
            response.insights.append({
                "type": "WARNING",
                "title": "Maintenance Alert",
                "text": "Brake servicing recommended. Vehicle has covered high mileage.",
                "action_label": "Schedule Service",
            })

        earnings = context.get("current_earnings", 0)
        if earnings < 5000:
            response.insights.append({
                "type": "INFO",
                "title": "Revenue Opportunity",
                "text": "Your earnings are below target. Check 'Nearby Loads' to reduce empty runs.",
            })

    elif role == "OWNER":
        idle_trucks = context.get("idle_truck_count", 0)
        maintenance_trucks = context.get("maintenance_count", 0)

        if idle_trucks > 0:
            response.top_recommendations.append({
                "type": "ACTION",
                "title": "Revenue Opportunity",
                "description": (
                    f"High demand detected in Pune Industrial Area. "
                    f"Relocating {idle_trucks} idle trucks there could increase daily revenue by 15%."
                ),
                "action_label": "Auto-Assign Loads",
            })
            response.summary = f"{idle_trucks} Trucks are currently idle."
            response.confidence_score = 0.88

        if maintenance_trucks > 0:
            response.insights.append({
                "type": "WARNING",
                "title": "Fleet Health Alert",
                "text": f"{maintenance_trucks} vehicles require immediate maintenance attention.",
            })

        response.insights.append({
            "type": "INFO",
            "title": "Market Trends",
            "text": "Freight rates in Mumbai → Delhi sector up by 12%.",
        })

    elif role == "CUSTOMER":
        active_shipments = context.get("active_shipments", 0)
        latest_status = context.get("latest_shipment_status", "UNKNOWN")

        if active_shipments > 0:
            response.top_recommendations.append({
                "type": "STATUS",
                "title": f"Shipment #{random.randint(1000, 9999)} Update",
                "description": (
                    f"Your shipment is currently {latest_status}. "
                    f"Expected arrival: Today 6:30 PM."
                ),
                "data": {"eta": "18:30", "status": latest_status},
                "action_label": "Track Live",
            })
            response.summary = "Shipments on track."
            response.confidence_score = 0.92
        else:
            response.summary = "No active shipments."
            response.insights.append({
                "type": "INFO",
                "title": "Booking Tip",
                "text": "Truck availability is high. Book now for best rates.",
            })

    response.explanation = f"Generated insights based on {role} profile and real-time context."
    return response

# ── Smart Matching ──

@app.post("/match", response_model=List[MatchResponse])
def smart_matching(load: LoadRequest, available_drivers: List[Driver]):
    load_dict = load.model_dump()
    load_dict["destination_city"] = "Pune"
    drivers_dict = [d.model_dump() for d in available_drivers]
    results = matching_engine.match_driver_to_load(load_dict, drivers_dict)
    return [
        MatchResponse(
            driver_id=r["driver_id"],
            score=r["total_score"],
            distance_km=r["details"]["distance_km"],
        )
        for r in results
    ]

# ── Predictive ETA ──

@app.post("/predict-eta", response_model=EtaResponse)
def calculate_smart_eta(req: EtaRequest):
    base = req.base_time
    multiplier = 1.0
    reason = []

    condition = req.weather_condition.lower()
    if condition == "rain":
        multiplier += 0.15
        reason.append("Weather (Rain) +15%")
    elif condition == "storm":
        multiplier += 0.40
        reason.append("Weather (Storm) +40%")

    if req.vehicle_type.lower() == "heavy truck":
        multiplier += 0.10
        reason.append("Vehicle (Heavy Truck) +10%")

    return EtaResponse(
        adjusted_eta=round(base * multiplier, 0),
        base_time=base,
        adjustment_factor=round(multiplier, 2),
        details=", ".join(reason) if reason else "Standard Conditions",
    )

# ── SOS ──

@app.post("/trigger-sos", response_model=SosResponse)
def trigger_smart_sos(req: SosRequest):
    hospital_name = "City General Hospital"
    police_station = "Central Police Station"
    alert_msg = (
        f"SOS at [{req.lat}, {req.lng}]. "
        f"Nearest Hospital: {hospital_name} (2.0 km away). "
        f"Nearest Police: {police_station} (3.0 km away)."
    )
    return SosResponse(
        alert=alert_msg,
        nearest_hospital={"name": hospital_name, "distance": 2.0},
        nearest_police={"name": police_station, "distance": 3.0},
    )

# ── Dynamic Pricing ──

@app.post("/predict-price", response_model=PriceResponse)
def dynamic_pricing(req: PriceRequest):
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
        breakdown={"rate": base_rate_per_km, "dist": req.distance_km},
    )

# ── Dost Chat History ──

@app.get("/dost/history")
async def get_dost_history(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"status": "error", "message": "Unauthorized: No token provided", "history": []}

    token = auth_header.split(" ")[1]
    user_id = None

    try:
        parts = token.split(".")
        if len(parts) == 3:
            payload_b64 = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            payload = json.loads(base64.b64decode(payload_b64).decode("utf-8"))
            user_id = payload.get("userId") or payload.get("id") or payload.get("sub")
    except Exception as e:
        logger.warning(f"Token parsing error in get_dost_history: {e}")
        return {"status": "error", "message": "Invalid token", "history": []}

    if not user_id:
        return {"status": "error", "message": "Unauthorized: Invalid user", "history": []}

    # Python engine does not persist history — history is saved by the Node backend.
    # This endpoint is a passthrough for compatibility; Node's /api/dost/history is authoritative.
    return {"status": "success", "history": []}

@app.delete("/dost/history")
async def delete_dost_history(request: Request):
    return {"status": "success", "message": "History cleared"}

# ── FIX 3 + FIX 12: Dost Chat — Full Context-Aware + Structured Error Handling ──

@app.post("/dost/chat")
async def dost_chat(request: Request):
    """
    TruckNet Dost AI Chat endpoint.
    FIX 3: Sends full conversation history to HuggingFace for context memory.
    FIX 12: Granular exception handling with structured logging.
    """
    # Parse body
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail={
            "error": "invalid_json",
            "message": "Request body JSON parse karne mein dikkat aayi.",
        })

    message: str = body.get("message", "").strip()
    conversation_history: list = body.get("conversationHistory", [])

    if not message:
        raise HTTPException(status_code=400, detail={
            "error": "empty_message",
            "message": "Message empty nahi ho sakta.",
        })

    HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
    if not HF_API_TOKEN:
        logger.error("HF_API_TOKEN environment variable is not set on this service.")
        raise HTTPException(status_code=503, detail={
            "error": "not_configured",
            "message": "AI service configure nahi ki gayi hai. Admin se sampark karo.",
        })

    # ── Build messages array (system + history + new user message) ──
    system_prompt = (
        "You are TruckNet Dost, a helpful AI assistant for Indian truck drivers and fleet owners. "
        "You help with load matching, route planning, freight pricing, and logistics in India. "
        "Always reply in friendly Hinglish (a natural mix of Hindi and English) unless the user "
        "writes in pure English — then reply in English. Keep replies concise: 2 to 4 sentences. "
        "Use simple language suitable for drivers who may not be highly educated. "
        "If you don't know something, say: 'Mujhe pata nahi yaar, ek baar fleet owner se pooch lo.' "
        "Do not make up freight rates or GPS coordinates — say you don't have live data."
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Inject last 10 turns of conversation history for context
    for turn in conversation_history[-10:]:
        role = turn.get("role", "")
        content = str(turn.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    # Append current user message
    messages.append({"role": "user", "content": message})

    logger.info(f"Sending {len(messages)} messages to HuggingFace (history={len(conversation_history)} turns)")

    # ── HuggingFace API call with granular error handling ──
    payload = {
        "model": "mistralai/Mistral-7B-Instruct-v0.2",
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.7,
        "stream": False,
    }

    try:
        hf_response = requests.post(
            "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {HF_API_TOKEN}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=45,
        )
        hf_response.raise_for_status()

    except requests.Timeout:
        logger.error("HuggingFace API timed out after 45 seconds")
        raise HTTPException(status_code=503, detail={
            "error": "timeout",
            "message": "Dost thoda slow hai abhi, 10 second mein dobara try karo. 🚛",
            "retry_after": 10,
        })

    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 0
        response_text = e.response.text[:500] if e.response is not None else ""
        logger.error(
            f"HuggingFace HTTP error — status={status_code} body={response_text}"
        )

        if status_code == 429:
            raise HTTPException(status_code=429, detail={
                "error": "rate_limited",
                "message": "AI ka quota khatam ho gaya. Thodi der mein try karo. ⏳",
            })
        elif status_code == 503:
            raise HTTPException(status_code=503, detail={
                "error": "hf_unavailable",
                "message": "AI service band hai. 1-2 minute mein dobara koshish karo. 🔧",
            })
        else:
            raise HTTPException(status_code=502, detail={
                "error": "hf_error",
                "message": "AI service se problem. Thodi der mein try karo. 🚛",
            })

    except requests.ConnectionError:
        logger.error("Cannot reach HuggingFace API — connection refused or DNS failure")
        raise HTTPException(status_code=503, detail={
            "error": "connection_error",
            "message": "Server se connect nahi ho pa raha. Internet check karo. 📶",
        })

    # ── Parse response ──
    try:
        result = hf_response.json()
        ai_reply = result["choices"][0]["message"]["content"].strip()
        if not ai_reply:
            ai_reply = "Namaste! Main TruckNet Dost hoon. Aapki kya madad kar sakta hoon? 🚛"
    except (KeyError, IndexError, ValueError) as e:
        logger.error(f"Unexpected HuggingFace response format: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={
            "error": "parse_error",
            "message": "AI ka jawab samajh nahi aaya. Dobara try karo.",
        })
    except Exception as e:
        logger.error(f"Unhandled exception parsing HF response: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={
            "error": "unknown",
            "message": "Kuch unexpected ho gaya. Team ko bata do.",
        })

    logger.info(f"Dost replied successfully — reply_length={len(ai_reply)} chars")

    return {
        "status": "success",
        "reply": ai_reply,
        "message_received": message,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting TruckNet AI Engine on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
