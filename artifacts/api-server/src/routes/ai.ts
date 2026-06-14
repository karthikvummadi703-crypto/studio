import { Router, type Request, type Response } from "express";

const router = Router();

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey(): string {
  const key = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set");
  return key;
}

/**
 * POST /api/ai/chat
 * Streams an AI response from Gemini back to the client as plain text chunks.
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKey();
    const { history = [], userInput, userContext = {} } = req.body as {
      history: { role: string; text: string }[];
      userInput: string;
      userContext: Record<string, unknown>;
    };

    if (!userInput) {
      res.status(400).json({ error: "userInput is required" });
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
      ...history.map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: userInput }] },
    ];

    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;
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
      res.status(502).json({ error: "AI service error", detail: err });
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
          const parsed = JSON.parse(json);
          const text: string =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
});

/**
 * POST /api/ai/insights
 * Returns a JSON carbon reduction plan based on the user's emissions data.
 */
router.post("/insights", async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKey();
    const { totalEmissions = 0, emissionsBreakdown = {} } = req.body as {
      totalEmissions: number;
      emissionsBreakdown: {
        transportation?: number;
        homeEnergy?: number;
        food?: number;
        lifestyle?: number;
      };
    };

    const prompt =
      `You are a carbon reduction expert. A user has total emissions of ${totalEmissions} kgCO2e. ` +
      `Breakdown: transportation=${emissionsBreakdown.transportation ?? 0} kgCO2e, ` +
      `homeEnergy=${emissionsBreakdown.homeEnergy ?? 0} kgCO2e, ` +
      `food=${emissionsBreakdown.food ?? 0} kgCO2e, ` +
      `lifestyle=${emissionsBreakdown.lifestyle ?? 0} kgCO2e.\n\n` +
      `Return a JSON object with exactly this shape (no markdown, raw JSON only):\n` +
      `{\n` +
      `  "personalizedAnalysis": "<2-3 sentence analysis>",\n` +
      `  "transportation": [{"action":"...","impactLevel":"High|Medium|Low","difficultyLevel":"Easy|Moderate|Hard","estimatedCarbonSavings":"..."}],\n` +
      `  "homeEnergy": [{"action":"...","impactLevel":"High|Medium|Low","difficultyLevel":"Easy|Moderate|Hard","estimatedCarbonSavings":"..."}],\n` +
      `  "food": [{"action":"...","impactLevel":"High|Medium|Low","difficultyLevel":"Easy|Moderate|Hard","estimatedCarbonSavings":"..."}],\n` +
      `  "lifestyle": [{"action":"...","impactLevel":"High|Medium|Low","difficultyLevel":"Easy|Moderate|Hard","estimatedCarbonSavings":"..."}]\n` +
      `}\n` +
      `Provide 2-3 recommendations per category. Output only valid JSON.`;

    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
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
      res.status(502).json({ error: "AI service error", detail: err });
      return;
    }

    const data = (await geminiRes.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
      res.json(JSON.parse(cleaned));
    } catch {
      res.status(502).json({ error: "AI returned invalid JSON", raw: cleaned.slice(0, 200) });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
