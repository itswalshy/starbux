'use server';
/**
 * @fileOverview Extracts partner name, partner number, and total tippable hours from a tip sheet image using OCR.
 *
 * - extractTipDataFromImage - A function that handles the tip data extraction process.
 * - ExtractTipDataFromImageInput - The input type for the extractTipDataFromImage function.
 * - ExtractTipDataFromImageOutput - The return type for the extractTipDataFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTipDataFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo or PDF of a tip sheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTipDataFromImageInput = z.infer<typeof ExtractTipDataFromImageInputSchema>;

const ExtractTipDataFromImageOutputSchema = z.object({
  partnerData: z.array(
    z.object({
      partnerName: z.string().describe('The name of the partner.'),
      partnerNumber: z.string().describe('The partner number.'),
      hoursWorked: z.number().describe('The total tippable hours worked by the partner.'),
    })
  ).describe('An array of partner data extracted from the tip sheet.'),
});
export type ExtractTipDataFromImageOutput = z.infer<typeof ExtractTipDataFromImageOutputSchema>;

export async function extractTipDataFromImage(input: ExtractTipDataFromImageInput): Promise<ExtractTipDataFromImageOutput> {
  return extractTipDataFromImageFlow(input);
}

const extractTipDataFromImagePrompt = ai.definePrompt({
  name: 'extractTipDataFromImagePrompt',
  input: {schema: ExtractTipDataFromImageInputSchema},
  output: {schema: ExtractTipDataFromImageOutputSchema},
  prompt: `You are an expert OCR reader. You will extract the partner name, partner number, and total tippable hours from the following tip sheet image. Return a JSON array of objects, one object for each partner.

Tip Sheet Image: {{media url=photoDataUri}}

Ensure that the partner number and hours worked are converted to the correct data type (string and number, respectively). If a field cannot be determined from the image, return an empty string for string fields and 0 for the hoursWorked field.

Output the response in JSON format.
`,
});

const extractTipDataFromImageFlow = ai.defineFlow(
  {
    name: 'extractTipDataFromImageFlow',
    inputSchema: ExtractTipDataFromImageInputSchema,
    outputSchema: ExtractTipDataFromImageOutputSchema,
  },
  async input => {
    const {output} = await extractTipDataFromImagePrompt(input);
    return output!;
  }
);
