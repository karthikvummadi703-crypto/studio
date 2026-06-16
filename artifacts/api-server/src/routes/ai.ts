import { Router, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../lib/logger";

const router = Router();

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  logger.warn("GOOGLE_AI_API_KEY is not set — AI endpoints will return 503");
}

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

/**
 * POST /api/ai/chat
 * Streams a Gemini response for the AI Advisor chat.
 */
router.post("/ai/chat", async (req: Request, res: Response) => {
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const { history = [], userInput, userContext }: ChatRequestBody = req.body;

  if (!userInput?.trim()) {
    res.status(400).json({ error: "userInput is required" });
    return;
  }

  const ctx = userContext ?? { points: 0, score: 0, level: "Seedling", challengesCompleted: 0 };

  const systemPrompt = `You are EcoPulse AI, a knowledgeable and friendly sustainability advisor.
The user's current stats:
- Sustainability Score: ${ctx.score}
- Green Points: ${ctx.points}
- Level: ${ctx.level}
- Challenges Completed: ${ctx.challengesCompleted}

Give practical, specific, encouraging advice personalised to their stats.
Keep responses concise (2-4 sentences) but genuinely helpful. Use plain text — no markdown.`;

  const contents = [
    ...history.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    { role: "user" as const, parts: [{ text: userInput }] },
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
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
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
});

/**
 * POST /api/ai/insights
 * Generates a structured reduction plan based on carbon footprint data.
 */
router.post("/ai/insights", async (req: Request, res: Response) => {
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const { totalEmissions, emissionsBreakdown }: InsightsRequestBody = req.body;

  const breakdown = emissionsBreakdown ?? {
    transportation: totalEmissions,
    homeEnergy: 0,
    food: 0,
    lifestyle: 0,
  };

  const prompt = `You are an environmental scientist. Analyse this carbon footprint and produce a reduction plan.

Total emissions: ${totalEmissions} kg CO₂
Breakdown:
- Transportation: ${breakdown.transportation} kg
- Home energy: ${breakdown.homeEnergy} kg
- Food: ${breakdown.food} kg
- Lifestyle: ${breakdown.lifestyle} kg

Respond ONLY with valid JSON matching this exact structure (no markdown, no explanation):
{
  "personalizedAnalysis": "2-3 sentence analysis of their footprint",
  "weeklyActionPlan": "3-4 specific weekly actions",
  "monthlyImprovementStrategy": "2-3 monthly goals",
  "transportationRecommendations": ["tip1", "tip2", "tip3"],
  "homeEnergyRecommendations": ["tip1", "tip2"],
  "foodRecommendations": ["tip1", "tip2"],
  "lifestyleRecommendations": ["tip1", "tip2"]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, temperature: 0.4 },
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err: unknown) {
    logger.error({ err }, "AI insights error");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
