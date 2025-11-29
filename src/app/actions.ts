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
      imageUrl: null,
      error: validatedFields.error.flatten().fieldErrors.photo?.[0] ?? 'Invalid image file.',
    };
  }

  const file = validatedFields.data.photo;
  
  // Create the data URI regardless of the analysis outcome.
  const buffer = await file.arrayBuffer();
  const base64String = Buffer.from(buffer).toString('base64');
  const photoDataUri = `data:${file.type};base64,${base64String}`;

  try {
    // Analyze image to get product name
    console.log("Starting image analysis...");
    const analysisResult = await extractProductNameFromImage({ photoDataUri });
    const productName = (analysisResult.productName || "Unnamed Product").trim();
    console.log(`Image analysis successful. Product: ${productName}`);
    
    return { productName, imageUrl: photoDataUri, error: null };

  } catch (error: any) {
    console.error("AI analysis failed, falling back to manual entry:", JSON.stringify(error, null, 2));
    // If AI fails, we proceed with the uploaded image and a generic name.
    // The user will be prompted to enter the name on the next screen.
    return { 
      productName: 'Unnamed Product', 
      imageUrl: photoDataUri, 
      error: null 
    };
  }
}
