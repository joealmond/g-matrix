'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';

export async function analyzeAndUploadProduct(
  prevState: ImageAnalysisState,
  formData: FormData
): Promise<ImageAnalysisState> {
  try {
    const file = formData.get('image') as File;
    const userId = 'anonymous'; // Optional tracking

    if (!file || file.size === 0) {
      return { success: false, error: 'No image file provided' };
    }

    // --- STEP 1: PREPARE IMAGE FOR AI ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Image}`;

    // --- STEP 2: ASK GEMINI via GENKIT FLOW ---
    const analysis = await extractProductNameFromImage({ photoDataUri: dataUri });

    // --- STEP 3: UPLOAD IMAGE TO FIREBASE STORAGE (ADMIN SDK) ---
    let publicUrl: string;
    try {
        const bucket = adminStorage.bucket(); 
        const fileName = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(buffer, {
            metadata: { 
                contentType: file.type,
            },
        });
        
        await fileUpload.makePublic();
        publicUrl = fileUpload.publicUrl();
    } catch (storageError: any) {
        console.error('Firebase Storage Error:', storageError);
        const serviceAccountEmail = process.env.FIREBASE_CLIENT_EMAIL;
        throw new Error(
            `Failed to upload to Firebase Storage. This is likely a permissions issue. Please ensure your service account ('${serviceAccountEmail}') has the 'Storage Object Admin' role in Google Cloud IAM. Original error: ${storageError.message}`
        );
    }

    // --- STEP 4: SAVE TO FIRESTORE (ADMIN SDK) ---
    const productName = analysis.productName || 'Unnamed Product';
    const productId = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const productRef = adminDb.collection('products').doc(productId);

    const docSnap = await productRef.get();

    if (!docSnap.exists) {
      await productRef.set({
        name: productName,
        imageUrl: publicUrl,
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
