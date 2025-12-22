# FinShadow: Codebase Analysis & Next Steps Roadmap

**Date**: December 22, 2025  
**Status**: MVP Phase 1 Ready to Execute

---

## Executive Summary

FinShadow is a **full-stack threat intelligence and fraud detection platform** that's ~70% ready. The architecture is well-designed, API endpoints are fully implemented, and the frontend is visually complete—but **the critical connection between frontend + API + database is missing**.

### Current State:
- ✅ **Frontend**: Fully functional React UI with mock data (all pages working)
- ✅ **API**: 35+ REST endpoints fully implemented with validation and error handling
- ⚠️ **Database**: Schema defined but NOT connected (in-memory storage only)
- ❌ **Data Integration**: Frontend doesn't call API; API doesn't touch database

### What Needs to Happen:
1. **Phase 1 (1-2 days)**: Connect API to PostgreSQL database
2. **Phase 2 (2-3 days)**: Wire frontend to make real API calls
3. **Phase 3 (3-5 days)**: Build ingestion layer for OSINT feeds (AlienVault OTX, MISP)
4. **Phase 4 (2-3 days)**: Implement risk scoring engine
5. **Phase 5+ (ongoing)**: Advanced features (alerts, webhooks, STIX parsers, etc.)

---

## Current Architecture Deep Dive

### 1. Frontend Layer (React 19 + Vite)

**Location**: `client/src/`

#### What's Done:
- ✅ 6 main pages fully built with real UI:
  - **Dashboard.tsx**: KPI cards, attack/prevention charts, recent findings
  - **FraudFindings.tsx**: Table with filtering, investigation workflow
  - **ThreatActors.tsx**: Card grid showing APT groups with risk levels
  - **DarkWebIntel.tsx**: Terminal-style live feed (simulated)
  - **Predictions.tsx**: Risk radar chart, ML confidence metrics
  - **Documentation.tsx**: Likely empty/stub page

- ✅ **50+ UI components** (Radix UI + shadcn):
  - Buttons, cards, dialogs, forms, tables, charts, alerts, etc.
  - Fully styled with Tailwind CSS + CSS variables
  - Dark/light mode ready (next-themes integrated)

- ✅ **Forms & validation**: react-hook-form + Zod schemas
- ✅ **Charting**: Recharts (area, bar, radar charts) with proper styling
- ✅ **Routing**: Wouter (lightweight) with 6 routes

#### What's Missing:
- ❌ **API Integration**: No API calls to backend
  - All data comes from `lib/mockData.ts` (hardcoded)
  - React Query is installed but unused
  - fetch() is not configured for authentication
- ❌ **Authentication UI**: No login page, signup, token handling
- ❌ **Real-time updates**: WebSocket integration planned but not implemented
- ⚠️ **Error handling**: No error boundaries or API error states

#### Key Files:
```
client/src/
├── App.tsx                    # Router setup
├── pages/
│   ├── Dashboard.tsx          # 295 lines, fully functional
│   ├── FraudFindings.tsx       # Filterable findings table
│   ├── ThreatActors.tsx        # Threat actor grid
│   ├── DarkWebIntel.tsx        # Terminal-style feed
│   ├── Predictions.tsx         # Risk radar chart
│   └── Documentation.tsx
├── components/
│   ├── Layout.tsx             # Nav + header
│   └── ui/                    # 50+ shadcn components
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── mockData.ts            # HARDCODED: 4 actors, 5 findings, 3 predictions
│   ├── queryClient.ts         # React Query configured but unused
│   └── utils.ts               # Tailwind merge, date formatting
└── index.css                  # Tailwind + custom theme
```

---

### 2. API Layer (Express + TypeScript)

**Location**: `server/`

#### What's Done:
- ✅ **35+ REST endpoints** fully implemented:
  - Auth (register, login) — ⚠️ No JWT/hashing yet
  - Transactions (CRUD, list with pagination)
  - Fraud Findings (CRUD, filtering, investigation actions)
  - Threat Actors (CRUD)
  - Dark Web Intel (CRUD)
  - Predictions (CRUD)
  - Alerts (CRUD, mark as read)
  - Dashboard (aggregated stats)

- ✅ **Input Validation**: All endpoints use Zod schemas
- ✅ **Error Handling**: Proper HTTP status codes, error messages
- ✅ **Logging**: Request/response logging with sanitization (passwords hidden)
- ✅ **In-memory storage**: MemStorage class fully implements 40+ methods

#### What's Missing:
- ❌ **Database Connection**: MemStorage uses Map<> instead of PostgreSQL
- ❌ **Authentication**: JWT middleware exists but not required on routes
  - `authenticateJWT` and `requireRole` middleware defined but not used
  - No token generation/validation logic connected
- ❌ **Environment config**: `server/env.ts` exists but not fully utilized
- ⚠️ **Health check**: Imported but not called during startup

#### Key Files:
```
server/
├── index.ts                   # Express app, logging, middleware
├── routes.ts                  # 504 lines: 35+ endpoints
├── storage.ts                 # 383 lines: IStorage interface + MemStorage
├── auth.ts                    # JWT/bcrypt functions (defined but unused)
├── db.ts                      # Drizzle connection (created, not used)
├── env.ts                     # Environment validation
├── vite.ts                    # Dev server integration
├── static.ts                  # Production static serving
└── middleware/
    └── auth.ts                # authenticateJWT, requireRole
```

#### Sample Endpoints:

```
Authentication:
  POST /api/auth/register      ← Input: username, password, email
  POST /api/auth/login         ← Output: token, user

Transactions:
  GET  /api/transactions?limit=20&offset=0
  GET  /api/transactions/:id
  POST /api/transactions       ← Input: amount, type, sourceAccount, etc.
  PUT  /api/transactions/:id

Fraud:
  GET  /api/fraud/findings?status=new&limit=20
  GET  /api/fraud/findings/:id
  POST /api/fraud/findings     ← Input: transactionId, type, severity, details
  PUT  /api/fraud/findings/:id
  POST /api/fraud/findings/:id/investigate
  POST /api/fraud/findings/:id/resolve

Threats:
  GET  /api/threats/actors
  POST /api/threats/actors
  PUT  /api/threats/actors/:id

Dark Web:
  GET  /api/dark-web/intel?severity=critical
  POST /api/dark-web/intel

Predictions:
  GET  /api/predictions
  POST /api/predictions

Alerts:
  GET  /api/alerts?unread=true
  POST /api/alerts
  PUT  /api/alerts/:id/read

Analytics:
  GET  /api/health
  GET  /api/stats
  GET  /api/dashboard          ← Aggregated KPIs
```

---

### 3. Database Layer (PostgreSQL + Drizzle ORM)

**Location**: `shared/schema.ts`

#### What's Done:
- ✅ **8 tables fully defined** with proper types and indexes:
  1. **users** — Account management (username, email, role, MFA)
  2. **transactions** — Financial transaction records (amount, currency, flags, riskScore, IP, geolocation)
  3. **fraudFindings** — Detected anomalies (type, severity, status, evidence)
  4. **threatActors** — Known threat groups (name, risk level, capabilities, targets)
  5. **darkWebIntel** — Dark web monitoring results (source, title, tags, severity)
  6. **predictions** — ML-generated predictions (model, confidence, risk score)
  7. **alerts** — Notifications to users (type, severity, read status)
  8. **auditLogs** — Compliance tracking (action, user, timestamp)

- ✅ **Proper indexing**: All frequently-queried columns indexed
- ✅ **Zod schemas**: Type-safe validation for all inserts
- ✅ **Foreign keys**: Referential integrity set up

#### Schema Structure (Example: fraudFindings):
```typescript
{
  id: UUID (PK),
  transactionId: FK → transactions.id,
  type: enum (account_takeover, credential_stuffing, synthetic_identity, etc.),
  severity: enum (critical, high, medium, low),
  status: enum (new, investigating, resolved),
  details: text,
  evidence: JSON,
  investigatedBy: UUID → users.id,
  resolvedAt: timestamp,
  createdAt: timestamp,
}
```

#### What's Missing:
- ❌ **Tables from MVP architecture**: `threatIntel`, `riskScores`, `baselineMetrics`
  - Defined in MVP_ARCHITECTURE.md but NOT in shared/schema.ts
  - These are critical for OSINT ingestion (Phase 3+)
- ❌ **Not connected**: PostgreSQL is defined but code still uses MemStorage
- ❌ **No migrations**: Drizzle kit is configured but migrations not run

---

## What's Implemented vs What's Missing

| Feature | Frontend | API | Database | Notes |
|---------|----------|-----|----------|-------|
| User authentication | ❌ No UI | ⚠️ Endpoint exists | ✅ Schema ready | Needs frontend login page |
| Transaction CRUD | ✅ Mock table | ✅ Full endpoints | ✅ Schema ready | Frontend doesn't call API |
| Fraud findings | ✅ Mock table | ✅ Full endpoints | ✅ Schema ready | Frontend doesn't call API |
| Threat actors | ✅ Mock grid | ✅ Full endpoints | ✅ Schema ready | Frontend doesn't call API |
| Dark web intel | ✅ Mock feed | ✅ Full endpoints | ✅ Schema ready | Frontend doesn't call API |
| Predictions | ✅ Mock chart | ✅ Full endpoints | ✅ Schema ready | Frontend doesn't call API |
| OSINT ingestion | ❌ No UI | ❌ Not implemented | ⚠️ Partially designed | MVP Phase 3 |
| Risk scoring | ❌ No UI | ❌ Not implemented | ⚠️ Partially designed | MVP Phase 4 |
| Alerts (real-time) | ✅ Page exists | ✅ Endpoints | ✅ Schema ready | No webhook integration |
| JWT auth | ❌ No login UI | ⚠️ Middleware exists | ✅ Functions defined | Not wired into routes |
| Database persistence | N/A | ❌ Uses MemStorage | ⚠️ Schema exists | **CRITICAL BLOCKER** |
| React Query integration | ❌ Not used | N/A | N/A | Installed but unused |
| WebSocket (real-time) | ❌ Not implemented | ❌ Not implemented | N/A | Future enhancement |

---

## Tech Stack Overview

### Frontend
- **Framework**: React 19.2 with Vite
- **Styling**: Tailwind CSS + CSS variables + framer-motion
- **Components**: Radix UI + shadcn/ui (50+ components)
- **Forms**: react-hook-form + Zod validation
- **Charting**: Recharts (area, bar, radar, combo charts)
- **Routing**: Wouter (3.3 KB alternative to React Router)
- **HTTP**: fetch (raw) + React Query (installed, unused)
- **State**: Local useState + Context (no Redux/Zustand)
- **Animations**: Framer Motion + Tailwind CSS animations

### Backend
- **Runtime**: Node.js + Express.js 4.21
- **Language**: TypeScript
- **ORM**: Drizzle ORM (configured, not used)
- **Database**: PostgreSQL (configured, not used)
- **Auth**: JWT + bcrypt (functions defined, not integrated)
- **Validation**: Zod schemas
- **Logging**: Custom logger (sanitizes passwords)
- **Package manager**: npm

### DevOps / Infrastructure
- **Dev server**: Vite (port 5173) + Express (port 5000)
- **Docker**: Dockerfile + docker-compose.yml provided
- **Database**: PostgreSQL (configured via DATABASE_URL env var)
- **Build**: TypeScript compilation + Vite bundling

---

## Project Status & Pain Points

### ✅ Strengths
1. **Well-architected**: Clear separation of concerns (frontend/API/database)
2. **Fully typed**: TypeScript throughout, Zod validation
3. **Beautiful UI**: Professional design, responsive, dark mode ready
4. **Complete API**: All endpoints exist and return proper responses
5. **Scalable schema**: Database tables are properly normalized
6. **Developer experience**: Good tooling (Vite, tsx, Drizzle Kit)
7. **Security-conscious**: Password sanitization, auth middleware exists

### ⚠️ Current Bottlenecks
1. **MemStorage is a bottleneck**: Every endpoint returns in-memory mock data
   - Restarting server loses all data
   - Can't scale beyond single process
   - **Fix**: Swap to PostgreSQL (2 days effort, high impact)

2. **Frontend doesn't know about API**: All data is hardcoded mockData.ts
   - Frontend and API are disconnected
   - No way to test API without curl/Postman
   - **Fix**: Add React Query + API client (1-2 days effort)

3. **Missing OSINT ingestion**: Can't pull real threat intelligence
   - No connector for AlienVault OTX or MISP
   - No STIX 2.1 parser
   - **Fix**: Build ingestion layer (3-5 days effort)

4. **No risk scoring**: Alerts are hardcoded, not AI-generated
   - Can't compute threat risk dynamically
   - **Fix**: Implement rule-based engine (2-3 days effort)

5. **Auth is wired but not required**: JWT functions exist but routes don't use them
   - No login page for frontend
   - No token validation on protected routes
   - **Fix**: Wire auth middleware + build login UI (1-2 days)

---

## Recommended Next Steps (Priority Order)

### 🔴 CRITICAL (Do First)

#### Step 1: Connect Database to API (1-2 days)
**Why**: Everything else depends on persistent data
**What**: 
1. Create `server/db.ts` (already outlined in MVP_ARCHITECTURE.md)
2. Refactor `server/storage.ts` from MemStorage → DrizzleStorage
3. Update `server/index.ts` to call `healthCheck()` on startup
4. Run migrations: `npm run db:push`

**Impact**: API endpoints now read/write real data

**Effort**: ~400 lines of Drizzle ORM code (copy-paste from routes.ts)

#### Step 2: Wire Frontend to API (1-2 days)
**Why**: So you can actually use the app instead of seeing mock data
**What**:
1. Create `client/src/lib/apiClient.ts` with fetch wrapper + token handling
2. Create `client/src/hooks/useAPI.ts` with React Query helpers
3. Replace all mockData.ts calls with actual API calls
4. Add error boundaries and loading states

**Impact**: Frontend now pulls real data from API

**Effort**: ~300 lines, mostly find-and-replace

#### Step 3: Implement JWT Auth (1 day)
**Why**: Secure the API; enable user isolation
**What**:
1. Add login page to frontend (form + submit)
2. Wire `authenticateJWT` middleware to protected routes
3. Store JWT in localStorage on frontend
4. Add token to request headers

**Impact**: Multi-user system with role-based access control

**Effort**: ~200 lines (80% plumbing)

### 🟡 HIGH PRIORITY (Do Next)

#### Step 4: Build OSINT Ingestion Layer (3-5 days)
**Why**: This is what makes FinShadow useful—real threat intel
**What**:
1. Add `threatIntel`, `riskScores`, `baselineMetrics` tables to schema
2. Create `server/ingest/sources.ts` with feed URLs (OTX, MISP)
3. Create `server/ingest/parsers.ts` to normalize feeds
4. Create `server/ingest/index.ts` with cron scheduler
5. Add endpoints: GET/POST `/api/intel`

**Impact**: Real threat intelligence flowing in hourly

**Effort**: ~800 lines, requires external API keys

#### Step 5: Implement Risk Scoring Engine (2-3 days)
**Why**: Turns raw intel into actionable alerts
**What**:
1. Create `server/risk/engine.ts` with scoring rules:
   - Spike detection (fintech-related threat spikes)
   - Severity weighting (critical threats score higher)
   - Recency decay (older intel scores lower)
2. Add endpoint: POST `/api/risk/score` to compute risk
3. Wire to alert generation

**Impact**: Dynamic threat risk scores + automatic alerts

**Effort**: ~500 lines (mostly rules + tests)

### 🟢 MEDIUM PRIORITY (Nice to Have)

#### Step 6: Real-time Alerts (WebSocket)
- Add Socket.io for push notifications
- Frontend subscribes to user's alerts
- Server broadcasts when risk > threshold

#### Step 7: Dark Web Monitoring Integration
- Connect to leak databases (haveibeenpwned, etc.)
- Monitor Telegram/Discord for chatter
- Real-time credential alerts

#### Step 8: ML Model Integration
- Train/deploy risk prediction model
- Integrate with scoring engine
- Dashboard confidence metrics

---

## Files That Need Changes

### Tier 1: Critical (Do First)

| File | Change | Effort | Blocker |
|------|--------|--------|---------|
| `server/db.ts` | Create new; initialize Drizzle connection | 30 min | Yes |
| `server/storage.ts` | Refactor MemStorage → DrizzleStorage | 2 hours | Yes |
| `server/env.ts` | Finalize environment loading | 15 min | Yes |
| `server/index.ts` | Add healthCheck() call on startup | 15 min | No |
| `client/src/lib/apiClient.ts` | Create API client with auth | 1 hour | Yes |
| `client/src/hooks/useAPI.ts` | Create React Query helpers | 1 hour | Yes |
| `client/src/pages/*.tsx` | Replace mockData with API calls | 3 hours | Yes |
| `.env.example` | Document DATABASE_URL, JWT_SECRET | 10 min | No |

### Tier 2: High Priority (Do Next)

| File | Change | Effort | Impact |
|------|--------|--------|--------|
| `shared/schema.ts` | Add threatIntel, riskScores, baselineMetrics | 1 hour | High |
| `server/ingest/` | Create ingestion layer (4 new files) | 2 days | High |
| `server/risk/engine.ts` | Create risk scoring engine | 1.5 days | High |
| `client/src/pages/Auth.tsx` | Create login/signup pages | 1 day | High |
| `server/middleware/auth.ts` | Wire JWT to all protected routes | 2 hours | High |

### Tier 3: Medium Priority (Polish)

| File | Change | Effort | Impact |
|------|--------|--------|--------|
| `client/src/components/ErrorBoundary.tsx` | Add error handling | 1 hour | Medium |
| `client/src/lib/hooks.ts` | Add useAuth, useAlerts hooks | 2 hours | Medium |
| `docker-compose.yml` | Ensure PostgreSQL service configured | 30 min | Low |
| `server/routes.ts` | Add endpoints for ingestion control | 1 hour | Low |

---

## How to Validate Progress

### After Step 1 (Database Connected):
```bash
# Test database connection
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Create a user (should persist to database)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass","email":"test@example.com"}'

# Restart server, query user (should still exist)
curl http://localhost:5000/api/users/test-id
```

### After Step 2 (Frontend Connected):
```bash
# Frontend should show real data from API
# No more "mock" labels
# Page loads show spinner → data
# Updating fraud findings persists across page refreshes
```

### After Step 3 (Auth Working):
```bash
# Login form should accept credentials
# Get JWT token back
# Store in localStorage
# Use on subsequent requests
```

### After Step 4 (Ingestion Running):
```bash
# Check ingested threats
curl http://localhost:5000/api/intel?limit=10
# Should return real data from AlienVault OTX

# Check for duplicates (content hash deduplication)
curl http://localhost:5000/api/intel?search=malware
# Results should be deduplicated
```

---

## Estimated Timeline

| Phase | Tasks | Effort | Start | End |
|-------|-------|--------|-------|-----|
| **1: Database** | Connect PostgreSQL, MemStorage → Drizzle | 1-2 days | Dec 22 | Dec 24 |
| **2: Frontend API** | Wire React to API, add error handling | 1-2 days | Dec 24 | Dec 26 |
| **3: Auth** | Implement JWT, login page, role-based access | 1 day | Dec 26 | Dec 27 |
| **4: OSINT Ingestion** | Build ingestion layer for OTX/MISP feeds | 3-5 days | Dec 27 | Jan 1 |
| **5: Risk Scoring** | Implement threat risk engine | 2-3 days | Jan 1 | Jan 3 |
| **6+: Polish & Advanced** | WebSocket alerts, ML models, dark web monitoring | 2+ weeks | Jan 3 | Ongoing |

**MVP complete by**: ~January 3rd (assuming 2-3 days work per phase)  
**Production ready by**: Late January (with hardening, testing, deployment)

---

## Key Decision Points

### 1. Database Choice ✅ DECIDED: PostgreSQL
- Drizzle ORM already configured
- Good for relational threat intel data
- Scales to millions of records

### 2. Authentication Method ✅ DECIDED: JWT + Bcrypt
- Middleware already defined
- Standard for REST APIs
- No external service needed

### 3. Real-time Data ⚠️ TO DECIDE: WebSocket vs Polling
- **Polling (simpler)**: Frontend polls `/api/alerts` every 10s
- **WebSocket (better UX)**: Socket.io for push notifications
- Recommendation: Start with polling, add WebSocket in Phase 6

### 4. OSINT Feed Priority ⚠️ TO DECIDE: OTX vs MISP
- **AlienVault OTX**: Easy API, free tier, good for MVP
- **MISP**: More comprehensive, requires instance
- Recommendation: Start with OTX, add MISP later

### 5. Risk Scoring Approach ✅ SUGGESTED: Rule-based (not ML)
- Rules: spike detection, severity weighting, recency decay
- Easier to explain to analysts ("why this alert?")
- ML models can replace later

---

## Code Quality Notes

### What's Good:
- ✅ Type safety throughout (TypeScript strict mode recommended)
- ✅ Input validation on all endpoints (Zod)
- ✅ Error messages are clear and actionable
- ✅ Logging sanitizes sensitive data
- ✅ Components are reusable and well-organized

### What Needs Improvement:
- ⚠️ Add error boundaries in React
- ⚠️ Add integration tests (currently no tests)
- ⚠️ Add database migrations strategy
- ⚠️ Document API with OpenAPI/Swagger
- ⚠️ Add rate limiting to endpoints
- ⚠️ Add CSRF protection

---

## Quick Reference: Commands

```bash
# Development
npm run dev              # Start Express server (port 5000)
npm run dev:client      # Start Vite dev server (port 5173)
npm run dev:all         # Both simultaneously (concurrently)

# Database
npm run db:push         # Apply migrations to PostgreSQL
npm run db:generate     # Generate migration files
npm run db:studio       # Open Drizzle Studio GUI

# Building
npm run build           # Compile TypeScript
npm run check           # Type check without emitting
npm start               # Run production build

# Maintenance
npm run db:pull         # Introspect PostgreSQL (update schema.ts)
```

---

## Conclusion

FinShadow is **well-architected and close to functional**. The main work ahead is:

1. **Connect the pieces**: Database ↔ API ↔ Frontend (Phases 1-3)
2. **Add real data**: OSINT ingestion (Phase 4)
3. **Smart scoring**: Risk engine (Phase 5)
4. **Polish**: WebSocket alerts, error handling, tests (Phase 6+)

**No fundamental redesign needed.** Just solid execution on the MVP phases already defined.

Start with **Phase 1 (Database)** today—it's the highest-leverage work and unblocks everything else.

---

**Next Action**: Open `EXECUTION_CHECKLIST.md` and work through Tasks 1.1-1.5 in order. Each has specific acceptance criteria you can check off.
