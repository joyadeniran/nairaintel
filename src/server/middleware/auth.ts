import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

export interface AuthedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Requires a valid Firebase ID token in the Authorization header:
 *   Authorization: Bearer <idToken>
 *
 * Identity is taken ONLY from the verified token — never from client body/query.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Empty bearer token" });
  }

  // Firebase Admin must be initialized (via FIREBASE_SERVICE_ACCOUNT_KEY)
  if (!admin.apps.length) {
    console.error("Auth middleware: Firebase Admin is not initialized");
    return res.status(503).json({
      error: "Authentication service unavailable. Server is not configured with Firebase Admin."
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (err: any) {
    console.error("Auth middleware: token verification failed:", err?.message || err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth — attaches user if token is present and valid, otherwise continues.
 * Useful for public read endpoints that personalize when logged in.
 */
export async function optionalAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ") || !admin.apps.length) {
    return next();
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return next();

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    // Ignore invalid token for optional auth
  }

  return next();
}
