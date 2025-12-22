import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL environment variable is required");
}

/**
 * PostgreSQL connection pool
 * Uses postgres.js with automatic connection pooling
 */
export const connection = postgres(process.env.DATABASE_URL);

/**
 * Drizzle ORM instance
 * Use this to query the database throughout the app
 */
export const db = drizzle(connection);

/**
 * Health check for database connectivity
 * Returns true if database is reachable, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Close database connection (useful for graceful shutdown)
 */
export async function closeConnection(): Promise<void> {
  await connection.end();
}
