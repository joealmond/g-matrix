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
  const file = formData.get('image') as File;
  const userId = 'anonymous';

  if (!file || file.size === 0) {
    return { success: false, error: 'No image file provided' };
  }

  try {
    // --- STEP 1: PREPARE IMAGE ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let analysis: z.infer<typeof AnalysisSchema> | null = null;

    // --- STEP 2: ATTEMPT AI ANALYSIS (WITH FALLBACK) ---
    try {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
      }
      
      const base64Image = buffer.toString('base64');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
      }
      analysis = AnalysisSchema.parse(JSON.parse(jsonMatch[0]));

    } catch (aiError: any) {
      // Log the detailed AI error for debugging, but don't stop the process.
      console.error('AI Analysis Failed (Fallback will be used):', aiError.message);
      // We'll proceed with `analysis` as null.
    }
    
    // --- STEP 3: UPLOAD TO FIREBASE STORAGE (ALWAYS RUNS) ---
    const bucket = adminStorage.bucket();
    const fileName = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { contentType: file.type },
    });

    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    // --- STEP 4: RETURN RESULT (SUCCESSFUL UPLOAD) ---
    const finalProductName = analysis?.productName || 'Unnamed Product';

    revalidatePath('/');

    return {
      success: true,
      productId: finalProductName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      productName: finalProductName,
      imageUrl: publicUrl,
      aiAnalysis: analysis ? {
        isGlutenFree: analysis.isLikelyGlutenFree,
        riskLevel: analysis.riskLevel,
        reasoning: analysis.reasoning,
        tags: analysis.tags,
      } : null, // AI analysis is null if it failed
      error: null,
    };
    
  } catch (error: any) {
    // This outer catch block now only handles critical failures (e.g., image upload fails).
    console.error('Critical Server Action Error:', error);
    return { success: false, error: `Failed to upload image: ${error.message}` };
  }
}
