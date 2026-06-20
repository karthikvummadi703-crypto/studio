import { Router, type IRouter } from "express";

const router: IRouter = Router();

let _cachedClientId: string | null | undefined = undefined;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

router.get("/config/google", async (_req, res) => {
  try {
    const now = Date.now();
    if (_cachedClientId !== undefined && now < _cacheExpiry) {
      res.json({ clientId: _cachedClientId });
      return;
    }

    // 1. Prefer an explicitly configured env var (no Firebase Hosting required)
    const envClientId =
      process.env["GOOGLE_CLIENT_ID"] ?? process.env["VITE_GOOGLE_CLIENT_ID"] ?? null;

    if (envClientId) {
      _cachedClientId = envClientId;
      _cacheExpiry = now + CACHE_TTL_MS;
      res.json({ clientId: envClientId });
      return;
    }

    // 2. Fallback: auto-discover from Firebase Hosting init.json
    const authDomain =
      process.env["VITE_FIREBASE_AUTH_DOMAIN"] ?? process.env["FIREBASE_AUTH_DOMAIN"] ?? "";

    if (!authDomain) {
      res.json({ clientId: null });
      return;
    }

    const initUrl = `https://${authDomain}/__/firebase/init.json`;
    const response = await fetch(initUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      _cachedClientId = null;
      _cacheExpiry = now + CACHE_TTL_MS;
      res.json({ clientId: null });
      return;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const clientId =
      typeof data["clientId"] === "string"
        ? data["clientId"]
        : typeof data["client_id"] === "string"
          ? data["client_id"]
          : null;

    _cachedClientId = clientId;
    _cacheExpiry = now + CACHE_TTL_MS;
    res.json({ clientId });
  } catch {
    res.json({ clientId: null });
  }
});

export default router;
