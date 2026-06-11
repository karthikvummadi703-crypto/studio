import { describe, it, expect, vi } from 'vitest';
import { generateCarbonAnalysis } from '../flows/generate-carbon-analysis';
import { GenerateCarbonAnalysisInputSchema } from '../flows/generate-carbon-analysis';
import { GenerateReductionPlanInputSchema } from '../flows/generate-reduction-plan';
import { AIAdvisorChatInputSchema } from '../flows/ai-advisor-chat';

vi.mock('../genkit', () => ({
  ai: {
    definePrompt: vi.fn(),
    defineFlow: vi.fn((config, handler) => {
      const flow = (input: any) => handler(input);
      return flow;
    }),
  },
}));

describe('Genkit Flows', () => {
  describe('generateCarbonAnalysis', () => {
    it('is defined and is a function', () => {
      expect(generateCarbonAnalysis).toBeDefined();
      expect(typeof generateCarbonAnalysis).toBe('function');
    });
  });

  describe('Schema nonnegative validation', () => {
    it('GenerateCarbonAnalysisInputSchema rejects negative totalEmissions', () => {
      const result = GenerateCarbonAnalysisInputSchema.safeParse({
        userName: 'Test',
        totalEmissions: -5,
        emissionsBreakdown: { transportation: 1, homeEnergy: 1, food: 1, lifestyle: 1 },
      });
      expect(result.success).toBe(false);
    });

    it('GenerateReductionPlanInputSchema rejects string totalEmissions', () => {
      const result = GenerateReductionPlanInputSchema.safeParse({
        totalEmissions: 'lots',
        emissionsBreakdown: { transportation: 1, homeEnergy: 1, food: 1, lifestyle: 1 },
      });
      expect(result.success).toBe(false);
    });

    it('AIAdvisorChatInputSchema rejects empty userInput', () => {
      const result = AIAdvisorChatInputSchema.safeParse({
        history: [],
        userInput: '',
        userContext: { points: 0, score: 0, level: 'Seedling', challengesCompleted: 0 },
      });
      expect(result.success).toBe(false);
    });
  });
});