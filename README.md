# TripTailor ✈️

> AI-powered trip planning SaaS — personalized itineraries generated in seconds using a 4-agent pipeline.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-triptailor.org-blue?style=flat-square)](https://www.triptailor.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-Multi--Agent-orange?style=flat-square)](https://google.github.io/adk-docs/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Production Stats

| Metric | Value |
|---|---|
| Real users (first 24h) | 26 |
| Edge requests (first 24h) | 400+ |
| Serverless invocations | 528 |
| AI pipeline error rate | 0.9% |

---

## What is TripTailor?

TripTailor lets you describe your dream trip in plain language and get a fully personalized day-by-day itinerary in seconds. Under the hood, a 4-agent AI pipeline built with Google ADK handles destination research, activity planning, logistics, and itinerary formatting — all in a single request.

---

## ✨ Features

- **4-agent AI pipeline** — specialized agents for research, planning, logistics, and formatting
- **Personalized itineraries** — tailored to travel dates, budget, interests, and travel style
- **Production-grade auth** — Better Auth with MongoDB-backed sessions
- **Usage gates** — middleware-enforced limits with server-side Zod validation on all API routes
- **Serverless architecture** — edge-deployed for low latency worldwide

---

## 🏗️ Architecture

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│           Google ADK Orchestrator        │
│                                         │
│  ┌──────────┐      ┌──────────────────┐ │
│  │ Research │ ───▶ │ Activity Planner │ │
│  │  Agent   │      │      Agent       │ │
│  └──────────┘      └──────────────────┘ │
│       │                    │            │
│       ▼                    ▼            │
│  ┌──────────┐      ┌──────────────────┐ │
│  │ Logistics│ ───▶ │   Formatter      │ │
│  │  Agent   │      │      Agent       │ │
│  └──────────┘      └──────────────────┘ │
└─────────────────────────────────────────┘
    │
    ▼
Structured Itinerary → Next.js Frontend
```

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 15 (App Router)
- Tailwind CSS
- Redux Toolkit
- shadcn/ui

**Backend**
- Node.js / Express
- MongoDB + Mongoose
- Better Auth
- Zod (schema validation)

**AI**
- Google ADK (Agent Development Kit)
- 4-agent orchestration pipeline

**Infrastructure**
- Vercel Edge Functions
- MongoDB Atlas

---

## 🔧 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB connection string
- Google ADK API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Afridi-haque7/ai-trip-planner.git
cd ai-trip-planner

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_ADK_API_KEY=your_google_adk_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
├── constants/            # App-wide constants
├── context/              # React context providers
├── lib/                  # Utility functions, DB config
├── models/               # Mongoose schemas
├── public/               # Static assets
├── auth.js               # Better Auth configuration
└── middleware.js         # Route protection & usage gates
```

---

## 🔐 Auth & Security

- Session-based auth via **Better Auth** with MongoDB session store
- Middleware-enforced usage gates — unauthenticated users cannot invoke the AI pipeline
- Server-side **Zod validation** on every API route — no raw user input reaches the AI agents
- See [`SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md) for the full security audit

---

## 🤖 Agent Architecture

The AI pipeline is a 4-agent system orchestrated by Google ADK. Each agent has a single responsibility:

1. **Research Agent** — gathers destination context, weather, local tips
2. **Activity Planner Agent** — selects and schedules activities based on user preferences
3. **Logistics Agent** — handles travel between locations, timing, and feasibility
4. **Formatter Agent** — structures the final itinerary for the frontend

See [`AGENTS_AND_TOOLS_ARCHITECTURE.md`](./AGENTS_AND_TOOLS_ARCHITECTURE.md) for the full breakdown.

---

## 🌐 Live Demo

👉 [https://www.triptailor.org](https://www.triptailor.org)

---

## 👤 Author

**Afridi Haque**

- Portfolio: [afridih.in](https://afridih.in)
- LinkedIn: [linkedin.com/in/afridi-haque-851924203](https://www.linkedin.com/in/afridi-haque-851924203/)
- GitHub: [@Afridi-haque7](https://github.com/Afridi-haque7)

---

## 📄 License

MIT © Afridi Haque
