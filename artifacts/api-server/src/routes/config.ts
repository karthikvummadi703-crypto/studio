/**
 * Config proxy route.
 *
 * GET /api/config/google
 *   Server-side fetches Firebase's public /__/firebase/init.json and returns
 *   { clientId } so the frontend can use Google Identity Services without
 *   hitting a CORS error (the init.json endpoint does not set ACAO headers
 *   for arbitrary origins).
 */
import { Router } from "express";

const configRouter = Router();

let cachedClientId: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

configRouter.get("/config/google", async (req, res) => {
  try {
    // Return from cache if fresh
    if (cachedClientId && Date.now() < cacheExpiry) {
      res.json({ clientId: cachedClientId });
      return;
    }

    const authDomain = process.env["VITE_FIREBASE_AUTH_DOMAIN"];
    if (!authDomain) {
      res.status(503).json({ error: "Firebase not configured" });
      return;
    }

    const upstream = await fetch(
      `https://${authDomain}/__/firebase/init.json`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!upstream.ok) {
      res.status(502).json({ error: "Upstream unavailable" });
      return;
    }

    const data: { clientId?: string } = await upstream.json() as { clientId?: string };
    cachedClientId = data.clientId ?? null;
    cacheExpiry = Date.now() + CACHE_TTL_MS;

    res.json({ clientId: cachedClientId });
  } catch {
    res.status(502).json({ error: "Failed to fetch Google client config" });
  }
});

export default configRouter;
