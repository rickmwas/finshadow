import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateJWT, requireRole } from "./middleware/auth";
import { hashPassword, verifyPassword, generateToken } from "./auth";
import {
  insertUserSchema,
  insertTransactionSchema,
  insertFraudFindingSchema,
  insertThreatActorSchema,
  insertDarkWebIntelSchema,
  insertPredictionSchema,
  insertAlertSchema,
} from "@shared/schema";
import { log } from "./index";

// Simple validation helper
function validateRequest<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T }
): { valid: true; data: T } | { valid: false; error: string } {
  try {
    return { valid: true, data: schema.parse(data) };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== AUTH ROUTES ====================
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertUserSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const existingUser = await storage.getUserByUsername(validation.data.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Hash password before storing (SECURITY)
      const hashedPassword = await hashPassword(validation.data.password);

      const user = await storage.createUser({
        ...validation.data,
        password: hashedPassword,
      });

      log(`✅ User registered: ${user.username}`, "auth");
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      log(`Register error: ${error.message}`, "auth");
      res.status(500).json({ error: "Registration failed" });
    }
  });

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

      // Verify password against bcrypt hash (SECURITY)
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token instead of returning raw user
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role as "admin" | "analyst" | "viewer",
      });

      log(`✅ User logged in: ${username}`, "auth");
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

  // ==================== TRANSACTIONS ====================
  app.get("/api/transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || "user-1";
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await storage.getTransactionsByUser(userId, limit, offset);
      res.json(transactions);
    } catch (error: any) {
      log(`Get transactions error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      log(`Get transaction error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertTransactionSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const transaction = await storage.createTransaction(validation.data);
      log(`Transaction created: ${transaction.id}`);
      res.status(201).json(transaction);
    } catch (error: any) {
      log(`Create transaction error: ${error.message}`);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateTransaction(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      log(`Transaction updated: ${req.params.id}`);
      res.json(updated);
    } catch (error: any) {
      log(`Update transaction error: ${error.message}`);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // ==================== FRAUD FINDINGS ====================
  app.get("/api/fraud/findings", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const findings = await storage.getFraudFindings(status, limit, offset);
      res.json(findings);
    } catch (error: any) {
      log(`Get fraud findings error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch fraud findings" });
    }
  });

  app.get("/api/fraud/findings/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const finding = await storage.getFraudFinding(req.params.id);
      if (!finding) {
        return res.status(404).json({ error: "Fraud finding not found" });
      }
      res.json(finding);
    } catch (error: any) {
      log(`Get fraud finding error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch fraud finding" });
    }
  });

  app.post("/api/fraud/findings", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertFraudFindingSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const finding = await storage.createFraudFinding(validation.data);
      log(`Fraud finding created: ${finding.id}`);
      res.status(201).json(finding);
    } catch (error: any) {
      log(`Create fraud finding error: ${error.message}`);
      res.status(500).json({ error: "Failed to create fraud finding" });
    }
  });

  app.put("/api/fraud/findings/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateFraudFinding(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Fraud finding not found" });
      }
      log(`Fraud finding updated: ${req.params.id}`);
      res.json(updated);
    } catch (error: any) {
      log(`Update fraud finding error: ${error.message}`);
      res.status(500).json({ error: "Failed to update fraud finding" });
    }
  });

  app.post("/api/fraud/findings/:id/investigate", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateFraudFinding(req.params.id, {
        status: "investigating",
        investigatedBy: req.body.userId,
      });
      if (!updated) {
        return res.status(404).json({ error: "Fraud finding not found" });
      }
      log(`Fraud finding investigation started: ${req.params.id}`);
      res.json(updated);
    } catch (error: any) {
      log(`Investigation error: ${error.message}`);
      res.status(500).json({ error: "Failed to start investigation" });
    }
  });

  app.post("/api/fraud/findings/:id/resolve", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateFraudFinding(req.params.id, {
        status: "resolved",
        resolvedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ error: "Fraud finding not found" });
      }
      log(`Fraud finding resolved: ${req.params.id}`);
      res.json(updated);
    } catch (error: any) {
      log(`Resolve error: ${error.message}`);
      res.status(500).json({ error: "Failed to resolve finding" });
    }
  });

  // ==================== THREAT ACTORS ====================
  app.get("/api/threats/actors", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const actors = await storage.getThreatActors(limit, offset);
      res.json(actors);
    } catch (error: any) {
      log(`Get threat actors error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch threat actors" });
    }
  });

  app.get("/api/threats/actors/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const actor = await storage.getThreatActor(req.params.id);
      if (!actor) {
        return res.status(404).json({ error: "Threat actor not found" });
      }
      res.json(actor);
    } catch (error: any) {
      log(`Get threat actor error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch threat actor" });
    }
  });

  app.post("/api/threats/actors", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertThreatActorSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const actor = await storage.createThreatActor(validation.data);
      log(`Threat actor created: ${actor.id}`);
      res.status(201).json(actor);
    } catch (error: any) {
      log(`Create threat actor error: ${error.message}`);
      res.status(500).json({ error: "Failed to create threat actor" });
    }
  });

  app.put("/api/threats/actors/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateThreatActor(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Threat actor not found" });
      }
      log(`Threat actor updated: ${req.params.id}`);
      res.json(updated);
    } catch (error: any) {
      log(`Update threat actor error: ${error.message}`);
      res.status(500).json({ error: "Failed to update threat actor" });
    }
  });

  // ==================== DARK WEB INTEL ====================
  app.get("/api/dark-web/intel", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const severity = req.query.severity as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const intels = await storage.getDarkWebIntels(severity, limit, offset);
      res.json(intels);
    } catch (error: any) {
      log(`Get dark web intel error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch dark web intelligence" });
    }
  });

  app.get("/api/dark-web/intel/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const intel = await storage.getDarkWebIntel(req.params.id);
      if (!intel) {
        return res.status(404).json({ error: "Intel not found" });
      }
      res.json(intel);
    } catch (error: any) {
      log(`Get dark web intel error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch intelligence" });
    }
  });

  app.post("/api/dark-web/intel", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertDarkWebIntelSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const intel = await storage.createDarkWebIntel(validation.data);
      log(`Dark web intel created: ${intel.id}`);
      res.status(201).json(intel);
    } catch (error: any) {
      log(`Create dark web intel error: ${error.message}`);
      res.status(500).json({ error: "Failed to create intelligence" });
    }
  });

  // ==================== PREDICTIONS ====================
  app.get("/api/predictions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const predictions = await storage.getPredictions(limit, offset);
      res.json(predictions);
    } catch (error: any) {
      log(`Get predictions error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.get("/api/predictions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const prediction = await storage.getPrediction(req.params.id);
      if (!prediction) {
        return res.status(404).json({ error: "Prediction not found" });
      }
      res.json(prediction);
    } catch (error: any) {
      log(`Get prediction error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch prediction" });
    }
  });

  app.post("/api/predictions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertPredictionSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const prediction = await storage.createPrediction(validation.data);
      log(`Prediction created: ${prediction.id}`);
      res.status(201).json(prediction);
    } catch (error: any) {
      log(`Create prediction error: ${error.message}`);
      res.status(500).json({ error: "Failed to create prediction" });
    }
  });

  // ==================== ALERTS ====================
  app.get("/api/alerts", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || "user-1";
      const unreadOnly = req.query.unreadOnly === "true";
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const alerts = await storage.getAlertsByUser(userId, unreadOnly, limit, offset);
      res.json(alerts);
    } catch (error: any) {
      log(`Get alerts error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error: any) {
      log(`Get alert error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = validateRequest(req.body, insertAlertSchema);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const alert = await storage.createAlert(validation.data);
      log(`Alert created: ${alert.id}`);
      res.status(201).json(alert);
    } catch (error: any) {
      log(`Create alert error: ${error.message}`);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.put("/api/alerts/:id/read", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const alert = await storage.markAlertAsRead(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      log(`Alert marked as read: ${req.params.id}`);
      res.json(alert);
    } catch (error: any) {
      log(`Mark alert read error: ${error.message}`);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // ==================== STATS & DASHBOARD ====================
  app.get("/api/stats", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      log(`Get stats error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      const recentFindings = await storage.getFraudFindings(undefined, 5);
      const predictions = await storage.getPredictions(3);
      const threatActors = await storage.getThreatActors(5);

      res.json({
        stats,
        recentFindings,
        predictions,
        threatActors,
      });
    } catch (error: any) {
      log(`Get dashboard error: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ==================== HEALTH CHECK & 404 ====================
  // Only catch 404 for API routes, let other routes (like /) pass through
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({ error: "Endpoint not found", path: req.path });
  });

  return httpServer;
}
