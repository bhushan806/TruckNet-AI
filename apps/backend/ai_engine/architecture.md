# TruckNet India - AI Engine Architecture

## Overview
The AI Engine is a dedicated microservice built with **Python (FastAPI)** that powers the intelligence layer of the TruckNet India platform. It handles computationally intensive tasks such as route optimization, dynamic pricing, and smart matching, leveraging **PostgreSQL with PostGIS** for geospatial operations and **Redis** for real-time caching.

## System Architecture Diagram Description

1.  **Client Layer (Frontend)**
    *   Web/Mobile Apps communicate with the **Main Backend (Node.js)** via REST/WebSockets.
    *   Real-time updates (e.g., driver location, price surges) are pushed to clients via Socket.io from the Node.js backend.

2.  **API Gateway / Main Backend (Node.js)**
    *   Acts as the orchestrator.
    *   Handles Authentication, User Management, and basic CRUD.
    *   Delegates complex AI tasks to the **AI Engine** via internal HTTP REST calls or a Message Queue (RabbitMQ/Redis PubSub).

3.  **AI Engine (Python/FastAPI)**
    *   **Service Interface**: Exposes endpoints like `/predict-price`, `/match-load`, `/optimize-route`.
    *   **Core Modules**:
        *   *Matching Engine*: Uses Scikit-Learn/NetworkX.
        *   *Pricing Engine*: Uses XGBoost models.
        *   *Routing Engine*: Uses Google OR-Tools.
    *   **Data Access**: Connects directly to the **AI Database (PostgreSQL)** for historical data and training sets.
    *   **Cache**: Uses **Redis** to store ephemeral data like "current driver locations" for sub-millisecond retrieval during matching.

4.  **Data Layer**
    *   **Primary App DB (MongoDB)**: Stores User profiles, Order history, Logs (handled by Node.js).
    *   **AI DB (PostgreSQL + PostGIS)**: Stores:
        *   Geospatial data (Road networks, Zones).
        *   Pricing Rules & Historical Demand.
        *   Matching Logs & Scores.
    *   **Redis**: Shared cache for real-time state (Driver Availability, Active Surge Multipliers).

## Communication Flow Example: Smart Matching
1.  **User** posts a Load via Frontend -> **Node.js Backend**.
2.  **Node.js Backend** saves Load to MongoDB.
3.  **Node.js Backend** calls AI Engine: `POST /api/v1/match { load_id, origin, dest, weight }`.
4.  **AI Engine**:
    *   Fetches available drivers from **Redis** (Geo-radius search).
    *   Runs **KNN/Hungarian Algorithm** to score drivers based on distance, rating, and vehicle type.
    *   Returns top 5 matches to Node.js.
5.  **Node.js Backend** notifies those drivers via WebSockets.

## Technology Stack
*   **Language**: Python 3.11+
*   **Framework**: FastAPI (High performance, async)
*   **Database**: PostgreSQL 15+ with PostGIS extension
*   **ML Libraries**: Scikit-Learn, Pandas, NumPy, NetworkX, OR-Tools
*   **Caching**: Redis
