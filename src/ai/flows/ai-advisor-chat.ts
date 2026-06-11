'use server';
/**
 * @fileOverview A hyper-optimized Genkit flow for the EcoPulse AI Advisor.
 *
 * - aiAdvisorChat - High-speed conversational AI consultant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'ai']),
  text: z.string(),
});

export const AIAdvisorChatInputSchema = z.object({
  history: z
    .array(MessageSchema)
    .max(20)
    .describe('Recent chat history, max 20 messages.'),
  userInput: z
    .string()
    .min(1)
    .max(500)
    .describe('User input, max 500 chars.'),
  userContext: z.object({
    points: z.number(),
    score: z.number(),
    level: z.string(),
    challengesCompleted: z.number(),
  }).describe('User sustainability stats.'),
});

export type AIAdvisorChatInput = z.infer<typeof AIAdvisorChatInputSchema>;

export const AIAdvisorChatOutputSchema = z.object({
  responseText: z.string().describe('Short, actionable response.'),
  suggestedTitle: z.string().optional().describe('3-5 word title.'),
});

export type AIAdvisorChatOutput = z.infer<typeof AIAdvisorChatOutputSchema>;

/**
 * Prompt definition for conversational AI advisor.
 */
export const advisorPrompt = ai.definePrompt({
  name: 'aiAdvisorChatPrompt',
  input: { schema: AIAdvisorChatInputSchema },
  output: { schema: AIAdvisorChatOutputSchema },
  config: {
    temperature: 0.3,
    maxOutputTokens: 400,
  },
  prompt: `You are EcoPulse AI, a high-speed sustainability expert. 

User Context:
- Score: {{userContext.score}}
- Points: {{userContext.points}}
- Level: {{userContext.level}}
- Challenges: {{userContext.challengesCompleted}}

History:
{{#each history}}
{{role}}: {{text}}
{{/each}}

User: {{userInput}}

Instruction: Provide a concise, 2-sentence actionable tip. Be specific to their stats. If this is the start of a conversation, provide a suggestedTitle for the chat.`,
});

/**
 * Executes the AI Advisor chat flow.
 * @param input Chat history and user context.
 * @returns Actionable response and optional chat title.
 */
export async function aiAdvisorChat(input: AIAdvisorChatInput): Promise<AIAdvisorChatOutput> {
  const { output } = await advisorPrompt(input);
  if (!output) {
    return {
      responseText: "I'm sorry, I couldn't generate a response at this time. Please try again.",
    };
  }
  return output;
}