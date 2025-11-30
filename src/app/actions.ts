'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { ImageAnalysisState } from '@/lib/actions-types';

// Define the structure we want Gemini to return
const AnalysisSchema = z.object({
  productName: z.string().describe('The specific brand name and product name visible on the packaging. If not found, return "Unnamed Product".'),
  isLikelyGlutenFree: z.boolean().describe('True if the packaging explicitly says Gluten Free or is naturally gluten free'),
  riskLevel: z.enum(['Safe', 'Sketchy', 'Unsafe']).describe('Based on ingredients or GF certification logos visible'),
  tags: z.array(z.string()).describe('Short tags like "Bread", "Snack", "Certified GF"'),
  reasoning: z.string().describe('Short explanation of why it was classified this way'),
});

export async function analyzeAndUploadProduct(
  prevState: ImageAnalysisState,
  formData: FormData
): Promise<ImageAnalysisState> {
  try {
    const file = formData.get('image') as File;
    const userId = 'anonymous'; 

    // 1. Standard Safety Check
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in .env.local file");
    }

    if (!file || file.size === 0) {
      return { success: false, error: 'No image file provided' };
    }

    // --- STEP 1: PREPARE IMAGE FOR AI ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // --- STEP 2: ASK GEMINI (AI ANALYSIS) ---
    const { object: analysis } = await generateObject({
      model: google('gemini-1.5-flash-latest'), 
      schema: AnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this product image for a celiac/gluten-free community app. Identify the product precisely. If you cannot identify the product name, return "Unnamed Product".' },
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
    const productName = analysis.productName || 'Unnamed Product';
    const productId = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const productRef = adminDb.collection('products').doc(productId);

    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      await productRef.set({
        name: productName,
        imageUrl: publicUrl,
        aiAnalysis: {
          isGlutenFree: analysis.isLikelyGlutenFree,
          riskLevel: analysis.riskLevel,
          reasoning: analysis.reasoning,
          tags: analysis.tags
        },
        avgSafety: 50,
        avgTaste: 50,
        voteCount: 0,
        createdAt: new Date(),
        createdBy: userId,
      });
    }

    revalidatePath('/');
    
    return {
      success: true,
      productId: productId,
      productName: productName,
      imageUrl: publicUrl,
      error: null
    };

  } catch (error: any) {
    console.error('Server Action Error:', error);
    return { success: false, error: `Failed to process image: ${error.message}` };
  }
}
