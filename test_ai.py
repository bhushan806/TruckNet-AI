import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("--- Testing /ping ---")
    try:
        r = requests.get(f"{BASE_URL}/ping")
        print(f"Status Code: {r.status_code}")
        print(r.json())
    except Exception as e:
        print(f"Error: {e}")

def test_match():
    print("\n--- Testing /match ---")
    payload = {
        "load": {
            "load_id": "L1",
            "origin": {"lat": 19.0760, "lng": 72.8777}, # Mumbai
            "destination": {"lat": 18.5204, "lng": 73.8567}, # Pune
            "weight": 10,
            "goods_type": "Electronics"
        },
        "available_drivers": [
            {
                "driver_id": "D1",
                "location": {"lat": 19.0800, "lng": 72.8800},
                "rating": 4.8,
                "vehicle_type": "Heavy Truck",
                "is_available": True
            },
            {
                "driver_id": "D2",
                "location": {"lat": 18.5000, "lng": 73.8000},
                "rating": 4.2,
                "vehicle_type": "Light Truck",
                "is_available": True
            }
        ]
    }
    try:
        r = requests.post(f"{BASE_URL}/match", json=payload)
        print(f"Status Code: {r.status_code}")
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

def test_predict_price():
    print("\n--- Testing /predict-price ---")
    payload = {
        "distance_km": 150.0,
        "weight": 12.5,
        "vehicle_type": "Heavy Truck",
        "origin_city": "Mumbai"
    }
    try:
        r = requests.post(f"{BASE_URL}/predict-price", json=payload)
        print(f"Status Code: {r.status_code}")
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

def test_predict_eta():
    print("\n--- Testing /predict-eta ---")
    payload = {
        "base_time": 120.0,
        "weather_condition": "Rain",
        "vehicle_type": "Heavy Truck"
    }
    try:
        r = requests.post(f"{BASE_URL}/predict-eta", json=payload)
        print(f"Status Code: {r.status_code}")
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

def test_sos():
    print("\n--- Testing /trigger-sos ---")
    payload = {
        "lat": 19.0760,
        "lng": 72.8777
    }
    try:
        r = requests.post(f"{BASE_URL}/trigger-sos", json=payload)
        print(f"Status Code: {r.status_code}")
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_health()
    test_match()
    test_predict_price()
    test_predict_eta()
    test_sos()
