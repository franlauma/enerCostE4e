'use server';

/**
 * @fileOverview Provides an AI-powered summary of energy cost simulation results.
 *
 * - `summarizeSimulationResults` - A function that generates a natural language summary of the simulation results.
 * - `SummarizeResultsInput` - The input type for the `summarizeSimulationResults` function.
 *- `SummarizeResultsOutput` - The return type for the `summarizeSimulationResults` function.
 */

import { ai } from '@/ai/genkit';
import type { SimulationResult } from '@/lib/data';
import { z } from 'genkit';

// We don't need to define the full SimulationResult schema here, just the parts the AI needs.
const SummarizeResultsInputSchema = z.object({
  currentCompanyName: z.string().describe('The name of the user\'s current energy provider.'),
  bestOptionCompanyName: z.string().describe('The name of the recommended, cheapest energy provider.'),
  estimatedSavings: z.number().describe('The estimated annual savings if the user switches to the best option.'),
  totalConsumptionKwh: z.number().describe('The total energy consumption in kWh over the period.'),
});

export type SummarizeResultsInput = z.infer<typeof SummarizeResultsInputSchema>;

const SummarizeResultsOutputSchema = z.object({
  summary: z.string().describe('A friendly, insightful, and brief summary of the simulation results for the user.'),
});

export type SummarizeResultsOutput = z.infer<typeof SummarizeResultsOutputSchema>;

export async function summarizeSimulationResults(input: SummarizeResultsInput): Promise<SummarizeResultsOutput> {
  return summarizeResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeResultsPrompt',
  input: { schema: SummarizeResultsInputSchema },
  output: { schema: SummarizeResultsOutputSchema },
  prompt: `You are an AI assistant in the E4e soluciones - Simulación factura app. Your task is to generate a short, encouraging, and easy-to-understand summary of an energy cost simulation. Use a friendly and professional tone.

The user's current provider is '{{{currentCompanyName}}}'.
The simulation, based on a total consumption of {{{totalConsumptionKwh}}} kWh, found that '{{{bestOptionCompanyName}}}' is the most economical option.
By switching, the user could save an estimated €{{{estimatedSavings}}} annually.

Generate a concise summary (2-3 sentences) highlighting the key takeaway: the best company and the potential savings. Address the user directly.
Example: "¡Buenas noticias! Basado en tu consumo, hemos determinado que **EcoLuz** es tu opción más económica. Cambiándote, podrías **ahorrar aproximadamente 250,75 € al año** en comparación con tu tarifa actual."
`,
});

const summarizeResultsFlow = ai.defineFlow(
  {
    name: 'summarizeResultsFlow',
    inputSchema: SummarizeResultsInputSchema,
    outputSchema: SummarizeResultsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
