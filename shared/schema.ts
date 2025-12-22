import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  json,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("viewer"), // admin, analyst, viewer
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== TRANSACTIONS ====================
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency").notNull().default("USD"),
    type: text("type").notNull(), // transfer, payment, deposit, withdrawal
    status: text("status").notNull().default("completed"), // pending, completed, failed
    sourceAccount: text("source_account").notNull(),
    destinationAccount: text("destination_account").notNull(),
    flags: json("flags").default({}), // suspicious flags
    riskScore: integer("risk_score").default(0), // 0-100
    ipAddress: text("ip_address"),
    geolocation: text("geolocation"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    timestampIdx: index("transactions_timestamp_idx").on(table.timestamp),
  })
);

// ==================== FRAUD FINDINGS ====================
export const fraudFindings = pgTable(
  "fraud_findings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    transactionId: varchar("transaction_id"),
    type: text("type").notNull(), // account_takeover, credential_stuffing, synthetic_identity, etc
    severity: text("severity").notNull(), // critical, high, medium, low
    status: text("status").notNull().default("new"), // new, investigating, resolved
    details: text("details").notNull(),
    evidence: json("evidence").default({}),
    investigatedBy: varchar("investigated_by"),
    resolvedAt: timestamp("resolved_at"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    timestampIdx: index("fraud_findings_timestamp_idx").on(table.timestamp),
    statusIdx: index("fraud_findings_status_idx").on(table.status),
  })
);

// ==================== THREAT INTELLIGENCE ====================
export const threatActors = pgTable(
  "threat_actors",
  {
    id: varchar("id").primaryKey(),
    name: text("name").notNull(),
    aliases: json("aliases").default([]), // Array of strings
    riskLevel: text("risk_level").notNull(), // critical, high, medium, low
    origin: text("origin"),
    lastSeen: timestamp("last_seen"),
    targets: json("targets").default([]), // Array of industries
    capabilities: json("capabilities").default([]), // Array of capabilities
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    riskLevelIdx: index("threat_actors_risk_level_idx").on(table.riskLevel),
  })
);

// ==================== DARK WEB INTELLIGENCE ====================
export const darkWebIntel = pgTable(
  "dark_web_intel",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    source: text("source").notNull(), // forum, marketplace, telegram, etc
    content: text("content").notNull(),
    severity: text("severity").notNull(), // critical, high, medium, low
    tags: json("tags").default([]),
    reference: text("reference"), // external link/hash
    verifiedAt: timestamp("verified_at"),
    discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    severityIdx: index("dark_web_intel_severity_idx").on(table.severity),
    discoveredIdx: index("dark_web_intel_discovered_idx").on(table.discoveredAt),
  })
);

// ==================== PREDICTIONS ====================
export const predictions = pgTable(
  "predictions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    target: text("target").notNull(), // system/entity name
    riskScore: integer("risk_score").notNull(), // 0-100
    likelyAttackType: text("likely_attack_type").notNull(),
    projectedImpact: text("projected_impact"),
    aiConfidence: integer("ai_confidence").notNull(), // 0-100
    region: text("region"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    riskScoreIdx: index("predictions_risk_score_idx").on(table.riskScore),
  })
);

// ==================== THREAT INTELLIGENCE (MVP) ====================
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
    
    // Indicators: Array of {type: "ip"|"domain"|"hash"|"url", value: "..."}
    indicators: json("indicators").default([]),
    tags: json("tags").default([]),
    
    // Deduplication: SHA256(title + description + indicators)
    contentHash: varchar("content_hash").notNull().unique(),
    
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
  })
);

// ==================== RISK SCORES (MVP) ====================
export const riskScores = pgTable(
  "risk_scores",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // Link to threat intel
    threatIntelId: varchar("threat_intel_id")
      .notNull()
      .references(() => threatIntel.id, { onDelete: "cascade" }),
    
    // Score & severity
    score: integer("score").notNull(), // 0-100
    severity: text("severity").notNull(), // "critical", "high", "medium", "low"
    
    // Rules applied & reasoning
    rulesFired: json("rules_fired").notNull().default([]), // Array of rule names
    reasoning: text("reasoning").notNull(), // Human-readable explanation
    
    // Versioning
    engineVersion: varchar("engine_version").notNull().default("1.0"),
    
    // Temporal
    computedAt: timestamp("computed_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"), // Stale after 7 days
  },
  (table) => ({
    threatIntelIdIdx: index("risk_scores_threat_intel_id_idx").on(table.threatIntelId),
    scoreIdx: index("risk_scores_score_idx").on(table.score),
    severityIdx: index("risk_scores_severity_idx").on(table.severity),
  })
);

// ==================== BASELINE METRICS (MVP) ====================
export const baselineMetrics = pgTable(
  "baseline_metrics",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // What we're measuring
    metric: text("metric").notNull().unique(), // "fintech_intel_count", "malware_variants", etc
    
    // Baseline calculation window
    windowDays: integer("window_days").notNull().default(sql`30`),
    baselineValue: decimal("baseline_value", { precision: 10, scale: 2 }).notNull(),
    
    // Current value for comparison
    currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
    
    // Spike threshold: if current > baseline * threshold, alert
    spikeThreshold: decimal("spike_threshold", { precision: 3, scale: 2 })
      .notNull()
      .default(sql`1.5`), // 1.5x = 50% spike
    
    // Temporal
    calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    metricIdx: index("baseline_metrics_metric_idx").on(table.metric),
  })
);

// ==================== ALERTS ====================
export const alerts = pgTable(
  "alerts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    type: text("type").notNull(), // transaction, fraud, threat, etc
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: text("severity").notNull(), // critical, high, medium, low
    read: boolean("read").default(false),
    relatedId: varchar("related_id"), // ID of related transaction/finding/etc
    
    // NEW MVP: Links to threat intelligence & risk score
    riskScoreId: varchar("risk_score_id").references(() => riskScores.id, { onDelete: "set null" }),
    threatIntelId: varchar("threat_intel_id").references(() => threatIntel.id, { onDelete: "set null" }),
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("alerts_user_id_idx").on(table.userId),
    readIdx: index("alerts_read_idx").on(table.read),
    riskScoreIdIdx: index("alerts_risk_score_id_idx").on(table.riskScoreId),
    threatIntelIdIdx: index("alerts_threat_intel_id_idx").on(table.threatIntelId),
  })
);

// ==================== AUDIT LOGS ====================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    action: text("action").notNull(), // view, update, delete, export, etc
    resource: text("resource").notNull(), // transaction, finding, alert, etc
    resourceId: varchar("resource_id"),
    changes: json("changes").default({}), // before/after values
    ipAddress: text("ip_address"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
  })
);

// ==================== SCHEMAS & TYPES ====================
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  currency: true,
  type: true,
  sourceAccount: true,
  destinationAccount: true,
  ipAddress: true,
  geolocation: true,
});

export const insertFraudFindingSchema = createInsertSchema(fraudFindings).pick({
  transactionId: true,
  type: true,
  severity: true,
  details: true,
  evidence: true,
});

export const insertThreatActorSchema = createInsertSchema(threatActors).pick({
  id: true,
  name: true,
  aliases: true,
  riskLevel: true,
  origin: true,
  targets: true,
  capabilities: true,
});

export const insertDarkWebIntelSchema = createInsertSchema(darkWebIntel).pick({
  source: true,
  content: true,
  severity: true,
  tags: true,
  reference: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  target: true,
  riskScore: true,
  likelyAttackType: true,
  projectedImpact: true,
  aiConfidence: true,
  region: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  severity: true,
  relatedId: true,
  riskScoreId: true,
  threatIntelId: true,
});

// MVP: Threat Intelligence schema
export const insertThreatIntelSchema = createInsertSchema(threatIntel).pick({
  source: true,
  sourceId: true,
  sourceUrl: true,
  title: true,
  description: true,
  type: true,
  severity: true,
  indicators: true,
  tags: true,
  contentHash: true,
  firstSeen: true,
  lastSeen: true,
});

// MVP: Risk Scores schema
export const insertRiskScoresSchema = createInsertSchema(riskScores).pick({
  threatIntelId: true,
  score: true,
  severity: true,
  rulesFired: true,
  reasoning: true,
  engineVersion: true,
});

// MVP: Baseline Metrics schema
export const insertBaselineMetricsSchema = createInsertSchema(baselineMetrics).pick({
  metric: true,
  windowDays: true,
  baselineValue: true,
  currentValue: true,
  spikeThreshold: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertFraudFinding = z.infer<typeof insertFraudFindingSchema>;
export type FraudFinding = typeof fraudFindings.$inferSelect;

export type InsertThreatActor = z.infer<typeof insertThreatActorSchema>;
export type ThreatActor = typeof threatActors.$inferSelect;

export type InsertDarkWebIntel = z.infer<typeof insertDarkWebIntelSchema>;
export type DarkWebIntel = typeof darkWebIntel.$inferSelect;

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// MVP types
export type InsertThreatIntel = z.infer<typeof insertThreatIntelSchema>;
export type ThreatIntel = typeof threatIntel.$inferSelect;

export type InsertRiskScores = z.infer<typeof insertRiskScoresSchema>;
export type RiskScore = typeof riskScores.$inferSelect;

export type InsertBaselineMetrics = z.infer<typeof insertBaselineMetricsSchema>;
export type BaselineMetric = typeof baselineMetrics.$inferSelect;
