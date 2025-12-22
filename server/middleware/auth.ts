import { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken, JWTPayload } from "../auth";

/**
 * Extend Express Request to include authenticated user info
 */
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

/**
 * Middleware: Verify JWT token from Authorization header
 * Sets req.user if token is valid, returns 401 if missing or invalid
 *
 * Usage: app.use(authenticateJWT)
 * Or:    app.get('/protected', authenticateJWT, handler)
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Attach user to request
  req.user = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  };

  next();
}

/**
 * Middleware: Require specific role(s)
 * Returns 403 if user lacks required role
 *
 * Usage: app.get('/admin', authenticateJWT, requireRole("admin"), handler)
 * Usage: app.get('/analyst', authenticateJWT, requireRole("admin", "analyst"), handler)
 *
 * @param roles - One or more allowed role(s)
 * @returns Express middleware function
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${roles.join(" or ")}, Got: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Optional authentication
 * Sets req.user if token is present and valid, but doesn't fail if missing
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      };
    }
  }

  next();
}
