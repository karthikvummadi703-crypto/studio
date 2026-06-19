import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures this variable is initialised before the vi.mock factory runs
const mockPromptFn = vi.hoisted(() => vi.fn());

vi.mock("../genkit", () => ({
  ai: {
    definePrompt: vi.fn(() => mockPromptFn),
    defineFlow: vi.fn((config: unknown, handler: (input: unknown) => unknown) => {
      // In Genkit, defineFlow returns a callable that executes the handler
      return (input: unknown) => handler(input);
    }),
  },
}));

import { generateCarbonAnalysis } from "../flows/generate-carbon-analysis";
import { generateReductionPlan } from "../flows/generate-reduction-plan";
import { aiAdvisorChat } from "../flows/ai-advisor-chat";
import { GenerateCarbonAnalysisInputSchema } from "../flows/generate-carbon-analysis";
import { GenerateReductionPlanInputSchema } from "../flows/generate-reduction-plan";
import { AIAdvisorChatInputSchema } from "../flows/ai-advisor-chat";

describe("Genkit Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCarbonAnalysis", () => {
    it("returns correctly shaped analysis from mocked prompt", async () => {
      const mockOutput = {
        personalizedAnalysis: "Your transport emissions are high.",
        mainEmissionSources: ["Transportation", "Home Energy"],
        highestImpactCategory: "Transportation",
      };

      mockPromptFn.mockResolvedValue({ output: mockOutput });

      const result = await generateCarbonAnalysis({
        userName: "Alice",
        totalEmissions: 10,
        emissionsBreakdown: {
          transportation: 5,
          homeEnergy: 3,
          food: 1,
          lifestyle: 1,
        },
      });

      expect(result).toEqual(mockOutput);
      expect(mockPromptFn).toHaveBeenCalled();
    });

    it("throws when the prompt function rejects", async () => {
      mockPromptFn.mockRejectedValueOnce(new Error("AI service unavailable"));
      await expect(
        generateCarbonAnalysis({
          userName: "Bob",
          totalEmissions: 5,
          emissionsBreakdown: {
            transportation: 2,
            homeEnergy: 1,
            food: 1,
            lifestyle: 1,
          },
        })
      ).rejects.toThrow("AI service unavailable");
    });
  });

  describe("generateReductionPlan", () => {
    it("returns a comprehensive reduction plan from mocked prompt", async () => {
      const mockOutput = {
        personalizedAnalysis: "Analysis string",
        weeklyActionPlan: "Weekly plan",
        monthlyImprovementStrategy: "Monthly strategy",
        transportationRecommendations: [
          {
            action: "Walk",
            impactLevel: "High",
            difficultyLevel: "Easy",
            estimatedCarbonSavings: "10kg",
          },
        ],
        homeEnergyRecommendations: [],
        foodRecommendations: [],
        lifestyleRecommendations: [],
      };

      mockPromptFn.mockResolvedValue({ output: mockOutput });

      const result = await generateReductionPlan({
        totalEmissions: 100,
        emissionsBreakdown: {
          transportation: 40,
          homeEnergy: 30,
          food: 20,
          lifestyle: 10,
        },
      });

      expect(result.weeklyActionPlan).toBe("Weekly plan");
      expect(result.transportationRecommendations).toHaveLength(1);
    });
  });

  describe("aiAdvisorChat", () => {
    it("returns a concise response and title from mocked prompt", async () => {
      const mockOutput = {
        responseText: "Try using a bike for short trips.",
        suggestedTitle: "Cycling for Sustainability",
      };

      mockPromptFn.mockResolvedValue({ output: mockOutput });

      const result = await aiAdvisorChat({
        history: [],
        userInput: "How can I lower my transport footprint?",
        userContext: {
          points: 100,
          score: 50,
          level: "Seedling",
          challengesCompleted: 1,
        },
      });

      expect(result.responseText).toContain("bike");
      expect(result.suggestedTitle).toBe("Cycling for Sustainability");
    });
  });

  describe("Schema validation", () => {
    it("GenerateCarbonAnalysisInputSchema rejects negative totalEmissions", () => {
      const result = GenerateCarbonAnalysisInputSchema.safeParse({
        userName: "Test",
        totalEmissions: -5,
        emissionsBreakdown: { transportation: 1, homeEnergy: 1, food: 1, lifestyle: 1 },
      });
      expect(result.success).toBe(false);
    });

    it("GenerateReductionPlanInputSchema rejects invalid emissions breakdown", () => {
      const result = GenerateReductionPlanInputSchema.safeParse({
        totalEmissions: 10,
        emissionsBreakdown: { transportation: "none" }, // Wrong type
      });
      expect(result.success).toBe(false);
    });

    it("AIAdvisorChatInputSchema rejects empty userInput", () => {
      const result = AIAdvisorChatInputSchema.safeParse({
        history: [],
        userInput: "",
        userContext: { points: 0, score: 0, level: "Seedling", challengesCompleted: 0 },
      });
      expect(result.success).toBe(false);
    });
  });
});
