'use server';
/**
 * @fileOverview A Genkit flow for generating personalized carbon footprint analysis.
 *
 * - generateCarbonAnalysis - A function that analyzes user carbon footprint data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCarbonAnalysisInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  totalEmissions: z.number().describe('The user\'s total carbon emissions in kgCO2e.'),
  emissionsBreakdown: z.object({
    transportation: z.number().describe('Carbon emissions from transportation in kgCO2e.'),
    homeEnergy: z.number().describe('Carbon emissions from home energy in kgCO2e.'),
    food: z.number().describe('Carbon emissions from food consumption in kgCO2e.'),
    lifestyle: z.number().describe('Carbon emissions from lifestyle choices in kgCO2e.'),
  }).describe('A breakdown of carbon emissions by category.'),
});
export type GenerateCarbonAnalysisInput = z.infer<typeof GenerateCarbonAnalysisInputSchema>;

const GenerateCarbonAnalysisOutputSchema = z.object({
  personalizedAnalysis: z.string().describe('A personalized explanation of the user\'s current emissions.'),
  mainEmissionSources: z.array(z.string()).describe('A list of the top 2-3 main emission sources for the user.'),
  highestImpactCategory: z.string().describe('The single category with the highest carbon impact.'),
});
export type GenerateCarbonAnalysisOutput = z.infer<typeof GenerateCarbonAnalysisOutputSchema>;

/**
 * Prompt definition for carbon analysis.
 */
const prompt = ai.definePrompt({
  name: 'carbonAnalysisPrompt',
  input: { schema: GenerateCarbonAnalysisInputSchema },
  output: { schema: GenerateCarbonAnalysisOutputSchema },
  prompt: `You are an expert sustainability analyst. Your goal is to help users understand their carbon footprint.

Analyze the following carbon footprint data for user '{{{userName}}}':

Total Emissions: {{{totalEmissions}}} kgCO2e
Emissions Breakdown:
- Transportation: {{{emissionsBreakdown.transportation}}} kgCO2e
- Home Energy: {{{emissionsBreakdown.homeEnergy}}} kgCO2e
- Food: {{{emissionsBreakdown.food}}} kgCO2e
- Lifestyle: {{{emissionsBreakdown.lifestyle}}} kgCO2e

Provide a personalized explanation of their current emissions, highlighting their main emission sources, so they can understand where their impact is highest. Identify the top 2-3 main emission sources and the single highest impact category.
`,
});

/**
 * Genkit flow to generate carbon analysis.
 */
const generateCarbonAnalysisFlow = ai.defineFlow(
  {
    name: 'generateCarbonAnalysisFlow',
    inputSchema: GenerateCarbonAnalysisInputSchema,
    outputSchema: GenerateCarbonAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Analysis generation failed: Empty output from prompt');
    }
    return output;
  }
);

/**
 * Analyzes user carbon footprint data using AI.
 * @param input User emissions data.
 * @returns AI generated analysis and breakdown.
 */
export async function generateCarbonAnalysis(input: GenerateCarbonAnalysisInput): Promise<GenerateCarbonAnalysisOutput> {
  return generateCarbonAnalysisFlow(input);
}
