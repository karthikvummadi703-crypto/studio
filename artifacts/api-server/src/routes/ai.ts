import { Router, type IRouter } from "express";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function getGemini() {
  const apiKey = process.env["GOOGLE_GENAI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

router.post("/ai/chat", requireAuth, async (req, res) => {
  try {
    const {
      history = [],
      userInput,
      userContext,
    } = req.body as {
      history: { role: string; text: string }[];
      userInput: string;
      userContext: {
        points: number;
        score: number;
        level: string;
        challengesCompleted: number;
      };
    };

    if (!userInput || typeof userInput !== "string") {
      res.status(400).json({ error: "userInput is required" });
      return;
    }

    const genai = getGemini();
    const model = genai.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    });

    const systemPrompt = `You are EcoPulse AI, a high-speed sustainability expert.

User Context:
- Score: ${userContext?.score ?? 0}
- Points: ${userContext?.points ?? 0}
- Level: ${userContext?.level ?? "Beginner"}
- Challenges completed: ${userContext?.challengesCompleted ?? 0}

Instruction: Provide a concise, 2-sentence actionable sustainability tip. Be specific to their stats.`;

    const chatHistory = history.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");

    const result = await chat.sendMessageStream(userInput);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end();
    }
  }
});

router.post("/ai/insights", requireAuth, async (req, res) => {
  try {
    const {
      totalEmissions,
      emissionsBreakdown,
      userName = "User",
    } = req.body as {
      totalEmissions: number;
      emissionsBreakdown: {
        transportation: number;
        homeEnergy: number;
        food: number;
        lifestyle: number;
      };
      userName?: string;
    };

    if (typeof totalEmissions !== "number") {
      res.status(400).json({ error: "totalEmissions is required" });
      return;
    }

    const genai = getGemini();
    const model = genai.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an expert sustainability analyst helping users understand their carbon footprint.

Analyse the following data for user '${userName}':

Total Emissions: ${totalEmissions} kgCO2e
Breakdown:
- Transportation: ${emissionsBreakdown?.transportation ?? 0} kgCO2e
- Home Energy:    ${emissionsBreakdown?.homeEnergy ?? 0} kgCO2e
- Food:           ${emissionsBreakdown?.food ?? 0} kgCO2e
- Lifestyle:      ${emissionsBreakdown?.lifestyle ?? 0} kgCO2e

Respond with ONLY a JSON object in this exact shape:
{
  "personalizedAnalysis": "<personalised explanation highlighting main sources, constructive tone>",
  "mainEmissionSources": ["<source1>", "<source2>", "<source3>"],
  "highestImpactCategory": "<single category name>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let parsed: unknown;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {
        personalizedAnalysis: text,
        mainEmissionSources: [],
        highestImpactCategory: "transportation",
      };
    }

    res.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service error";
    res.status(500).json({ error: message });
  }
});

export default router;
