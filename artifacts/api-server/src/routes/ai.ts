import { Router, type Request, type Response, type NextFunction } from "express";

const router = Router();

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── Auth middleware ──────────────────────────────────────────────────────────

interface AuthedRequest extends Request {
  uid?: string;
}

/**
 * Verifies a Firebase ID token using the Firebase REST API.
 * Requires FIREBASE_API_KEY (the web API key from Firebase Console > Project Settings).
 */
async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email?: string }> {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_API_KEY not configured");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? "Invalid token");
  }

  const data = await res.json() as { users: { localId: string; email?: string }[] };
  const user = data?.users?.[0];
  if (!user?.localId) throw new Error("Token user not found");
  return { uid: user.localId, email: user.email };
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }
  try {
    const { uid } = await verifyFirebaseToken(auth.slice(7));
    req.uid = uid;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    res.status(401).json({ error: `Unauthorized: ${message}` });
  }
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

interface Window { timestamps: number[] }
const rateLimitStore = new Map<string, Window>();

/**
 * Sliding-window rate limiter keyed by uid (or IP fallback).
 * Returns true if the request is allowed.
 */
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  if (entry.timestamps.length >= limit) {
    rateLimitStore.set(key, entry);
    return false;
  }
  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);
  return true;
}

function rateLimit(limit: number, windowMs: number) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const key = req.uid ?? req.ip ?? "anon";
    if (!checkRateLimit(key, limit, windowMs)) {
      res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
      res.status(429).json({ error: "Too many requests. Please wait before trying again." });
      return;
    }
    next();
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGeminiKey(): string {
  const key = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set");
  return key;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Auth: Firebase ID token required. Rate: 15 req/60s per uid.
 * Streams Gemini response as plain text chunks.
 */
router.post(
  "/chat",
  requireAuth,
  rateLimit(15, 60_000),
  async (req: AuthedRequest, res: Response) => {
    try {
      const geminiKey = getGeminiKey();
      const { history = [], userInput, userContext = {} } = req.body as {
        history: { role: string; text: string }[];
        userInput: string;
        userContext: Record<string, unknown>;
      };

      if (!userInput || typeof userInput !== "string" || userInput.trim().length === 0) {
        res.status(400).json({ error: "userInput is required and must be non-empty" });
        return;
      }

      const systemInstruction =
        `You are EcoPulse AI, an expert sustainability advisor. ` +
        `The user has ${userContext.points ?? 0} green points, ` +
        `sustainability score ${userContext.score ?? 0}, ` +
        `level "${userContext.level ?? "Seedling"}", ` +
        `and has completed ${userContext.challengesCompleted ?? 0} challenges. ` +
        `Give practical, motivating carbon-reduction advice. Be concise and friendly.`;

      const contents = [
        ...history.slice(-10).map((m) => ({
          role: m.role === "ai" ? "model" : "user",
          parts: [{ text: String(m.text).slice(0, 2000) }],
        })),
        { role: "user", parts: [{ text: userInput.trim().slice(0, 2000) }] },
      ];

      const url = `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${geminiKey}&alt=sse`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
      });

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        res.status(502).json({ error: "AI service error", detail: err.slice(0, 200) });
        return;
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value);
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json) as {
              candidates?: { content?: { parts?: { text?: string }[] } }[];
            };
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) res.write(text);
          } catch {
            // skip malformed SSE lines
          }
        }
      }
      res.end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (!res.headersSent) res.status(500).json({ error: message });
    }
  }
);

/**
 * POST /api/ai/insights
 * Auth: Firebase ID token required. Rate: 10 req/60s per uid.
 * Returns JSON carbon reduction plan.
 */
router.post(
  "/insights",
  requireAuth,
  rateLimit(10, 60_000),
  async (req: AuthedRequest, res: Response) => {
    try {
      const geminiKey = getGeminiKey();
      const { totalEmissions = 0, emissionsBreakdown = {} } = req.body as {
        totalEmissions: number;
        emissionsBreakdown: {
          transportation?: number;
          homeEnergy?: number;
          food?: number;
          lifestyle?: number;
        };
      };

      if (typeof totalEmissions !== "number" || totalEmissions < 0) {
        res.status(400).json({ error: "totalEmissions must be a non-negative number" });
        return;
      }

      const prompt =
        `You are a carbon reduction expert. A user has total emissions of ${totalEmissions} kgCO2e. ` +
        `Breakdown: transportation=${emissionsBreakdown.transportation ?? 0} kgCO2e, ` +
        `homeEnergy=${emissionsBreakdown.homeEnergy ?? 0} kgCO2e, ` +
        `food=${emissionsBreakdown.food ?? 0} kgCO2e, ` +
        `lifestyle=${emissionsBreakdown.lifestyle ?? 0} kgCO2e.\n\n` +
        `Return a JSON object with exactly this shape (raw JSON only, no markdown):\n` +
        `{"personalizedAnalysis":"<2-3 sentence analysis>",` +
        `"transportation":[{"action":"...","impactLevel":"High","difficultyLevel":"Easy","estimatedCarbonSavings":"..."}],` +
        `"homeEnergy":[{"action":"...","impactLevel":"High","difficultyLevel":"Easy","estimatedCarbonSavings":"..."}],` +
        `"food":[{"action":"...","impactLevel":"High","difficultyLevel":"Easy","estimatedCarbonSavings":"..."}],` +
        `"lifestyle":[{"action":"...","impactLevel":"High","difficultyLevel":"Easy","estimatedCarbonSavings":"..."}]}` +
        `\nProvide 2-3 items per category. impactLevel: High|Medium|Low. difficultyLevel: Easy|Moderate|Hard.`;

      const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
        }),
      });

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        res.status(502).json({ error: "AI service error", detail: err.slice(0, 200) });
        return;
      }

      const data = await geminiRes.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

      try {
        res.json(JSON.parse(cleaned));
      } catch {
        res.status(502).json({ error: "AI returned malformed JSON", raw: cleaned.slice(0, 200) });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  }
);

export default router;
