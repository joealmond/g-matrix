'use server';

import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';
import { z } from 'zod';
import type { ImageAnalysisState } from '@/lib/actions-types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const formSchema = z.object({
  photo: z
    .instanceof(File)
    .refine(file => file.size > 0, 'Please select an image to upload.')
    .refine(
      file => file.size <= MAX_FILE_SIZE,
      `Max image size is 5MB.`
    )
    .refine(
      file => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

export async function handleImageAnalysis(prevState: any, formData: FormData): Promise<ImageAnalysisState> {
  const validatedFields = formSchema.safeParse({
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    return {
      productName: null,
      error: validatedFields.error.flatten().fieldErrors.photo?.[0] || 'Invalid file.',
    };
  }

  const file = validatedFields.data.photo;
  
  try {
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const photoDataUri = `data:${file.type};base64,${base64String}`;

    const result = await extractProductNameFromImage({ photoDataUri });
    const productName = result.productName || "Unnamed Product";

    return { productName, error: null };

  } catch (error: any) {
    console.error("Image analysis failed:", JSON.stringify(error, null, 2));
    const errorMessage = error.message || 'An unexpected error occurred during image analysis.';
    return {
      productName: null,
      error: `Analysis failed: ${errorMessage}`,
    };
  }
}
