/**
 * Firebase Configuration for Smirkle
 * 
 * IMPORTANT: Firebase credentials must be provided via environment variables.
 * Create a .env file in the project root with the following variables:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 * 
 * To get these values:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select your project (or create a new one)
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll to "Your apps" and select your web app
 * 5. Copy the firebaseConfig object values
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config from environment variables (required)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate that all required config values are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(key => !import.meta.env[key]);
if (missingEnvVars.length > 0) {
  if (import.meta.env.DEV) {
    console.warn(
      `Firebase Configuration Warning: Missing environment variables: ${missingEnvVars.join(', ')}. ` +
      'Please add these to your .env file for the app to function correctly.'
    );
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Enable offline persistence for Firestore
 * This allows the app to work offline and sync when connection is restored
 * 
 * Note: Persistence can only be enabled in one browser tab at a time
 * Multiple tabs will share data through localStorage
 */
enableIndexedDbPersistence(db).catch((err) => {
  if (import.meta.env.DEV) {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Firestore Persistence Warning: Multiple tabs open. ' +
        'Offline persistence can only be enabled in one tab at a time.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn(
        'Firestore Persistence Warning: The current browser does not support ' +
        'offline persistence. The app will work online only.'
      );
    }
  }
});

// Export writeBatch for use in other services
export { writeBatch };

// Export the app instance for potential advanced configurations
export default app;
