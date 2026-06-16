import { describe, it, expect } from 'vitest';
import { AIAdvisorChatInputSchema } from '../flows/ai-advisor-chat';
import { GenerateCarbonAnalysisInputSchema } from '../flows/generate-carbon-analysis';
import { GenerateReductionPlanInputSchema } from '../flows/generate-reduction-plan';

describe('AI Input Schemas', () => {
  describe('AIAdvisorChatInputSchema', () => {
    it('validates correct full input', () => {
      expect(AIAdvisorChatInputSchema.safeParse({
        history: [{ role: 'user', text: 'hi' }],
        userInput: 'how to save energy?',
        userContext: { points: 100, score: 50, level: 'Seedling', challengesCompleted: 1 }
      }).success).toBe(true);
    });

    it('validates with empty history array', () => {
      expect(AIAdvisorChatInputSchema.safeParse({
        history: [],
        userInput: 'hello',
        userContext: { points: 0, score: 0, level: 'Seedling', challengesCompleted: 0 }
      }).success).toBe(true);
    });

    it('rejects missing userInput', () => {
      expect(AIAdvisorChatInputSchema.safeParse({
        history: [],
        userContext: { points: 0, score: 0, level: 'Seedling', challengesCompleted: 0 }
      }).success).toBe(false);
    });

    it('rejects invalid role in history', () => {
      expect(AIAdvisorChatInputSchema.safeParse({
        history: [{ role: 'admin', text: 'hi' }],
        userInput: 'hi',
        userContext: { points: 0, score: 0, level: 'Seedling', challengesCompleted: 0 }
      }).success).toBe(false);
    });
  });

  describe('GenerateCarbonAnalysisInputSchema', () => {
    it('validates complete correct input', () => {
      const input = {
        userName: 'John',
        totalEmissions: 5.5,
        emissionsBreakdown: { transportation: 2, homeEnergy: 1, food: 1.5, lifestyle: 1 }
      };
      expect(GenerateCarbonAnalysisInputSchema.safeParse(input).success).toBe(true);
    });

    it('rejects missing breakdown fields', () => {
      const input = {
        userName: 'John',
        totalEmissions: 5,
        emissionsBreakdown: { transportation: 2 }
      };
      expect(GenerateCarbonAnalysisInputSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('GenerateReductionPlanInputSchema', () => {
    it('validates correct input', () => {
      const input = {
        totalEmissions: 10,
        emissionsBreakdown: { transportation: 3, homeEnergy: 3, food: 2, lifestyle: 2 }
      };
      expect(GenerateReductionPlanInputSchema.safeParse(input).success).toBe(true);
    });

    it('rejects string totalEmissions', () => {
      const input = {
        totalEmissions: 'too much',
        emissionsBreakdown: { transportation: 1, homeEnergy: 1, food: 1, lifestyle: 1 }
      };
      expect(GenerateReductionPlanInputSchema.safeParse(input).success).toBe(false);
    });
  });
});