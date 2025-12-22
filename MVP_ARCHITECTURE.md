# FinShadow MVP Architecture & Execution Plan

## Executive Summary

This document maps the MVP requirements to the existing FinShadow codebase and defines a phased execution strategy. The MVP transforms FinShadow from a mock-data UI into a **real, production-grade threat intelligence ingestion and alerting system** that:

1. **Ingests** legal, public OSINT feeds (AlienVault OTX, MISP)
2. **Normalizes** data into a unified threat intelligence schema
3. **Scores** threats using explainable, rule-based logic
4. **Alerts** analysts automatically when risk thresholds are exceeded
5. **Visualizes** threat landscape and risk trends in a clean dashboard

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Data Ingestion Layer (Legal OSINT Feeds)                           │
│  ├─ AlienVault OTX (free OSINT feed)                                │
│  ├─ MISP Export API (public threat feeds)                           │
│  └─ STIX 2.1 parsers (standardized threat format)                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (Cron: hourly)
┌──────────────────────────▼──────────────────────────────────────────┐
│  Ingestion Module (server/ingest/)                                  │
│  ├─ Fetch & parse feeds                                             │
│  ├─ Deduplicate by content hash (SHA256)                            │
│  ├─ Normalize to threat_intel schema                                │
│  └─ Persist to PostgreSQL                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  Risk Engine (server/risk/engine.ts)                                │
│  ├─ Rule 1: Spike detection (fintech-related chatter vs baseline)   │
│  ├─ Rule 2: Severity weighting (critical threats score higher)      │
│  ├─ Rule 3: Recency decay (older intel scores lower)                │
│  └─ Output: Risk scores + human-readable reasons                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (Runs on demand + after ingest)
┌──────────────────────────▼──────────────────────────────────────────┐
│  Alert Generator                                                    │
│  ├─ Compare risk vs thresholds (high > 70, critical > 85)           │
│  ├─ Create alert records linked to risk_scores                      │
│  └─ Persist to alerts table                                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  REST API Layer (Express)                                           │
│  ├─ GET /api/intel (view ingested OSINT)                           │
│  ├─ GET /api/risk (view computed risk scores)                      │
│  ├─ GET /api/alerts (view + acknowledge alerts)                    │
│  └─ All endpoints: JWT auth + RBAC (analyst, admin)               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (HTTP/REST)
┌──────────────────────────▼──────────────────────────────────────────┐
│  Frontend (React)                                                   │
│  ├─ Dashboard: KPIs, risk timeline, top threats                    │
│  ├─ Threat Intel: Searchable OSINT feed                            │
│  ├─ Alerts: Real-time threat notifications                         │
│  └─ All pages: React Query caching + JWT bearer tokens             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Setup (PostgreSQL + Drizzle ORM)

**Goal**: Replace in-memory MemStorage with real PostgreSQL persistence.

### Files to Modify

#### `shared/schema.ts` — **Extend with new tables**

**Add**: `threat_intel`, `risk_scores`, `baseline_metrics` tables

```typescript
// NEW TABLE: threat_intel (core ingested OSINT data)
export const threatIntel = pgTable(
  "threat_intel",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // Source metadata
    source: text("source").notNull(), // "AlienVault OTX", "MISP", etc
    sourceId: text("source_id"), // ID in original feed
    sourceUrl: text("source_url"), // Link to original
    
    // Threat data
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(), // "malware", "ip", "domain", "hash", "actor", "malicious_url"
    severity: text("severity").notNull(), // "critical", "high", "medium", "low", "info"
    
    // Indicators
    indicators: json("indicators").default([]), // Array of IoCs: [{type: "ip", value: "1.2.3.4"}, ...]
    tags: json("tags").default([]), // ["fintech", "ransomware", "APT28", ...]
    
    // Deduplication
    contentHash: varchar("content_hash").notNull().unique(), // SHA256(title + description + indicators)
    
    // Temporal
    firstSeen: timestamp("first_seen").notNull().defaultNow(),
    lastSeen: timestamp("last_seen").notNull().defaultNow(),
    discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    sourceIdx: index("threat_intel_source_idx").on(table.source),
    severityIdx: index("threat_intel_severity_idx").on(table.severity),
    typeIdx: index("threat_intel_type_idx").on(table.type),
    discoveredIdx: index("threat_intel_discovered_idx").on(table.discoveredAt),
    contentHashIdx: index("threat_intel_content_hash_idx").on(table.contentHash),
    tagsIdx: index("threat_intel_tags_idx").on(table.tags), // PostgreSQL jsonb indexing
  })
);

// NEW TABLE: risk_scores (computed threat risk per rule engine run)
export const riskScores = pgTable(
  "risk_scores",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // Scope
    threatIntelId: varchar("threat_intel_id").notNull().references(() => threatIntel.id, { onDelete: "cascade" }),
    
    // Score & reason
    score: integer("score").notNull(), // 0-100
    severity: text("severity").notNull(), // "critical", "high", "medium", "low" (derived from score)
    
    // Rules applied
    rulesFired: json("rules_fired").notNull(), // Array of rule names: ["fintech_spike", "severity_weighted", "recency_decay"]
    reasoning: text("reasoning").notNull(), // Human-readable explanation
    
    // Versioning
    engineVersion: varchar("engine_version").notNull().default("1.0"),
    
    // Temporal
    computedAt: timestamp("computed_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"), // Risk scores stale after 7 days
  },
  (table) => ({
    threatIntelIdIdx: index("risk_scores_threat_intel_id_idx").on(table.threatIntelId),
    scoreIdx: index("risk_scores_score_idx").on(table.score),
    severityIdx: index("risk_scores_severity_idx").on(table.severity),
  })
);

// NEW TABLE: baseline_metrics (for spike detection in risk engine)
export const baselineMetrics = pgTable(
  "baseline_metrics",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // What we're measuring
    metric: text("metric").notNull(), // "fintech_intel_count", "malware_variants", etc
    
    // Baseline window (e.g., last 30 days average)
    windowDays: integer("window_days").notNull().default(30),
    baselineValue: decimal("baseline_value", { precision: 10, scale: 2 }).notNull(),
    
    // Current value for comparison
    currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
    
    // Spike threshold (if current > baseline * threshold, alert)
    spikeThreshold: decimal("spike_threshold", { precision: 3, scale: 2 }).notNull().default(1.5), // 1.5x = 50% spike
    
    // Temporal
    calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    metricIdx: index("baseline_metrics_metric_idx").on(table.metric),
  })
);
```

**Modify**: Keep existing tables (`users`, `fraudFindings`, `alerts`, etc.) but update:
- Add `deletedAt` timestamp for soft deletes (optional for MVP, but recommended)
- Add `riskScoreId` foreign key to `alerts` table (links alert to risk computation)

```typescript
// MODIFY alerts table - add link to risk_scores
export const alerts = pgTable(
  "alerts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    type: text("type").notNull(), // "threat_intel", "risk_spike", etc
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: text("severity").notNull(),
    
    // NEW: Link alert to the risk score that triggered it
    riskScoreId: varchar("risk_score_id").references(() => riskScores.id, { onDelete: "set null" }),
    
    // NEW: Link to threat intel
    threatIntelId: varchar("threat_intel_id").references(() => threatIntel.id, { onDelete: "set null" }),
    
    read: boolean("read").default(false),
    relatedId: varchar("related_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("alerts_user_id_idx").on(table.userId),
    readIdx: index("alerts_read_idx").on(table.read),
    riskScoreIdIdx: index("alerts_risk_score_id_idx").on(table.riskScoreId),
  })
);
```

#### `server/db.ts` — **NEW FILE**

Create a Drizzle ORM database connection module:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// This is imported by all server modules
export const connection = postgres(process.env.DATABASE_URL!);
export const db = drizzle(connection);

export async function healthCheck() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    return true;
  } catch (e) {
    console.error("DB health check failed:", e);
    return false;
  }
}
```

#### `server/storage.ts` — **Refactor**

Replace `MemStorage` class with `DrizzleStorage` class that uses actual Drizzle queries. Keep the `IStorage` interface but swap implementation:

```typescript
// Keep interface, replace implementation
export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  // ... implement all methods using db.select(), db.insert(), etc
}

// Export single instance
export const storage = new DrizzleStorage();
```

#### `server/index.ts` — **Minor update**

Add health check startup validation:

```typescript
(async () => {
  // Verify DB connection before starting
  const dbHealthy = await healthCheck();
  if (!dbHealthy && process.env.NODE_ENV === "production") {
    console.error("Database unreachable. Aborting startup.");
    process.exit(1);
  }
  
  // ... rest of startup
})();
```

#### `.env.example` — **Update**

Add database configuration:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/finshadow
JWT_SECRET=your-jwt-secret-key-here
ALIENVALULT_OTX_API_KEY=your-api-key-optional
NODE_ENV=development
PORT=5000
```

#### `package.json` — **Update scripts**

Add database migration:

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "tsx server/migrations/run.ts"
  }
}
```

### Execution Steps

1. Update `shared/schema.ts` with new tables
2. Create `server/db.ts` with connection pooling
3. Refactor `server/storage.ts` from MemStorage to DrizzleStorage
4. Update `.env.example` with `DATABASE_URL`
5. Run `npm run db:push` to create tables
6. Test with `npm run dev` — API should still work, but now reading from PostgreSQL

---

## Phase 2: Authentication & Security

**Goal**: Replace plaintext passwords with bcrypt, add JWT token auth, enforce RBAC.

### Files to Modify

#### `package.json` — **Add dependencies**

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.1.0",
    "bcrypt": "^5.1.0"
  }
}
```

#### `server/auth.ts` — **NEW FILE**

Create JWT & password utilities:

```typescript
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  username: string;
  role: "admin" | "analyst" | "viewer";
  iat?: number;
  exp?: number;
}

// Hash password for storage
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token (expires in 24 hours)
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify and decode JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
```

#### `server/middleware/auth.ts` — **NEW FILE**

Create authentication & authorization middleware:

```typescript
import { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken } from "../auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: "admin" | "analyst" | "viewer";
      };
    }
  }
}

// Middleware: Verify JWT token
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  };

  next();
}

// Middleware: Require specific role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
```

#### `server/index.ts` — **Update**

Add auth middleware to protected routes:

```typescript
import { authenticateJWT, requireRole } from "./middleware/auth";

// Auth routes: NO middleware (public)
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);

// Protected routes: Require JWT auth
app.use("/api/intel", authenticateJWT);
app.use("/api/risk", authenticateJWT);
app.use("/api/alerts", authenticateJWT);
app.use("/api/threat-actors", authenticateJWT);
app.use("/api/fraud", authenticateJWT);

// Admin-only routes
app.use("/api/admin", authenticateJWT, requireRole("admin"));
app.use("/api/audit-logs", authenticateJWT, requireRole("admin", "analyst"));
```

#### `server/routes.ts` — **Update auth endpoints**

Replace plaintext password comparison with bcrypt:

```typescript
// POST /api/auth/register
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const validation = validateRequest(req.body, insertUserSchema);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check for existing user
    const existingUser = await storage.getUserByUsername(validation.data.username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(validation.data.password);
    
    const user = await storage.createUser({
      ...validation.data,
      password: hashedPassword,
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
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

    // Verify hashed password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return JWT token instead of raw user object
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
    res.status(500).json({ error: "Login failed" });
  }
});
```

#### Logging updates

**CRITICAL**: Sanitize logs to prevent password leakage:

```typescript
// In server/index.ts, update the request logging middleware
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

function isSensitiveEndpoint(path: string): boolean {
  return path.includes("/auth") || path.includes("/password");
}

function sanitizeResponse(data: any): any {
  if (data && typeof data === "object") {
    const copy = { ...data };
    if (copy.password) delete copy.password;
    if (copy.token) copy.token = "***";
    return copy;
  }
  return data;
}
```

---

## Phase 3: Ingestion Layer (server/ingest/)

**Goal**: Fetch legal OSINT feeds, deduplicate, normalize, and persist to `threat_intel` table.

### New Module Structure

```
server/ingest/
├── index.ts           # Main scheduler & orchestrator
├── sources.ts         # Feed definitions (OTX, MISP URLs)
├── parsers.ts         # Format-specific parsers (STIX 2.1, JSON, etc)
├── deduplicator.ts    # Content hash deduplication
└── normalizer.ts      # Convert any format to threat_intel schema
```

#### `server/ingest/sources.ts` — **Feed definitions**

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
    id: "otx-public",
    name: "AlienVault OTX - Fintech Threats",
    url: "https://otx.alienvault.com/api/v1/pulses/search?query=fintech&limit=100",
    type: "otx",
    updateIntervalHours: 6,
  },
  {
    id: "misp-export",
    name: "MISP Public Feeds",
    url: "https://misp.circl.lu/feeds", // Example; check actual endpoints
    type: "stix",
    updateIntervalHours: 12,
  },
];
```

#### `server/ingest/normalizer.ts` — **Convert to threat_intel schema**

```typescript
import crypto from "crypto";

export interface NormalizedThreat {
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  title: string;
  description?: string;
  type: "malware" | "ip" | "domain" | "hash" | "actor" | "malicious_url";
  severity: "critical" | "high" | "medium" | "low" | "info";
  indicators: Array<{ type: string; value: string }>;
  tags: string[];
  contentHash: string;
  firstSeen: Date;
  lastSeen: Date;
  discoveredAt: Date;
}

// Compute content hash for deduplication
export function computeContentHash(threat: Omit<NormalizedThreat, "contentHash">): string {
  const content = `${threat.title}|${threat.description}|${JSON.stringify(threat.indicators)}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Normalize OTX pulse format
export function normalizeOTXPulse(pulse: any): NormalizedThreat {
  const indicators = [];
  
  // OTX stores indicators in "indicators" array
  if (pulse.indicators) {
    for (const ind of pulse.indicators) {
      indicators.push({
        type: ind.type, // "IPv4", "domain", "hash", etc
        value: ind.indicator,
      });
    }
  }

  // Extract tags, filter for fintech-relevant
  const tags = pulse.tags || [];
  const fintechTags = tags.filter((t: string) => 
    t.toLowerCase().includes("fintech") || 
    t.toLowerCase().includes("finance") ||
    t.toLowerCase().includes("bank")
  );

  const threat: Omit<NormalizedThreat, "contentHash"> = {
    source: "AlienVault OTX",
    sourceId: pulse.id?.toString(),
    sourceUrl: `https://otx.alienvault.com/pulse/${pulse.id}`,
    title: pulse.name || "Unnamed OTX Pulse",
    description: pulse.description,
    type: inferThreatType(pulse.indicators || []),
    severity: mapOTXSeverity(pulse.TLP),
    indicators,
    tags: fintechTags.length > 0 ? fintechTags : tags,
    firstSeen: pulse.created || new Date(),
    lastSeen: pulse.modified || new Date(),
    discoveredAt: new Date(),
  };

  return {
    ...threat,
    contentHash: computeContentHash(threat),
  };
}

// Infer threat type from indicators
function inferThreatType(indicators: any[]): NormalizedThreat["type"] {
  if (!indicators.length) return "malware";
  const first = indicators[0];
  if (first.type === "IPv4") return "ip";
  if (first.type === "domain") return "domain";
  if (first.type === "hash") return "hash";
  if (first.type === "URL") return "malicious_url";
  return "malware";
}

// Map OTX TLP to severity
function mapOTXSeverity(tlp?: string): NormalizedThreat["severity"] {
  if (!tlp) return "medium";
  if (tlp === "red") return "critical";
  if (tlp === "amber") return "high";
  if (tlp === "green") return "low";
  return "info";
}
```

#### `server/ingest/deduplicator.ts` — **Deduplication**

```typescript
import { threatIntel } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function isDuplicate(contentHash: string): Promise<boolean> {
  const existing = await db
    .select({ id: threatIntel.id })
    .from(threatIntel)
    .where(eq(threatIntel.contentHash, contentHash))
    .limit(1);

  return existing.length > 0;
}

export async function updateLastSeen(contentHash: string, now: Date): Promise<void> {
  // If we see the same threat again, update lastSeen timestamp
  await db
    .update(threatIntel)
    .set({ lastSeen: now })
    .where(eq(threatIntel.contentHash, contentHash));
}
```

#### `server/ingest/index.ts` — **Main orchestrator**

```typescript
import fetch from "node-fetch";
import cron from "node-cron";
import { INGEST_SOURCES } from "./sources";
import { normalizeOTXPulse } from "./normalizer";
import { isDuplicate, updateLastSeen } from "./deduplicator";
import { db } from "../db";
import { threatIntel } from "@shared/schema";
import { log } from "../index";

export async function ingestFromSource(sourceConfig: any) {
  try {
    log(`Fetching from ${sourceConfig.name}...`, "ingest");

    const response = await fetch(sourceConfig.url, {
      headers: sourceConfig.headers || {},
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    let normalized = [];

    // Parse based on source type
    if (sourceConfig.type === "otx") {
      // OTX returns { results: [...pulses] }
      normalized = data.results.map(normalizeOTXPulse);
    } else if (sourceConfig.type === "stix") {
      // Handle STIX format (more complex, simplified here)
      normalized = parseSTIX(data);
    }

    // Dedup & insert
    let inserted = 0;
    let duplicates = 0;

    for (const threat of normalized) {
      const dup = await isDuplicate(threat.contentHash);
      if (dup) {
        await updateLastSeen(threat.contentHash, new Date());
        duplicates++;
      } else {
        await db.insert(threatIntel).values(threat);
        inserted++;
      }
    }

    log(
      `Ingested from ${sourceConfig.name}: ${inserted} new, ${duplicates} duplicates`,
      "ingest"
    );
  } catch (error: any) {
    log(
      `Failed to ingest from ${sourceConfig.name}: ${error.message}`,
      "ingest"
    );
  }
}

export async function runAllIngestions() {
  log("Starting threat intelligence ingestion...", "ingest");

  for (const source of INGEST_SOURCES) {
    await ingestFromSource(source);
  }

  log("Ingestion cycle complete", "ingest");
}

// Schedule ingestion (example: every 6 hours)
export function scheduleIngestCron() {
  // Run at 0, 6, 12, 18 UTC
  cron.schedule("0 */6 * * *", runAllIngestions);
  log("Ingest scheduler started (every 6 hours)", "ingest");
}

// Call on startup
export function initializeIngest() {
  scheduleIngestCron();
  // Also run once on startup (optional, removes delay)
  runAllIngestions();
}
```

#### `server/index.ts` — **Add ingest initialization**

```typescript
import { initializeIngest } from "./ingest";

(async () => {
  // ... existing setup ...

  // Initialize OSINT ingestion (after DB is healthy)
  if (await healthCheck()) {
    initializeIngest();
  }

  httpServer.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
```

---

## Phase 4: Risk Engine (server/risk/engine.ts)

**Goal**: Implement rule-based threat scoring that is explainable and auditable.

#### `server/risk/engine.ts` — **NEW FILE**

```typescript
import { threatIntel, riskScores, baselineMetrics } from "@shared/schema";
import { db } from "../db";
import { eq, gte, lt } from "drizzle-orm";

export interface RiskComputation {
  threatIntelId: string;
  score: number;
  severity: "critical" | "high" | "medium" | "low";
  rulesFired: string[];
  reasoning: string;
}

const FINTECH_KEYWORDS = ["fintech", "bank", "payment", "credit", "atm", "swift", "wire"];

export async function computeRisk(intelRecord: any): Promise<RiskComputation> {
  const rules: { name: string; score: number; fired: boolean }[] = [];
  let totalScore = 0;
  const reasoning: string[] = [];

  // Rule 1: Severity-weighted base score
  const severityScores = {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
    info: 5,
  };

  const baseSeverityScore = severityScores[intelRecord.severity as keyof typeof severityScores] || 0;
  totalScore += baseSeverityScore;

  rules.push({
    name: "severity_weighted",
    score: baseSeverityScore,
    fired: true,
  });
  reasoning.push(`Severity '${intelRecord.severity}' base score: +${baseSeverityScore}`);

  // Rule 2: Fintech relevance spike detection
  const isFintechRelated = FINTECH_KEYWORDS.some(kw =>
    intelRecord.title.toLowerCase().includes(kw) ||
    intelRecord.description?.toLowerCase().includes(kw) ||
    (intelRecord.tags || []).some((t: string) =>
      t.toLowerCase().includes(kw)
    )
  );

  if (isFintechRelated) {
    totalScore += 20;
    rules.push({ name: "fintech_relevance", score: 20, fired: true });
    reasoning.push("Fintech-related indicators detected: +20");
  }

  // Rule 3: Recency decay (threats older than 30 days score lower)
  const now = new Date();
  const daysOld = (now.getTime() - new Date(intelRecord.discoveredAt).getTime()) / (1000 * 60 * 60 * 24);

  if (daysOld > 30) {
    const decayFactor = Math.max(0.5, 1 - (daysOld - 30) / 180); // Decay over 6 months
    const decayPenalty = totalScore * (1 - decayFactor);
    totalScore *= decayFactor;
    rules.push({ name: "recency_decay", score: -decayPenalty, fired: true });
    reasoning.push(`Discovered ${daysOld.toFixed(0)} days ago: ${(decayPenalty).toFixed(0)} recency penalty`);
  }

  // Rule 4: Indicator count bonus (more IoCs = higher confidence)
  const indicatorCount = (intelRecord.indicators || []).length;
  if (indicatorCount > 5) {
    totalScore += 10;
    rules.push({ name: "high_indicator_count", score: 10, fired: true });
    reasoning.push(`${indicatorCount} indicators detected: +10`);
  }

  // Clamp score to 0-100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Map score to severity
  const computedSeverity = 
    finalScore >= 85 ? "critical" :
    finalScore >= 70 ? "high" :
    finalScore >= 40 ? "medium" :
    "low";

  return {
    threatIntelId: intelRecord.id,
    score: Math.round(finalScore),
    severity: computedSeverity,
    rulesFired: rules.filter(r => r.fired).map(r => r.name),
    reasoning: reasoning.join("\n"),
  };
}

// Compute risks for all recent intel
export async function computeAllRisks() {
  // Only compute for intel from last 7 days (or re-compute all if needed)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentIntel = await db
    .select()
    .from(threatIntel)
    .where(gte(threatIntel.discoveredAt, sevenDaysAgo));

  const riskComputations: RiskComputation[] = [];

  for (const intel of recentIntel) {
    const risk = await computeRisk(intel);
    riskComputations.push(risk);
  }

  // Batch insert risk scores
  if (riskComputations.length > 0) {
    await db.insert(riskScores).values(
      riskComputations.map(r => ({
        threatIntelId: r.threatIntelId,
        score: r.score,
        severity: r.severity,
        rulesFired: r.rulesFired,
        reasoning: r.reasoning,
        engineVersion: "1.0",
        computedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }))
    );
  }

  return riskComputations;
}

// Detect spikes in threat activity
export async function detectSpikes() {
  const metrics = [
    { metric: "fintech_intel_count", windowDays: 30 },
    { metric: "critical_severity_count", windowDays: 7 },
  ];

  for (const metricConfig of metrics) {
    const windowDate = new Date(Date.now() - metricConfig.windowDays * 24 * 60 * 60 * 1000);

    // Baseline: average over window
    const baselineIntel = await db
      .select()
      .from(threatIntel)
      .where(lt(threatIntel.discoveredAt, windowDate));

    const baselineValue = baselineIntel.length / metricConfig.windowDays;

    // Current: last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayIntel = await db
      .select()
      .from(threatIntel)
      .where(gte(threatIntel.discoveredAt, oneDayAgo));

    const currentValue = todayIntel.length;
    const spikeThreshold = 1.5; // 50% increase = alert

    // Store/update metric
    await db
      .insert(baselineMetrics)
      .values({
        metric: metricConfig.metric,
        windowDays: metricConfig.windowDays,
        baselineValue: baselineValue.toString(),
        currentValue: currentValue.toString(),
        spikeThreshold: spikeThreshold.toString(),
        calculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [baselineMetrics.metric],
        set: {
          currentValue: currentValue.toString(),
          updatedAt: new Date(),
        },
      });

    // If spiking, log for alerting
    if (currentValue > baselineValue * spikeThreshold) {
      console.log(`⚠️  SPIKE DETECTED: ${metricConfig.metric} at ${currentValue.toFixed(1)} (baseline: ${baselineValue.toFixed(1)})`);
    }
  }
}
```

#### `server/risk/scheduler.ts` — **NEW FILE**

Schedule risk computation:

```typescript
import cron from "node-cron";
import { computeAllRisks, detectSpikes } from "./engine";
import { log } from "../index";

export function initializeRiskEngine() {
  // Run risk computation every hour
  cron.schedule("0 * * * *", async () => {
    try {
      log("Running risk engine...", "risk");
      const risks = await computeAllRisks();
      await detectSpikes();
      log(`Risk computation complete: ${risks.length} threats scored`, "risk");
    } catch (error: any) {
      log(`Risk engine error: ${error.message}`, "risk");
    }
  });

  log("Risk engine scheduler initialized", "risk");
}
```

---

## Phase 5: API Refactoring

**Goal**: Add intel/risk/alerts endpoints, secure all routes with JWT.

### New Endpoints

#### `GET /api/intel` — View ingested threat intelligence

```typescript
app.get("/api/intel", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const severity = req.query.severity as string;
    const source = req.query.source as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let query = db.select().from(threatIntel);

    if (severity) {
      query = query.where(eq(threatIntel.severity, severity));
    }
    if (source) {
      query = query.where(eq(threatIntel.source, source));
    }

    const results = await query
      .orderBy(threatIntel.discoveredAt)
      .limit(limit)
      .offset(offset);

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

#### `GET /api/risk` — View computed risk scores

```typescript
app.get("/api/risk", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const severity = req.query.severity as string;
    const minScore = parseInt(req.query.minScore as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    let query = db.select().from(riskScores);

    if (severity) {
      query = query.where(eq(riskScores.severity, severity));
    }

    const results = await query
      .where(gte(riskScores.score, minScore))
      .orderBy(riskScores.score)
      .limit(limit);

    // Enrich with threat intel details
    const enriched = await Promise.all(
      results.map(async (risk) => {
        const intel = await db
          .select()
          .from(threatIntel)
          .where(eq(threatIntel.id, risk.threatIntelId))
          .limit(1);
        return { ...risk, threat: intel[0] };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

#### `GET /api/alerts` — View alerts (analyst can only see their own)

```typescript
app.get("/api/alerts", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const limit = parseInt(req.query.limit as string) || 50;

    // Viewers can see all; analysts see only unread
    let query = db.select().from(alerts);
    
    if (req.user!.role === "analyst") {
      query = query.where(eq(alerts.userId, req.user!.userId));
    }

    if (unreadOnly) {
      query = query.where(eq(alerts.read, false));
    }

    const results = await query
      .orderBy(alerts.createdAt)
      .limit(limit);

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/alerts/:id/read", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const result = await db
      .update(alerts)
      .set({ read: true })
      .where(eq(alerts.id, req.params.id))
      .returning();

    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Phase 6: Frontend Integration

**Goal**: Replace mock data with real API calls via React Query.

### Modified Files

#### `client/src/lib/queryClient.ts` — **Initialize React Query**

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### `client/src/pages/Dashboard.tsx` — **Wire to API**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth"; // New hook for token management

export function Dashboard() {
  const { token } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <StatCard title="Active Threats" value={stats?.activeThreats} />
      <AlertsList alerts={alerts} />
      {/* ... */}
    </div>
  );
}
```

#### `client/src/pages/DarkWebIntel.tsx` — **Wire to threat intel endpoint**

```typescript
const { data: intel, isLoading } = useQuery({
  queryKey: ["threat-intel", severity],
  queryFn: async () => {
    const res = await fetch(`/api/intel?severity=${severity}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
});
```

#### `client/src/hooks/useAuth.ts` — **NEW FILE**

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "wouter";

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem("auth_token"),
    user: localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")!) : null,
    isAuthenticated: !!localStorage.getItem("auth_token"),
  });

  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));

    setAuth({
      token: data.token,
      user: data.user,
      isAuthenticated: true,
    });

    navigate("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuth({ token: null, user: null, isAuthenticated: false });
    navigate("/login");
  };

  return { ...auth, login, logout };
}
```

---

## Execution Order & Timeline

| Phase | Tasks | Dependencies | Estimated Time |
|-------|-------|--------------|-----------------|
| **Phase 1** | Database setup, Drizzle schema migration | None | **3 days** |
| **Phase 2** | Auth (bcrypt, JWT), RBAC middleware | Phase 1 | **2 days** |
| **Phase 3** | Ingestion layer (OTX, MISP, parsers) | Phase 1 | **4 days** |
| **Phase 4** | Risk engine, scoring rules, spike detection | Phase 1, 3 | **3 days** |
| **Phase 5** | New API endpoints (/intel, /risk, /alerts) | Phase 2, 4 | **2 days** |
| **Phase 6** | Frontend integration, React Query | Phase 5 | **3 days** |
| **Total** | Full MVP | — | **~17 days (3 weeks, 1-2 developers)** |

---

## Security Checklist (MVP-Grade)

- [ ] Passwords hashed with bcrypt (not plaintext)
- [ ] JWT tokens signed with strong secret
- [ ] All API endpoints require JWT (except /auth)
- [ ] RBAC enforced: analysts ≠ admins ≠ viewers
- [ ] Logs sanitized: no passwords, tokens, sensitive data
- [ ] SQL injection prevented: Drizzle ORM parameterizes all queries
- [ ] XSS prevented: React + React Query (no unsafe DOM)
- [ ] CSRF protected: JWT in Authorization header (not cookies)
- [ ] Rate limiting: TODO (use `express-rate-limit` in Phase 7)
- [ ] Input validation: Zod schemas on all endpoints
- [ ] Audit logs: Track who accessed what (optional Phase 7)

---

## Notes for Developer

1. **Start small**: Run `npm run db:push` first, test DB connection.
2. **Parallel work**: Phases 3 & 4 can overlap; risk engine doesn't block ingest.
3. **Testing**: After each phase, run `npm run dev` and verify with curl:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}' \
     > token.json
   
   curl http://localhost:5000/api/intel \
     -H "Authorization: Bearer $(jq -r .token token.json)"
   ```
4. **Seed data**: After Phase 1, manually insert test threat intelligence to avoid waiting for ingest cycles.
5. **Error handling**: All phases should handle DB errors gracefully (connection pooling, retries).
6. **Documentation**: Update API_ENDPOINTS.md as you add endpoints.

---

## What's Explicitly NOT in MVP

- Machine learning models
- Dark web scraping (using legal OSINT only)
- Multi-tenancy
- WebSocket real-time sync
- SSO / OAuth
- Email notifications (alerts visible in UI only)
- S3 file storage
- Container orchestration
- Load balancing
- Observability platforms (Datadog, etc)

These are **Phase 7+** (production hardening).

---

## Go/No-Go Criteria for MVP Completion

✅ **Go** when all of the following are true:

1. Dashboard displays real threat intelligence (not mock data)
2. Risk scores computed and displayed
3. At least 10 real OSINT threats ingested from AlienVault OTX
4. Alerts generated automatically when risk > 70
5. Frontend login works with JWT tokens
6. All API endpoints secured with `authenticateJWT`
7. No plaintext passwords in logs or database
8. Database persists across server restarts
9. 0 XSS/SQL injection/auth vulnerabilities in code review

---

Generated: 2025-12-15
Author: Senior Backend + Security Engineer
Status: **READY FOR EXECUTION**
