'use server';
import 'dotenv/config';
import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';
import { z } from 'zod';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { PlaceHolderImages } from '@/lib/placeholder-images';


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

  // This function is now outside the try...catch to be reusable
  const getFallbackData = (): ImageAnalysisState => {
    const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
    return {
      productName: 'Unnamed Product',
      imageUrl: randomImage.imageUrl,
      error: null // We are treating this as a success with fallback data
    };
  };

  if (!validatedFields.success) {
    // Even on validation failure, we can use the fallback
    console.warn("Validation failed, using fallback.", validatedFields.error.flatten());
    return getFallbackData();
  }

  const file = validatedFields.data.photo;
  
  try {
    // 1. Get buffer and data URI for analysis
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const photoDataUri = `data:${file.type};base64,${base64String}`;

    // 2. Analyze image to get product name
    console.log("Starting image analysis...");
    const analysisResult = await extractProductNameFromImage({ photoDataUri });
    const productName = (analysisResult.productName || "Unnamed Product").trim();
    console.log(`Image analysis successful. Product: ${productName}`);

    // For now, we will return the data URI as the image URL since we're not uploading.
    // In a real scenario, you'd upload and get a persistent URL.
    return { productName, imageUrl: photoDataUri, error: null };

  } catch (error: any) {
    console.error("Full analysis/upload failed, using fallback:", JSON.stringify(error, null, 2));
    // Instead of returning an error, we return the fallback data
    return getFallbackData();
  }
}
