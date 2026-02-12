/**
 * CPU Fallback Pipeline
 * 
 * CPU-only processing pipeline for devices without GPU support.
 * Uses reduced resolution and optimized settings for better performance.
 */

import {
  FaceLandmarker,
  FilesetResolver
} from '@mediapipe/tasks-vision';

// CDN for WASM files
const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export interface CPUPipelineOptions {
  targetFPS: number;
  resolutionScale: number;
  enableFrameSkipping: boolean;
}

export interface CPUPipelineResult {
  result: unknown;
  latency: number;
  fps: number;
}

export class CPUFallbackPipeline {
  private landmarker: FaceLandmarker | null = null;
  private options: CPUPipelineOptions;
  private lastFrameTime: number = 0;
  private frameSkipCounter: number = 0;
  private isInitialized: boolean = false;
  
  constructor(options: CPUPipelineOptions) {
    this.options = options;
  }
  
  /**
   * Initialize the pipeline with CPU delegate
   */
  async initialize(): Promise<void> {
    try {
      console.log('[CPUFallbackPipeline] Initializing with CPU delegate...');
      
      // Load vision fileset from CDN
      const vision = await FilesetResolver.forVisionTasks(
        VISION_CDN
      );
      
      // Create FaceLandmarker with CPU delegate
      // Using correct option names for MediaPipe Tasks Vision
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        outputFaceBlendshapes: true,
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      this.isInitialized = true;
      console.log('[CPUFallbackPipeline] Initialization complete');
      
    } catch (error) {
      console.error('[CPUFallbackPipeline] Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if current frame should be processed
   */
  shouldProcessFrame(timestamp: number): boolean {
    const frameInterval = 1000 / this.options.targetFPS;
    
    if (this.options.enableFrameSkipping) {
      this.frameSkipCounter++;
      return this.frameSkipCounter % 2 === 0; // Process every other frame
    }
    
    return timestamp - this.lastFrameTime >= frameInterval;
  }
  
  /**
   * Process a video frame
   */
  async detect(imageBitmap: ImageBitmap, timestamp: number): Promise<CPUPipelineResult> {
    if (!this.isInitialized || !this.landmarker) {
      throw new Error('Pipeline not initialized');
    }
    
    // Downscale image for better CPU performance
    const scaledBitmap = await this.downscaleImage(imageBitmap);
    
    const startTime = performance.now();
    const result = this.landmarker.detectForVideo(scaledBitmap, timestamp);
    const latency = performance.now() - startTime;
    
    this.lastFrameTime = timestamp;
    
    return {
      result,
      latency,
      fps: 1000 / latency
    };
  }
  
  /**
   * Downscale image to reduce processing load
   */
  private async downscaleImage(imageBitmap: ImageBitmap): Promise<ImageBitmap> {
    const scale = this.options.resolutionScale;
    const width = Math.floor(imageBitmap.width * scale);
    const height = Math.floor(imageBitmap.height * scale);
    
    // Create offscreen canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to regular canvas if offscreen not available
      const regularCanvas = document.createElement('canvas');
      regularCanvas.width = width;
      regularCanvas.height = height;
      const regularCtx = regularCanvas.getContext('2d');
      if (regularCtx) {
        regularCtx.drawImage(imageBitmap, 0, 0, width, height);
      }
      // Return original bitmap if canvas conversion fails
      return imageBitmap;
    }
    
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    return canvas.transferToImageBitmap();
  }
  
  /**
   * Get current options
   */
  getOptions(): CPUPipelineOptions {
    return { ...this.options };
  }
  
  /**
   * Update options at runtime
   */
  updateOptions(options: Partial<CPUPipelineOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Check if pipeline is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.landmarker) {
      this.landmarker = null;
    }
    this.isInitialized = false;
    console.log('[CPUFallbackPipeline] Disposed');
  }
}

/**
 * Create CPU pipeline with default settings
 */
export function createDefaultCPUPipeline(): CPUFallbackPipeline {
  return new CPUFallbackPipeline({
    targetFPS: 15,
    resolutionScale: 0.5,
    enableFrameSkipping: true
  });
}
