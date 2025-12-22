import { z } from "zod";

/**
 * Environment variable schema with validation
 * Run at startup to ensure all required vars are present
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10)),
  BIND_HOST: z.string().default("0.0.0.0").describe("Host to bind the HTTP server to"),
  DATABASE_URL: z.string().describe("PostgreSQL connection string"),
  JWT_SECRET: z
    .string()
    .default("dev-secret-key-change-in-production")
    .describe("JWT signing secret (min 32 chars in production)"),
  ALIENVALULT_OTX_API_KEY: z.string().optional().describe("AlienVault OTX API key"),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Safe to use throughout the app
 */
export const env = envSchema.parse(process.env);

/**
 * Log which environment we're running in
 */
export function logEnvironment(): void {
  console.log(`📋 Environment: ${env.NODE_ENV}`);
  console.log(`🔌 Database: ${env.DATABASE_URL?.split("@")[1] || "unknown"}`);
  console.log(`🌐 Bind: ${env.BIND_HOST}:${env.PORT}`);
  console.log(`🔑 JWT Secret: ${env.JWT_SECRET === "dev-secret-key-change-in-production" ? "⚠️  DEFAULT (unsafe)" : "✅ Set"}`);
}
