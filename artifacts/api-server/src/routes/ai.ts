import { Router, type Request, type Response, type NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../lib/logger";

const router = Router();

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  logger.warn("GOOGLE_AI_API_KEY is not set — AI endpoints will return 503");
}

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
    process.env.FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY;
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

const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= limit) {
    rateLimitStore.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface UserContext {
  points: number;
  score: number;
  level: string;
  challengesCompleted: number;
}

interface ChatRequestBody {
  history?: ChatMessage[];
  userInput: string;
  userContext?: UserContext;
}

interface InsightsRequestBody {
  totalEmissions: number;
  emissionsBreakdown?: {
    transportation: number;
    homeEnergy: number;
    food: number;
    lifestyle: number;
  };
}

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
    if (!apiKey) {
      res.status(503).json({ error: "AI service not configured" });
      return;
    }

    const { history = [], userInput, userContext }: ChatRequestBody = req.body;

    if (!userInput?.trim()) {
      res.status(400).json({ error: "userInput is required" });
      return;
    }

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
      const ai = new GoogleGenAI({ apiKey });
      const stream = await ai.models.generateContentStream({
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
 *
 * Returns GenerateReductionPlanOutput — matches the frontend type exactly:
 * {
 *   personalizedAnalysis: string
 *   weeklyActionPlan: string
 *   monthlyImprovementStrategy: string
 *   transportationRecommendations: Recommendation[]
 *   homeEnergyRecommendations: Recommendation[]
 *   foodRecommendations: Recommendation[]
 *   lifestyleRecommendations: Recommendation[]
 * }
 * Recommendation = { action, impactLevel: High|Medium|Low,
 *                    difficultyLevel: Easy|Moderate|Hard, estimatedCarbonSavings }
 */
router.post(
  "/ai/insights",
  requireAuth,
  rateLimit(10, 60_000),
  async (req: AuthedRequest, res: Response) => {
    if (!apiKey) {
      res.status(503).json({ error: "AI service not configured" });
      return;
    }

    const { totalEmissions, emissionsBreakdown }: InsightsRequestBody =
      req.body;

    if (typeof totalEmissions !== "number" || totalEmissions < 0) {
      res
        .status(400)
        .json({ error: "totalEmissions must be a non-negative number" });
      return;
    }

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
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048, temperature: 0.4 },
      });

      const text = response.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } catch (err: unknown) {
      logger.error({ err }, "AI insights error");
      res.status(500).json({ error: "Failed to generate insights" });
    }
  }
);

export default router;
