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
 *   VITE_FIREBASE_MEASUREMENT_ID (optional, for analytics)
 *
 * To get these values:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select your project (or create a new one)
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll to "Your apps" and select your web app
 * 5. Copy the firebaseConfig object values
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  writeBatch,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config from environment variables (required)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required config values are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter((key) => !import.meta.env[key]);
if (missingEnvVars.length > 0) {
  if (import.meta.env.DEV) {
    console.warn(
      `Firebase Configuration Warning: Missing environment variables: ${missingEnvVars.join(', ')}. ` +
        'Please add these to your .env file for the app to function correctly.'
    );
  }
}

// Initialize Firebase only if all required environment variables are present
let app = null;
let analytics = null;
let db = null;
let auth = null;
let storage = null;

const isFirebaseConfigValid = missingEnvVars.length === 0;

if (isFirebaseConfigValid) {
  try {
    // Avoid double initialization
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize Analytics if measurementId is present
    if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      isSupported()
        .then((supported) => {
          if (supported) {
            analytics = getAnalytics(app);
          }
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('Firebase Analytics initialization failed:', err);
          }
        });
    }

    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Enable offline persistence for Firestore
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (import.meta.env.DEV) {
        if (err.code === 'failed-precondition') {
          console.warn(
            'Firestore Persistence Warning: Multiple tabs open with persistence enabled. ' +
              'Only the primary tab will have write access.'
          );
        } else if (err.code === 'unimplemented') {
          console.warn(
            'Firestore Persistence Warning: The current browser does not support ' +
              'offline persistence. The app will work online only.'
          );
        } else {
          console.warn('Firestore Persistence Warning: Failed to enable persistence.', err);
        }
      }
    });
  } catch (error) {
    console.warn('Firebase initialization failed. The app will run in offline mode.', error);
  }
}

// Export services (will be null if initialization failed)
export {
  app,
  analytics,
  db,
  auth,
  storage,
  writeBatch,
  // Firestore functions
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
};

// Export individual services for convenience
// (Already exported via named exports above)

// Export a flag to check if Firebase is initialized
export const isFirebaseInitialized = () => app !== null;
