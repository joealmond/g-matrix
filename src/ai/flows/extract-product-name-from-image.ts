'use server';
/**
 * @fileOverview Extracts the product name from an image using AI.
 *
 * - extractProductNameFromImage - A function that handles the product name extraction process.
 * - ExtractProductNameFromImageInput - The input type for the extractProductNameFromImage function.
 * - ExtractProductNameFromImageOutput - The return type for the extractProductNameFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractProductNameFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractProductNameFromImageInput = z.infer<
  typeof ExtractProductNameFromImageInputSchema
>;

const ExtractProductNameFromImageOutputSchema = z.object({
  productName: z.string().describe('The name of the product extracted from the image.'),
});
export type ExtractProductNameFromImageOutput = z.infer<
  typeof ExtractProductNameFromImageOutputSchema
>;

export async function extractProductNameFromImage(
  input: ExtractProductNameFromImageInput
): Promise<ExtractProductNameFromImageOutput> {
  return extractProductNameFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProductNameFromImagePrompt',
  input: {schema: ExtractProductNameFromImageInputSchema},
  output: {schema: ExtractProductNameFromImageOutputSchema},
  prompt: `You are an AI assistant designed to extract the name of a product from an image.
  Analyze the following image and extract the product name. Only return the product name.

  Image: {{media url=photoDataUri}}
  `,
});

const extractProductNameFromImageFlow = ai.defineFlow(
  {
    name: 'extractProductNameFromImageFlow',
    inputSchema: ExtractProductNameFromImageInputSchema,
    outputSchema: ExtractProductNameFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
