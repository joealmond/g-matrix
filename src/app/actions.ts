'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { FieldValue } from 'firebase-admin/firestore';
import {
  REGISTERED_VOTE_WEIGHT,
  ANONYMOUS_VOTE_WEIGHT,
  TIME_DECAY_FACTOR_PER_YEAR,
  TIME_DECAY_MINIMUM_WEIGHT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} from '@/lib/config';

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record) {
    if (now - record.windowStart < RATE_LIMIT_WINDOW_MS) {
      if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
      }
      record.count += 1;
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
    } else {
      // Reset window
      record.windowStart = now;
      record.count = 1;
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }
  } else {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    
    // Simple cleanup to prevent memory leaks
    if (rateLimitMap.size > 10000) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) {
                rateLimitMap.delete(key);
            }
        }
    }
    
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
}

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
  // --- RATE LIMITING ---
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             headersList.get('x-real-ip') || 
             'unknown';
  
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before uploading again.' };
  }

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
    if (!adminStorage) {
      return { success: false, error: 'Storage service not available' };
    }
    const bucket = adminStorage.bucket();
    const fileName = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { 
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
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

// --- HELPER: Generate product ID from name ---
function generateProductId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// --- HELPER: Calculate weighted average from sums ---
function calculateWeightedAverage(
  registeredSum: number,
  registeredCount: number,
  anonymousSum: number,
  anonymousCount: number
): number {
  const totalWeightedSum = (registeredSum * REGISTERED_VOTE_WEIGHT) + anonymousSum;
  const totalWeightedCount = (registeredCount * REGISTERED_VOTE_WEIGHT) + anonymousCount;
  
  if (totalWeightedCount === 0) return 0;
  return totalWeightedSum / totalWeightedCount;
}

// --- CHECK IF PRODUCT EXISTS (for duplicate detection) ---
export async function checkProductExists(productName: string): Promise<{
  exists: boolean;
  productId: string | null;
}> {
  if (!adminDb) {
    return { exists: false, productId: null };
  }
  
  const productId = generateProductId(productName);
  const productRef = adminDb.collection('products').doc(productId);
  const productDoc = await productRef.get();
  
  return {
    exists: productDoc.exists,
    productId: productDoc.exists ? productId : null,
  };
}

// --- SUBMIT VOTE (for registered or anonymous users) ---
export async function submitVote(params: {
  productId: string;
  productName: string;
  imageUrl: string;
  aiAnalysis?: {
    isGlutenFree: boolean;
    riskLevel: 'Safe' | 'Sketchy' | 'Unsafe';
    reasoning: string;
    tags: string[];
  } | null;
  userId: string;
  isRegistered: boolean;
  safety: number;
  taste: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not available' };
  }

  const { productId, productName, imageUrl, aiAnalysis, userId, isRegistered, safety, taste } = params;
  const productRef = adminDb.collection('products').doc(productId);
  const voteRef = productRef.collection('votes').doc(userId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      const voteDoc = await transaction.get(voteRef);

      if (!productDoc.exists) {
        // --- Create new product with first vote ---
        const initialData = {
          name: productName,
          imageUrl: imageUrl,
          aiAnalysis: aiAnalysis || null,
          
          // Initialize vote tracking
          registeredVoteCount: isRegistered ? 1 : 0,
          registeredSafetySum: isRegistered ? safety : 0,
          registeredTasteSum: isRegistered ? taste : 0,
          anonymousVoteCount: isRegistered ? 0 : 1,
          anonymousSafetySum: isRegistered ? 0 : safety,
          anonymousTasteSum: isRegistered ? 0 : taste,
          voteCount: 1,
          
          // Calculate initial weighted averages
          avgSafety: safety,
          avgTaste: taste,
          
          createdAt: FieldValue.serverTimestamp(),
          createdBy: userId,
        };
        transaction.set(productRef, initialData);
      } else {
        // --- Update existing product ---
        const data = productDoc.data()!;
        
        let regCount = data.registeredVoteCount || 0;
        let regSafetySum = data.registeredSafetySum || 0;
        let regTasteSum = data.registeredTasteSum || 0;
        let anonCount = data.anonymousVoteCount || 0;
        let anonSafetySum = data.anonymousSafetySum || 0;
        let anonTasteSum = data.anonymousTasteSum || 0;
        let totalVoteCount = data.voteCount || 0;
        
        if (voteDoc.exists) {
          // --- Update existing vote: subtract old contribution first ---
          const oldVote = voteDoc.data()!;
          const wasRegistered = oldVote.isRegistered;
          
          if (wasRegistered) {
            regSafetySum -= oldVote.safety;
            regTasteSum -= oldVote.taste;
            regCount -= 1;
          } else {
            anonSafetySum -= oldVote.safety;
            anonTasteSum -= oldVote.taste;
            anonCount -= 1;
          }
          totalVoteCount -= 1;
        }
        
        // Add new vote contribution
        if (isRegistered) {
          regSafetySum += safety;
          regTasteSum += taste;
          regCount += 1;
        } else {
          anonSafetySum += safety;
          anonTasteSum += taste;
          anonCount += 1;
        }
        totalVoteCount += 1;
        
        // Calculate new weighted averages
        const newAvgSafety = calculateWeightedAverage(regSafetySum, regCount, anonSafetySum, anonCount);
        const newAvgTaste = calculateWeightedAverage(regTasteSum, regCount, anonTasteSum, anonCount);
        
        transaction.update(productRef, {
          registeredVoteCount: regCount,
          registeredSafetySum: regSafetySum,
          registeredTasteSum: regTasteSum,
          anonymousVoteCount: anonCount,
          anonymousSafetySum: anonSafetySum,
          anonymousTasteSum: anonTasteSum,
          voteCount: totalVoteCount,
          avgSafety: newAvgSafety,
          avgTaste: newAvgTaste,
        });
      }
      
      // Set/update the vote document
      transaction.set(voteRef, {
        userId: userId,
        safety: safety,
        taste: taste,
        isRegistered: isRegistered,
        votedAt: FieldValue.serverTimestamp(), // Always update votedAt to current time
        createdAt: voteDoc.exists ? voteDoc.data()!.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    revalidatePath('/');
    revalidatePath(`/product/${productId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Vote submission error:', error);
    return { success: false, error: error.message };
  }
}

// --- DELETE VOTE (admin only) ---
export async function deleteVote(params: {
  productId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not available' };
  }

  const { productId, userId } = params;
  const productRef = adminDb.collection('products').doc(productId);
  const voteRef = productRef.collection('votes').doc(userId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      const voteDoc = await transaction.get(voteRef);

      if (!productDoc.exists || !voteDoc.exists) {
        throw new Error('Product or vote not found');
      }

      const productData = productDoc.data()!;
      const voteData = voteDoc.data()!;
      
      let regCount = productData.registeredVoteCount || 0;
      let regSafetySum = productData.registeredSafetySum || 0;
      let regTasteSum = productData.registeredTasteSum || 0;
      let anonCount = productData.anonymousVoteCount || 0;
      let anonSafetySum = productData.anonymousSafetySum || 0;
      let anonTasteSum = productData.anonymousTasteSum || 0;
      let totalVoteCount = productData.voteCount || 0;
      
      // Subtract the vote's contribution
      if (voteData.isRegistered) {
        regSafetySum -= voteData.safety;
        regTasteSum -= voteData.taste;
        regCount -= 1;
      } else {
        anonSafetySum -= voteData.safety;
        anonTasteSum -= voteData.taste;
        anonCount -= 1;
      }
      totalVoteCount -= 1;
      
      // Recalculate weighted averages
      const newAvgSafety = calculateWeightedAverage(regSafetySum, regCount, anonSafetySum, anonCount);
      const newAvgTaste = calculateWeightedAverage(regTasteSum, regCount, anonTasteSum, anonCount);
      
      transaction.update(productRef, {
        registeredVoteCount: regCount,
        registeredSafetySum: regSafetySum,
        registeredTasteSum: regTasteSum,
        anonymousVoteCount: anonCount,
        anonymousSafetySum: anonSafetySum,
        anonymousTasteSum: anonTasteSum,
        voteCount: totalVoteCount,
        avgSafety: newAvgSafety,
        avgTaste: newAvgTaste,
      });
      
      transaction.delete(voteRef);
    });

    revalidatePath('/');
    revalidatePath(`/product/${productId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Vote deletion error:', error);
    return { success: false, error: error.message };
  }
}

// --- HELPER: Calculate time decay weight for a vote ---
function calculateTimeDecayWeight(votedAt: Date): number {
  const now = new Date();
  const yearsAgo = (now.getTime() - votedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
  // Apply exponential decay: weight = DECAY_FACTOR ^ years
  // e.g., 0.9^1 = 0.9 (1 year old), 0.9^2 = 0.81 (2 years old)
  const decayedWeight = Math.pow(TIME_DECAY_FACTOR_PER_YEAR, yearsAgo);
  // Ensure weight doesn't fall below minimum threshold
  return Math.max(decayedWeight, TIME_DECAY_MINIMUM_WEIGHT);
}

// --- RECALCULATE PRODUCT AVERAGES WITH TIME DECAY ---
// Call this periodically (e.g., daily via cron/Cloud Function) to update averages
export async function recalculateProductAveragesWithTimeDecay(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not available' };
  }

  const productRef = adminDb.collection('products').doc(productId);
  
  try {
    const votesSnapshot = await productRef.collection('votes').get();
    
    if (votesSnapshot.empty) {
      // No votes, reset to 0
      await productRef.update({
        avgSafety: 0,
        avgTaste: 0,
        voteCount: 0,
        registeredVoteCount: 0,
        anonymousVoteCount: 0,
      });
      return { success: true };
    }

    let totalWeightedSafety = 0;
    let totalWeightedTaste = 0;
    let totalWeight = 0;
    let registeredCount = 0;
    let anonymousCount = 0;

    votesSnapshot.forEach((doc) => {
      const vote = doc.data();
      const votedAt = vote.votedAt?.toDate() || vote.createdAt?.toDate() || new Date();
      
      // Calculate base weight (registered vs anonymous from config)
      const baseWeight = vote.isRegistered ? REGISTERED_VOTE_WEIGHT : ANONYMOUS_VOTE_WEIGHT;
      
      // Apply time decay
      const timeDecay = calculateTimeDecayWeight(votedAt);
      const finalWeight = baseWeight * timeDecay;
      
      totalWeightedSafety += vote.safety * finalWeight;
      totalWeightedTaste += vote.taste * finalWeight;
      totalWeight += finalWeight;
      
      if (vote.isRegistered) {
        registeredCount++;
      } else {
        anonymousCount++;
      }
    });

    const avgSafety = totalWeight > 0 ? totalWeightedSafety / totalWeight : 0;
    const avgTaste = totalWeight > 0 ? totalWeightedTaste / totalWeight : 0;

    await productRef.update({
      avgSafety: avgSafety,
      avgTaste: avgTaste,
      voteCount: registeredCount + anonymousCount,
      registeredVoteCount: registeredCount,
      anonymousVoteCount: anonymousCount,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Recalculation error:', error);
    return { success: false, error: error.message };
  }
}

// --- RECALCULATE ALL PRODUCTS (for scheduled jobs) ---
export async function recalculateAllProductsWithTimeDecay(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  if (!adminDb) {
    return { success: false, processed: 0, errors: 1 };
  }

  const productsSnapshot = await adminDb.collection('products').get();
  let processed = 0;
  let errors = 0;

  for (const doc of productsSnapshot.docs) {
    const result = await recalculateProductAveragesWithTimeDecay(doc.id);
    if (result.success) {
      processed++;
    } else {
      errors++;
      console.error(`Failed to recalculate ${doc.id}:`, result.error);
    }
  }

  revalidatePath('/');
  
  return { success: errors === 0, processed, errors };
}
