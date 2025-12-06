'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest tour package types based on trip activity descriptions.
 *
 * - suggestTourTypes - A function that suggests tour types based on activity descriptions.
 * - SuggestTourTypesInput - The input type for the suggestTourTypes function.
 * - SuggestTourTypesOutput - The return type for the suggestTourTypes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTourTypesInputSchema = z.object({
  activityDescriptions: z
    .array(z.string())
    .describe('An array of activity descriptions from a trip itinerary.'),
});
export type SuggestTourTypesInput = z.infer<typeof SuggestTourTypesInputSchema>;

const SuggestTourTypesOutputSchema = z.object({
  suggestedTypes: z
    .array(z.string())
    .describe('An array of suggested tour package types based on the activities.'),
});
export type SuggestTourTypesOutput = z.infer<typeof SuggestTourTypesOutputSchema>;

export async function suggestTourTypes(input: SuggestTourTypesInput): Promise<SuggestTourTypesOutput> {
  return suggestTourTypesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTourTypesPrompt',
  input: {schema: SuggestTourTypesInputSchema},
  output: {schema: SuggestTourTypesOutputSchema},
  prompt: `You are an AI assistant designed to suggest tour package types based on the descriptions of activities in a trip itinerary.

  Given the following activity descriptions, suggest appropriate tour package types (e.g., adventure, leisure, pilgrimage, cultural, wildlife). Provide the response as a JSON array of strings.

  Activity Descriptions:
  {{#each activityDescriptions}}- {{{this}}}\n{{/each}}`,
});

const suggestTourTypesFlow = ai.defineFlow(
  {
    name: 'suggestTourTypesFlow',
    inputSchema: SuggestTourTypesInputSchema,
    outputSchema: SuggestTourTypesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
