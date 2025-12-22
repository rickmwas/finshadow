# FinShadow MVP Execution Checklist

This file tracks concrete, actionable tasks for implementing the MVP. Each task references specific files and has clear acceptance criteria.

---

## Phase 1: Database Setup ✅ Ready to Execute

### Task 1.1: Update `shared/schema.ts` with new tables

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**What to do**:
1. Add `threatIntel` table (ingested OSINT data)
2. Add `riskScores` table (computed threat risk)
3. Add `baselineMetrics` table (spike detection baselines)
4. Modify `alerts` table to add `riskScoreId` and `threatIntelId` foreign keys
5. Add Zod insert schemas for all new tables

**Files**:
- `shared/schema.ts` (modify + extend)

**Acceptance Criteria**:
- [ ] `npm run check` passes (TypeScript compilation)
- [ ] All 3 new tables defined with proper indexes
- [ ] Foreign key constraints set up correctly
- [ ] Zod schemas export without errors
- [ ] Schema file is < 400 lines (use comments if needed)

**Risk**: NONE (pure schema, no data migration yet)

---

### Task 1.2: Create `server/db.ts` — Database connection module

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**What to do**:
1. Create new file `server/db.ts`
2. Initialize Drizzle ORM with PostgreSQL connection
3. Export `db` singleton and `connection` pool
4. Add `healthCheck()` function

**Files**:
- `server/db.ts` (new)

**Code to include**:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var is required");
}

export const connection = postgres(process.env.DATABASE_URL);
export const db = drizzle(connection);

export async function healthCheck(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    return false;
  }
}
```

**Acceptance Criteria**:
- [ ] File exports `db` and `connection`
- [ ] `healthCheck()` function exists and is testable
- [ ] No hardcoded credentials or secrets
- [ ] TypeScript compilation passes

---

### Task 1.3: Create `server/env.ts` — Environment variable loader

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**What to do**:
1. Create `server/env.ts`
2. Define all required env vars with validation
3. Export typed environment object

**Files**:
- `server/env.ts` (new)
- `.env.example` (update)

**Code**:
```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().default("5000").transform(Number),
  DATABASE_URL: z.string().describe("PostgreSQL connection string"),
  JWT_SECRET: z.string().default("dev-secret-key"),
  ALIENVALULT_OTX_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

**Acceptance Criteria**:
- [ ] All required env vars documented in `.env.example`
- [ ] Zod validation prevents startup if DATABASE_URL missing
- [ ] No defaults for sensitive vars (JWT_SECRET OK to default in dev)

---

### Task 1.4: Refactor `server/storage.ts` — Replace MemStorage with DrizzleStorage

**Status**: Not started  
**Estimated**: 2 days  
**Owner**: Backend engineer  
**Blocks**: Task 2.x, 3.x, 5.x

**What to do**:
1. Keep `IStorage` interface (don't break contract)
2. Replace `MemStorage` class with `DrizzleStorage` class
3. Implement all ~40 methods using `db.select()`, `db.insert()`, etc.
4. Export singleton: `export const storage = new DrizzleStorage()`
5. Remove all `Map<>` data structures

**Files**:
- `server/storage.ts` (replace implementation)

**Methods to implement** (example for users):
```typescript
async getUser(id: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0];
}

async getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result[0];
}

async createUser(insertUser: InsertUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(insertUser)
    .returning();
  return user;
}
```

**Acceptance Criteria**:
- [ ] All 40+ methods implemented with Drizzle queries
- [ ] `npm run check` passes
- [ ] No more references to `Map<>` or "in-memory"
- [ ] Error handling: DB connection errors throw, not return undefined
- [ ] Methods are async (keep interface compatible)
- [ ] Code is readable (< 500 lines; use comments for complex queries)

**Testing**:
```bash
# After implementation, verify:
npm run dev
# Open browser: http://localhost:5000/api/health
# Should return {"status":"ok"}
```

---

### Task 1.5: Update `server/index.ts` — Add DB health check

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**What to do**:
1. Import `healthCheck()` from `server/db.ts`
2. Call `healthCheck()` during startup
3. Exit with error if DB unreachable in production
4. Log DB connection status

**Files**:
- `server/index.ts` (modify startup block)

**Change**:
```typescript
(async () => {
  // NEW: Check DB connectivity before starting
  const dbHealthy = await healthCheck();
  if (!dbHealthy) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Database unreachable. Aborting startup.");
      process.exit(1);
    } else {
      console.warn("⚠️  Database unreachable. Continuing in dev mode...");
    }
  } else {
    log("✅ Database connection healthy");
  }

  await registerRoutes(httpServer, app);
  // ... rest of startup
})();
```

**Acceptance Criteria**:
- [ ] Server starts only if DB is reachable (production)
- [ ] Helpful error message logged
- [ ] Server still starts in dev (with warning) if DB unreachable

---

### Task 1.6: Update `.env.example` — Add required env vars

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**Files**:
- `.env.example` (new/update)

**Content**:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finshadow

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended

# Optional: OSINT API Keys
ALIENVALULT_OTX_API_KEY=

# Runtime
NODE_ENV=development
PORT=5000
```

**Acceptance Criteria**:
- [ ] All env vars documented
- [ ] Example values are safe (no real secrets)
- [ ] Developer can copy `.env.example` → `.env` and run

---

### Task 1.7: Update `package.json` — Add DB-related scripts

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**What to do**:
1. Add `"db:push"` script (run migrations)
2. Add `"db:studio"` script (Drizzle Studio for debugging)

**Files**:
- `package.json` (modify scripts section)

**Changes**:
```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx server/seeds/seed.ts"
  }
}
```

**Acceptance Criteria**:
- [ ] Scripts are executable: `npm run db:push`
- [ ] Scripts documented in README

---

## Phase 1 Validation ✅ MUST PASS BEFORE Phase 2

**Integration test**:
```bash
# 1. Create .env file with DATABASE_URL pointing to real PostgreSQL
# 2. Run:
npm install
npm run db:push  # Create tables
npm run dev      # Start server

# 3. In another terminal, test:
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}

# 4. Insert test user:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123","email":"test@example.com"}'

# 5. Verify in DB:
# SELECT * FROM users;  -- should have 1 row
```

---

## Phase 2: Authentication & Security ✅ Ready (after Phase 1)

### Task 2.1: Add dependencies to `package.json`

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**Files**:
- `package.json` (modify dependencies)

**Add**:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.1.0",
    "bcrypt": "^5.1.0"
  }
}
```

**Then run**: `npm install`

---

### Task 2.2: Create `server/auth.ts` — JWT & password utilities

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Files**:
- `server/auth.ts` (new)

**Export functions**:
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`
- `generateToken(payload: JWTPayload): string`
- `verifyToken(token: string): JWTPayload | null`
- `extractToken(authHeader: string | undefined): string | null`

**Acceptance Criteria**:
- [ ] `hashPassword()` uses bcrypt with salt rounds = 10
- [ ] Tokens expire after 24 hours
- [ ] `verifyPassword()` is constant-time (bcrypt.compare)
- [ ] No hardcoded secrets in code (use env var)
- [ ] TypeScript types are strict (`JWTPayload` interface)

---

### Task 2.3: Create `server/middleware/auth.ts` — JWT middleware

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Files**:
- `server/middleware/auth.ts` (new)

**Export functions**:
- `authenticateJWT(req, res, next)` — Verify JWT token
- `requireRole(...roles)` — RBAC middleware

**Acceptance Criteria**:
- [ ] Middleware sets `req.user` with userId, username, role
- [ ] Returns 401 if token missing/invalid
- [ ] Returns 403 if user lacks required role
- [ ] Works with Express pipeline (calls `next()`)

---

### Task 2.4: Update `server/routes.ts` — Secure auth endpoints

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Changes**:
1. Update `POST /api/auth/register` to hash password before storing
2. Update `POST /api/auth/login` to verify password, return JWT token
3. Add all PROTECTED routes after these auth endpoints
4. Remove plaintext password comparisons

**Code snippet for login**:
```typescript
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Use bcrypt comparison instead of ===
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as "admin" | "analyst" | "viewer",
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    log(`Login error: ${error.message}`, "auth");
    res.status(500).json({ error: "Login failed" });
  }
});
```

**Acceptance Criteria**:
- [ ] No plaintext password comparisons remain
- [ ] Login returns JWT token in response
- [ ] Register hashes password before DB insert
- [ ] Timestamps show hashing doesn't block (async)

---

### Task 2.5: Update `server/index.ts` — Apply auth middleware globally

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Changes**:
```typescript
import { authenticateJWT, requireRole } from "./middleware/auth";

// Public routes (NO auth middleware)
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);
app.get("/api/health", healthHandler);

// Protected routes (require JWT)
app.use("/api/intel", authenticateJWT);
app.use("/api/risk", authenticateJWT);
app.use("/api/alerts", authenticateJWT);
app.use("/api/threat-actors", authenticateJWT);
app.use("/api/fraud", authenticateJWT);
app.use("/api/transactions", authenticateJWT);

// Admin-only routes
app.use("/api/admin", authenticateJWT, requireRole("admin"));
app.use("/api/audit-logs", authenticateJWT, requireRole("admin", "analyst"));
```

**Acceptance Criteria**:
- [ ] All `/api/*` routes (except /auth) require JWT
- [ ] `req.user` is populated in protected handlers
- [ ] 401 returned if no token
- [ ] 403 returned if insufficient role

---

### Task 2.6: Sanitize logging — Don't log passwords/tokens

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Changes to `server/index.ts`**:
```typescript
function isSensitiveEndpoint(path: string): boolean {
  return path.includes("/auth") || 
         path.includes("/password") ||
         path.includes("/login");
}

function sanitizeResponse(data: any): any {
  if (data && typeof data === "object") {
    const copy = { ...data };
    if (copy.password) delete copy.password;
    if (copy.token) copy.token = "***";
    if (copy.hash) delete copy.hash;
    return copy;
  }
  return data;
}

// In request logging middleware:
res.on("finish", () => {
  const duration = Date.now() - start;
  if (path.startsWith("/api")) {
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    // NEVER log sensitive response data
    if (capturedJsonResponse && !isSensitiveEndpoint(path)) {
      logLine += ` :: ${JSON.stringify(sanitizeResponse(capturedJsonResponse))}`;
    }

    log(logLine);
  }
});
```

**Acceptance Criteria**:
- [ ] Passwords never logged
- [ ] JWT tokens abbreviated or hidden ("***")
- [ ] Auth endpoint responses not logged
- [ ] Other endpoints' responses still logged for debugging

---

## Phase 2 Validation ✅ MUST PASS BEFORE Phase 3

**Integration test**:
```bash
# 1. Start server
npm run dev

# 2. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123","email":"alice@example.com"}'
# Response: 201 {"id":"...","username":"alice",...}

# 3. Login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123"}' | jq -r .token)

# 4. Use token to access protected endpoint
curl http://localhost:5000/api/intel \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [...]  (even if empty)

# 5. Verify token is required
curl http://localhost:5000/api/intel
# Response: 401 {"error":"No token provided"}

# 6. Check database — passwords should be hashed, not plaintext
# SELECT username, password FROM users;  
# password column should look like: $2b$10$...
```

---

## Phase 3: Ingestion Layer 🔄 Ready (after Phase 1 + 2)

### Task 3.1: Create `server/ingest/sources.ts` — OSINT feed definitions

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Files**:
- `server/ingest/sources.ts` (new)

**Content**:
```typescript
export interface SourceConfig {
  id: string;
  name: string;
  url: string;
  type: "otx" | "misp" | "stix" | "json";
  headers?: Record<string, string>;
  updateIntervalHours: number;
}

export const INGEST_SOURCES: SourceConfig[] = [
  {
    id: "otx-fintech",
    name: "AlienVault OTX - Fintech Threats",
    url: "https://otx.alienvault.com/api/v1/pulses/search?query=fintech&limit=100",
    type: "otx",
    updateIntervalHours: 6,
  },
  // Add more sources as needed
];
```

**Acceptance Criteria**:
- [ ] Exported as constant array
- [ ] TypeScript interface for `SourceConfig`
- [ ] At least 1 real OTX feed configured

---

### Task 3.2: Create `server/ingest/normalizer.ts` — OSINT parser & normalizer

**Status**: Not started  
**Estimated**: 1.5 days  
**Owner**: Backend engineer

**Files**:
- `server/ingest/normalizer.ts` (new)

**Export functions**:
- `normalizeOTXPulse(pulse: any): NormalizedThreat`
- `computeContentHash(threat: ...): string`
- `inferThreatType(indicators: any[]): ThreatType`
- `mapOTXSeverity(tlp?: string): Severity`

**Acceptance Criteria**:
- [ ] Converts OTX pulse JSON → normalized threat schema
- [ ] Extracts indicators (IPs, domains, hashes, URLs)
- [ ] Filters tags (fintech-relevant)
- [ ] Computes SHA256 content hash for dedup
- [ ] Maps OTX TLP to severity levels
- [ ] Handles missing/null fields gracefully

---

### Task 3.3: Create `server/ingest/deduplicator.ts` — Dedup by content hash

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Files**:
- `server/ingest/deduplicator.ts` (new)

**Export functions**:
- `isDuplicate(contentHash: string): Promise<boolean>`
- `updateLastSeen(contentHash: string, now: Date): Promise<void>`

**Acceptance Criteria**:
- [ ] Queries `threat_intel` table by content_hash
- [ ] Returns boolean efficiently (single DB query)
- [ ] Updates `lastSeen` timestamp if duplicate seen again

---

### Task 3.4: Create `server/ingest/index.ts` — Main ingest orchestrator

**Status**: Not started  
**Estimated**: 1.5 days  
**Owner**: Backend engineer

**Files**:
- `server/ingest/index.ts` (new)

**Export functions**:
- `ingestFromSource(sourceConfig: SourceConfig): Promise<void>`
- `runAllIngestions(): Promise<void>`
- `scheduleIngestCron(): void`
- `initializeIngest(): void`

**Acceptance Criteria**:
- [ ] Fetches from URL (with error handling)
- [ ] Parses JSON response
- [ ] Normalizes each item
- [ ] Checks for duplicates
- [ ] Batch inserts new threats to DB
- [ ] Logs counts (inserted, duplicates, errors)
- [ ] Can be scheduled via cron (e.g., every 6 hours)

---

### Task 3.5: Update `server/index.ts` — Initialize ingest on startup

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**Changes**:
```typescript
import { initializeIngest } from "./ingest";

(async () => {
  // ... existing startup ...

  if (await healthCheck()) {
    initializeIngest(); // Start ingest scheduler
  }

  httpServer.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
```

**Acceptance Criteria**:
- [ ] `initializeIngest()` called after DB health check
- [ ] Server starts even if ingest fails (non-blocking)
- [ ] Ingest errors logged but don't crash server

---

### Task 3.6: Seed test data (optional but recommended)

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Files**:
- `server/seeds/seed.ts` (new)

**What to do**:
1. Create 10–20 test threat intelligence records
2. Manually insert to DB for fast testing (don't wait for OTX cron)
3. Run: `npm run db:seed`

**Acceptance Criteria**:
- [ ] Seed script creates realistic test data
- [ ] All threat types represented (malware, IP, domain, hash)
- [ ] Severity levels distributed (critical, high, medium, low)
- [ ] Script is idempotent (can run multiple times safely)

---

## Phase 3 Validation ✅ MUST PASS BEFORE Phase 4

**Integration test**:
```bash
# 1. Run ingest manually (to avoid waiting 6 hours):
npm run ingest:once  # If you add this script

# OR trigger via API (create endpoint for admin):
curl -X POST http://localhost:5000/api/admin/ingest \
  -H "Authorization: Bearer $TOKEN"

# 2. Query threat intel endpoint
curl http://localhost:5000/api/intel?limit=20 \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [{id, source, title, severity, ...}, ...]

# 3. Verify dedup works
# Run ingest again — should see "X duplicates skipped"

# 4. Check database
# SELECT COUNT(*) FROM threat_intel;  -- should be > 0
# SELECT * FROM threat_intel ORDER BY discovered_at DESC LIMIT 5;
```

---

## Phase 4: Risk Engine 🔄 Ready (after Phase 1 + 3)

### Task 4.1: Create `server/risk/engine.ts` — Rule-based risk scoring

**Status**: Not started  
**Estimated**: 2 days  
**Owner**: Backend engineer + risk analyst

**Files**:
- `server/risk/engine.ts` (new)

**Export functions**:
- `computeRisk(intelRecord: ThreatIntel): Promise<RiskComputation>`
- `computeAllRisks(): Promise<RiskComputation[]>`
- `detectSpikes(): Promise<void>`

**Rules to implement**:
1. **Severity Weighting** (+80 critical, +60 high, +40 medium, +20 low)
2. **Fintech Relevance** (+20 if tags/title contain fintech keywords)
3. **Recency Decay** (−10% per 30 days old, bottoms at 50%)
4. **Indicator Count** (+10 if > 5 indicators)
5. **Spike Detection** (alert if daily count > 1.5x baseline)

**Acceptance Criteria**:
- [ ] Final score is 0–100 (clamped)
- [ ] Severity derived from score (critical ≥ 85, high ≥ 70, etc.)
- [ ] Human-readable reasoning generated
- [ ] Baseline metrics tracked in DB
- [ ] Spike detection compares 24-hour vs 30-day average

---

### Task 4.2: Create `server/risk/scheduler.ts` — Risk engine cron

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Files**:
- `server/risk/scheduler.ts` (new)

**Export**:
- `initializeRiskEngine(): void`

**What to do**:
1. Use `node-cron` to run `computeAllRisks()` hourly
2. Also run `detectSpikes()` to track baselines
3. Log results

**Acceptance Criteria**:
- [ ] Runs every hour (cron: `0 * * * *`)
- [ ] Logs: "Risk computation complete: X threats scored"
- [ ] Errors don't crash server (try/catch)

---

### Task 4.3: Update `server/index.ts` — Initialize risk engine

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Backend engineer

**Changes**:
```typescript
import { initializeRiskEngine } from "./risk/scheduler";

(async () => {
  // ... startup ...
  
  if (await healthCheck()) {
    initializeIngest();
    initializeRiskEngine(); // Start risk scheduler
  }

  httpServer.listen(port, ...);
})();
```

**Acceptance Criteria**:
- [ ] Risk engine initializes after ingest
- [ ] Server still starts if risk engine fails

---

## Phase 4 Validation ✅ MUST PASS BEFORE Phase 5

**Integration test**:
```bash
# 1. Ensure threat_intel table has data (from Phase 3)

# 2. Manually trigger risk computation:
curl -X POST http://localhost:5000/api/admin/compute-risks \
  -H "Authorization: Bearer $TOKEN"

# OR wait 1 hour for cron

# 3. Query risk scores
curl http://localhost:5000/api/risk?limit=20 \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [{threatIntelId, score, severity, reasoning, ...}, ...]

# 4. Verify alert generation (will implement in Phase 5)
# Check alerts table if any were created

# 5. Database check
# SELECT * FROM risk_scores ORDER BY score DESC LIMIT 10;
# SELECT * FROM baseline_metrics;
```

---

## Phase 5: API Refactoring 🔄 Ready (after Phase 2 + 4)

### Task 5.1: Create `/api/intel` endpoint — View ingested OSINT

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Endpoint**: `GET /api/intel`  
**Auth**: JWT required  
**Query params**:
- `severity` (critical, high, medium, low)
- `source` (AlienVault OTX, MISP, etc.)
- `limit` (default 50)
- `offset` (default 0)

**Response**: `200 [{id, source, title, indicators, severity, ...}, ...]`

**Acceptance Criteria**:
- [ ] Filters by severity
- [ ] Filters by source
- [ ] Paginates with limit/offset
- [ ] Results ordered by discoveredAt DESC
- [ ] Requires JWT auth
- [ ] Sanitizes response (no internal fields)

---

### Task 5.2: Create `/api/risk` endpoint — View computed risk scores

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Endpoint**: `GET /api/risk`  
**Auth**: JWT required  
**Query params**:
- `severity` (critical, high, medium, low)
- `minScore` (integer 0–100)
- `limit` (default 50)

**Response**: `200 [{threatIntelId, score, severity, reasoning, threat: {...}}, ...]`

**Notes**:
- Enrich response with threat intel details
- Order by score DESC (highest risk first)

**Acceptance Criteria**:
- [ ] Filters by severity
- [ ] Filters by minScore
- [ ] Joins with threat_intel to return full context
- [ ] Requires JWT auth

---

### Task 5.3: Create `/api/alerts` endpoints — View + manage alerts

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Backend engineer

**Endpoints**:
- `GET /api/alerts` — List alerts (analyst sees own only)
- `PUT /api/alerts/:id/read` — Mark as read
- `POST /api/alerts` — Create new alert (admin only)

**Acceptance Criteria**:
- [ ] Analysts see only their own alerts (role-based)
- [ ] Admins see all
- [ ] Can filter by `unread=true`
- [ ] Alerts linked to risk_score (reference)
- [ ] All require JWT auth

---

### Task 5.4: Create `/api/admin/ingest` endpoint (optional)

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**Endpoint**: `POST /api/admin/ingest`  
**Auth**: JWT required (admin only)

**What to do**:
Manually trigger ingest cycle (useful for testing)

```typescript
app.post("/api/admin/ingest", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    await runAllIngestions();
    res.json({ message: "Ingest cycle triggered" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Acceptance Criteria**:
- [ ] Admin-only endpoint
- [ ] Triggers `runAllIngestions()`
- [ ] Returns success/error status

---

### Task 5.5: Update `GET /api/dashboard` endpoint — Return real data

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Backend engineer

**What to do**:
Modify existing dashboard endpoint to return actual stats from DB

**Response should include**:
```json
{
  "activeThreats": 42,
  "criticalRisks": 5,
  "highRisks": 12,
  "avgRiskScore": 65,
  "recentAlerts": [...],
  "threatsBySource": { "AlienVault OTX": 30, "MISP": 12 },
  "threatsSeverity": { "critical": 5, "high": 12, "medium": 20, "low": 5 }
}
```

**Acceptance Criteria**:
- [ ] Stats aggregated from threat_intel + risk_scores tables
- [ ] Counts are accurate
- [ ] Requires JWT auth

---

## Phase 5 Validation ✅ MUST PASS BEFORE Phase 6

**Integration test**:
```bash
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123"}' | jq -r .token)

# Test intel endpoint
curl http://localhost:5000/api/intel?severity=critical \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [...]

# Test risk endpoint
curl http://localhost:5000/api/risk?minScore=70 \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [...]

# Test alerts
curl http://localhost:5000/api/alerts?unread=true \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 [...]

# Test admin trigger (with admin token)
curl -X POST http://localhost:5000/api/admin/ingest \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Response: 200 {"message":"Ingest cycle triggered"}
```

---

## Phase 6: Frontend Integration 🔄 Ready (after Phase 5)

### Task 6.1: Create `client/src/hooks/useAuth.ts` — Auth hook

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Frontend engineer

**Files**:
- `client/src/hooks/useAuth.ts` (new)

**Export**:
- `useAuth(): AuthState & { login, logout, register }`

**Acceptance Criteria**:
- [ ] Manages JWT token in localStorage
- [ ] `login()` function
- [ ] `logout()` function
- [ ] `register()` function
- [ ] `isAuthenticated` boolean
- [ ] Redirects to /login on logout

---

### Task 6.2: Create `client/src/pages/Login.tsx` — Login page

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Frontend engineer

**Files**:
- `client/src/pages/Login.tsx` (new)

**Features**:
- Username/password form
- "Register" link
- Submit calls `useAuth().login()`
- Redirects to `/dashboard` on success
- Shows error toast on failure

**Acceptance Criteria**:
- [ ] Form is responsive
- [ ] Uses shadcn/ui components
- [ ] Validates input (non-empty)
- [ ] Shows loading state
- [ ] Handles errors gracefully

---

### Task 6.3: Update `client/src/pages/Dashboard.tsx` — Wire to API

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Frontend engineer

**Changes**:
1. Replace mock `initialStats` with `useQuery(['dashboard'], () => fetch('/api/dashboard')...)`
2. Show loading skeleton while fetching
3. Handle errors (show toast)
4. Replace alert list with real data

**Acceptance Criteria**:
- [ ] Data fetched from `/api/dashboard`
- [ ] React Query caching works (refetch on focus)
- [ ] Loading + error states shown
- [ ] Stats displayed in real-time

---

### Task 6.4: Update `client/src/pages/DarkWebIntel.tsx` — Wire to threat intel API

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Frontend engineer

**Changes**:
1. Replace mock intel feed with real `/api/intel` calls
2. Add severity filter dropdown
3. Add pagination (limit/offset)
4. Wire live feed simulation to real data

**Acceptance Criteria**:
- [ ] Data fetched from `/api/intel`
- [ ] Filters work (severity)
- [ ] Pagination works
- [ ] Auto-refresh every 30 seconds

---

### Task 6.5: Update `client/src/pages/FraudFindings.tsx` — Wire to alerts API

**Status**: Not started  
**Estimated**: 1 day  
**Owner**: Frontend engineer

**Changes**:
1. Replace mock findings with real alerts from `/api/alerts`
2. Add "Mark as read" button
3. Add filters (unread, severity)

**Acceptance Criteria**:
- [ ] Data fetched from `/api/alerts`
- [ ] "Mark as read" updates backend
- [ ] Filters work
- [ ] Reflected in UI after update

---

### Task 6.6: Update `client/src/App.tsx` — Add login route & auth guard

**Status**: Not started  
**Estimated**: 0.5 day  
**Owner**: Frontend engineer

**Changes**:
1. Add `/login` route
2. Protect dashboard routes (redirect if not authenticated)
3. Add logout button to header

**Acceptance Criteria**:
- [ ] Login route works
- [ ] Unauthenticated users redirected to login
- [ ] Logout clears token + redirects
- [ ] Header shows username when logged in

---

### Task 6.7: Update `client/src/lib/queryClient.ts` — Configure React Query

**Status**: Not started  
**Estimated**: 0.25 day  
**Owner**: Frontend engineer

**Changes**:
1. Set default cache times (5 min for intel, 1 min for alerts)
2. Add retry logic (1 retry for failed requests)
3. Setup error handlers

**Acceptance Criteria**:
- [ ] Queries cache appropriately
- [ ] Failed requests retry once
- [ ] Stale data refetches on window focus

---

## Phase 6 Validation ✅ MUST PASS (MVP Complete!)

**End-to-end test**:
```bash
# 1. Open browser: http://localhost:5000
# Should see login page (not mock dashboard)

# 2. Click "Register"
# Create account: alice@example.com / SecurePass123

# 3. Login
# Should redirect to Dashboard

# 4. Dashboard should show:
# - Real threat stats (from DB, not mock data)
# - Real recent alerts (from /api/alerts)
# - Real risk KPIs (from /api/risk)

# 5. Click "Threat Intel" tab
# Should show real OSINT threats (from /api/intel)

# 6. Click "Alerts" tab
# Should show real alerts (from /api/alerts)
# Test "Mark as read" — should update in real-time

# 7. Logout
# Should redirect to login page
# Token cleared from localStorage

# 8. Browser DevTools → Network tab
# Verify all requests have "Authorization: Bearer ..." header
# Verify 401 if header missing
```

---

## Summary

| Phase | Tasks | Status | Est. Time |
|-------|-------|--------|-----------|
| 1 | DB setup | 🔄 Ready | 3 days |
| 2 | Auth & security | 🔄 Ready | 2 days |
| 3 | Ingestion layer | 🔄 Ready | 4 days |
| 4 | Risk engine | 🔄 Ready | 3 days |
| 5 | API refactoring | 🔄 Ready | 2 days |
| 6 | Frontend integration | 🔄 Ready | 3 days |
| **TOTAL** | **MVP** | **🔄 Ready** | **17 days** |

---

## Critical Path

To minimize time, parallelize:
- **Weeks 1**: Phase 1 (database) + Task 2.1–2.3 (auth setup)
- **Week 2**: Phase 2 (finish auth) + Phase 3 (ingest)
- **Week 3**: Phase 4 (risk) + Phase 5 (API)
- **Week 4**: Phase 6 (frontend) + Testing & polish

---

**Status**: ✅ Ready for execution  
**Generated**: 2025-12-15  
**Next Step**: Start with Task 1.1 (update schema.ts)
