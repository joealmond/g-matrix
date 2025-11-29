'use server';
import 'dotenv/config';
import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';
import { z } from 'zod';
import * as admin from 'firebase-admin';
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

// Safely initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e: any) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY or initializing Firebase Admin SDK:", e.message);
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK not initialized.");
  }
}


export async function handleImageAnalysis(prevState: any, formData: FormData): Promise<ImageAnalysisState> {
   if (!admin.apps.length) {
    return {
      productName: null,
      imageUrl: null,
      error: "Server configuration error: Firebase Admin SDK not initialized. Please check environment variables.",
    };
  }

  const validatedFields = formSchema.safeParse({
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    return {
      productName: null,
      imageUrl: null,
      error: validatedFields.error.flatten().fieldErrors.photo?.[0] || 'Invalid file.',
    };
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
    const productName = analysisResult.productName || "Unnamed Product";
    console.log(`Image analysis successful. Product: ${productName}`);

    // 3. Upload image to Firebase Storage using Admin SDK
    const bucket = admin.storage().bucket();
    const destination = `uploads/${Date.now()}-${file.name}`;
    const fileUpload = bucket.file(destination);
    
    console.log(`Uploading to Firebase Storage at: ${destination}`);
    await fileUpload.save(Buffer.from(buffer), {
        metadata: {
            contentType: file.type,
        },
    });

    // 4. Get a public URL
    const [imageUrl] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration date
    });
    console.log("Successfully uploaded and got signed URL:", imageUrl);

    return { productName, imageUrl, error: null };

  } catch (error: any) {
    console.error("Full analysis/upload failed:", JSON.stringify(error, null, 2));
    const errorMessage = error.code ? `${error.code}: ${error.message}` : (error.message || 'An unexpected error occurred.');
    return {
      productName: null,
      imageUrl: null,
      error: `Action failed: ${errorMessage}`,
    };
  }
}
