# 🚛 TruckNet India — AI-Powered Logistics Platform

> **Next-Gen logistics platform connecting Fleet Owners, Drivers, and Transporters across India with AI-driven intelligence.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [AI Modules](#-ai-modules)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🌟 Overview

TruckNet India is a comprehensive logistics platform designed for the Indian transportation market. It provides:

- **🏭 For Customers (SMEs/Factories):** Post loads, track shipments, manage documents
- **🚚 For Fleet Owners:** Manage vehicles, find drivers, financial analytics, load matching
- **👨‍✈️ For Drivers:** Find loads, track earnings, roadside assistance, safety features
- **🤖 AI-Powered Intelligence:** Route optimization, demand prediction, fraud detection, smart load matching

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion |
| **Backend** | Express.js 4, TypeScript, Node.js 18+ |
| **Database** | MongoDB 7+ (Mongoose ODM), Prisma (AI logging) |
| **AI Engine** | Python (FastAPI), Heuristic algorithms, LLM integration (Groq/Ollama) |
| **Real-time** | Socket.io |
| **Auth** | JWT (access + refresh token rotation), bcrypt |
| **Security** | Helmet, CORS, Rate limiting, Zod validation, Response sanitization |
| **Build** | Turborepo (monorepo orchestration) |

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js Client │────▶│  Express API     │────▶│  MongoDB        │
│  (React 19)     │     │  (TypeScript)    │     │  (Mongoose)     │
│  Port: 3000     │     │  Port: 5000      │     │                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │  AI Modules      │
                        │  - Route Optim.  │
                        │  - Demand Pred.  │
                        │  - Fraud Detect. │
                        └──────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Python AI Engine│
                        │  (FastAPI)       │
                        │  Port: 8000      │
                        └──────────────────┘
```

**MVC Pattern Enforced:**
- `Routes` → Define endpoints, apply middleware
- `Controllers` → Parse request, validate input, send response
- `Services` → Business logic, orchestration
- `AI Modules` → Isolated intelligence layer (called only by services)
- `Models` → Data schema and database interaction

---

## 📁 Folder Structure

```
trucknet-india/
│
├── apps/
│   ├── api/                          # Express Backend (TypeScript)
│   │   ├── src/
│   │   │   ├── ai/                   # AI module layer
│   │   │   │   ├── index.ts          # Barrel exports
│   │   │   │   ├── routeOptimizer.ts # Route optimization
│   │   │   │   ├── demandPrediction.ts # Load demand prediction
│   │   │   │   └── fraudDetection.ts # Transaction fraud scoring
│   │   │   ├── config/               # Configuration
│   │   │   │   ├── env.ts            # Validated env variables (Zod)
│   │   │   │   ├── mongoose.ts       # MongoDB connection
│   │   │   │   ├── prisma.ts         # Prisma client
│   │   │   │   ├── multer.ts         # File upload config
│   │   │   │   └── socket.ts         # Socket.io setup
│   │   │   ├── controllers/          # Request handlers
│   │   │   ├── middlewares/          # Auth, rate limiting, sanitize
│   │   │   ├── models/               # Mongoose/Prisma schemas
│   │   │   ├── routes/               # Express route definitions
│   │   │   ├── services/             # Business logic layer
│   │   │   ├── types/                # TypeScript type definitions
│   │   │   ├── utils/                # Shared utilities
│   │   │   └── app.ts                # Application entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Prisma schema (AI logging)
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── web/                          # Next.js Frontend
│   │   ├── app/                      # App Router (pages)
│   │   │   ├── auth/                 # Login, Register
│   │   │   ├── dashboard/            # Role-based dashboards
│   │   │   │   ├── customer/
│   │   │   │   ├── driver/
│   │   │   │   └── owner/
│   │   │   ├── find-vehicle/
│   │   │   └── rules/
│   │   ├── components/               # Reusable components
│   │   │   ├── ai/                   # AI chat assistant
│   │   │   ├── dashboard/            # Dashboard widgets
│   │   │   ├── landing/              # Landing page sections
│   │   │   ├── layout/               # Navbar, Sidebar
│   │   │   ├── map/                  # Map components
│   │   │   └── ui/                   # Primitives (Button, Card, etc.)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/                      # API client, auth context, utils
│   │   └── package.json
│   │
│   └── ai_engine/                    # Python AI Engine (FastAPI)
│       ├── main.py                   # FastAPI server
│       ├── matching.py               # Load-driver matching
│       ├── routing.py                # Route computation
│       ├── models.py                 # Data models
│       └── requirements.txt
│
├── .env.example                      # Root env template
├── .gitignore                        # Comprehensive ignore rules
├── README.md                         # This file
├── turbo.json                        # Turborepo config
└── package.json                      # Monorepo root
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** ≥ 7.0 (running locally or MongoDB Atlas)
- **Python** ≥ 3.9 (for AI Engine, optional)
- **npm** ≥ 9.x

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/trucknet-india.git
cd trucknet-india
```

### 2. Install Dependencies

```bash
# Root dependencies (Turborepo)
npm install

# API dependencies
cd apps/api && npm install && cd ../..

# Web dependencies
cd apps/web && npm install && cd ../..

# AI Engine (optional)
cd apps/ai_engine && pip install -r requirements.txt && cd ../..
```

### 3. Configure Environment Variables

```bash
# Copy the template
cp .env.example apps/api/.env

# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste the output into JWT_SECRET and JWT_REFRESH_SECRET in .env

# Set the frontend env
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > apps/web/.env.local
```

### 4. Start MongoDB

```bash
mongod --dbpath /data/db --replSet rs0
```

### 5. Run the Application

```bash
# Start all services (via Turborepo)
npm run dev

# Or start individually:
cd apps/api && npm run dev    # Backend on port 5000
cd apps/web && npm run dev    # Frontend on port 3000
cd apps/ai_engine && python main.py  # AI Engine on port 8000
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | API server port (default: 5000) |
| `DATABASE_URL` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `NODE_ENV` | ✅ | `development` / `production` / `test` |
| `CORS_ORIGIN` | ✅ | Allowed frontend origin |
| `GROQ_API_KEY` | ❌ | Groq cloud LLM API key |
| `OLLAMA_HOST` | ❌ | Local Ollama LLM host URL |
| `AI_ENGINE_URL` | ❌ | Python AI engine URL |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL for frontend |

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login with email/password |
| `POST` | `/api/auth/refresh` | ❌ | Rotate refresh token |
| `POST` | `/api/auth/logout` | ✅ | Revoke all tokens |
| `GET` | `/api/vehicles` | ✅ | List vehicles |
| `POST` | `/api/vehicles` | ✅ OWNER | Create vehicle |
| `GET` | `/api/loads` | ✅ | List available loads |
| `POST` | `/api/loads` | ✅ CUSTOMER | Post a new load |
| `GET` | `/api/rides` | ✅ | List rides |
| `POST` | `/api/matches` | ✅ | AI-powered load matching |
| `GET` | `/api/ai/insights` | ✅ | Role-based AI insights |
| `POST` | `/api/assistant/command` | ✅ | AI assistant chat |
| `GET` | `/api/health` | ❌ | Health check |

---

## 🤖 AI Modules

All AI logic is isolated in `apps/api/src/ai/`:

| Module | File | Purpose |
|--------|------|---------|
| Route Optimizer | `routeOptimizer.ts` | Optimizes delivery routes using distance/traffic heuristics |
| Demand Prediction | `demandPrediction.ts` | Predicts load demand by region, season, and day |
| Fraud Detection | `fraudDetection.ts` | Scores transactions for fraud risk using weighted rules |

**Architecture:** Routes → Controllers → Services → **AI Modules**

AI modules are never called directly from routes. They are invoked exclusively through the services layer, ensuring clean separation of concerns.

---

## 🔒 Security

### Implemented Security Measures

| Category | Implementation |
|----------|---------------|
| **Authentication** | JWT with access/refresh token rotation |
| **Password Security** | bcrypt hashing (10 salt rounds) |
| **Token Reuse Detection** | Automatic revocation of all tokens on reuse |
| **Input Validation** | Zod schemas on all endpoints |
| **Response Sanitization** | Auto-strips `password`, `__v` from all responses |
| **Rate Limiting** | Per-IP rate limiting on auth routes (10 req/min) |
| **CORS** | Restricted to configured frontend origin |
| **HTTP Headers** | Helmet.js security headers |
| **Request Timeout** | 30-second timeout on all requests |
| **Structured Logging** | No `console.log`; sensitive fields auto-redacted |
| **Environment Variables** | Zod-validated on startup; server refuses to start with missing config |
| **Error Handling** | Centralized error handler; no stack traces in production |
| **Fraud Detection** | AI-powered transaction risk scoring |

### Security Best Practices

- ❌ No hardcoded secrets anywhere in codebase
- ❌ No API keys in frontend code
- ❌ No password returned in any API response
- ❌ No raw error details leaked in production
- ✅ All secrets from environment variables
- ✅ Startup validation prevents misconfigured deploys
- ✅ Token rotation prevents replay attacks

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `security:` Security improvement
- `chore:` Maintenance

---

## 📄 License

Proprietary — © 2024-2026 TruckNet India. All rights reserved.

---

<p align="center">
  Built with ❤️ for India's logistics ecosystem
</p>
