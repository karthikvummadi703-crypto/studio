import { Router, type Request, type Response, type NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { logger } from "../lib/logger";

const router = Router();

const apiKey = process.env["GOOGLE_AI_API_KEY"];
if (!apiKey) {
  logger.warn("GOOGLE_AI_API_KEY is not set — AI endpoints will return 503");
}

const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ─── Auth ─────────────────────────────────────────────────────────────────────

interface AuthedRequest extends Request {
  uid?: string;
}

/**
 * Verify a Firebase ID token via the Firebase REST accounts:lookup endpoint.
 * Works server-side with just the web API key — no Admin SDK required.
 */
async function verifyFirebaseToken(idToken: string): Promise<string> {
  const firebaseApiKey =
    process.env["FIREBASE_API_KEY"] ?? process.env["VITE_FIREBASE_API_KEY"];
  if (!firebaseApiKey) throw new Error("FIREBASE_API_KEY not configured");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(errBody?.error?.message ?? "Invalid token");
  }

  const data = (await res.json()) as {
    users?: { localId: string }[];
  };
  const uid = data?.users?.[0]?.localId;
  if (!uid) throw new Error("Token user not found");
  return uid;
}

async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }
  try {
    req.uid = await verifyFirebaseToken(authHeader.slice(7));
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    res.status(401).json({ error: `Unauthorized: ${message}` });
  }
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
  lastAccess: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodically evict stale entries (keys not accessed in 5 minutes)
setInterval(
  () => {
    const cutoff = Date.now() - 5 * 60_000;
    for (const [key, entry] of rateLimitStore) {
      if (entry.lastAccess < cutoff) rateLimitStore.delete(key);
    }
  },
  60_000
);

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key) ?? { timestamps: [], lastAccess: now };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  entry.lastAccess = now;

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
      res
        .status(429)
        .json({ error: "Too many requests. Please wait before trying again." });
      return;
    }
    next();
  };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(["user", "ai"]),
  text: z.string().max(4000),
});

const UserContextSchema = z.object({
  points: z.number().nonnegative(),
  score: z.number().nonnegative(),
  level: z.string().max(50),
  challengesCompleted: z.number().nonnegative(),
});

const ChatRequestSchema = z.object({
  history: z.array(ChatMessageSchema).max(20).optional().default([]),
  userInput: z.string().min(1).max(2000),
  userContext: UserContextSchema.optional(),
});

const InsightsRequestSchema = z.object({
  totalEmissions: z.number().nonnegative(),
  emissionsBreakdown: z
    .object({
      transportation: z.number().nonnegative(),
      homeEnergy: z.number().nonnegative(),
      food: z.number().nonnegative(),
      lifestyle: z.number().nonnegative(),
    })
    .optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Auth: Firebase ID token required.  Rate: 15 req / 60 s per uid.
 * Streams Gemini response as plain-text chunks.
 */
router.post(
  "/ai/chat",
  requireAuth,
  rateLimit(15, 60_000),
  async (req: AuthedRequest, res: Response) => {
    if (!genai) {
      res.status(503).json({ error: "AI service not configured" });
      return;
    }

    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const { history, userInput, userContext } = parsed.data;

    const ctx = userContext ?? {
      points: 0,
      score: 0,
      level: "Seedling",
      challengesCompleted: 0,
    };

    const systemPrompt = `You are EcoPulse AI, a knowledgeable and friendly sustainability advisor.
The user's current stats:
- Sustainability Score: ${ctx.score}
- Green Points: ${ctx.points}
- Level: ${ctx.level}
- Challenges Completed: ${ctx.challengesCompleted}

Give practical, specific, encouraging advice personalised to their stats.
Keep responses concise (2-4 sentences) but genuinely helpful. Use plain text — no markdown.`;

    const contents = [
      ...history.slice(-10).map((m) => ({
        role: m.role === "ai" ? "model" : ("user" as const),
        parts: [{ text: String(m.text).slice(0, 2000) }],
      })),
      {
        role: "user" as const,
        parts: [{ text: userInput.trim().slice(0, 2000) }],
      },
    ];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Transfer-Encoding", "chunked");

    try {
      const stream = await genai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) res.write(text);
      }
      res.end();
    } catch (err: unknown) {
      logger.error({ err }, "AI chat stream error");
      if (!res.headersSent) {
        res.status(500).json({ error: "AI service error" });
      } else {
        res.end();
      }
    }
  }
);

/**
 * POST /api/ai/insights
 * Auth: Firebase ID token required.  Rate: 10 req / 60 s per uid.
 */
router.post(
  "/ai/insights",
  requireAuth,
  rateLimit(10, 60_000),
  async (req: AuthedRequest, res: Response) => {
    if (!genai) {
      res.status(503).json({ error: "AI service not configured" });
      return;
    }

    const parsed = InsightsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const { totalEmissions, emissionsBreakdown } = parsed.data;

    const breakdown = emissionsBreakdown ?? {
      transportation: totalEmissions,
      homeEnergy: 0,
      food: 0,
      lifestyle: 0,
    };

    const recShape =
      `[{"action":"string","impactLevel":"High|Medium|Low","difficultyLevel":"Easy|Moderate|Hard","estimatedCarbonSavings":"e.g. 120 kg CO₂/yr"}]`;

    const prompt = `You are an environmental scientist. Analyse this carbon footprint and produce a structured reduction plan.

Total emissions: ${totalEmissions} kg CO₂
Breakdown:
- Transportation: ${breakdown.transportation} kg
- Home energy: ${breakdown.homeEnergy} kg
- Food: ${breakdown.food} kg
- Lifestyle: ${breakdown.lifestyle} kg

Respond ONLY with valid JSON matching this exact structure (no markdown, no explanation outside the JSON):
{
  "personalizedAnalysis": "2-3 sentence analysis of their specific footprint pattern",
  "weeklyActionPlan": "3-4 specific weekly actions they can take immediately",
  "monthlyImprovementStrategy": "2-3 monthly goals to track measurable progress",
  "transportationRecommendations": ${recShape},
  "homeEnergyRecommendations": ${recShape},
  "foodRecommendations": ${recShape},
  "lifestyleRecommendations": ${recShape}
}

Rules:
- Each recommendation array must contain 2-3 items.
- impactLevel must be exactly "High", "Medium", or "Low".
- difficultyLevel must be exactly "Easy", "Moderate", or "Hard".
- estimatedCarbonSavings must be a realistic numeric string, e.g. "85 kg CO₂/yr".`;

    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048, temperature: 0.4 },
      });

      const text = response.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");

      const result = JSON.parse(jsonMatch[0]);
      res.json(result);
    } catch (err: unknown) {
      logger.error({ err }, "AI insights error");
      res.status(500).json({ error: "Failed to generate insights" });
    }
  }
);

export default router;
