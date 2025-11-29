'use server';

import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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

export async function handleImageUpload(prevState: any, formData: FormData) {
  const validatedFields = formSchema.safeParse({
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    return {
      productName: null,
      error: validatedFields.error.flatten().fieldErrors.photo?.[0]
    };
  }

  const file = validatedFields.data.photo;
  const { db, app } = initializeFirebase();
  const storage = getStorage(app);
  
  try {
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const photoDataUri = `data:${file.type};base64,${base64String}`;

    const result = await extractProductNameFromImage({ photoDataUri });
    const productName = result.productName || "Unnamed Product";

    const productDocRef = doc(db, 'products', productName);
    const productDoc = await getDoc(productDocRef);

    if (!productDoc.exists()) {
      const storageRef = ref(storage, `products/${productName}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      await setDoc(productDocRef, {
        id: productName,
        name: productName,
        imageUrl: imageUrl,
        avgSafety: 50,
        avgTaste: 50,
        voteCount: 0,
      });
    }
    
    revalidatePath('/');
    revalidatePath(`/product/${encodeURIComponent(productName)}`);

    return { productName: productName, error: null };

  } catch (error) {
    console.error(error);
    return {
      productName: null,
      error: 'An unexpected error occurred during image analysis.',
    };
  }
}
