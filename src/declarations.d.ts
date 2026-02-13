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

// Module declaration for dynamic worker imports (matches relative imports from any location)
declare module '*MediaPipeWorker.js' {
  const MediaPipeWorkerConstructor: {
    new (): Worker;
  };
  export default MediaPipeWorkerConstructor;
}

// Allow any .js file in workers directory to be imported
declare module '../workers/*.js' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Extend Window interface for performance
interface Window {
  performance: Performance;
}

// Performance interface extension
interface Performance {
  now(): number;
}
