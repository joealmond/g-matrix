'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the structure we want Gemini to return
const AnalysisSchema = z.object({
  productName: z.string().describe('The specific brand name and product name visible on the packaging'),
  isLikelyGlutenFree: z.boolean().describe('True if the packaging explicitly says Gluten Free or is naturally gluten free'),
  riskLevel: z.enum(['Safe', 'Sketchy', 'Unsafe']).describe('Based on ingredients or GF certification logos visible'),
  tags: z.array(z.string()).describe('Short tags like "Bread", "Snack", "Certified GF"'),
  reasoning: z.string().describe('Short explanation of why it was classified this way'),
});

export type ImageAnalysisState = {
  productName?: string | null;
  productId?: string | null;
  imageUrl?: string | null;
  error?: string | null;
  data?: z.infer<typeof AnalysisSchema> | null;
  success: boolean;
};

export const initialState: ImageAnalysisState = {
  productName: null,
  productId: null,
  imageUrl: null,
  error: null,
  data: null,
  success: false,
};


export async function analyzeAndUploadProduct(prevState: any, formData: FormData): Promise<ImageAnalysisState> {
  try {
    const file = formData.get('photo') as File;
    const userId = 'anonymous'; // Optional tracking

    if (!file) {
      return { success: false, error: 'No image file provided' };
    }
     if (file.size === 0) {
      return { success: false, error: 'Cannot process an empty file.' };
    }


    // --- STEP 1: PREPARE IMAGE FOR AI ---
    // Convert the file to a Buffer and then Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // --- STEP 2: ASK GEMINI (AI ANALYSIS) ---
    const { object: analysis } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: AnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this product image for a celiac/gluten-free community app. Identify the product precisely.' },
            { type: 'image', image: base64Image },
          ],
        },
      ],
    });

    // --- STEP 3: UPLOAD IMAGE TO FIREBASE STORAGE (ADMIN SDK) ---
    const bucket = adminStorage.bucket(); 
    
    const fileName = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { 
        contentType: file.type,
      },
    });

    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    // --- STEP 4: SAVE TO FIRESTORE (ADMIN SDK) ---
    const productId = analysis.productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const productRef = adminDb.collection('products').doc(productId);

    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      await productRef.set({
        name: analysis.productName,
        imageUrl: publicUrl,
        aiAnalysis: {
          isGlutenFree: analysis.isLikelyGlutenFree,
          riskLevel: analysis.riskLevel,
          reasoning: analysis.reasoning,
        },
        tags: analysis.tags,
        avgSafety: 50,
        avgTaste: 50,
        voteCount: 0,
        createdAt: new Date(),
        createdBy: userId,
      });
    } else {
      console.log('Product already exists, linking to existing entry.');
    }

    return { 
      success: true, 
      productId: productId, 
      productName: analysis.productName,
      imageUrl: publicUrl,
      data: analysis 
    };

  } catch (error) {
    console.error('Server Action Error:', error);
    // Provide a generic but informative error to the client
    let errorMessage = 'Failed to process image due to a server error.';
    if (error instanceof Error) {
        // More specific error for certain cases if needed
        if (error.message.includes('deadline')) {
            errorMessage = 'The analysis took too long to complete. Please try again.';
        } else if (error.message.includes('format')) {
            errorMessage = 'The AI could not understand the image. Please try a clearer photo.';
        }
    }
    return { success: false, error: errorMessage };
  }
}
