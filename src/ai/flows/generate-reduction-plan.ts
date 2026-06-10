'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized carbon reduction plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecommendationSchema = z.object({
  action: z.string().describe('The specific action to take.'),
  impactLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The estimated impact level of this action on carbon reduction.'),
  difficultyLevel: z
    .enum(['Easy', 'Moderate', 'Hard'])
    .describe('The estimated difficulty level to implement this action.'),
  estimatedCarbonSavings: z
    .string()
    .describe(
      'Estimated carbon savings per year (e.g., "50 kgCO2e/year" or "10% reduction").'
    ),
});

const GenerateReductionPlanInputSchema = z.object({
  totalEmissions: z
    .number()
    .describe('The user\u0027s total estimated carbon emissions in kgCO2e.'),
  emissionsBreakdown: z
    .object({
      transportation: z
        .number()
        .describe('Carbon emissions from transportation in kgCO2e.'),
      homeEnergy: z
        .number()
        .describe('Carbon emissions from home energy in kgCO2e.'),
      food: z
        .number()
        .describe('Carbon emissions from food consumption in kgCO2e.'),
      lifestyle: z
        .number()
        .describe('Carbon emissions from lifestyle choices in kgCO2e.'),
    })
    .describe('Breakdown of carbon emissions by category.'),
});

export type GenerateReductionPlanInput = z.infer<
  typeof GenerateReductionPlanInputSchema
>;

const GenerateReductionPlanOutputSchema = z.object({
  personalizedAnalysis: z
    .string()
    .describe(
      'A detailed explanation of the user\u0027s current footprint and main emission sources.'
    ),
  weeklyActionPlan: z
    .string()
    .describe('A detailed, actionable weekly plan for carbon reduction.'),
  monthlyImprovementStrategy: z
    .string()
    .describe('A long-term strategy for sustained carbon footprint reduction.'),
  transportationRecommendations: z
    .array(RecommendationSchema)
    .describe('Specific recommendations for reducing transportation emissions.'),
  homeEnergyRecommendations: z
    .array(RecommendationSchema)
    .describe('Specific recommendations for reducing home energy consumption.'),
  foodRecommendations: z
    .array(RecommendationSchema)
    .describe('Specific recommendations for sustainable food choices.'),
  lifestyleRecommendations: z
    .array(RecommendationSchema)
    .describe('Specific recommendations for reducing lifestyle-related emissions.'),
});

export type GenerateReductionPlanOutput = z.infer<
  typeof GenerateReductionPlanOutputSchema
>;

/**
 * Prompt for carbon reduction plan generation.
 */
const reductionPlanPrompt = ai.definePrompt({
  name: 'reductionPlanPrompt',
  input: { schema: GenerateReductionPlanInputSchema },
  output: { schema: GenerateReductionPlanOutputSchema },
  prompt: `You are an expert sustainability consultant tasked with generating a personalized carbon reduction plan.
The user has a total carbon footprint of {{{totalEmissions}}} kgCO2e, with the following breakdown:
- Transportation: {{{emissionsBreakdown.transportation}}} kgCO2e
- Home Energy: {{{emissionsBreakdown.homeEnergy}}} kgCO2e
- Food: {{{emissionsBreakdown.food}}} kgCO2e
- Lifestyle: {{{emissionsBreakdown.lifestyle}}} kgCO2e

Based on this data, provide a detailed personalized analysis, a weekly action plan, a monthly improvement strategy, and specific recommendations for each category (transportation, home energy, food, and lifestyle).
Each recommendation must include an action, its estimated impact level (Low, Medium, High), difficulty level (Easy, Moderate, Hard), and estimated carbon savings.
Prioritize recommendations that address the highest emission categories and are practical for an individual to implement.`,
});

/**
 * Genkit flow for generating a reduction plan.
 */
const generateReductionPlanFlow = ai.defineFlow(
  {
    name: 'generateReductionPlanFlow',
    inputSchema: GenerateReductionPlanInputSchema,
    outputSchema: GenerateReductionPlanOutputSchema,
  },
  async (input) => {
    const { output } = await reductionPlanPrompt(input);
    if (!output) {
      throw new Error('Reduction plan generation failed: Empty output');
    }
    return output;
  }
);

/**
 * Generates a personalized carbon reduction plan using AI.
 * @param input User emissions breakdown.
 * @returns Detailed AI generated reduction strategy.
 */
export async function generateReductionPlan(
  input: GenerateReductionPlanInput
): Promise<GenerateReductionPlanOutput> {
  return generateReductionPlanFlow(input);
}
