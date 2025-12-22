import {
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type FraudFinding,
  type InsertFraudFinding,
  type ThreatActor,
  type InsertThreatActor,
  type DarkWebIntel,
  type InsertDarkWebIntel,
  type Prediction,
  type InsertPrediction,
  type Alert,
  type InsertAlert,
  users,
  transactions,
  fraudFindings,
  threatActors,
  darkWebIntel,
  predictions,
  alerts,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Storage interface defining CRUD operations
 * Implemented by DrizzleStorage for PostgreSQL persistence
 */
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUser(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Fraud Findings
  getFraudFinding(id: string): Promise<FraudFinding | undefined>;
  getFraudFindings(
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<FraudFinding[]>;
  createFraudFinding(finding: InsertFraudFinding): Promise<FraudFinding>;
  updateFraudFinding(
    id: string,
    updates: Partial<FraudFinding>
  ): Promise<FraudFinding | undefined>;

  // Threat Actors
  getThreatActor(id: string): Promise<ThreatActor | undefined>;
  getThreatActors(limit?: number, offset?: number): Promise<ThreatActor[]>;
  createThreatActor(actor: InsertThreatActor): Promise<ThreatActor>;
  updateThreatActor(
    id: string,
    updates: Partial<ThreatActor>
  ): Promise<ThreatActor | undefined>;

  // Dark Web Intel
  getDarkWebIntel(id: string): Promise<DarkWebIntel | undefined>;
  getDarkWebIntels(
    severity?: string,
    limit?: number,
    offset?: number
  ): Promise<DarkWebIntel[]>;
  createDarkWebIntel(intel: InsertDarkWebIntel): Promise<DarkWebIntel>;

  // Predictions
  getPrediction(id: string): Promise<Prediction | undefined>;
  getPredictions(limit?: number, offset?: number): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;

  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  getAlertsByUser(
    userId: string,
    unreadOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<Alert | undefined>;

  // Stats
  getStats(): Promise<{
    activeThreats: number;
    fraudAttemptsBlocked: number;
    systemRiskScore: number;
    aiConfidenceAvg: number;
  }>;
}

/**
 * PostgreSQL implementation using Drizzle ORM
 * Provides persistent data storage with proper indexing and relationships
 */
export class DrizzleStorage implements IStorage {
  // ========== USERS ==========
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
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

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // ========== TRANSACTIONS ==========
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return result[0];
  }

  async getTransactionsByUser(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  // ========== FRAUD FINDINGS ==========
  async getFraudFinding(id: string): Promise<FraudFinding | undefined> {
    const result = await db
      .select()
      .from(fraudFindings)
      .where(eq(fraudFindings.id, id))
      .limit(1);
    return result[0];
  }

  async getFraudFindings(
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<FraudFinding[]> {
    let query = db
      .select()
      .from(fraudFindings)
      .orderBy(desc(fraudFindings.timestamp));

    if (status) {
      query = query.where(eq(fraudFindings.status, status)) as typeof query;
    }

    return query.limit(limit).offset(offset);
  }

  async createFraudFinding(finding: InsertFraudFinding): Promise<FraudFinding> {
    const [newFinding] = await db
      .insert(fraudFindings)
      .values(finding)
      .returning();
    return newFinding;
  }

  async updateFraudFinding(
    id: string,
    updates: Partial<FraudFinding>
  ): Promise<FraudFinding | undefined> {
    const [updated] = await db
      .update(fraudFindings)
      .set(updates)
      .where(eq(fraudFindings.id, id))
      .returning();
    return updated;
  }

  // ========== THREAT ACTORS ==========
  async getThreatActor(id: string): Promise<ThreatActor | undefined> {
    const result = await db
      .select()
      .from(threatActors)
      .where(eq(threatActors.id, id))
      .limit(1);
    return result[0];
  }

  async getThreatActors(limit = 20, offset = 0): Promise<ThreatActor[]> {
    return db
      .select()
      .from(threatActors)
      .orderBy(desc(threatActors.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async createThreatActor(actor: InsertThreatActor): Promise<ThreatActor> {
    const [newActor] = await db
      .insert(threatActors)
      .values(actor)
      .returning();
    return newActor;
  }

  async updateThreatActor(
    id: string,
    updates: Partial<ThreatActor>
  ): Promise<ThreatActor | undefined> {
    const [updated] = await db
      .update(threatActors)
      .set(updates)
      .where(eq(threatActors.id, id))
      .returning();
    return updated;
  }

  // ========== DARK WEB INTEL ==========
  async getDarkWebIntel(id: string): Promise<DarkWebIntel | undefined> {
    const result = await db
      .select()
      .from(darkWebIntel)
      .where(eq(darkWebIntel.id, id))
      .limit(1);
    return result[0];
  }

  async getDarkWebIntels(
    severity?: string,
    limit = 20,
    offset = 0
  ): Promise<DarkWebIntel[]> {
    let query = db
      .select()
      .from(darkWebIntel)
      .orderBy(desc(darkWebIntel.discoveredAt));

    if (severity) {
      query = query.where(eq(darkWebIntel.severity, severity)) as typeof query;
    }

    return query.limit(limit).offset(offset);
  }

  async createDarkWebIntel(intel: InsertDarkWebIntel): Promise<DarkWebIntel> {
    const [newIntel] = await db
      .insert(darkWebIntel)
      .values(intel)
      .returning();
    return newIntel;
  }

  // ========== PREDICTIONS ==========
  async getPrediction(id: string): Promise<Prediction | undefined> {
    const result = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, id))
      .limit(1);
    return result[0];
  }

  async getPredictions(limit = 20, offset = 0): Promise<Prediction[]> {
    return db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db
      .insert(predictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }

  // ========== ALERTS ==========
  async getAlert(id: string): Promise<Alert | undefined> {
    const result = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);
    return result[0];
  }

  async getAlertsByUser(
    userId: string,
    unreadOnly = false,
    limit = 20,
    offset = 0
  ): Promise<Alert[]> {
    const condition = unreadOnly
      ? and(eq(alerts.userId, userId), eq(alerts.read, false))
      : eq(alerts.userId, userId);

    return db
      .select()
      .from(alerts)
      .where(condition)
      .orderBy(desc(alerts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const [updated] = await db
      .update(alerts)
      .set({ read: true })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  // ========== STATS ==========
  async getStats() {
    try {
      // Get count of active threats (high/critical risk)
      const threatCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(threatActors)
        .where(
          sql`${threatActors.riskLevel} IN ('critical', 'high')`
        );

      // Get count of resolved fraud findings
      const fraudCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(fraudFindings)
        .where(eq(fraudFindings.status, "resolved"));

      // Get average risk score from predictions
      const riskStats = await db
        .select({
          avgRisk: sql<number>`cast(avg(${predictions.riskScore}) as integer)`,
          avgConfidence: sql<number>`cast(avg(${predictions.aiConfidence}) as integer)`,
        })
        .from(predictions);

      const stats = riskStats[0] || { avgRisk: 0, avgConfidence: 0 };

      return {
        activeThreats: threatCount[0]?.count || 0,
        fraudAttemptsBlocked: fraudCount[0]?.count || 0,
        systemRiskScore: stats.avgRisk || 0,
        aiConfidenceAvg: stats.avgConfidence || 0,
      };
    } catch (error) {
      // Return zero stats if tables are empty or query fails
      return {
        activeThreats: 0,
        fraudAttemptsBlocked: 0,
        systemRiskScore: 0,
        aiConfidenceAvg: 0,
      };
    }
  }
}

/**
 * Singleton storage instance using PostgreSQL/Drizzle ORM
 * All API routes use this instance for data operations
 */
export const storage = new DrizzleStorage();
