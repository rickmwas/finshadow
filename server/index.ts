import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { healthCheck } from "./db";
import { env, logEnvironment } from "./env";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// =====================
// MIDDLEWARE
// =====================

// Enable CORS for Vite frontend in dev + production (adjust as needed)
app.use(cors({
  origin: env.NODE_ENV === "development" ? "http://localhost:5173" : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// JSON & URL-encoded body parsing with raw buffer
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Logging helper
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Determine sensitive endpoints
function isSensitiveEndpoint(path: string): boolean {
  return path.includes("/auth") || path.includes("/password") || path.includes("/login");
}

// Sanitize sensitive response data
function sanitizeResponse(data: any): any {
  if (!data || typeof data !== "object") return data;
  const copy = { ...data };
  delete copy.password;
  if (copy.token) copy.token = "***";
  delete copy.hash;
  if (copy.jwt) copy.jwt = "***";
  return copy;
}

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && !isSensitiveEndpoint(path)) {
        logLine += ` :: ${JSON.stringify(sanitizeResponse(capturedJsonResponse))}`;
      }
      log(logLine);
    }
  });

  next();
});

// =====================
// STARTUP
// =====================
(async () => {
  logEnvironment();

  log("🔍 Checking database connectivity...");
  const dbHealthy = await healthCheck();

  if (!dbHealthy) {
    if (env.NODE_ENV === "production") {
      log("❌ Database unreachable in production. Aborting startup.", "error");
      process.exit(1);
    } else {
      log("⚠️  Database unreachable. Continuing in dev mode...", "warn");
    }
  } else {
    log("✅ Database connection healthy");
  }

  await registerRoutes(httpServer, app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Serve static only in production
  if (env.NODE_ENV === "production") {
    try {
      serveStatic(app);
    } catch (err: any) {
      log(`⚠️  Static assets not found: ${err.message}`, "warn");
    }
  } else {
    app.get("/", (_req, res) => {
      res.json({
        message: "FinShadow API Server",
        frontend: "Frontend running on http://localhost:5173",
        apis: "API endpoints available at /api/*",
      });
    });
  }

  const port = env.PORT || 5000;
  const host = env.BIND_HOST || "0.0.0.0";
  httpServer.listen(port, host, () => {
    log(`🚀 Server running on ${host}:${port}`);
  });
})();
