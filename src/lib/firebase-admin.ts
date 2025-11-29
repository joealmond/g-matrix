'use server'; // Prevents this from leaking to client
import admin from 'firebase-admin';

// Check if app is already initialized to prevent "App already exists" error
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle the \n character correctly across different environments
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
  } catch (error: any) {
    console.error("Firebase admin initialization failed:", error.message);
    throw new Error(`Firebase admin initialization failed: ${error.message}. Please check your service account credentials in the .env file.`);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
