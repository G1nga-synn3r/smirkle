// src/firebaseClient.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined
};

const app = initializeApp(firebaseConfig);

// Initialize analytics only in the browser and only if measurementId is present
let analytics;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      try { analytics = getAnalytics(app); } catch (e) { console.warn("Analytics init failed", e); }
    })
    .catch(e => console.warn("Failed to load firebase/analytics", e));
}

export { app, analytics };
