/**
 * Firebase Client - Re-exports from firebaseConfig.js
 *
 * This file exists for backward compatibility.
 * New imports should use: import { ... } from './services/firebaseConfig.js';
 *
 * @deprecated Use './services/firebaseConfig.js' directly instead
 */

// Re-export everything from firebaseConfig.js
export * from './services/firebaseConfig.js';

// Also export as default for convenience
export {
  app,
  analytics,
  db,
  auth,
  storage,
  isFirebaseInitialized,
} from './services/firebaseConfig.js';
