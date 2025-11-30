'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { ImageAnalysisState } from '@/lib/actions-types';

const AnalysisSchema = z.object({
  productName: z.string(),
  isLikelyGlutenFree: z.boolean(),
  riskLevel: z.enum(['Safe', 'Sketchy', 'Unsafe']),
  tags: z.array(z.string()),
  reasoning: z.string(),
});

export async function analyzeAndUploadProduct(
  prevState: ImageAnalysisState,
  formData: FormData
): Promise<ImageAnalysisState> {
  try {
    const file = formData.get('image') as File;
    const userId = 'anonymous';

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    }

    if (!file || file.size === 0) {
      return { success: false, error: 'No image file provided' };
    }

    // --- STEP 1: PREPARE IMAGE ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // --- STEP 2: USE GOOGLE GENERATIVE AI DIRECTLY ---
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Analyze this product image for a celiac/gluten-free community app. 
    Return a JSON object with these exact fields:
    - productName: string (the brand and product name visible on packaging, or "Unnamed Product" if unknown)
    - isLikelyGlutenFree: boolean (true if packaging says Gluten Free or product is naturally GF)
    - riskLevel: "Safe" | "Sketchy" | "Unsafe" (based on ingredients or GF certification)
    - tags: string[] (e.g., ["Bread", "Snack", "Certified GF"])
    - reasoning: string (short explanation of classification)
    
    Return ONLY valid JSON, no markdown code blocks.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type || 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const analysis = AnalysisSchema.parse(JSON.parse(jsonMatch[0]));

    // --- STEP 3: UPLOAD TO FIREBASE STORAGE ---
    const bucket = adminStorage.bucket();
    const fileName = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { contentType: file.type },
    });

    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    // --- STEP 4: SAVE TO FIRESTORE ---
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
          tags: analysis.tags,
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
      productId,
      productName,
      imageUrl: publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error('Server Action Error:', error);
    return { success: false, error: `Failed to process image: ${error.message}` };
  }
}
