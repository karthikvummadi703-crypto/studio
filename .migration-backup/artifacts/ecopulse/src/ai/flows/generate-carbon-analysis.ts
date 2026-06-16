'use server';
/**
 * @fileOverview Genkit flow — personalised carbon footprint analysis.
 *
 * Public API:
 *   generateCarbonAnalysis(input)         Main callable
 *   GenerateCarbonAnalysisInputSchema     Zod schema (exported for tests)
 *   GenerateCarbonAnalysisInput           Input type
 *   GenerateCarbonAnalysisOutput          Output type
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateCarbonAnalysisInputSchema = z.object({
  userName: z.string().min(1).describe('Display name of the user.'),
  totalEmissions: z
    .number()
    .nonnegative()
    .describe('Total carbon emissions in kgCO2e.'),
  emissionsBreakdown: z
    .object({
      transportation: z.number().nonnegative().describe('kgCO2e from transportation.'),
      homeEnergy:     z.number().nonnegative().describe('kgCO2e from home energy.'),
      food:           z.number().nonnegative().describe('kgCO2e from food.'),
      lifestyle:      z.number().nonnegative().describe('kgCO2e from lifestyle choices.'),
    })
    .describe('Per-category emissions breakdown.'),
});

export type GenerateCarbonAnalysisInput = z.infer<typeof GenerateCarbonAnalysisInputSchema>;

const GenerateCarbonAnalysisOutputSchema = z.object({
  personalizedAnalysis: z
    .string()
    .describe('Personalised explanation of the user\'s current emissions.'),
  mainEmissionSources: z
    .array(z.string())
    .describe('Top 2–3 emission sources for this user.'),
  highestImpactCategory: z
    .string()
    .describe('The single category with the highest carbon impact.'),
});

export type GenerateCarbonAnalysisOutput = z.infer<typeof GenerateCarbonAnalysisOutputSchema>;

/** Prompt definition — separated from the flow for independent testability. */
const carbonAnalysisPrompt = ai.definePrompt({
  name: 'carbonAnalysisPrompt',
  input:  { schema: GenerateCarbonAnalysisInputSchema },
  output: { schema: GenerateCarbonAnalysisOutputSchema },
  prompt: `You are an expert sustainability analyst helping users understand their carbon footprint.

Analyse the following data for user '{{{userName}}}':

Total Emissions: {{{totalEmissions}}} kgCO2e
Breakdown:
- Transportation: {{{emissionsBreakdown.transportation}}} kgCO2e
- Home Energy:    {{{emissionsBreakdown.homeEnergy}}} kgCO2e
- Food:           {{{emissionsBreakdown.food}}} kgCO2e
- Lifestyle:      {{{emissionsBreakdown.lifestyle}}} kgCO2e

Provide a personalised explanation highlighting the top 2–3 emission sources and the single highest-impact category. Keep the tone constructive and encouraging.`,
});

/** Genkit flow wrapping the prompt for type-safe, observable invocation. */
const generateCarbonAnalysisFlow = ai.defineFlow(
  {
    name: 'generateCarbonAnalysisFlow',
    inputSchema:  GenerateCarbonAnalysisInputSchema,
    outputSchema: GenerateCarbonAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await carbonAnalysisPrompt(input);
    if (!output) {
      throw new Error('Carbon analysis generation failed: empty output from model.');
    }
    return output;
  }
);

/**
 * Analyses user carbon footprint data using the Gemini model.
 *
 * @param input - Validated user emissions data.
 * @returns       AI-generated analysis, sources, and highest-impact category.
 */
export async function generateCarbonAnalysis(
  input: GenerateCarbonAnalysisInput
): Promise<GenerateCarbonAnalysisOutput> {
  return generateCarbonAnalysisFlow(input);
}
