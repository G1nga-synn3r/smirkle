/**
 * TypeScript Declarations
 * 
 * Custom type declarations for the Smirkle application.
 */

// Vite worker import declarations
declare module '*.worker.js' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Module declaration for dynamic worker imports
declare module '../workers/MediaPipeWorker.js' {
  export default class MediaPipeWorker extends Worker {
    constructor();
  }
}

// Extend Window interface for performance
interface Window {
  performance: Performance;
}

// Performance interface extension
interface Performance {
  now(): number;
}
