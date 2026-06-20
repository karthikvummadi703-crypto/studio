import { type Request, type Response, type NextFunction } from "express";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { logger } from "../lib/logger";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const projectId =
    process.env["VITE_FIREBASE_PROJECT_ID"] ?? process.env["FIREBASE_PROJECT_ID"] ?? "";

  const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
  const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    adminApp = initializeApp({ projectId });
  }

  return adminApp;
}

/**
 * Express middleware that verifies a Firebase ID token from the Authorization header.
 * Responds 401 when the token is missing or invalid.
 * Attaches `res.locals.uid` on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    res.locals["uid"] = decoded.uid;
    next();
  } catch (err) {
    logger.warn({ err }, "Firebase ID token verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
