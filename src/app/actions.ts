'use server';

import { extractProductNameFromImage } from '@/ai/flows/extract-product-name-from-image';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { z } from 'zod';

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

// This is the new success state type
export type ImageUploadSuccessState = {
  productName: string;
  imageUrl: string;
  error: null;
};

// This is the error state type
export type ImageUploadErrorState = {
  productName: null;
  imageUrl: null;
  error: string;
}

export type ImageUploadState = ImageUploadSuccessState | ImageUploadErrorState;


const initialState: ImageUploadState = {
  productName: null,
  imageUrl: null,
  error: null,
};


export async function handleImageUpload(prevState: any, formData: FormData): Promise<ImageUploadState> {
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
  // We only initialize Firebase here to get the Storage instance.
  // No database operations will be performed on the server.
  const { app } = initializeFirebase();
  const storage = getStorage(app);
  
  try {
    // 1. Analyze the image with AI
    const buffer = await file.arrayBuffer();
    const base64String = Buffer.from(buffer).toString('base64');
    const photoDataUri = `data:${file.type};base64,${base64String}`;

    const result = await extractProductNameFromImage({ photoDataUri });
    const productName = result.productName || "Unnamed Product";

    // 2. Upload the image to Firebase Storage
    const storageRef = ref(storage, `products/${productName}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 3. Return the product name and image URL to the client
    return { productName: productName, imageUrl: imageUrl, error: null };

  } catch (error: any) {
    console.error("Image analysis or upload failed:", JSON.stringify(error, null, 2));
    const errorMessage = error.message || 'An unexpected error occurred.';
    return {
      productName: null,
      imageUrl: null,
      error: `Analysis/Upload failed: ${errorMessage}`,
    };
  }
}
