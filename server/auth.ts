import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "./env";

const SALT_ROUNDS = 10;

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  username: string;
  role: "admin" | "analyst" | "viewer";
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 * Automatically salts and returns the hash
 *
 * @param password - Plain text password to hash
 * @returns Promise<string> - bcrypt hash (e.g., $2b$10$...)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash
 * Constant-time comparison to prevent timing attacks
 *
 * @param password - Plain text password to verify
 * @param hash - bcrypt hash from database
 * @returns Promise<boolean> - true if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 * Token expires in 24 hours
 *
 * @param payload - JWTPayload with userId, username, role
 * @returns string - Signed JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "24h",
  });
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 *
 * @param token - JWT token string (without "Bearer " prefix)
 * @returns JWTPayload | null - Decoded payload or null
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 * Expected format: "Bearer <token>"
 *
 * @param authHeader - Authorization header value
 * @returns string | null - Token or null if header is invalid
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7); // Remove "Bearer " prefix
}
