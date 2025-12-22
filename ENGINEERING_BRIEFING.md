# FinShadow MVP: Engineering Briefing

**Date**: 2025-12-15  
**Status**: ✅ Ready for Execution  
**Prepared by**: Senior Backend + Security Engineer  

---

## Mission

Transform FinShadow from a **mock-data UI prototype** into a **real, production-grade threat intelligence ingestion and alerting platform** that:

1. **Ingests** legal, public OSINT feeds (AlienVault OTX, MISP)
2. **Normalizes** data into unified threat intelligence schema
3. **Scores** threats using explainable, rule-based logic
4. **Alerts** analysts automatically when risk thresholds exceeded
5. **Visualizes** threat landscape and risk trends in clean dashboard

**Timeline**: 3–4 weeks (1–2 developers)  
**Go-live criteria**: Real threat intelligence flowing, alerts working, JWT auth enforced

---

## What Changed (Context → MVP)

### **Before** (Current State)
- ✗ All data hardcoded in `mockData.ts`
- ✗ No database persistence
- ✗ No authentication (plaintext passwords in memory)
- ✗ No API integration (frontend doesn't call backend)
- ✗ 35 REST endpoints defined but unused
- ✗ Zero threat intelligence ingestion

### **After** (MVP Goal)
- ✅ Real threat intelligence from AlienVault OTX + MISP feeds
- ✅ PostgreSQL persistence via Drizzle ORM
- ✅ Bcrypt passwords + JWT authentication
- ✅ Frontend integrated with real API calls
- ✅ Risk scoring engine (rule-based, explainable)
- ✅ Automatic alerts when risk thresholds exceeded
- ✅ Clean separation: API tier ↔ ingestion tier ↔ risk tier ↔ UI tier

---

## Architecture (MVP)

```
┌─────────────────────────────────────────┐
│  Legal OSINT Feeds                      │
│  (AlienVault OTX, MISP export)          │
└──────────────┬──────────────────────────┘
               │ (Cron: every 6 hours)
┌──────────────▼──────────────────────────┐
│  Ingestion Module (server/ingest/)      │
│  - Parse STIX/JSON                      │
│  - Normalize to schema                  │
│  - Deduplicate by hash                  │
│  → INSERT threat_intel                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Risk Engine (server/risk/)             │
│  - Severity weighting                   │
│  - Fintech relevance detection          │
│  - Recency decay                        │
│  - Spike detection vs baseline          │
│  → INSERT risk_scores                   │
│  → INSERT alerts (if risk > threshold)  │
└──────────────┬──────────────────────────┘
               │ (Cron: every hour)
┌──────────────▼──────────────────────────┐
│  Express API (server/routes.ts)         │
│  - GET /api/intel                       │
│  - GET /api/risk                        │
│  - GET /api/alerts                      │
│  - All endpoints: JWT + RBAC            │
└──────────────┬──────────────────────────┘
               │ (HTTP)
┌──────────────▼──────────────────────────┐
│  React Frontend (client/src/)           │
│  - Dashboard (stats, alerts)            │
│  - Threat Intel (OSINT feed)            │
│  - Alerts (notifications)               │
│  - All pages: React Query caching       │
└─────────────────────────────────────────┘
       ↓
    PostgreSQL (persistent storage)
```

---

## Key Design Principles

### 1. **Explainability Over Blackbox**
- Risk scores always include human-readable reasoning
- Rules are simple (no complex ML)
- Every alert references the rule that triggered it

### 2. **Legal & Ethical**
- OSINT only (no dark web scraping, no honeypots)
- Public feeds with clear attribution
- No deanonymization
- Complies with fintech monitoring regulations

### 3. **Production-Ready from Day 1**
- Bcrypt passwords (not plaintext)
- JWT authentication (not sessions)
- SQL parameterization via Drizzle ORM
- Comprehensive error handling
- Audit-friendly logging (no sensitive data)

### 4. **Maintainable & Scalable**
- Clear separation of concerns (ingest ≠ risk ≠ API ≠ UI)
- Normalized schemas (no data duplication)
- Indexed queries (fast lookups)
- Cron-based batch processing (no WebSockets complexity yet)

---

## New Tables (3 additions to schema)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **threat_intel** | Ingested OSINT data | id, source, title, severity, indicators, contentHash (dedup) |
| **risk_scores** | Computed threat risk | threatIntelId, score (0–100), severity, reasoning, rulesFired |
| **baseline_metrics** | Spike detection baselines | metric, baselineValue, currentValue, spikeThreshold |

**Modified tables**:
- **alerts** — Add `riskScoreId` FK (links alert to risk computation), `threatIntelId` FK

---

## New Modules (3 packages)

### `server/ingest/` (4 files)
- `sources.ts` — OSINT feed definitions (OTX, MISP URLs)
- `normalizer.ts` — Convert any format → threat_intel schema
- `deduplicator.ts` — SHA256 content hash dedup
- `index.ts` — Main orchestrator, cron scheduler

### `server/risk/` (2 files)
- `engine.ts` — Rule-based scoring logic
- `scheduler.ts` — Hourly risk computation cron

### `server/middleware/` (1 file)
- `auth.ts` — JWT verification + RBAC enforcement

### `server/` (2 new files)
- `db.ts` — Drizzle ORM connection
- `auth.ts` — JWT + bcrypt utilities
- `env.ts` — Environment variable validation

### `client/src/hooks/` (1 new file)
- `useAuth.ts` — Token management + login/logout

---

## Critical Files to Modify

| File | Change | Severity |
|------|--------|----------|
| `shared/schema.ts` | Add 3 new tables + modify alerts | HIGH |
| `server/storage.ts` | Replace MemStorage → DrizzleStorage | CRITICAL |
| `server/routes.ts` | Add /api/intel, /api/risk, /api/alerts + JWT middleware | HIGH |
| `server/index.ts` | Add DB health check + ingest/risk init | MEDIUM |
| `client/src/pages/Dashboard.tsx` | Replace mock → useQuery calls | MEDIUM |
| `client/src/pages/DarkWebIntel.tsx` | Replace mock → useQuery calls | MEDIUM |
| `.env.example` | Add DATABASE_URL, JWT_SECRET | LOW |
| `package.json` | Add bcrypt, jsonwebtoken; update db:push script | LOW |

---

## Execution Phases (Sequential Dependency)

| Phase | Scope | Duration | Blocker? |
|-------|-------|----------|----------|
| **1** | Database: Schema, Drizzle setup, MemStorage → DrizzleStorage | 3 days | YES – all other phases |
| **2** | Auth: Bcrypt, JWT, RBAC middleware, sanitized logging | 2 days | YES – frontend + API security |
| **3** | Ingest: OTX parser, normalizer, deduplicator, cron scheduler | 4 days | Can parallel with Phase 2 |
| **4** | Risk: Rule engine, spike detection, alert generation | 3 days | Depends on Phase 1 + 3 |
| **5** | API: Clean /api/intel, /api/risk, /api/alerts endpoints | 2 days | Depends on Phase 2 + 4 |
| **6** | Frontend: Login page, React Query integration, remove mocks | 3 days | Depends on Phase 5 |

---

## What Success Looks Like

### ✅ Functional MVP (EOD Week 3)

1. **Data is real** — Dashboard shows threat intelligence from OTX, not mocks
2. **Alerts work** — Risk spike triggers alert automatically
3. **Auth is strict** — No JWT = 401; wrong role = 403
4. **Persistence survives** — Server restart doesn't lose data
5. **Logs are clean** — Passwords never logged; tokens hidden
6. **Scale can follow** — DB indexed; APIs paginated; cron-based (not long-running)

### ✅ Security (EOD Week 3)

- [ ] Passwords hashed (bcrypt, not plaintext)
- [ ] JWT tokens signed with strong secret
- [ ] All API endpoints protected (except /auth)
- [ ] RBAC enforced: `requireRole("admin")` blocks analysts
- [ ] SQL injection prevented (Drizzle parameterization)
- [ ] XSS prevented (React, no unsafe HTML)
- [ ] Logs sanitized (no passwords, tokens, sensitive data)

### ✅ Code Quality (EOD Week 3)

- [ ] TypeScript: `npm run check` passes (0 errors)
- [ ] No console.error without context
- [ ] Errors logged with actionable details
- [ ] Schema changes documented
- [ ] All new functions have JSDoc comments
- [ ] Tests for critical functions (auth, scoring rules)

---

## Known Risks & Mitigations

### Risk: Database Connection Fails at Scale
**Mitigation**: Drizzle connection pooling (defaults to PgPool)

### Risk: Ingest Rate Limits from OTX
**Mitigation**: Start with 1 request/day during dev; add exponential backoff

### Risk: Risk Scores Drift Over Time
**Mitigation**: Baseline metrics stored in DB; recalculated hourly

### Risk: Frontend Still Uses Mocks
**Mitigation**: Delete mockData.ts after Phase 6; audit for remaining hardcodes

### Risk: JWT Secret Leaked
**Mitigation**: Strong secret in .env (not committed); rotate in production

---

## Testing Strategy (MVP)

### Unit Tests (Optional but Recommended)
- Risk scoring rules (edge cases: old threats, no indicators)
- Password hashing (bcrypt comparison)
- Content hash dedup

### Integration Tests (Required)
1. **Auth flow**: Register → Login → Get token → Access protected endpoint
2. **Ingest flow**: Fetch OTX → Normalize → Deduplicate → Insert
3. **Risk flow**: Threat intel → Compute risk → Generate alert
4. **API flow**: All endpoints return correct status codes + data types
5. **Frontend flow**: Login → See real data → Logout

### Manual Testing
- Browser: Open login page, register, verify dashboard shows real data
- curl: Test JWT auth headers, 401/403 responses
- Database: Verify data persists across server restarts

---

## Deployment Readiness (Out of Scope for MVP, but Consider)

**Not in MVP but plan for**:
- Docker image + docker-compose for PostgreSQL
- Environment file template (.env.example → .env.production)
- Database migrations (keep drizzle.config.ts current)
- Monitoring (health checks, error alerting)
- Rate limiting (`express-rate-limit`)
- HTTPS redirect (nginx proxy in production)

---

## Team Capacity

**Recommended team**:
- **1 Backend Engineer** (Phases 1–2, 4–5)
- **1 Frontend Engineer** (Phase 6)
- **Risk Analyst** (advisory for Phase 4 rules) — part-time

**If 1 person only**:
- Parallelize Phases 1 & 2 (database + auth)
- Complete Phases 3–4 sequentially (ingest, risk)
- Phase 5 overlaps with Phase 4 (API endpoints)
- Phase 6 last (frontend)
- **Total**: 4–5 weeks (instead of 3)

---

## Documentation to Create

After MVP completion:

1. **API Documentation** (`API_ENDPOINTS.md` — update)
   - All 10+ new endpoints
   - Request/response schemas (Zod)
   - JWT header format

2. **Database Schema** (`DB_SCHEMA.md` — new)
   - ER diagram (threat_intel → risk_scores → alerts)
   - Indexes & query patterns
   - Backup strategy

3. **Risk Scoring Rules** (`RISK_ENGINE.md` — new)
   - Each rule explained
   - Sensitivity tuning guide
   - Baseline metrics calculation

4. **Deployment Guide** (`DEPLOYMENT.md` — new)
   - Environment setup
   - Database init (pg_restore)
   - Scaling considerations

5. **Security Audit** (`SECURITY.md` — new)
   - Threat model
   - Compliance checklist (if needed: PCI DSS, GDPR, etc.)

---

## Next Steps (For You, The Developer)

1. **Read** `MVP_ARCHITECTURE.md` (comprehensive technical design)
2. **Read** `EXECUTION_CHECKLIST.md` (40+ specific tasks with acceptance criteria)
3. **Start Phase 1, Task 1.1** — Update `shared/schema.ts` with new tables
4. **Daily**: Check off tasks in `EXECUTION_CHECKLIST.md`
5. **Weekly**: Update status in this briefing

---

## Questions to Ask Before Starting

**Q: Should I add WebSockets for real-time alerts?**  
A: No. Cron-based + polling is sufficient for MVP. WebSockets in Phase 7.

**Q: What if OTX API key is expensive?**  
A: Use public/free tier first. MISP also has free public instances.

**Q: Should I implement email notifications?**  
A: No. In-app alerts only. Email in Phase 7.

**Q: What about dark web scraping?**  
A: Out of scope. Legal risk too high. Stick to public OSINT feeds.

**Q: Can I use Redis for caching?**  
A: Not for MVP. Single PostgreSQL instance is fine. Redis in Phase 7.

**Q: What if the team wants ML risk scoring?**  
A: Rule-based is simpler, more maintainable, more explainable for MVP. ML in Phase 8+.

---

## Success Metrics (How to Know MVP is Done)

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Real threat intel** | ≥ 50 threats in DB | `SELECT COUNT(*) FROM threat_intel;` |
| **Risk scores** | ≥ 50% of intel scored | `SELECT COUNT(*) FROM risk_scores;` |
| **Alerts generated** | ≥ 1 alert when risk > 70 | `SELECT * FROM alerts WHERE severity = 'high';` |
| **Auth working** | 401 without token, 403 if wrong role | curl test unauthenticated |
| **Frontend integrated** | Dashboard shows real data (not mocks) | Visual inspection in browser |
| **No plaintext passwords** | All hashed in DB | `SELECT password FROM users;` (should be $2b$10$...) |
| **Zero security vulns** | OWASP Top 10 covered | Code review + curl security tests |
| **Logs clean** | No passwords in logs | `grep -r "password\|token" logs/` (should be 0) |

---

## Final Checklist Before You Start

- [ ] You have Postgres running locally (or credentials for cloud DB)
- [ ] You've read `SYSTEM.md` (existing architecture)
- [ ] You've read `MVP_ARCHITECTURE.md` (this design)
- [ ] You've read `EXECUTION_CHECKLIST.md` (specific tasks)
- [ ] You have Node.js 18+ installed
- [ ] You can run `npm install` successfully
- [ ] `.env.example` exists in repo
- [ ] You understand JWT auth flow (Bearer token in Authorization header)
- [ ] You're comfortable with SQL (writing Drizzle queries)
- [ ] You have access to test data (OTX API or MISP feeds)

---

## Go/No-Go Decision

**GO** if:
- ✅ Database available + tested
- ✅ Team capacity allocated
- ✅ Requirements understood
- ✅ Security non-negotiable
- ✅ Timeline acceptable (3–4 weeks)

**NO-GO** if:
- ❌ Unclear scope changes during execution
- ❌ Team expects ML models in MVP
- ❌ Dark web scraping non-negotiable
- ❌ Compliance requirements unknown (PCI, GDPR, etc.)

---

## Sign-Off

**Architecture Review**: ✅ APPROVED  
**Security Review**: ✅ APPROVED (MVP-grade, not production-grade)  
**Feasibility**: ✅ APPROVED (3-week timeline realistic)  
**Status**: 🟢 **READY TO EXECUTE**

---

**Generated**: 2025-12-15  
**Author**: Senior Backend + Security Engineer  
**Next Review**: End of Phase 1 (3 days)  
**Contact**: Reference `EXECUTION_CHECKLIST.md` for task-level questions  

---

## Quick Reference: Most Important Files

**To start Phase 1**:
1. `shared/schema.ts` ← Add 3 new tables here
2. `server/db.ts` ← Create this next
3. `server/storage.ts` ← Refactor this
4. `.env.example` ← Update with DATABASE_URL

**To start Phase 2**:
1. `server/auth.ts` ← Create JWT + bcrypt utilities
2. `server/middleware/auth.ts` ← Create auth middleware
3. `server/routes.ts` ← Update login endpoint

**To start Phase 3**:
1. `server/ingest/index.ts` ← Create main orchestrator
2. `server/ingest/normalizer.ts` ← Create OTX parser

**To start Phase 4**:
1. `server/risk/engine.ts` ← Create scoring rules

**To start Phase 5**:
1. `server/routes.ts` ← Add /api/intel, /api/risk, /api/alerts

**To start Phase 6**:
1. `client/src/pages/Dashboard.tsx` ← Replace mock data with useQuery
2. `client/src/hooks/useAuth.ts` ← Create auth hook

---

**Happy coding! 🚀**
