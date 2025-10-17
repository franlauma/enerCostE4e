'use server';

/**
 * @fileOverview Provides contextual assistance to users within the E4e soluciones - Simulación factura application.
 *
 * - `getContextualHelp` -  A function that provides AI-powered, context-sensitive help based on the given issue description.
 * - `ContextualHelpInput` - The input type for the `getContextualHelp` function.
 * - `ContextualHelpOutput` - The return type for the `getContextualHelp` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualHelpInputSchema = z.object({
  issueDescription: z.string().describe('A description of the issue or problem the user is encountering.'),
});

export type ContextualHelpInput = z.infer<typeof ContextualHelpInputSchema>;

const ContextualHelpOutputSchema = z.object({
  helpMessage: z.string().describe('A context-sensitive help message to guide the user to resolve the issue.'),
});

export type ContextualHelpOutput = z.infer<typeof ContextualHelpOutputSchema>;

export async function getContextualHelp(input: ContextualHelpInput): Promise<ContextualHelpOutput> {
  return contextualHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualHelpPrompt',
  input: {schema: ContextualHelpInputSchema},
  output: {schema: ContextualHelpOutputSchema},
  prompt: `You are an AI assistant embedded within the E4e soluciones - Simulación factura application. Your goal is to provide helpful, context-sensitive guidance to users based on the issues they are encountering. Use a friendly and professional tone.

Issue Description: {{{issueDescription}}}

Provide a clear and concise help message to guide the user to resolve the issue. Break down the solution into small steps if necessary.
`,
});

const contextualHelpFlow = ai.defineFlow(
  {
    name: 'contextualHelpFlow',
    inputSchema: ContextualHelpInputSchema,
    outputSchema: ContextualHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
