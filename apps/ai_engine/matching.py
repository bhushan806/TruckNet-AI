import math
from typing import List, Dict, Any

class MatchingEngine:
    def __init__(self):
        # Weights for the scoring algorithm (Logistics Enterprise Grade)
        self.weights = {
            "proximity": 0.25,           # 25% (Driver close to pickup hub)
            "capacity_fit": 0.25,        # 25% (Payload match without wasted tonnage)
            "backhaul": 0.30,            # 30% (Empty return trip optimization)
            "body_compatibility": 0.10,  # 10% (Specialized body type fit)
            "rating": 0.10               # 10% (Driver reliability & safety record)
        }

    def _calculate_haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great circle distance between two decimal coordinates in km."""
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _evaluate_body_compatibility(self, goods_type: str, body_type: str, required_body: str = "ANY") -> float:
        """
        Evaluates body type compatibility for Indian freight commodities.
        Returns a score from 0 to 100.
        """
        goods = (goods_type or "").lower().strip()
        body = (body_type or "").upper().strip()
        req = (required_body or "ANY").upper().strip()

        # Direct requirement match
        if req != "ANY" and req == body:
            return 100.0

        # Dedicated tankers can ONLY carry liquids
        if body == "TANKER_LIQUID":
            if any(w in goods for w in ["liquid", "oil", "chemical", "petrol", "diesel", "milk", "water", "fuel"]):
                return 100.0
            return 0.0  # Liquid tanker cannot carry dry cargo

        # Dedicated tippers can ONLY carry bulk aggregates/minerals
        if body == "TIPPER_DUMPER":
            if any(w in goods for w in ["sand", "gravel", "aggregate", "stone", "coal", "mining", "mud"]):
                return 100.0
            return 0.0  # Tipper cannot carry bagged goods, electronics, or cement bulk

        # Commodity-specific rules
        if "cement" in goods:
            if "bulk" in goods or "loose" in goods:
                return 100.0 if body == "CEMENT_BULKER" else 0.0
            # Bagged cement: Open high bed or flatbed with tarpaulin
            if body in ["OPEN_HIGH_BED", "FLATBED"]:
                return 100.0
            if body == "CEMENT_BULKER":
                return 30.0
            return 0.0

        if any(w in goods for w in ["steel", "iron", "pipes", "coils", "tmt", "rods"]):
            if body in ["FLATBED", "OPEN_HIGH_BED"]:
                return 100.0
            return 15.0

        if any(w in goods for w in ["liquid", "oil", "chemical", "petrol", "diesel", "milk"]):
            if body == "TANKER_LIQUID":
                return 100.0
            return 0.0  # Hazardous / liquid cannot go in open truck

        if any(w in goods for w in ["sand", "gravel", "aggregate", "stone", "coal", "mining"]):
            if body in ["TIPPER_DUMPER", "OPEN_HIGH_BED"]:
                return 100.0
            return 25.0

        if any(w in goods for w in ["fmcg", "electronics", "retail", "pharma", "garments"]):
            if body == "CONTAINER_CLOSED":
                return 100.0
            if body == "OPEN_HIGH_BED":
                return 70.0  # Needs tarpaulin
            return 30.0

        # Default fallback compatibility
        return 80.0

    def match_driver_to_load(self, load_request: Dict[str, Any], available_drivers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Production Load Matching Engine:
        Evaluates available trucks against real logistics parameters:
        Proximity, Capacity Fit, Backhaul (Home Base), Body Compatibility, and Driver Rating.
        """
        scored_drivers = []

        load_origin = load_request.get("origin") or {"lat": 19.0760, "lng": 72.8777}
        required_weight = float(load_request.get("weight", 0) or 0)
        goods_type = load_request.get("goods_type", "General Cargo")
        dest_city = str(load_request.get("destination_city", "")).lower().strip()
        required_body = load_request.get("required_body_type", "ANY")

        for driver in available_drivers:
            details = {}
            driver_id = driver.get("driver_id") or driver.get("id") or "UNKNOWN"
            driver_capacity = float(driver.get("capacity", 0) or 0)
            driver_body = driver.get("body_type", driver.get("vehicle_type", "OPEN_HIGH_BED"))
            driver_home = str(driver.get("home_city", "")).lower().strip()

            # ── HARD FILTER 1: Capacity Check ──
            # A truck cannot take a load heavier than its registered capacity
            if driver_capacity > 0 and required_weight > 0 and driver_capacity < required_weight:
                continue  # Reject overloaded truck

            # ── HARD FILTER 2: Body Compatibility ──
            body_score = self._evaluate_body_compatibility(goods_type, driver_body, required_body)
            if body_score <= 0:
                continue  # Reject incompatible body (e.g. liquid tanker for bagged cement)

            details["body_score"] = body_score

            # ── 1. Proximity Weight (25%) ──
            driver_loc = driver.get("location") or {"lat": 19.0760, "lng": 72.8777}
            distance_km = self._calculate_haversine(
                load_origin.get("lat", 19.0760), load_origin.get("lng", 72.8777),
                driver_loc.get("lat", 19.0760), driver_loc.get("lng", 72.8777)
            )

            if distance_km < 15:
                dist_score = 100.0
            elif distance_km < 40:
                dist_score = 80.0
            elif distance_km < 80:
                dist_score = 60.0
            elif distance_km < 150:
                dist_score = 30.0
            else:
                dist_score = 10.0

            details["distance_km"] = round(distance_km, 1)
            details["distance_score"] = dist_score

            # ── 2. Capacity Fit Weight (25%) ──
            # Best fit is 75% - 100% capacity utilization (efficient fuel usage)
            if driver_capacity > 0 and required_weight > 0:
                utilization = required_weight / driver_capacity
                if 0.75 <= utilization <= 1.0:
                    cap_score = 100.0
                elif 0.50 <= utilization < 0.75:
                    cap_score = 80.0
                elif utilization < 0.50:
                    cap_score = 55.0  # Excessive truck size for small load (diesel waste)
                else:
                    cap_score = 20.0
            else:
                cap_score = 70.0

            details["capacity_score"] = cap_score

            # ── 3. Backhaul / Home Base Match (30%) ──
            # Massive incentive: Truck returning towards its home depot
            backhaul_score = 30.0  # Base score for general availability
            if driver_home and dest_city:
                if driver_home in dest_city or dest_city in driver_home:
                    backhaul_score = 100.0  # Perfect return load match!
                elif any(part in dest_city for part in driver_home.split()):
                    backhaul_score = 85.0

            details["backhaul_score"] = backhaul_score

            # ── 4. Driver Rating (10%) ──
            rating = float(driver.get("rating", 4.5) or 4.5)
            rating_score = min(max(rating * 20.0, 0.0), 100.0)
            details["rating_score"] = rating_score

            # ── Final Weighted Composite Score (0 - 100) ──
            total_score = (
                (dist_score * self.weights["proximity"]) +
                (cap_score * self.weights["capacity_fit"]) +
                (backhaul_score * self.weights["backhaul"]) +
                (body_score * self.weights["body_compatibility"]) +
                (rating_score * self.weights["rating"])
            )

            scored_drivers.append({
                "driver_id": driver_id,
                "total_score": round(total_score, 1),
                "details": details,
                "driver_data": driver
            })

        # Sort descending by composite score
        scored_drivers.sort(key=lambda x: x["total_score"], reverse=True)
        return scored_drivers
