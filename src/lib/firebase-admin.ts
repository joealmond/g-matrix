
import 'server-only'; // Prevents this from leaking to client
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { cert } from 'firebase-admin/app';

// Check if app is already initialized to prevent "App already exists" error
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Missing Firebase Admin SDK credentials in .env file. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }

    admin.initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
  } catch (error: any) {
    console.error("Firebase admin initialization failed:", error.message);
    throw new Error(`Firebase admin initialization failed: ${error.message}. Please check your service account credentials in the .env file.`);
  }
}

const app = admin.app();
export const adminDb = getFirestore(app);
export const adminAuth = admin.auth(app);
export const adminStorage = getStorage(app);
