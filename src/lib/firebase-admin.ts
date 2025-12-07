
import 'server-only'; // Prevents this from leaking to client
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { cert } from 'firebase-admin/app';

let isInitialized = false;

// Check if app is already initialized to prevent "App already exists" error
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn('Missing Firebase Admin SDK credentials in .env file. Server-side Firebase features will be unavailable.');
        console.warn('Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    } else {
        admin.initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
          storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
        });
        isInitialized = true;
    }
  } catch (error: any) {
    console.error("Firebase admin initialization failed:", error.message);
  }
} else {
    isInitialized = true;
}

const app = isInitialized ? admin.app() : null;
export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? admin.auth(app) : null;
export const adminStorage = app ? getStorage(app) : null;
export { isInitialized as firebaseAdminInitialized };
